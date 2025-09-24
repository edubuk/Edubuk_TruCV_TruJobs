import boto3
import PyPDF2
import logging
from config import Config

logger = logging.getLogger()

# Initialize S3 client
s3 = boto3.client('s3')

def save_text_to_s3(text_content, filename):
    """Save text content to S3 bucket as a text file"""
    try:
        s3_config = Config.get_s3_config()
        s3_key = f"{s3_config['jd_prefix']}{filename}"
        
        s3.put_object(
            Bucket=s3_config['bucket_name'],
            Key=s3_key,
            Body=text_content.encode('utf-8'),
            ContentType='text/plain'
        )
        return s3_key
    except Exception as e:
        logger.error(f"Error saving text to S3: {str(e)}")
        raise

def save_pdf_to_s3(pdf_content, filename):
    """Save PDF content to S3 bucket"""
    try:
        s3_config = Config.get_s3_config()
        s3_key = f"{s3_config['jd_prefix']}{filename}"
        
        # Handle both BytesIO objects and raw bytes
        if hasattr(pdf_content, 'read'):
            # It's a stream (BytesIO), read the content
            pdf_content.seek(0)  # Ensure we're at the beginning
            body_data = pdf_content.read()
        else:
            # It's already bytes
            body_data = pdf_content
        
        s3.put_object(
            Bucket=s3_config['bucket_name'],
            Key=s3_key,
            Body=body_data,
            ContentType='application/pdf'
        )
        return s3_key
    except Exception as e:
        logger.error(f"Error saving PDF to S3: {str(e)}")
        raise

def extract_text_from_pdf(pdf_content):
    """Extract text content from PDF with robust error handling"""
    import io
    
    try:
        # Convert to BytesIO if it's raw bytes
        if isinstance(pdf_content, bytes):
            pdf_stream = io.BytesIO(pdf_content)
        elif hasattr(pdf_content, 'read'):
            # It's already a stream, read all content and create fresh BytesIO
            pdf_content.seek(0)
            pdf_data = pdf_content.read()
            if not pdf_data:
                raise ValueError("PDF content is empty")
            pdf_stream = io.BytesIO(pdf_data)
        else:
            raise ValueError("Invalid PDF content type")
        
        # Validate PDF header
        pdf_stream.seek(0)
        header = pdf_stream.read(4)
        if header != b'%PDF':
            logger.error(f"Invalid PDF header: {header}")
            raise ValueError("Invalid PDF file - missing PDF header")
        
        # Reset to beginning for processing
        pdf_stream.seek(0)
        
        # Try PyPDF2 extraction
        try:
            pdf_reader = PyPDF2.PdfReader(pdf_stream)
            
            # Check if PDF has pages
            if len(pdf_reader.pages) == 0:
                raise ValueError("PDF has no pages")
            
            text = ""
            for i, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                    logger.info(f"Extracted text from page {i+1}: {len(page_text)} characters")
                except Exception as page_error:
                    logger.warning(f"Failed to extract text from page {i+1}: {str(page_error)}")
                    continue
            
            if text.strip():
                logger.info(f"PDF text extraction successful: {len(text)} characters from {len(pdf_reader.pages)} pages")
                return text.strip()
            else:
                logger.warning("No text found in any PDF pages")
                
        except Exception as e:
            logger.warning(f"PyPDF2 extraction failed: {str(e)}")
        
        # If extraction fails, try alternative approach with strict=False
        try:
            pdf_stream.seek(0)
            pdf_reader = PyPDF2.PdfReader(pdf_stream, strict=False)
            text = ""
            for i, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                except Exception as page_error:
                    logger.warning(f"Page {i+1} extraction failed: {str(page_error)}")
                    continue
            
            if text.strip():
                logger.info(f"PyPDF2 (strict=False) extraction successful: {len(text)} characters")
                return text.strip()
                
        except Exception as e:
            logger.warning(f"PyPDF2 (strict=False) extraction failed: {str(e)}")
        
        # If all methods fail
        logger.error("All text extraction methods failed - PDF may be corrupted or encrypted")
        raise ValueError("No text content extracted from PDF - file may be corrupted, encrypted, or image-only")
        
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise 
import boto3
import PyPDF2
import logging
import base64
import io
import re
import time
import uuid
from config import BUCKET_NAME, RESUME_PREFIX

logger = logging.getLogger()
s3 = boto3.client('s3')
logging.getLogger("PyPDF2").setLevel(logging.ERROR)


def parse_multipart_form(event):
    """Parse multipart form data from API Gateway event with enhanced validation"""
    try:
        headers = event.get('headers', {})
        if not headers and 'multiValueHeaders' in event:
            headers = {k: v[0] if isinstance(v, list) else v for k, v in event['multiValueHeaders'].items()}
        
        # Case-insensitive content-type lookup
        content_type = None
        for key in headers:
            if key.lower() == 'content-type':
                content_type = headers[key]
                break
        
        if not content_type:
            raise ValueError('Content-Type header missing in request')

        boundary_match = re.search(r'boundary=([^;,\s]+)', content_type, re.IGNORECASE)
        if not boundary_match:
            raise ValueError('Boundary not found in Content-Type header')
        boundary = boundary_match.group(1).strip('"')

        body = event.get('body', '')
        if not body:
            raise ValueError('Request body is empty')
            
        if event.get('isBase64Encoded', False):
            try:
                body = base64.b64decode(body)
            except Exception as e:
                logger.error(f"Failed to decode base64 body: {str(e)}")
                raise ValueError('Failed to decode base64 body')
        else:
            if isinstance(body, str):
                body = body.encode('utf-8')

        boundary_bytes = f'--{boundary}'.encode('utf-8')
        parts = body.split(boundary_bytes)

        pdf_file = None
        job_description_id = None
        logger.info(f"Found {len(parts)} parts in multipart data")

        for i, part in enumerate(parts):
            if not part or part.strip() in [b'', b'--', b'--\r\n', b'--\n']:
                continue

            try:
                header_end = -1
                for separator in [b'\r\n\r\n', b'\n\n', b'\r\r']:
                    pos = part.find(separator)
                    if pos != -1:
                        header_end = pos + len(separator)
                        break
                
                if header_end == -1:
                    logger.warning(f"No header separator found in part {i}")
                    continue

                header_section = part[:header_end].decode('utf-8', errors='ignore')
                content_section = part[header_end:]

                if 'name="pdf_file"' in header_section or 'filename=' in header_section:
                    logger.info(f"Found PDF file in part {i}")
                    
                    # Clean up trailing boundary markers
                    if content_section.endswith(b'--\r\n'):
                        content_section = content_section[:-4]
                    elif content_section.endswith(b'--\n'):
                        content_section = content_section[:-3]
                    elif content_section.endswith(b'\r\n'):
                        content_section = content_section[:-2]
                    elif content_section.endswith(b'\n'):
                        content_section = content_section[:-1]

                    # Validate PDF content
                    if len(content_section) < 100:  # PDFs should be at least 100 bytes
                        logger.warning(f"PDF content too small: {len(content_section)} bytes")
                        continue
                        
                    # Check for PDF header
                    if not content_section.startswith(b'%PDF'):
                        logger.warning(f"Invalid PDF header in part {i}: {content_section[:10]}")
                        continue

                    pdf_file = io.BytesIO(content_section)
                    logger.info(f"Successfully extracted PDF content: {len(content_section)} bytes")

                elif 'name="job_description_id"' in header_section:
                    content_text = content_section.decode('utf-8', errors='ignore').strip()
                    content_text = content_text.strip('\r\n-')
                    if content_text:
                        job_description_id = content_text
                        logger.info(f"Found job_description_id: {job_description_id}")

            except Exception as e:
                logger.warning(f"Error processing multipart section {i}: {str(e)}")
                continue

        if pdf_file is None:
            raise ValueError('PDF file not found in request. Make sure the field name is "pdf_file"')
        if not job_description_id or job_description_id.strip() == '':
            raise ValueError('Job description ID is required. Make sure the field name is "job_description_id"')

        # Final validation
        pdf_file.seek(0)
        pdf_size = len(pdf_file.getvalue())
        if pdf_size < 100:
            raise ValueError(f'PDF file appears to be too small or corrupted: {pdf_size} bytes')

        # Reset position for further processing
        pdf_file.seek(0)
        logger.info(f"Successfully parsed multipart form: PDF ({pdf_size} bytes), JD ID: {job_description_id}")
        
        return pdf_file, job_description_id.strip()

    except Exception as e:
        logger.error(f"Multipart parsing error: {str(e)}")
        raise


def extract_text_from_pdf(pdf_content):
    """
    Enhanced PDF text extraction with raw binary fallback
    Based on comprehensive test results showing raw binary extraction
    works best for resume maker PDFs
    """
    
    logger.info("🔍 Starting enhanced PDF text extraction...")
    
    # Get PDF bytes
    if hasattr(pdf_content, 'clean_pdf_bytes'):
        pdf_bytes = pdf_content.clean_pdf_bytes
        logger.info(f"📄 Using clean PDF bytes: {len(pdf_bytes)} bytes")
    else:
        # Convert to bytes if needed
        if isinstance(pdf_content, bytes):
            pdf_bytes = pdf_content
        elif hasattr(pdf_content, 'read'):
            pdf_content.seek(0)
            pdf_bytes = pdf_content.read()
        elif hasattr(pdf_content, 'getvalue'):
            pdf_bytes = pdf_content.getvalue()
        else:
            raise ValueError("Invalid PDF content type")
        
        logger.info(f"📄 Using PDF content: {len(pdf_bytes)} bytes")
    
    # Validate PDF header
    if not pdf_bytes.startswith(b'%PDF'):
        logger.error(f"Invalid PDF header: {pdf_bytes[:10]}")
        raise ValueError("Invalid PDF file - missing PDF header")
    
    # Method 1: Try standard extraction methods (fast path for clean PDFs)
    standard_result = try_standard_extraction_methods(pdf_bytes)
    if standard_result and standard_result['text_length'] > 100:
        logger.info(f"✅ Standard extraction successful: {standard_result['method']} - {standard_result['text_length']} chars")
        return standard_result['text']
    
    # Method 2: Enhanced raw binary extraction (works for resume maker PDFs)
    logger.info("🔧 Trying enhanced raw binary extraction...")
    raw_result = enhanced_raw_binary_extraction(pdf_bytes)
    if raw_result and len(raw_result.strip()) > 50:
        logger.info(f"✅ Raw binary extraction successful: {len(raw_result)} chars")
        return raw_result
    
    # Method 3: Combined approach (last resort)
    logger.info("🔄 Trying combined approach...")
    combined_result = try_combined_extraction(pdf_bytes)
    if combined_result:
        logger.info(f"✅ Combined extraction successful: {len(combined_result)} chars")
        return combined_result
    
    # If all methods fail
    logger.warning("⚠️ All extraction methods failed")
    return ""


def try_standard_extraction_methods(pdf_bytes):
    """Try standard PDF extraction methods"""
    
    methods = [
        ("pdfplumber", try_pdfplumber_extraction),
        ("PyPDF2", try_pypdf2_extraction),
        ("pdfminer", try_pdfminer_extraction)
    ]
    
    for method_name, method_func in methods:
        try:
            result = method_func(pdf_bytes)
            if result and len(result.strip()) > 0:
                return {
                    "text": result,
                    "method": method_name,
                    "text_length": len(result.strip())
                }
        except Exception as e:
            logger.debug(f"Method {method_name} failed: {str(e)}")
            continue
    
    return None


def try_pypdf2_extraction(pdf_bytes):
    """Try PyPDF2 extraction with error handling"""
    try:
        import io
        pdf_stream = io.BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_stream, strict=False)
        
        text = ""
        for page in reader.pages:
            try:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            except:
                continue
        
        return text.strip()
        
    except Exception as e:
        logger.debug(f"PyPDF2 extraction failed: {str(e)}")
        return None


def try_pdfplumber_extraction(pdf_bytes):
    """Try pdfplumber extraction"""
    try:
        import pdfplumber
        import io
        
        pdf_stream = io.BytesIO(pdf_bytes)
        text = ""
        
        with pdfplumber.open(pdf_stream) as pdf:
            for page in pdf.pages:
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                except:
                    continue
        
        return text.strip()
        
    except Exception as e:
        logger.debug(f"pdfplumber extraction failed: {str(e)}")
        return None


def try_pdfminer_extraction(pdf_bytes):
    """Try pdfminer.six extraction"""
    try:
        from pdfminer.high_level import extract_text
        import io
        
        pdf_stream = io.BytesIO(pdf_bytes)
        text = extract_text(pdf_stream)
        
        return text.strip()
        
    except Exception as e:
        logger.debug(f"pdfminer extraction failed: {str(e)}")
        return None


def enhanced_raw_binary_extraction(pdf_bytes):
    """
    Enhanced raw binary extraction - the breakthrough method!
    This method works excellently for resume maker PDFs
    """
    
    try:
        logger.info("🔍 Starting enhanced raw binary extraction...")
        
        # Step 1: Try different encodings to decode PDF content
        extracted_content = []
        
        for encoding in ['latin-1', 'cp1252', 'utf-8']:
            try:
                decoded_content = pdf_bytes.decode(encoding, errors='ignore')
                
                # Step 2: Extract text from PDF streams
                stream_text = extract_text_from_streams(decoded_content)
                if stream_text:
                    extracted_content.append(stream_text)
                
                # Step 3: Extract direct text content
                direct_text = extract_direct_text_content(decoded_content)
                if direct_text:
                    extracted_content.append(direct_text)
                    
            except Exception as e:
                logger.debug(f"Encoding {encoding} failed: {str(e)}")
                continue
        
        # Step 4: Combine and clean extracted content
        if extracted_content:
            combined_text = ' '.join(extracted_content)
            cleaned_text = clean_extracted_text(combined_text)
            
            logger.info(f"✅ Raw binary extraction found {len(cleaned_text)} characters")
            return cleaned_text
        
        logger.warning("⚠️ Raw binary extraction found no content")
        return ""
        
    except Exception as e:
        logger.error(f"Enhanced raw binary extraction failed: {str(e)}")
        return ""


def extract_text_from_streams(decoded_content):
    """Extract text from PDF stream objects"""
    
    try:
        # Look for stream...endstream blocks
        stream_pattern = r'stream\s*(.*?)\s*endstream'
        streams = re.findall(stream_pattern, decoded_content, re.DOTALL | re.IGNORECASE)
        
        extracted_text = []
        
        for stream in streams:
            # Clean the stream content
            cleaned_stream = clean_stream_content(stream)
            if cleaned_stream and len(cleaned_stream) > 10:
                extracted_text.append(cleaned_stream)
        
        return ' '.join(extracted_text) if extracted_text else ""
        
    except Exception as e:
        logger.debug(f"Stream extraction failed: {str(e)}")
        return ""


def extract_direct_text_content(decoded_content):
    """Extract direct text content from PDF"""
    
    try:
        # Look for text patterns that might be readable content
        text_patterns = [
            r'\((.*?)\)',  # Text in parentheses
            r'\[(.*?)\]',  # Text in brackets
            r'Tj\s*([^\s]+)',  # Text show operators
            r'TJ\s*([^\s]+)',  # Text show with individual glyph positioning
        ]
        
        extracted_text = []
        
        for pattern in text_patterns:
            matches = re.findall(pattern, decoded_content, re.IGNORECASE)
            for match in matches:
                cleaned_match = clean_text_match(match)
                if cleaned_match and len(cleaned_match) > 2:
                    extracted_text.append(cleaned_match)
        
        return ' '.join(extracted_text) if extracted_text else ""
        
    except Exception as e:
        logger.debug(f"Direct text extraction failed: {str(e)}")
        return ""


def clean_stream_content(stream_content):
    """Clean and filter stream content"""
    
    try:
        # Remove non-printable characters but keep letters, numbers, and basic punctuation
        cleaned = re.sub(r'[^\w\s@.-]', ' ', stream_content)
        
        # Split into words and filter
        words = cleaned.split()
        
        # Keep words that are likely to be meaningful text
        meaningful_words = []
        for word in words:
            if (len(word) > 1 and 
                any(c.isalnum() for c in word) and
                not word.isdigit() or 
                '@' in word or 
                '.' in word):
                meaningful_words.append(word)
        
        return ' '.join(meaningful_words)
        
    except Exception as e:
        logger.debug(f"Stream cleaning failed: {str(e)}")
        return ""


def clean_text_match(text_match):
    """Clean individual text matches"""
    
    try:
        # Basic cleaning
        cleaned = re.sub(r'[^\w\s@.-]', ' ', text_match)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Filter out very short or non-meaningful content
        if len(cleaned) < 3 or cleaned.isdigit():
            return ""
        
        return cleaned
        
    except Exception as e:
        logger.debug(f"Text match cleaning failed: {str(e)}")
        return ""


def clean_extracted_text(raw_text):
    """Final cleaning of extracted text"""
    
    try:
        # Remove excessive whitespace
        cleaned = re.sub(r'\s+', ' ', raw_text)
        
        # Remove very short words (likely noise)
        words = cleaned.split()
        filtered_words = [word for word in words if len(word) > 1 or word.isalpha()]
        
        # Join and final cleanup
        result = ' '.join(filtered_words)
        result = result.strip()
        
        return result
        
    except Exception as e:
        logger.debug(f"Final text cleaning failed: {str(e)}")
        return raw_text


def try_combined_extraction(pdf_bytes):
    """Combined approach using multiple methods"""
    
    try:
        all_text = []
        
        # Try all methods and combine results
        methods = [
            try_pypdf2_extraction,
            try_pdfplumber_extraction,
            try_pdfminer_extraction,
            lambda x: enhanced_raw_binary_extraction(x)
        ]
        
        for method in methods:
            try:
                result = method(pdf_bytes)
                if result and len(result.strip()) > 10:
                    all_text.append(result)
            except:
                continue
        
        if all_text:
            # Combine and deduplicate
            combined = ' '.join(all_text)
            # Remove duplicates while preserving order
            words = combined.split()
            seen = set()
            unique_words = []
            for word in words:
                if word.lower() not in seen:
                    seen.add(word.lower())
                    unique_words.append(word)
            
            return ' '.join(unique_words)
        
        return ""
        
    except Exception as e:
        logger.error(f"Combined extraction failed: {str(e)}")
        return ""


def save_pdf_to_s3(pdf_content, filename):
    """Save PDF file to S3 bucket"""
    try:
        s3_key = f"{RESUME_PREFIX}{filename}"
        s3.put_object(Bucket=BUCKET_NAME, Key=s3_key, Body=pdf_content)
        return s3_key
    except Exception as e:
        logger.error(f"S3 upload error: {str(e)}")
        raise 
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
    """Extract text content from PDF file with robust error handling"""
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
        
        # Method 1: Try PyPDF2 with tolerant settings (strict=False) to handle malformed PDFs
        try:
            pdf_reader = PyPDF2.PdfReader(pdf_stream, strict=False)
            
            # Check if PDF has pages
            logger.info(f"PDF has {len(pdf_reader.pages)} pages")
            if len(pdf_reader.pages) == 0:
                raise ValueError("PDF contains no pages")
            
            text = ""
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                        logger.info(f"Page {page_num + 1}: extracted {len(page_text)} characters")
                    else:
                        logger.warning(f"Page {page_num + 1}: no text extracted")
                except Exception as e:
                    logger.warning(f"Error extracting text from page {page_num + 1}: {str(e)}")
                    continue
            
            if text.strip():
                logger.info(f"PyPDF2 extraction successful: {len(text)} characters from {len(pdf_reader.pages)} pages")
                return text.strip()
            else:
                logger.warning("No text found in any PDF pages")
                
        except Exception as e:
            logger.warning(f"PyPDF2 extraction failed: {str(e)}")
        
        # Method 2: Retry PyPDF2 with strict=False (kept as an additional attempt; often redundant but safe)
        try:
            pdf_stream.seek(0)
            pdf_reader = PyPDF2.PdfReader(pdf_stream, strict=False)

            text = ""
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                        logger.info(f"Page {page_num + 1} (retry): extracted {len(page_text)} characters")
                        logger.info(f"Page {page_num + 1} (strict=False): extracted {len(page_text)} characters")
                except Exception as e:
                    logger.warning(f"Page {page_num + 1} extraction failed: {str(e)}")
                    continue
            
            if text.strip():
                logger.info(f"PyPDF2 (strict=False) extraction successful: {len(text)} characters")
                return text.strip()
                
        except Exception as e:
            logger.warning(f"PyPDF2 (strict=False) extraction failed: {str(e)}")
        
        # Method 3: Try alternative extraction method for Google Docs PDFs
        try:
            pdf_stream.seek(0)
            # Read PDF as text with error handling for malformed structure
            pdf_reader = PyPDF2.PdfReader(pdf_stream, strict=False)
            text = ""
            
            # Try different extraction strategies
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    # Method 3a: Extract text with different parameters
                    if hasattr(page, 'extract_text'):
                        page_text = page.extract_text(extraction_mode="layout")
                        if page_text:
                            text += page_text + "\n"
                            logger.info(f"Page {page_num + 1} (layout mode): extracted {len(page_text)} characters")
                            continue
                except:
                    pass
                
                try:
                    # Method 3b: Basic text extraction
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                        logger.info(f"Page {page_num + 1} (basic): extracted {len(page_text)} characters")
                except Exception as e:
                    logger.warning(f"Page {page_num + 1} basic extraction failed: {str(e)}")
                    continue
            
            if text.strip():
                logger.info(f"Alternative extraction successful: {len(text)} characters")
                return text.strip()
                
        except Exception as e:
            logger.warning(f"Alternative extraction method failed: {str(e)}")
        
        # Method 3.5: (Removed) Sync Textract on PDF bytes is unreliable for many PDFs; prefer async S3-based OCR below

        # Method 3.6: Fallback using pdfminer.six (pure Python) when available via Lambda Layer
        try:
            def _extract_with_pdfminer(pdf_bytes: bytes) -> str:
                try:
                    from pdfminer.high_level import extract_text as pdfminer_extract_text
                    return pdfminer_extract_text(io.BytesIO(pdf_bytes))
                except ImportError:
                    logger.warning("pdfminer.six not available (layer missing); skipping pdfminer fallback")
                    return ""
                except Exception as e:
                    logger.warning(f"pdfminer.six extraction failed: {str(e)}")
                    return ""

            pdf_stream.seek(0)
            pdf_bytes_for_pdfminer = pdf_stream.read()
            if pdf_bytes_for_pdfminer:
                pm_text = _extract_with_pdfminer(pdf_bytes_for_pdfminer)
                if pm_text and pm_text.strip():
                    logger.info(f"pdfminer.six extracted {len(pm_text)} characters")
                    return pm_text.strip()
        except Exception as e:
            logger.warning(f"pdfminer fallback threw an unexpected error: {str(e)}")

        # Method 3.7: Textract asynchronous OCR via S3 for PDF (robust and supported)
        try:
            pdf_stream.seek(0)
            pdf_bytes_for_async = pdf_stream.read()
            if pdf_bytes_for_async:
                textract = boto3.client('textract')
                tmp_key = f"{RESUME_PREFIX}textract_tmp/{uuid.uuid4()}.pdf"
                try:
                    s3.put_object(Bucket=BUCKET_NAME, Key=tmp_key, Body=pdf_bytes_for_async)
                    logger.info(f"Uploaded temp PDF to s3://{BUCKET_NAME}/{tmp_key} for Textract async OCR")

                    start_resp = textract.start_document_text_detection(
                        DocumentLocation={
                            'S3Object': {'Bucket': BUCKET_NAME, 'Name': tmp_key}
                        }
                    )
                    job_id = start_resp['JobId']
                    logger.info(f"Textract async JobId: {job_id}")

                    # Poll for completion up to ~15 seconds to improve completion chances
                    max_wait_seconds = 15
                    waited = 0
                    status = 'IN_PROGRESS'
                    pages = []
                    while waited < max_wait_seconds and status in ('IN_PROGRESS', 'SUCCEEDED'):
                        time.sleep(1)
                        waited += 1
                        get_resp = textract.get_document_text_detection(JobId=job_id, MaxResults=1000)
                        status = get_resp.get('JobStatus', 'FAILED')
                        if status == 'SUCCEEDED':
                            pages.append(get_resp)
                            # Handle pagination
                            next_token = get_resp.get('NextToken')
                            while next_token:
                                get_resp = textract.get_document_text_detection(JobId=job_id, MaxResults=1000, NextToken=next_token)
                                pages.append(get_resp)
                                next_token = get_resp.get('NextToken')
                            break
                        elif status == 'FAILED':
                            break

                    if status == 'SUCCEEDED' and pages:
                        ocr_lines = []
                        for page in pages:
                            for block in page.get('Blocks', []):
                                if block.get('BlockType') == 'LINE' and 'Text' in block:
                                    line = block['Text'].strip()
                                    if line:
                                        ocr_lines.append(line)
                        if ocr_lines:
                            ocr_text = '\n'.join(ocr_lines)
                            logger.info(f"Textract async OCR extracted {len(ocr_text)} characters across {len(ocr_lines)} lines")
                            return ocr_text
                        else:
                            logger.warning("Textract async OCR returned no LINE text")
                    else:
                        logger.warning(f"Textract async OCR job status: {status} after {waited}s (may still be running)")
                finally:
                    # Clean up temp object
                    try:
                        s3.delete_object(Bucket=BUCKET_NAME, Key=tmp_key)
                    except Exception as cleanup_err:
                        logger.warning(f"Failed to delete temp Textract object: {str(cleanup_err)}")
        except Exception as e:
            logger.warning(f"Textract async OCR fallback failed or unavailable: {str(e)}")

        # Method 4: Last resort - extract any readable content
        try:
            pdf_stream.seek(0)
            pdf_content_bytes = pdf_stream.read()
            
            # Look for text patterns in raw PDF content
            text_patterns = []
            
            # Extract strings that look like readable text
            import re
            readable_text = re.findall(rb'[A-Za-z0-9\s.,!?;:()]+', pdf_content_bytes)
            for match in readable_text:
                try:
                    decoded = match.decode('utf-8', errors='ignore').strip()
                    if len(decoded) > 3 and any(c.isalpha() for c in decoded):
                        text_patterns.append(decoded)
                except:
                    continue
            
            if text_patterns:
                extracted_text = ' '.join(text_patterns)
                logger.info(f"Raw content extraction found {len(extracted_text)} characters")
                
                # Basic cleanup and validation
                if len(extracted_text) > 50:  # Reasonable minimum for a resume
                    return extracted_text
                    
        except Exception as e:
            logger.warning(f"Raw content extraction failed: {str(e)}")
        
        # If all methods fail
        logger.error("All text extraction methods failed - PDF may be image-based, heavily encrypted, or corrupted")
        raise ValueError("No text content extracted from PDF - file may be image-based (scanned), corrupted, encrypted, or created by Google Docs with rendering issues. Please try uploading a different PDF or convert to text format.")
        
    except Exception as e:
        logger.error(f"PDF text extraction error: {str(e)}")
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


def save_pdf_to_s3(pdf_content, filename):
    """Save PDF file to S3 bucket"""
    try:
        s3_key = f"{RESUME_PREFIX}{filename}"
        s3.put_object(Bucket=BUCKET_NAME, Key=s3_key, Body=pdf_content)
        return s3_key
    except Exception as e:
        logger.error(f"S3 upload error: {str(e)}")
        raise 
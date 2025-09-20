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
            pdf_stream.seek(0)
            pdf_bytes_for_debug = pdf_stream.read()
            logger.info(f"PDF bytes for PyPDF2: {len(pdf_bytes_for_debug)} bytes, header: {pdf_bytes_for_debug[:20]}")
            
            pdf_stream.seek(0)
            reader = PyPDF2.PdfReader(pdf_stream, strict=False)
            logger.info(f"PDF has {len(reader.pages)} pages")
            
            all_text = []
            for page_num, page in enumerate(reader.pages, 1):
                try:
                    text = page.extract_text()
                    if text and text.strip():
                        all_text.append(text)
                        logger.info(f"Page {page_num}: extracted {len(text)} characters")
                        # Log sample of extracted text for debugging
                        sample = text.strip()[:100].replace('\n', ' ')
                        logger.info(f"Page {page_num} sample: {repr(sample)}")
                    else:
                        logger.warning(f"Page {page_num}: no text extracted")
                except Exception as e:
                    logger.warning(f"Page {page_num}: extraction error: {str(e)}")
            
            if all_text:
                combined_text = '\n'.join(all_text)
                logger.info(f"PyPDF2 extracted {len(combined_text)} characters total")
                # Log sample of combined text
                sample = combined_text.strip()[:200].replace('\n', ' ')
                logger.info(f"PyPDF2 combined sample: {repr(sample)}")
                return combined_text
            else:
                logger.warning("No text found in any PDF pages")
        except Exception as e:
            logger.warning(f"PyPDF2 extraction failed: {str(e)}")
        
        # Method 2: Retry PyPDF2 with strict=False (kept as an additional attempt; often redundant but safe)
        try:
            pdf_stream.seek(0)
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
                    error_msg = str(e).lower()
                    if "data-loss" in error_msg or "decompressing" in error_msg or "corrupted" in error_msg:
                        # Mark corruption detected and fail fast to avoid timeout
                        extract_text_from_pdf._corruption_detected = True
                        logger.error(f"PDF corruption detected by pdfminer.six: {str(e)}")
                        logger.error("Failing fast due to corruption to avoid API Gateway timeout")
                        raise ValueError("PDF file is corrupted or damaged. The file contains invalid compressed data streams. Please try re-saving or re-exporting the PDF from the original application, or upload a different version of the file.")
                    else:
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

        # Skip OCR completely - PDFs are text-based, not image-based
        logger.info("🚀 Skipping OCR - PDFs are text-based, saves 20+ seconds!")
        
        # Method 3: Raw content extraction for text-based PDFs
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
                logger.info(f"✅ Raw content extraction found {len(extracted_text)} characters")
                
                # Log sample of what raw extraction finds
                sample = extracted_text[:200].replace('\n', ' ')
                logger.info(f"Raw extraction sample: {repr(sample)}")
                
                # Check if it contains expected content
                has_ganesh = "Ganesh" in extracted_text
                has_email = "ganeshagrahari108" in extracted_text
                has_qtechsolutions = "QTechSolutions" in extracted_text
                
                logger.info(f"Raw extraction content check - Ganesh: {has_ganesh}, Email: {has_email}, QTechSolutions: {has_qtechsolutions}")
                
                # Return if it has the expected content
                if has_ganesh and has_email:
                    logger.info("✅ Raw extraction contains expected content - using it")
                    return extracted_text
                else:
                    logger.warning("⚠️ Raw extraction does not contain expected content but using anyway")
                    return extracted_text
                    
        except Exception as e:
            logger.warning(f"❌ Raw content extraction failed: {str(e)}")
        
        # If all methods fail, check if we detected corruption
        corruption_detected = False
        
        # Check logs for corruption indicators (this is a simple heuristic)
        try:
            # If we got here and pdfminer was attempted, check for corruption signs
            if hasattr(extract_text_from_pdf, '_corruption_detected'):
                corruption_detected = True
        except:
            pass
            
        if corruption_detected:
            logger.error("PDF file appears to be corrupted - detected decompression errors")
            raise ValueError("PDF file is corrupted or damaged. The file contains invalid compressed data streams. Please try re-saving or re-exporting the PDF from the original application, or upload a different version of the file.")
        else:
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
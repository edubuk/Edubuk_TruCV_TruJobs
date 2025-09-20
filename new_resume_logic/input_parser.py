import json
import base64
import re
import logging
from io import BytesIO
import boto3

logger = logging.getLogger()

def determine_input_type(event):
    """Determine if the input is JSON, multipart form data, or S3 event"""
    try:
        # Check if this is an S3 event
        if 'Records' in event and isinstance(event['Records'], list):
            if len(event['Records']) > 0 and 's3' in event['Records'][0]:
                return 's3'
        
        headers = event.get('headers', {})
        # Handle both uppercase and lowercase header names
        content_type = headers.get('content-type', headers.get('Content-Type', '')).lower()
        
        if 'application/json' in content_type:
            return 'json'
        elif 'multipart/form-data' in content_type:
            return 'multipart'
        else:
            # Try to parse as JSON if no clear content type
            try:
                if event.get('body'):
                    json.loads(event['body'])
                    return 'json'
            except:
                pass
            
            # Default to multipart if content-type suggests form data
            if 'boundary=' in content_type:
                return 'multipart'
                
        return 'json'  # Default to JSON
    except Exception as e:
        logger.warning(f"Error determining input type: {str(e)}, defaulting to JSON")
        return 'json'

def parse_json_input(event):
    """Parse JSON input from the event for resume processing"""
    try:
        body = event.get('body', '{}')
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(body).decode('utf-8')
        
        data = json.loads(body)
        
        # Validate required fields for resume processing
        if 'resume_content' not in data:
            raise ValueError("Missing 'resume_content' in JSON input")
        
        if 'job_description_id' not in data:
            raise ValueError("Missing 'job_description_id' in JSON input")
            
        return data
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {str(e)}")
    except Exception as e:
        raise ValueError(f"Error parsing JSON input: {str(e)}")

def parse_s3_event(event):
    """Parse S3 event to extract bucket and key information"""
    try:
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        # Skip processing if this is a generated .txt file to prevent recursion
        if key.endswith('.txt'):
            logger.info(f"Skipping .txt file {key} to prevent recursion")
            return None, None
            
        logger.info(f"Processing S3 event: bucket={bucket}, key={key}")
        return bucket, key
        
    except Exception as e:
        logger.error(f"Error parsing S3 event: {str(e)}")
        raise ValueError(f"Invalid S3 event format: {str(e)}")

def parse_multipart_form(event):
    """Parse multipart form data to extract resume content and job description ID"""
    try:
        headers = event.get('headers', {})
        content_type = headers.get('content-type', headers.get('Content-Type', ''))
        
        if 'multipart/form-data' not in content_type:
            raise ValueError("Content-Type must be multipart/form-data")
        
        # Extract boundary
        boundary_match = re.search(r'boundary=([^;]+)', content_type)
        if not boundary_match:
            raise ValueError("No boundary found in Content-Type header")
        
        boundary = boundary_match.group(1).strip('"')
        
        # Get body content
        body = event.get('body', '')
        is_base64 = event.get('isBase64Encoded', False)
        logger.info(f"Multipart parsing: isBase64Encoded={is_base64}, body_type={type(body)}, body_length={len(body) if body else 0}")
        
        if is_base64:
            body = base64.b64decode(body)
            logger.info(f"Decoded base64 body to {len(body)} bytes")
        else:
            # For multipart data, body should already be bytes or need proper handling
            if isinstance(body, str):
                # Try to handle as latin-1 to preserve binary data
                try:
                    body = body.encode('latin-1')
                    logger.info(f"Encoded string body as latin-1 to {len(body)} bytes")
                except UnicodeEncodeError as e:
                    logger.warning(f"Latin-1 encoding failed: {e}")
                    # Fallback: assume it's base64 encoded even if flag is wrong
                    try:
                        body = base64.b64decode(body)
                        logger.info(f"Fallback: decoded as base64 to {len(body)} bytes")
                    except Exception as e2:
                        logger.warning(f"Base64 fallback failed: {e2}")
                        # Last resort: UTF-8 encoding (may corrupt binary data)
                        body = body.encode('utf-8')
                        logger.warning(f"Last resort: UTF-8 encoding to {len(body)} bytes (may corrupt binary)")
            elif not isinstance(body, bytes):
                body = str(body).encode('utf-8')
                logger.info(f"Converted non-string body to UTF-8 bytes: {len(body)} bytes")
        
        # Parse multipart data
        boundary_bytes = f'--{boundary}'.encode()
        parts = body.split(boundary_bytes)
        
        resume_content = None
        job_description_id = None
        logger.info(f"Found {len(parts)} parts in multipart data")
        
        for i, part in enumerate(parts):
            if not part or part.strip() in [b'', b'--', b'--\r\n', b'--\n']:
                continue
                
            if b'Content-Disposition: form-data' in part:
                # Parse headers and content
                header_end = part.find(b'\r\n\r\n')
                if header_end == -1:
                    header_end = part.find(b'\n\n')
                if header_end == -1:
                    logger.warning(f"No header separator found in part {i}")
                    continue
                
                headers_section = part[:header_end]
                content_start = header_end + (4 if b'\r\n\r\n' in part else 2)
                content = part[content_start:]
                
                # Clean up trailing boundary markers
                if content.endswith(b'--\r\n'):
                    content = content[:-4]
                elif content.endswith(b'--\n'):
                    content = content[:-3]
                elif content.endswith(b'\r\n'):
                    content = content[:-2]
                elif content.endswith(b'\n'):
                    content = content[:-1]
                
                try:
                    headers_str = headers_section.decode('utf-8', errors='ignore')
                except:
                    headers_str = headers_section.decode('latin-1', errors='ignore')
                
                if ('name="resume"' in headers_str or 'name="file"' in headers_str or 
                    'name="pdf_file"' in headers_str or 'filename=' in headers_str):
                    
                    # Validate PDF content
                    if len(content) < 100:
                        logger.warning(f"PDF content too small in part {i}: {len(content)} bytes")
                        continue
                        
                    # Check for PDF header
                    if not content.startswith(b'%PDF'):
                        logger.warning(f"Invalid PDF header in part {i}: {content[:10]}")
                        continue
                    
                    resume_content = BytesIO(content)
                    logger.info(f"Successfully extracted PDF content from part {i}: {len(content)} bytes")
                    
                elif 'name="job_description_id"' in headers_str:
                    try:
                        job_description_id = content.decode('utf-8', errors='ignore').strip()
                        job_description_id = job_description_id.strip('\r\n-')
                        logger.info(f"Found job_description_id: {job_description_id}")
                    except Exception as e:
                        logger.warning(f"Error decoding job_description_id: {str(e)}")
        
        if not resume_content:
            raise ValueError("No resume file found in multipart data. Make sure field name is 'resume', 'file', or 'pdf_file'")
        
        if not job_description_id:
            raise ValueError("No job_description_id found in multipart data. Make sure field name is 'job_description_id'")
        
        # Final validation
        resume_content.seek(0)
        pdf_size = len(resume_content.getvalue())
        if pdf_size < 100:
            raise ValueError(f"PDF file appears to be too small or corrupted: {pdf_size} bytes")
        
        # Reset position for further processing
        resume_content.seek(0)
        logger.info(f"Successfully parsed multipart form: PDF ({pdf_size} bytes), JD ID: {job_description_id}")
        
        return resume_content, job_description_id
        
    except Exception as e:
        logger.error(f"Error parsing multipart form: {str(e)}")
        raise ValueError(f"Failed to parse multipart form data: {str(e)}")

def get_s3_pdf_content(bucket, key):
    """Download PDF content from S3"""
    try:
        s3_client = boto3.client('s3')
        response = s3_client.get_object(Bucket=bucket, Key=key)
        pdf_content = BytesIO(response['Body'].read())
        
        logger.info(f"Downloaded PDF from S3: {bucket}/{key}")
        return pdf_content
        
    except Exception as e:
        logger.error(f"Error downloading PDF from S3: {str(e)}")
        raise ValueError(f"Failed to download PDF from S3: {str(e)}")

import json
import base64
import re
import logging
from io import BytesIO

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
    """Parse JSON input from the event"""
    try:
        body = event.get('body', '{}')
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(body).decode('utf-8')
        
        data = json.loads(body)
        
        # Validate required fields
        job_description_text = data.get('job_description')
        if not job_description_text:
            raise ValueError('job_description field is required in JSON input')
        
        # Optional fields with defaults
        job_title = data.get('job_title', '')
        job_requirements = data.get('job_requirements', [])
        job_location = data.get('job_location', '')
        
        return {
            'text': job_description_text,
            'metadata': {
                'job_title': job_title,
                'job_requirements': job_requirements if isinstance(job_requirements, list) else [],
                'job_location': job_location
            },
            'filename': None  # No file for JSON input
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON format: {str(e)}")
        raise ValueError(f'Invalid JSON format: {str(e)}')
    except Exception as e:
        logger.error(f"Error parsing JSON input: {str(e)}")
        raise ValueError(f'Error parsing JSON input: {str(e)}')

def parse_multipart_form(event):
    """Parse multipart form data from the event"""
    try:
        # Get headers with case-insensitive lookup
        headers = event.get('headers', {})
        content_type = None
        for key, value in headers.items():
            if key.lower() == 'content-type':
                content_type = value
                break
        
        if not content_type:
            raise ValueError('Content-Type header missing in request')

        # Extract boundary
        boundary_match = re.search(r'boundary=([^;]+)', content_type)
        if not boundary_match:
            raise ValueError('Boundary not found in Content-Type header')
        boundary = boundary_match.group(1).strip('"')

        # Get body content
        body = event.get('body', '')
        if not body:
            raise ValueError('Request body is empty')
            
        # Handle base64 encoding
        if event.get('isBase64Encoded', False):
            try:
                body = base64.b64decode(body)
            except Exception as e:
                logger.error(f"Error decoding base64 body: {str(e)}")
                raise ValueError('Error decoding base64 content')
        else:
            # Convert string to bytes if needed
            if isinstance(body, str):
                body = body.encode('utf-8')

        # Split by boundary
        boundary_bytes = f'--{boundary}'.encode('utf-8')
        parts = body.split(boundary_bytes)

        pdf_content = None
        logger.info(f"Found {len(parts)} parts in multipart data")

        for i, part in enumerate(parts):
            if not part or part.strip() == b'--' or part.strip() == b'':
                continue

            try:
                # Look for the double newline that separates headers from content
                header_end = part.find(b'\r\n\r\n')
                if header_end == -1:
                    header_end = part.find(b'\n\n')
                if header_end == -1:
                    logger.warning(f"No header separator found in part {i}")
                    continue

                # Extract headers
                headers_bytes = part[:header_end]
                try:
                    headers_str = headers_bytes.decode('utf-8', errors='ignore')
                except:
                    headers_str = headers_bytes.decode('latin-1', errors='ignore')

                # Check if this part contains the PDF file
                if 'name="pdf_file"' in headers_str or 'filename=' in headers_str:
                    logger.info(f"Found PDF file in part {i}")
                    
                    # Extract content after headers
                    content_start = header_end + (4 if b'\r\n\r\n' in part else 2)
                    pdf_content = part[content_start:]
                    
                    # Remove trailing boundary markers
                    if pdf_content.endswith(b'--\r\n'):
                        pdf_content = pdf_content[:-4]
                    elif pdf_content.endswith(b'--\n'):
                        pdf_content = pdf_content[:-3]
                    elif pdf_content.endswith(b'\r\n'):
                        pdf_content = pdf_content[:-2]
                    elif pdf_content.endswith(b'\n'):
                        pdf_content = pdf_content[:-1]

                    # Validate PDF content
                    if len(pdf_content) < 100:  # PDFs should be at least 100 bytes
                        logger.warning(f"PDF content too small: {len(pdf_content)} bytes")
                        continue
                        
                    # Check for PDF header
                    if not pdf_content.startswith(b'%PDF'):
                        logger.warning(f"Invalid PDF header: {pdf_content[:10]}")
                        continue
                    
                    logger.info(f"Successfully extracted PDF content: {len(pdf_content)} bytes")
                    return BytesIO(pdf_content)

            except Exception as e:
                logger.warning(f"Error processing part {i}: {str(e)}")
                continue

        if pdf_content is None:
            raise ValueError('PDF file not found in multipart request. Make sure the field name is "pdf_file"')

        return BytesIO(pdf_content)

    except Exception as e:
        logger.error(f"Error parsing multipart form data: {str(e)}")
        raise ValueError(f'Error parsing multipart form data: {str(e)}')

def parse_s3_event(event):
    """Parse S3 event to get bucket and object key"""
    try:
        if 'Records' not in event or not event['Records']:
            raise ValueError('No Records found in S3 event')
        
        record = event['Records'][0]
        if 's3' not in record:
            raise ValueError('No S3 data found in event record')
        
        s3_data = record['s3']
        bucket_name = s3_data['bucket']['name']
        object_key = s3_data['object']['key']
        
        logger.info(f"S3 event: bucket={bucket_name}, key={object_key}")
        
        return {
            'bucket_name': bucket_name,
            'object_key': object_key,
            'event_name': record.get('eventName', 'Unknown')
        }
        
    except Exception as e:
        logger.error(f"Error parsing S3 event: {str(e)}")
        raise ValueError(f'Error parsing S3 event: {str(e)}') 
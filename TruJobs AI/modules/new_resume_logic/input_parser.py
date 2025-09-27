#summary:
'''
 This module is responsible for robustly handling all possible input types (JSON, multipart, S3 event) for resume uploads.
It ensures the PDF and job description ID are reliably extracted and ready for downstream processing, regardless of how the data arrives.
It includes advanced error handling and logging for easier debugging and production reliability.
'''  
#1. Imports and Logger Setup
'''
Imports standard libraries for JSON, base64, regex, logging, IO, and boto3 for AWS.
Sets up a logger for debugging and info messages.
'''
import json
import base64
import re
import logging
from io import BytesIO
import boto3


logger = logging.getLogger()

#2.  PDF Reconstruction
'''
Purpose: Fixes binary corruption that can happen when API Gateway passes PDF data as a string.
How:
Tries to encode the string as latin-1 (simple case).
If that fails, reconstructs the bytes manually, handling surrogate escapes and skipping replacement characters.
'''


def apply_proven_pdf_reconstruction(body_string):
    """
    Production-ready PDF reconstruction for API Gateway multipart data
    Handles binary data corruption from API Gateway string conversion
    """
    # Method 1: Simple latin-1 (works when no corruption)
    try:
        return body_string.encode('latin-1')
    except UnicodeEncodeError:
        # Method 2: Nuclear reconstruction for corrupted data
        reconstructed_bytes = bytearray()
        
        for char in body_string:
            char_code = ord(char)
            
            if char_code <= 255:
                reconstructed_bytes.append(char_code)
            elif 0xDC80 <= char_code <= 0xDCFF:
                # Convert surrogate escape back to original byte
                original_byte = char_code - 0xDC00
                reconstructed_bytes.append(original_byte)
            elif char_code == 0xFFFD:
                continue  # Skip replacement characters
            else:
                reconstructed_bytes.append(char_code & 0xFF)
        
        return bytes(reconstructed_bytes)

# 3. Input Type Detection:
'''
Purpose: Figures out if the incoming request is:
An S3 event,
JSON,
or multipart form data.
How:
Checks for S3 event structure.
Looks at the Content-Type header for JSON or multipart.
Tries to parse the body as JSON if unsure.
Defaults to JSON if it can’t decide.

'''


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

#4. JSON Input Parsing
'''
Purpose: Extracts and validates JSON input for resume processing.
How:
Decodes base64 if needed.
Supports two JSON modes:
  1) Simple text mode with 'resume_content'
  2) Structured mode with 'resume_json' (or a top-level resume object)
Flattens structured JSON to text and returns with 'job_description_id'.
'''

def flatten_resume_json_to_text(resume_json):
    """Flatten a structured resume JSON object into plain text"""
    try:
        parts = []
        get = resume_json.get

        # Nano ID (if present)
        nano_id = get('nano_Id') or get('nanoId') or get('nano_id')
        if nano_id:
            parts.append(f"Nano ID: {nano_id}")
        
        # Name / contact
        name = get('name') or get('full_name')
        if name:
            parts.append(f"Name: {name}")
        
        contact = get('contact') or {}
        if isinstance(contact, dict):
            cparts = []
            # Handle all possible contact fields
            for k in ['phone', 'email', 'alt_email', 'linkedin', 'github', 'website', 'location', 'profession', 'yearOfExperience']:
                if contact.get(k):
                    cparts.append(f"{k}: {contact.get(k)}")
            if cparts:
                parts.append("Contact: " + "; ".join(cparts))

        # Education - handle both list and object formats
        edu = get('education')
        if edu:
            if isinstance(edu, list):
                # Handle list format
                for e in edu:
                    if isinstance(e, dict):
                        seg = []
                        for k in ['institution', 'degree', 'board', 'grade', 'duration']:
                            if e.get(k):
                                seg.append(f"{k}: {e.get(k)}")
                        if seg:
                            parts.append("Education: " + "; ".join(seg))
            elif isinstance(edu, dict):
                # Handle object format with nested structure
                edu_parts = []
                
                # Class 10
                if edu.get('class10School'):
                    edu_parts.append(f"Class 10: {edu.get('class10School')}, Board: {edu.get('class10Board')}, Grade: {edu.get('class10Grade')}%")
                
                # Class 12
                if edu.get('class12College'):
                    edu_parts.append(f"Class 12: {edu.get('class12College')}, Board: {edu.get('class12Board')}, Grade: {edu.get('class12Grade')}%")
                
                # Undergraduate
                if edu.get('underGraduateCollege'):
                    ug_text = f"Undergraduate: {edu.get('underGraduateDegree')} from {edu.get('underGraduateCollege')}, GPA: {edu.get('underGraduateGPA')}"
                    if edu.get('underGraduateDuration', {}).get('duration'):
                        dur = edu['underGraduateDuration']['duration']
                        ug_text += f", Duration: {dur.get('from')} to {dur.get('to')}"
                    edu_parts.append(ug_text)
                
                if edu_parts:
                    parts.append("Education: " + "; ".join(edu_parts))

        # Experience
        exp = get('experience') or []
        if isinstance(exp, list) and exp:
            for ex in exp:
                if not isinstance(ex, dict):
                    continue
                seg = []
                
                # Handle job role, company name, description
                if ex.get('job_role'):
                    seg.append(f"Role: {ex.get('job_role')}")
                if ex.get('company_name'):
                    seg.append(f"Company: {ex.get('company_name')}")
                
                # Handle duration object
                if ex.get('duration') and isinstance(ex['duration'], dict):
                    dur = ex['duration']
                    from_date = dur.get('from', '')
                    to_date = dur.get('to', '')
                    if from_date or to_date:
                        seg.append(f"Duration: {from_date} to {to_date}")
                
                # Handle description
                if ex.get('description'):
                    seg.append(f"Description: {ex.get('description')}")
                
                if seg:
                    parts.append("Experience: " + "; ".join(seg))

        # Skills - handle list format
        skills = get('skills') or []
        if isinstance(skills, list) and skills:
            skill_names = []
            for skill in skills:
                if isinstance(skill, dict) and skill.get('skillName'):
                    skill_names.append(skill['skillName'])
                elif isinstance(skill, str):
                    skill_names.append(skill)
            if skill_names:
                parts.append("Skills: " + ", ".join(skill_names))
        elif isinstance(skills, dict) and skills:
            # Handle dict format
            seg = []
            for k, v in skills.items():
                if isinstance(v, list):
                    seg.append(f"{k}: " + ", ".join(map(str, v)))
                else:
                    seg.append(f"{k}: {v}")
            if seg:
                parts.append("Skills: " + "; ".join(seg))

        # Achievements
        achievements = get('achievements')
        if achievements and isinstance(achievements, dict):
            # Awards
            awards = achievements.get('awards', [])
            if isinstance(awards, list) and awards:
                for award in awards:
                    if isinstance(award, dict):
                        award_parts = []
                        if award.get('award_name'):
                            award_parts.append(f"Award: {award['award_name']}")
                        if award.get('awarding_organization'):
                            award_parts.append(f"Organization: {award['awarding_organization']}")
                        if award.get('date_of_achievement'):
                            award_parts.append(f"Date: {award['date_of_achievement']}")
                        if award.get('description'):
                            award_parts.append(f"Description: {award['description']}")
                        if award_parts:
                            parts.append("Achievement: " + "; ".join(award_parts))
            
            # Courses
            courses = achievements.get('courses', [])
            if isinstance(courses, list) and courses:
                for course in courses:
                    if isinstance(course, dict):
                        course_parts = []
                        if course.get('course_name'):
                            course_parts.append(f"Course: {course['course_name']}")
                        if course.get('organization'):
                            course_parts.append(f"Organization: {course['organization']}")
                        if course.get('duration') and isinstance(course['duration'], dict):
                            dur = course['duration']
                            course_parts.append(f"Duration: {dur.get('from')} to {dur.get('to')}")
                        if course.get('description'):
                            course_parts.append(f"Description: {course['description']}")
                        if course_parts:
                            parts.append("Course: " + "; ".join(course_parts))
            
            # Projects within achievements
            projects = achievements.get('projects', [])
            if isinstance(projects, list) and projects:
                for project in projects:
                    if isinstance(project, dict):
                        proj_parts = []
                        if project.get('project_name'):
                            proj_parts.append(f"Project: {project['project_name']}")
                        if project.get('duration') and isinstance(project['duration'], dict):
                            dur = project['duration']
                            proj_parts.append(f"Duration: {dur.get('from')} to {dur.get('to')}")
                        if project.get('description'):
                            proj_parts.append(f"Description: {project['description']}")
                        if project.get('project_url'):
                            proj_parts.append(f"URL: {project['project_url']}")
                        if proj_parts:
                            parts.append("Project: " + "; ".join(proj_parts))

        # Handle top-level projects (if any)
        projs = get('projects') or []
        if isinstance(projs, list) and projs:
            for pr in projs:
                if not isinstance(pr, dict):
                    continue
                seg = []
                for k in ['title', 'name', 'project_name', 'description', 'repo', 'project_url']:
                    if pr.get(k):
                        seg.append(f"{k}: {pr.get(k)}")
                st = pr.get('stack')
                if isinstance(st, list) and st:
                    seg.append("stack: " + ", ".join(map(str, st)))
                if seg:
                    parts.append("Project: " + "; ".join(seg))

        text = "\n".join(parts)
        return text if text else json.dumps(resume_json, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"Error flattening resume JSON: {str(e)}")
        # Fallback to JSON dump if flattening fails
        return json.dumps(resume_json, ensure_ascii=False)


def parse_json_input(event):
    """Parse JSON input from the event for resume processing"""
    try:
        body = event.get('body', '{}')
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(body).decode('utf-8')
        
        data = json.loads(body)

        # Determine mode: simple text or structured resume
        resume_text = None
        if isinstance(data, dict) and 'resume_content' in data and isinstance(data['resume_content'], str):
            resume_text = data['resume_content']
        elif isinstance(data, dict) and 'resume_json' in data and isinstance(data['resume_json'], dict):
            resume_text = flatten_resume_json_to_text(data['resume_json'])
        else:
            # Heuristic: if top-level looks like a resume object
            probable_keys = {'name', 'full_name', 'contact', 'education', 'experience', 'projects', 'skills'}
            if isinstance(data, dict) and any(k in data for k in probable_keys):
                resume_text = flatten_resume_json_to_text(data)
            else:
                raise ValueError("Missing 'resume_content' or 'resume_json' in JSON input")

        # Validate job_description_id
        job_description_id = data.get('job_description_id')
        if not job_description_id or not isinstance(job_description_id, str) or not job_description_id.strip():
            raise ValueError("Missing 'job_description_id' in JSON input")

        return {
            'resume_content': resume_text,
            'job_description_id': job_description_id
        }
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {str(e)}")
    except Exception as e:
        raise ValueError(f"Error parsing JSON input: {str(e)}")

#5. S3 Event Parsing
'''
Purpose: Extracts the S3 bucket and key from an S3 event.
How:
Reads the first record for bucket and key.
Skips .txt files to prevent recursion.
Logs and returns bucket/key, or raises error if parsing fails.
'''

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

#6. Multipart Form Data Parsing
'''
Purpose: Extracts the PDF file and job description ID from a multipart form upload (used for resume uploads).
How:
Checks for correct Content-Type.
Extracts the boundary from the header.
Handles base64 decoding if needed.
Applies PDF reconstruction if body is a string.
Splits the body into parts using the boundary.
For each part:
Looks for the PDF file (by field name or filename) and validates it starts with %PDF.
Extracts the job description ID from the appropriate field.
Validates both PDF and job description ID are found.
Returns the PDF content (as a BytesIO object) and the job description ID.
'''

def parse_multipart_form(event):
    """Parse multipart form data to extract resume content and job description ID"""
    try:
        headers = event.get('headers', {})
        content_type = headers.get('content-type', headers.get('Content-Type', ''))
        
        if 'multipart/form-data' not in content_type:
            raise ValueError("Content-Type must be multipart/form-data")
        
        # Extract boundary
        '''
        If content_type = "multipart/form-data; boundary=----12345; charset=UTF-8",
        the regex captures ----12345.
        '''
        boundary_match = re.search(r'boundary=([^;]+)', content_type)
        if not boundary_match:
            raise ValueError("No boundary found in Content-Type header")
        
        boundary = boundary_match.group(1).strip('"')
        
        # Get body content with comprehensive debugging
        body = event.get('body', '')
        is_base64 = event.get('isBase64Encoded', False)
        
        # Log detailed information about the incoming data
        logger.info(f"Multipart parsing debug:")
        logger.info(f"  - isBase64Encoded: {is_base64}")
        logger.info(f"  - body type: {type(body)}")
        logger.info(f"  - body length: {len(body) if body else 0}")
        
        if body:
            # Sample first 100 characters to understand the format
            sample = body[:100] if len(body) > 100 else body
            logger.info(f"  - body sample (first 100 chars): {repr(sample)}")
            
            # Check if it looks like base64
            import string
            if isinstance(body, str):
                is_likely_base64 = all(c in string.ascii_letters + string.digits + '+/=' for c in body.replace('\n', '').replace('\r', ''))
                logger.info(f"  - appears to be base64: {is_likely_base64}")
        
        if is_base64:
            try:
                body = base64.b64decode(body)
                logger.info(f"✅ Successfully decoded base64 body to {len(body)} bytes")
            except Exception as e:
                logger.error(f"❌ Base64 decoding failed: {e}")
                raise ValueError(f"Failed to decode base64 body: {e}")
        else:
            # Handle non-base64 encoded body
            if isinstance(body, str):
                # Apply proven PDF reconstruction for API Gateway corruption
                body = apply_proven_pdf_reconstruction(body)
            elif isinstance(body, bytes):
                logger.info(f"✅ Body is already bytes: {len(body)} bytes")
            else:
                # Convert other types to string then bytes
                body = str(body).encode('utf-8')
                logger.info(f"✅ Converted {type(body)} to UTF-8 bytes: {len(body)} bytes")
        
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
                        
                    # Check for PDF header with detailed logging
                    if not content.startswith(b'%PDF'):
                        logger.warning(f"❌ Invalid PDF header in part {i}")
                        logger.warning(f"   Expected: b'%PDF', Got: {content[:20]}")
                        logger.warning(f"   Content sample: {repr(content[:100])}")
                        continue
                    else:
                        logger.info(f"✅ Valid PDF header found in part {i}: {content[:10]}")
                    
                    resume_content = BytesIO(content)
                    # Store clean PDF bytes for S3 save
                    resume_content.clean_pdf_bytes = content
                    logger.info(f"Successfully extracted PDF content from part {i}: {len(content)} bytes")
                    logger.info(f"✅ Attached clean_pdf_bytes attribute: {len(content)} bytes")
                    
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

#7. S3 PDF Downloading
'''
Purpose: Downloads a PDF file from S3 and returns it as a BytesIO object.
How:
Uses boto3 to get the object from S3.
Reads the file content into a BytesIO stream.
Returns the stream for further processing.
'''
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

 
    

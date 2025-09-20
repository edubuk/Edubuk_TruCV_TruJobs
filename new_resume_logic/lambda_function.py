import json
import uuid
import logging
import boto3
import time
from io import BytesIO
from pdf_processor import extract_text_from_pdf, save_pdf_to_s3
from ai_services import get_metadata_from_bedrock, create_section_embeddings
from opensearch_client import get_opensearch_client, normalize_metadata_for_opensearch, index_resume_document
from input_parser import determine_input_type, parse_json_input, parse_s3_event, parse_multipart_form, get_s3_pdf_content

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """Main Lambda handler function with comprehensive error handling"""
    start_time = time.time()
    resume_id = None
    
    try:
        logger.info("🚀 Processing resume upload request")
        
        # Validate event structure
        if not event:
            raise ValueError("Empty event received")
        
        # Log event with size limit to avoid CloudWatch overflow
        event_str = json.dumps(event, default=str)
        if len(event_str) > 2000:
            logger.info(f"Event (truncated): {event_str[:2000]}...")
        else:
            logger.info(f"Event: {event_str}")

        # Determine input type and process accordingly
        input_type = determine_input_type(event)
        logger.info(f"✅ Detected input type: {input_type}")
        
        # Generate unique identifiers
        resume_id = str(uuid.uuid4())
        filename = f"{resume_id}.pdf"
        logger.info(f"📝 Generated resume ID: {resume_id}")
        
        # Initialize variables with validation
        pdf_content = None
        job_description_id = None
        text = None
        
        # Validate remaining execution time
        remaining_time = context.get_remaining_time_in_millis() if context else 30000
        if remaining_time < 5000:  # Less than 5 seconds remaining
            raise TimeoutError(f"Insufficient time remaining: {remaining_time}ms")
        
        if input_type == 'json':
            # Handle JSON input (test events)
            data = parse_json_input(event)
            text = data['resume_content']
            job_description_id = data.get('job_description_id', 'test-jd-001')
            logger.info("Processing JSON input with embedded resume text")
            
        elif input_type == 'multipart':
            # Handle multipart form uploads
            pdf_content, job_description_id = parse_multipart_form(event)
            
            # Read PDF content once and create separate streams for different operations
            pdf_content.seek(0)
            pdf_content_bytes = pdf_content.read()
            
            # Create separate streams for text extraction and S3 upload
            text_extraction_stream = BytesIO(pdf_content_bytes)
            s3_upload_stream = BytesIO(pdf_content_bytes)
            
            # Extract text from PDF with timeout check
            pdf_start = time.time()
            elapsed_so_far = pdf_start - start_time
            
            # Check if we're already close to timeout (25s limit to be safe)
            if elapsed_so_far > 25:
                logger.error(f" Approaching timeout limit. Elapsed: {elapsed_so_far:.2f}s")
                return {
                    'statusCode': 408,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': 'processing_timeout',
                        'message': f'Processing took too long ({elapsed_so_far:.1f}s). Please try a simpler PDF or contact support.',
                        'elapsed_time': elapsed_so_far
                    })
                }
            
            logger.info(f" Starting PDF extraction at {elapsed_so_far:.2f}s elapsed")
            text = extract_text_from_pdf(pdf_content.getvalue())
            pdf_time = time.time() - pdf_start
            total_elapsed = time.time() - start_time
            logger.info(f"Extracted {len(text)} characters from multipart PDF in {pdf_time:.2f}s (total elapsed: {total_elapsed:.2f}s)")
            # Fail fast if no usable text to prevent empty embeddings and bad records
            min_chars = 50
            if not text or len(text.strip()) < min_chars:
                logger.warning("No usable text extracted from PDF after all fallbacks; aborting request")
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'no_extractable_text',
                        'message': 'Unable to extract readable text from the uploaded PDF. It may be image-only/blank or unsupported. Please upload a text-based PDF or enable the OCR layer.',
                    })
                }
            
            # Set pdf_content to the S3 upload stream for later S3 operations
            pdf_content = s3_upload_stream
            
        elif input_type == 's3':
            # Handle S3 event triggers
            bucket, key = parse_s3_event(event)
            
            # Skip all S3 event processing for resume uploads to prevent duplicates
            # The multipart form upload already handles complete processing
            logger.info(f"Skipping S3 event processing for resume upload: {key}")
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Resume already processed via multipart upload - skipping S3 event'})
            }
        
        # Save PDF to S3 if we have pdf_content
        s3_key = None
        if pdf_content:
            # Use clean PDF bytes if available, otherwise fall back to getvalue()
            if hasattr(pdf_content, 'clean_pdf_bytes'):
                pdf_content_bytes = pdf_content.clean_pdf_bytes
                logger.info(f"🎯 Using clean PDF bytes for S3 save: {len(pdf_content_bytes)} bytes")
            else:
                pdf_content_bytes = pdf_content.getvalue()
                logger.info(f"⚠️ Using BytesIO content for S3 save: {len(pdf_content_bytes)} bytes")
            
            s3_key = save_pdf_to_s3(pdf_content_bytes, filename)
            logger.info(f"✅ Saved PDF to S3: {s3_key}")

        # Initialize OpenSearch
        opensearch = get_opensearch_client()

        # Get structured metadata using Bedrock
        bedrock_start = time.time()
        raw_metadata = get_metadata_from_bedrock(text)
        bedrock_time = time.time() - bedrock_start
        candidate_name = raw_metadata.get('full_name', 'Unknown')
        logger.info(f"Extracted metadata for candidate: {candidate_name} in {bedrock_time:.2f}s")

        # Normalize metadata for OpenSearch compatibility
        normalized_metadata = normalize_metadata_for_opensearch(raw_metadata, text)

        # Create section-specific embeddings
        embedding_start = time.time()
        embeddings = create_section_embeddings(raw_metadata)
        embedding_time = time.time() - embedding_start
        logger.info(f"Generated section-specific embeddings in {embedding_time:.2f}s")

        # Check timeout before indexing (slowest operation)
        pre_index_elapsed = time.time() - start_time
        if pre_index_elapsed > 25:
            logger.error(f"⏰ Timeout before indexing. Elapsed: {pre_index_elapsed:.2f}s")
            return {
                'statusCode': 408,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'processing_timeout',
                    'message': f'Processing took too long before indexing ({pre_index_elapsed:.1f}s). PDF processed successfully but indexing skipped.',
                    'elapsed_time': pre_index_elapsed,
                    'resume_id': resume_id,
                    'candidate_name': candidate_name
                })
            }
        
        # Index document in OpenSearch
        index_start = time.time()
        logger.info(f"⏱️ Starting OpenSearch indexing at {pre_index_elapsed:.2f}s elapsed")
        response = index_resume_document(
            opensearch, resume_id, job_description_id, filename, 
            candidate_name, s3_key, normalized_metadata, embeddings
        )
        index_time = time.time() - index_start
        total_time = time.time() - start_time
        logger.info(f"Indexed document in {index_time:.2f}s. Total processing time: {total_time:.2f}s")
        
        # Final timeout check
        if total_time > 28:
            logger.warning(f"⚠️ Processing completed but took {total_time:.2f}s (close to 29s limit)")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Successfully processed resume',
                'resume_id': resume_id,
                'filename': filename,
                'job_description_id': job_description_id,
                'candidate_name': candidate_name,
                's3_key': s3_key
                # 'opensearch_id': response.get('_id')
            })
        }

    except TimeoutError as e:
        elapsed = time.time() - start_time
        logger.error(f"⏰ Timeout error after {elapsed:.2f}s: {str(e)}")
        return {
            'statusCode': 408,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Request timeout',
                'message': f'Processing timed out after {elapsed:.2f}s: {str(e)}',
                'resume_id': resume_id,
                'elapsed_time': elapsed
            })
        }
        
    except ValueError as e:
        elapsed = time.time() - start_time
        logger.error(f"❌ Validation error after {elapsed:.2f}s: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Invalid request format or missing required data'
            })
        }

    except Exception as e:
        elapsed = time.time() - start_time
        error_msg = str(e)
        
        # Categorize errors for better debugging
        if "bedrock" in error_msg.lower():
            error_type = "AI Processing Error"
            status_code = 503
        elif "opensearch" in error_msg.lower():
            error_type = "Search Index Error"
            status_code = 503
        elif "s3" in error_msg.lower():
            error_type = "Storage Error"
            status_code = 503
        elif "pdf" in error_msg.lower() or "extract" in error_msg.lower():
            error_type = "PDF Processing Error"
            status_code = 422
        else:
            error_type = "Internal Server Error"
            status_code = 500
        
        logger.error(f"💥 {error_type} after {elapsed:.2f}s: {error_msg}", exc_info=True)
        
        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': error_type,
                'message': f'Failed to process resume: {error_msg}',
                'resume_id': resume_id,
                'elapsed_time': elapsed,
                'timestamp': time.time()
            })
        }
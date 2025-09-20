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
    """Main Lambda handler function"""
    try:
        start_time = time.time()
        logger.info("Processing resume upload request")
        logger.info(f"Event: {json.dumps(event, default=str)}")

        # Determine input type and process accordingly
        input_type = determine_input_type(event)
        logger.info(f"Detected input type: {input_type}")
        
        # Generate unique identifiers
        resume_id = str(uuid.uuid4())
        filename = f"{resume_id}.pdf"
        
        # Initialize variables
        pdf_content = None
        job_description_id = None
        text = None
        
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
            
            # Extract text from PDF
            pdf_start = time.time()
            text = extract_text_from_pdf(pdf_content.getvalue())
            pdf_time = time.time() - pdf_start
            logger.info(f"Extracted {len(text)} characters from multipart PDF in {pdf_time:.2f}s")
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
            pdf_content_bytes = pdf_content.getvalue()
            s3_key = save_pdf_to_s3(pdf_content_bytes, filename)
            logger.info(f"Saved PDF to S3: {s3_key}")

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

        # Index document in OpenSearch
        index_start = time.time()
        response = index_resume_document(
            opensearch, resume_id, job_description_id, filename, 
            candidate_name, s3_key, normalized_metadata, embeddings
        )
        index_time = time.time() - index_start
        total_time = time.time() - start_time
        logger.info(f"Indexed document in {index_time:.2f}s. Total processing time: {total_time:.2f}s")

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

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
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
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': f'Failed to process resume: {str(e)}'
            })
        }
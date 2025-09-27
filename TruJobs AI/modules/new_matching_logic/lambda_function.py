import json
import base64
import time
from config import DEFAULT_TOP_K, HEADERS, logger
from opensearch_client import get_opensearch_client
from resume_service import (
    verify_job_description, get_job_description_embedding, 
    get_resume_embeddings, verify_job_description_text, get_job_description_text_embedding
)
from similarity_calculator import (
    calculate_multi_vector_similarity, 
    create_match_explanation_from_metadata
)


def parse_request_body(event):
    """Parse and validate request body from Lambda event"""
    request_data = None
    
    if 'body' in event:
        try:
            if isinstance(event['body'], dict):
                request_data = event['body']
            elif isinstance(event['body'], str):
                if event.get('isBase64Encoded', False):
                    # Handle base64 encoded body
                    decoded_body = base64.b64decode(event['body']).decode('utf-8')
                    request_data = json.loads(decoded_body)
                elif event['body']:
                    # Handle regular string body
                    request_data = json.loads(event['body'])
                else:
                    raise ValueError('Empty request body')
        except json.JSONDecodeError as e:
            raise ValueError(f'Invalid JSON in request body: {str(e)}')
    else:
        request_data = event
        
    if not request_data:
        raise ValueError('No request data found')
    
    return request_data


def create_error_response(status_code, error_message):
    """Create standardized error response"""
    return {
        'statusCode': status_code,
        'headers': HEADERS,
        'body': json.dumps({'error': True, 'message': error_message})
    }


def create_success_response(job_data, matches, execution_time, debug_info=None):
    """Create standardized success response"""
    response_body = {
        'job_description': {
            'id': job_data.get('id'),
            'title': job_data.get('title', 'Job Description')
        },
        'matches': matches,
        'total_matches': len(matches),
        'execution_time': f"{execution_time:.4f}s"
    }
    
    if debug_info:
        response_body['debug_info'] = debug_info
    
    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps(response_body)
    }


def process_resume_matching_by_id(opensearch, job_description_id, resume_id, top_k, 
                                 metadata_filters, similarity_threshold, calculate_similarity):
    """Process resume matching using job description ID"""
    
    # Get resume embeddings first
    resume_embeddings = get_resume_embeddings(
        opensearch, job_description_id, resume_id, top_k, metadata_filters
    )

    if not resume_embeddings:
        return [], {'total_resumes_found': 0, 'method': 'job_id_based'}

    # If similarity calculation is disabled, return all resumes without scores
    if not calculate_similarity:
        matches = []
        for resume in resume_embeddings:
            matches.append({
                'nano_Id': resume.get('nano_Id'),
                'resume_id': resume['resume_id'],
                'candidate_name': resume['candidate_name'],
                'similarity_score': None,
                'vector_scores': None,
                'match_explanation': 'Resume uploaded for this job description',
                'metadata': resume['metadata']
            })
        
        return matches, {
            'total_resumes_found': len(resume_embeddings),
            'similarity_calculation': 'skipped',
            'method': 'job_id_based'
        }

    # Verify job description exists
    job_hits = verify_job_description(opensearch, job_description_id)
    if not job_hits:
        raise ValueError(f'Job description not found: {job_description_id}')
    
    # Get job description embedding
    job_data = get_job_description_embedding(opensearch, job_description_id)
    
    if not job_data.get('embedding'):
        # Return resumes without similarity scores if no embedding available
        matches = []
        for resume in resume_embeddings:
            matches.append({
                'nano_Id': resume.get('nano_Id'),
                'resume_id': resume['resume_id'],
                'candidate_name': resume['candidate_name'],
                'similarity_score': None,
                'vector_scores': None,
                'match_explanation': 'Resume uploaded for this job description (no similarity score available)',
                'metadata': resume['metadata']
            })
        
        return matches, {
            'total_resumes_found': len(resume_embeddings),
            'similarity_calculation': 'no job embedding available',
            'job_title': job_data.get('job_title'),
            'method': 'job_id_based'
        }
    
    # Calculate similarities using multi-vector approach
    similarities = calculate_multi_vector_similarity(
        job_data['embedding'], resume_embeddings, similarity_threshold
    )

    # Create match explanations
    matches = []
    for similarity in similarities:
        match_explanation = create_match_explanation_from_metadata(
            similarity['metadata'], similarity['vector_scores']
        )
        
        matches.append({
            'nano_Id': similarity.get('nano_Id'),
            'resume_id': similarity['resume_id'],
            'candidate_name': similarity['candidate_name'],
            'similarity_score': similarity['similarity_score'],
            'vector_scores': similarity['vector_scores'],
            'match_explanation': match_explanation,
            'metadata': similarity['metadata']
        })

    return matches, {
        'total_resumes_found': len(resume_embeddings),
        'job_embedding_dimension': len(job_data['embedding']),
        'similarity_threshold': similarity_threshold,
        'job_title': job_data.get('job_title'),
        'method': 'job_id_based'
    }


def process_resume_matching_by_text(opensearch, job_description_text, resume_id, top_k, 
                                   metadata_filters, similarity_threshold):
    """Process resume matching using job description text (fallback method)"""
    
    # Validate job description text
    validation_result = verify_job_description_text(job_description_text)
    if not validation_result.get('valid'):
        raise ValueError(f"Invalid job description: {validation_result.get('reason')}")
    
    # Get job description embedding from text
    job_embedding = get_job_description_text_embedding(job_description_text)
    
    if not job_embedding:
        raise ValueError("Failed to generate job description embedding")
    
    # For text-based matching, we need to search all resumes since we don't have a specific job ID
    # This is a simplified approach - in production you might want more sophisticated filtering
    
    # Get all resume embeddings (this is a simplified approach)
    resume_embeddings = get_resume_embeddings(
        opensearch, None, resume_id, top_k, metadata_filters
    )

    if not resume_embeddings:
        return [], {'total_resumes_found': 0, 'method': 'text_based'}

    # Calculate similarities using multi-vector approach
    similarities = calculate_multi_vector_similarity(
        job_embedding, resume_embeddings, similarity_threshold
    )

    # Create match explanations
    matches = []
    for similarity in similarities:
        match_explanation = create_match_explanation_from_metadata(
            similarity['metadata'], similarity['vector_scores']
        )
        
        matches.append({
            'nano_Id': similarity.get('nano_Id'),
            'resume_id': similarity['resume_id'],
            'candidate_name': similarity['candidate_name'],
            'similarity_score': similarity['similarity_score'],
            'vector_scores': similarity['vector_scores'],
            'match_explanation': match_explanation,
            'metadata': similarity['metadata']
        })

    return matches, {
        'total_resumes_found': len(resume_embeddings),
        'job_embedding_dimension': len(job_embedding),
        'similarity_threshold': similarity_threshold,
        'job_title': 'Job Description (from text)',
        'method': 'text_based'
    }


def lambda_handler(event, context):
    """Main Lambda handler function - supports both job_description_id and job_description text"""
    total_start_time = time.time()
    
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Parse and validate request
        try:
            request_data = parse_request_body(event)
        except ValueError as e:
            return create_error_response(400, str(e))

        # Extract parameters with support for both input types
        job_description_id = request_data.get('job_description_id')
        job_description_text = request_data.get('job_description')  # Legacy support
        
        # Validate that we have either job_description_id or job_description
        if not job_description_id and not job_description_text:
            return create_error_response(400, 'Either job_description_id or job_description is required')

        resume_id = request_data.get('resume_id')
        top_k = request_data.get('top_k', DEFAULT_TOP_K)
        metadata_filters = request_data.get('metadata_filters', {})
        similarity_threshold = request_data.get('similarity_threshold', 0.0)
        calculate_similarity = request_data.get('calculate_similarity', True)

        logger.info(f"Parameters: job_description_id={job_description_id}, job_description_text_provided={bool(job_description_text)}, "
                   f"resume_id={resume_id}, top_k={top_k}, metadata_filters={metadata_filters}, "
                   f"similarity_threshold={similarity_threshold}, calculate_similarity={calculate_similarity}")

        # Initialize OpenSearch client
        opensearch = get_opensearch_client()
        
        # Choose processing method based on input
        if job_description_id:
            # Process using job description ID (preferred method)
            matches, debug_info = process_resume_matching_by_id(
                opensearch, job_description_id, resume_id, top_k, 
                metadata_filters, similarity_threshold, calculate_similarity
            )
            job_data = {
                'id': job_description_id,
                'title': debug_info.get('job_title', 'Job Description')
            }
        else:
            # Process using job description text (fallback method)
            matches, debug_info = process_resume_matching_by_text(
                opensearch, job_description_text, resume_id, top_k, 
                metadata_filters, similarity_threshold
            )
            job_data = {
                'id': 'text_based',
                'title': 'Job Description (from text)'
            }

        total_execution_time = time.time() - total_start_time
        logger.info(f"Total execution time: {total_execution_time:.4f} seconds")

        return create_success_response(job_data, matches, total_execution_time, debug_info)
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error("Error details:", exc_info=True)
        return create_error_response(500, f"Internal server error: {str(e)}")


def create_success_response(job_data, matches, execution_time, debug_info=None):
    """Create standardized success response"""
    response_body = {
        'job_description': {
            'id': job_data.get('id'),
            'title': job_data.get('title', 'Job Description')
        },
        'matches': matches,
        'total_matches': len(matches),
        'execution_time': f"{execution_time:.4f}s"
    }
    
    if debug_info:
        response_body['debug_info'] = debug_info
    
    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps(response_body)
    }


def process_resume_matching(opensearch, job_description_id, resume_id, top_k, 
                          metadata_filters, similarity_threshold, calculate_similarity):
    """Process resume matching logic"""
    
    # Get resume embeddings first
    resume_embeddings = get_resume_embeddings(
        opensearch, job_description_id, resume_id, top_k, metadata_filters
    )

    if not resume_embeddings:
        return [], {'total_resumes_found': 0}

    # If similarity calculation is disabled, return resumes without scores but apply top_k
    if not calculate_similarity:
        # Apply top_k filtering even without similarity calculation
        limited_resumes = resume_embeddings[:top_k] if top_k > 0 else resume_embeddings
        
        matches = []
        for resume in limited_resumes:
            matches.append({
                'nano_Id': resume.get('nano_Id'),
                'resume_id': resume['resume_id'],
                'candidate_name': resume['candidate_name'],
                'similarity_score': None,
                'vector_scores': None,
                'match_explanation': 'Resume uploaded for this job description',
                'metadata': resume['metadata']
            })
        
        return matches, {
            'total_resumes_found': len(resume_embeddings),
            'matches_returned': len(matches),
            'top_k_applied': top_k,
            'similarity_calculation': 'skipped'
        }

    # Verify job description exists
    job_hits = verify_job_description(opensearch, job_description_id)
    if not job_hits:
        raise ValueError(f'Job description not found: {job_description_id}')
    
    # Get job description embedding
    job_data = get_job_description_embedding(opensearch, job_description_id)
    
    if not job_data.get('embedding'):
        # Return resumes without similarity scores if no embedding available, but apply top_k
        limited_resumes = resume_embeddings[:top_k] if top_k > 0 else resume_embeddings
        
        matches = []
        for resume in limited_resumes:
            matches.append({
                'nano_Id': resume.get('nano_Id'),
                'resume_id': resume['resume_id'],
                'candidate_name': resume['candidate_name'],
                'similarity_score': None,
                'vector_scores': None,
                'match_explanation': 'Resume uploaded for this job description (no similarity score available)',
                'metadata': resume['metadata']
            })
        
        return matches, {
            'total_resumes_found': len(resume_embeddings),
            'matches_returned': len(matches),
            'top_k_applied': top_k,
            'similarity_calculation': 'no job embedding available',
            'job_title': job_data.get('job_title')
        }
    
    # Calculate similarities using multi-vector approach
    similarities = calculate_multi_vector_similarity(
        job_data['embedding'], resume_embeddings, similarity_threshold
    )

    # Apply similarity threshold filtering
    if similarity_threshold > 0.0:
        similarities = [s for s in similarities if s['similarity_score'] >= similarity_threshold]
        logger.info(f"After similarity threshold {similarity_threshold}: {len(similarities)} matches")

    # Sort by similarity score (descending)
    similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
    
    # Apply top_k filtering
    if top_k > 0:
        similarities = similarities[:top_k]
        logger.info(f"After top_k filtering ({top_k}): {len(similarities)} matches")

    # Create match explanations
    matches = []
    for similarity in similarities:
        match_explanation = create_match_explanation_from_metadata(
            similarity['metadata'], similarity['vector_scores']
        )
        
        matches.append({
            'nano_Id': similarity.get('nano_Id'),
            'resume_id': similarity['resume_id'],
            'candidate_name': similarity['candidate_name'],
            'similarity_score': similarity['similarity_score'],
            'vector_scores': similarity['vector_scores'],
            'match_explanation': match_explanation,
            'metadata': similarity['metadata']
        })

    return matches, {
        'total_resumes_found': len(resume_embeddings),
        'matches_after_threshold': len(similarities) if similarity_threshold > 0.0 else len(resume_embeddings),
        'matches_returned': len(matches),
        'job_embedding_dimension': len(job_data['embedding']),
        'similarity_threshold': similarity_threshold,
        'top_k_applied': top_k,
        'job_title': job_data.get('job_title')
    }


def lambda_handler(event, context):
    """Main Lambda handler function"""
    total_start_time = time.time()
    
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Parse and validate request
        try:
            request_data = parse_request_body(event)
        except ValueError as e:
            return create_error_response(400, str(e))

        # Extract and validate parameters
        job_description_id = request_data.get('job_description_id')
        if not job_description_id:
            return create_error_response(400, 'job_description_id is required')

        resume_id = request_data.get('resume_id')
        top_k = request_data.get('top_k', DEFAULT_TOP_K)
        metadata_filters = request_data.get('metadata_filters', {})
        similarity_threshold = request_data.get('similarity_threshold', 0.0)
        calculate_similarity = request_data.get('calculate_similarity', True)

        logger.info(f"Parameters: job_description_id={job_description_id}, resume_id={resume_id}, "
                   f"top_k={top_k}, metadata_filters={metadata_filters}, similarity_threshold={similarity_threshold}, "
                   f"calculate_similarity={calculate_similarity}")

        # Initialize OpenSearch client
        opensearch = get_opensearch_client()
        
        # Process resume matching
        matches, debug_info = process_resume_matching(
            opensearch, job_description_id, resume_id, top_k, 
            metadata_filters, similarity_threshold, calculate_similarity
        )

        total_execution_time = time.time() - total_start_time
        logger.info(f"Total execution time: {total_execution_time:.4f} seconds")

        # Create response
        job_data = {
            'id': job_description_id,
            'title': debug_info.get('job_title', 'Job Description')
        }

        return create_success_response(job_data, matches, total_execution_time, debug_info)
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error("Error details:", exc_info=True)
        return create_error_response(500, f"Internal server error: {str(e)}")
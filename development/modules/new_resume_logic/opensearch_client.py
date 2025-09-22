import json
import boto3
import logging
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
from datetime import datetime
from config import AWS_REGION, OPENSEARCH_ENDPOINT, OPENSEARCH_INDEX

logger = logging.getLogger()


def get_opensearch_client():
    """Initialize OpenSearch client and create/update index if needed"""
    service = 'aoss'
    credentials = boto3.Session().get_credentials()
    auth = AWSV4SignerAuth(credentials, AWS_REGION, service)

    endpoint = OPENSEARCH_ENDPOINT
    if '://' in endpoint:
        endpoint = endpoint.split('://')[-1]
    endpoint = endpoint.replace('[', '').replace(']', '').strip()

    opensearch = OpenSearch(
        hosts=[{'host': endpoint, 'port': 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        timeout=30
    )

    # Check if index exists and handle mapping conflicts
    try:
        if opensearch.indices.exists(index=OPENSEARCH_INDEX):
            logger.info(f"Index '{OPENSEARCH_INDEX}' already exists")
            
            # Try to update mapping for compatibility
            try:
                mapping_update = {
                    "properties": {
                        "metadata": {
                            "type": "object",
                            "properties": {
                                "projects_text": {"type": "text"},
                                "work_experience_text": {"type": "text"},
                                "education_text": {"type": "text"}
                            }
                        }
                    }
                }
                opensearch.indices.put_mapping(index=OPENSEARCH_INDEX, body=mapping_update)
                logger.info("Updated index mapping for compatibility")
            except Exception as e:
                logger.warning(f"Could not update mapping: {str(e)}")
        else:
            # Create new index with schema
            index_body = {
                'mappings': {
                    'properties': {
                        'resume_id': {'type': 'keyword'},
                        'job_description_id': {'type': 'keyword'},
                        'file_name': {'type': 'keyword'},
                        'upload_date': {'type': 'date'},
                        'candidate_name': {'type': 'text'},
                        's3_key': {'type': 'keyword'},
                        
                        # Multi-vector fields for different resume sections
                        'skills_vector': {'type': 'knn_vector', 'dimension': 1024},
                        'experience_vector': {'type': 'knn_vector', 'dimension': 1024},
                        'certification_vector': {'type': 'knn_vector', 'dimension': 1024},
                        'projects_vector': {'type': 'knn_vector', 'dimension': 1024},
                        
                        # Flattened metadata structure
                        'metadata': {
                            'type': 'object',
                            'properties': {
                                'full_name': {'type': 'text'},
                                'email': {'type': 'keyword'},
                                'phone': {'type': 'keyword'},
                                'location': {'type': 'text'},
                                'skills': {'type': 'text'},
                                'skills_list': {'type': 'keyword'},
                                'work_experience_text': {'type': 'text'},
                                'certifications': {'type': 'text'},
                                'projects_text': {'type': 'text'},
                                'education_text': {'type': 'text'},
                                'summary': {'type': 'text'},
                                'raw_text_preview': {'type': 'text'}
                            }
                        }
                    }
                },
                'settings': {
                    'index.knn': True,
                    'index.knn.algo_param.ef_search': 100
                }
            }
            opensearch.indices.create(index=OPENSEARCH_INDEX, body=index_body)
            logger.info(f"Created '{OPENSEARCH_INDEX}' index")
    except Exception as e:
        logger.warning(f"Index management warning: {str(e)}")

    return opensearch


def normalize_metadata_for_opensearch(metadata, raw_text):
    """Normalize metadata to ensure compatibility with OpenSearch schema"""
    try:
        normalized = {}
        
        def to_string_list(items, kind):
            """Convert a list potentially containing dicts/strings into a list of readable strings."""
            result = []
            if not isinstance(items, list):
                return [str(items)] if items else []
            for it in items:
                try:
                    if isinstance(it, dict):
                        if kind == 'work':
                            # Handle work experience objects
                            parts = []
                            if it.get('job_title') or it.get('title'):
                                parts.append(f"Title: {it.get('job_title') or it.get('title')}")
                            if it.get('company'):
                                parts.append(f"Company: {it.get('company')}")
                            if it.get('start_date') or it.get('end_date'):
                                duration = f"{it.get('start_date', '')} - {it.get('end_date', '')}".strip(' -')
                                if duration:
                                    parts.append(f"Duration: {duration}")
                            if it.get('description'):
                                parts.append(f"Description: {it.get('description')}")
                            text = '. '.join(parts) if parts else str(it)
                        elif kind == 'project':
                            # Handle project objects
                            parts = []
                            if it.get('name') or it.get('title'):
                                parts.append(f"Project: {it.get('name') or it.get('title')}")
                            if it.get('details') or it.get('description'):
                                parts.append(it.get('details') or it.get('description'))
                            text = '. '.join(parts) if parts else str(it)
                        elif kind == 'cert':
                            # Handle certification objects or strings
                            if isinstance(it, str):
                                text = it
                            else:
                                parts = []
                                if it.get('name'):
                                    parts.append(it.get('name'))
                                if it.get('issuer'):
                                    parts.append(f"by {it.get('issuer')}")
                                if it.get('date'):
                                    parts.append(f"({it.get('date')})")
                                text = ' '.join(parts) if parts else str(it)
                        elif kind == 'edu':
                            # Handle education objects
                            parts = []
                            if it.get('name') or it.get('degree'):
                                parts.append(it.get('name') or it.get('degree'))
                            if it.get('details') or it.get('institution'):
                                parts.append(it.get('details') or it.get('institution'))
                            text = '. '.join(parts) if parts else str(it)
                        elif kind == 'skill':
                            # Handle skill objects (shouldn't happen, but just in case)
                            if isinstance(it, str):
                                text = it
                            else:
                                text = it.get('name') or it.get('skill') or str(it)
                        else:
                            # Fallback for any other dict
                            text = str(it)
                        result.append(text)
                    elif isinstance(it, (str, int, float)):
                        result.append(str(it))
                    else:
                        result.append(str(it))
                except Exception as e:
                    logger.warning(f"Error processing item {it} of kind {kind}: {str(e)}")
                    result.append(str(it))
            return result
        
        # Handle simple fields
        for field in ['full_name', 'email', 'phone', 'location', 'summary']:
            value = metadata.get(field, None)
            normalized[field] = str(value) if value is not None else None
        
        # Handle skills - normalize to string list then join for text field
        skills = metadata.get('skills', [])
        skills_list = to_string_list(skills, kind='skill')
        normalized['skills'] = ' '.join(skills_list) if skills_list else ''
        normalized['skills_list'] = skills_list
        
        # Flatten work experience to text
        work_exp = metadata.get('work_experience', [])
        work_exp_texts = to_string_list(work_exp, kind='work')
        normalized['work_experience_text'] = ' | '.join(work_exp_texts) if work_exp_texts else ''
        
        # Handle certifications - convert array to text
        certifications = metadata.get('certifications', [])
        cert_texts = to_string_list(certifications, kind='cert')
        normalized['certifications'] = ' | '.join(cert_texts) if cert_texts else ''
        
        # Flatten projects to text
        projects = metadata.get('projects', [])
        project_texts = to_string_list(projects, kind='project')
        normalized['projects_text'] = ' | '.join(project_texts) if project_texts else ''
        
        # Flatten education to text
        education = metadata.get('education', [])
        education_texts = to_string_list(education, kind='edu')
        normalized['education_text'] = ' | '.join(education_texts) if education_texts else ''
        
        # Add truncated raw text for debugging
        normalized['raw_text_preview'] = raw_text[:1000] if raw_text else ''
        
        logger.info(f"Normalized metadata created")
        return normalized
        
    except Exception as e:
        logger.error(f"Metadata normalization error: {str(e)}")
        return {
            'full_name': 'Unknown',
            'email': None,
            'phone': None,
            'location': None,
            'skills': '',
            'skills_list': [],
            'work_experience_text': '',
            'certifications': '',
            'projects_text': '',
            'education_text': '',
            'summary': None,
            'raw_text_preview': raw_text[:1000] if raw_text else ''
        }


def index_resume_document(opensearch, resume_id, job_description_id, filename, candidate_name, s3_key, normalized_metadata, embeddings):
    """Index resume document in OpenSearch"""
    try:
        document = {
            'resume_id': resume_id,
            'job_description_id': job_description_id,
            'file_name': filename,
            'upload_date': datetime.utcnow().isoformat(),
            'candidate_name': candidate_name,
            's3_key': s3_key,
            'metadata': normalized_metadata,
            **embeddings
        }

        # Add timeout setting for faster indexing
        response = opensearch.index(
            index=OPENSEARCH_INDEX, 
            body=document,
            timeout=30  # Set explicit timeout (seconds as number)
        )
        logger.info(f"Indexed document with ID: {response.get('_id')}")
        return response
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"💥 Document indexing error: {error_msg}")
        
        # Provide specific error context
        if "timeout" in error_msg.lower():
            raise TimeoutError(f"OpenSearch indexing timed out: {error_msg}")
        elif "connection" in error_msg.lower():
            raise ConnectionError(f"OpenSearch connection failed: {error_msg}")
        elif "unauthorized" in error_msg.lower() or "403" in error_msg:
            raise PermissionError(f"OpenSearch access denied: {error_msg}")
        elif "not found" in error_msg.lower() or "404" in error_msg:
            raise ValueError(f"OpenSearch index not found: {error_msg}")
        else:
            raise RuntimeError(f"OpenSearch indexing failed: {error_msg}") 
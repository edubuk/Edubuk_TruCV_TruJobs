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
        
        # Handle simple fields
        for field in ['full_name', 'email', 'phone', 'location', 'summary']:
            value = metadata.get(field, None)
            normalized[field] = str(value) if value is not None else None
        
        # Handle skills - convert array to both text and keyword list
        skills = metadata.get('skills', [])
        if isinstance(skills, list):
            normalized['skills'] = ' '.join(skills) if skills else ''
            normalized['skills_list'] = skills
        else:
            skills_str = str(skills) if skills else ''
            normalized['skills'] = skills_str
            normalized['skills_list'] = [skills_str] if skills_str else []
        
        # Flatten work experience to text
        work_exp = metadata.get('work_experience', [])
        if isinstance(work_exp, list):
            work_exp_texts = []
            for exp in work_exp:
                if isinstance(exp, dict):
                    exp_text = f"Company: {exp.get('company', 'N/A')}, Title: {exp.get('title', 'N/A')}, Duration: {exp.get('duration', 'N/A')}, Description: {exp.get('description', 'N/A')}"
                    work_exp_texts.append(exp_text)
                elif isinstance(exp, str):
                    work_exp_texts.append(exp)
            normalized['work_experience_text'] = ' | '.join(work_exp_texts)
        else:
            normalized['work_experience_text'] = str(work_exp) if work_exp else ''
        
        # Handle certifications - convert array to text
        certifications = metadata.get('certifications', [])
        if isinstance(certifications, list):
            normalized['certifications'] = ' '.join(certifications) if certifications else ''
        else:
            normalized['certifications'] = str(certifications) if certifications else ''
        
        # Flatten projects to text
        projects = metadata.get('projects', [])
        if isinstance(projects, list):
            project_texts = []
            for project in projects:
                if isinstance(project, dict):
                    proj_text = f"Title: {project.get('title', 'N/A')}, Description: {project.get('description', 'N/A')}"
                    project_texts.append(proj_text)
                elif isinstance(project, str):
                    project_texts.append(project)
            normalized['projects_text'] = ' | '.join(project_texts)
        else:
            normalized['projects_text'] = str(projects) if projects else ''
        
        # Flatten education to text
        education = metadata.get('education', [])
        if isinstance(education, list):
            education_texts = []
            for edu in education:
                if isinstance(edu, dict):
                    edu_text = f"Institution: {edu.get('institution', 'N/A')}, Degree: {edu.get('degree', 'N/A')}, Field: {edu.get('field', 'N/A')}, Year: {edu.get('year', 'N/A')}"
                    education_texts.append(edu_text)
                elif isinstance(edu, str):
                    education_texts.append(edu)
            normalized['education_text'] = ' | '.join(education_texts)
        else:
            normalized['education_text'] = str(education) if education else ''
        
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

        response = opensearch.index(index=OPENSEARCH_INDEX, body=document)
        logger.info(f"Indexed document with ID: {response.get('_id')}")
        return response
        
    except Exception as e:
        logger.error(f"Document indexing error: {str(e)}")
        raise 
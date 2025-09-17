import json
import boto3
import logging
import re
from config import AWS_REGION, BEDROCK_ENDPOINT, EMBEDDING_MODEL_ID, LLM_MODEL_ID, MAX_TEXT_LENGTH, MAX_EMBEDDING_LENGTH, EMBEDDING_DIMENSION
from prompts import get_metadata_extraction_prompt

logger = logging.getLogger()
bedrock = boto3.client('bedrock-runtime', AWS_REGION, endpoint_url=BEDROCK_ENDPOINT)


def get_metadata_from_bedrock(text):
    """Extract structured metadata from resume text using Bedrock"""
    try:
        logger.info(f"Input text length: {len(text)}")
        
        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH] + "..."
        
        prompt_text = get_metadata_extraction_prompt(text)
        
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "temperature": 0.1,
            "messages": [
                {"role": "user", "content": [{"type": "text", "text": prompt_text}]}
            ]
        })

        logger.info("Calling Bedrock for metadata extraction...")
        
        response = bedrock.invoke_model(
            body=body,
            modelId=LLM_MODEL_ID,
            accept="application/json",
            contentType="application/json"
        )
        
        response_body = json.loads(response['body'].read())
        llm_output = response_body['content'][0]['text']
        
        logger.info(f"Bedrock response: {llm_output}")
        
        try:
            metadata = json.loads(llm_output)
        except json.JSONDecodeError:
            json_match = re.search(r'\{.*\}', llm_output, re.DOTALL)
            if json_match:
                try:
                    metadata = json.loads(json_match.group())
                except json.JSONDecodeError:
                    logger.error("Failed to parse JSON from LLM response")
                    raise ValueError("Invalid JSON in LLM response")
            else:
                logger.error("No JSON found in LLM response")
                raise ValueError("No JSON found in LLM response")
        
        # Ensure all required fields exist with defaults
        defaults = {
            'full_name': 'Unknown',
            'email': None,
            'phone': None,
            'location': None,
            'skills': [],
            'work_experience': [],
            'certifications': [],
            'projects': [],
            'education': [],
            'summary': None
        }
        
        for key, default_value in defaults.items():
            if key not in metadata or metadata[key] is None:
                metadata[key] = default_value
        
        # Process skills to ensure they are concise
        if isinstance(metadata.get('skills'), list):
            processed_skills = []
            for skill in metadata['skills']:
                if isinstance(skill, str):
                    skill = skill.strip()
                    skill = re.sub(r'^(Experience with|Proficient in|Skilled in|Knowledge of|Familiar with)\s+', '', skill, flags=re.IGNORECASE)
                    skill = skill.split(' and ')[0].split(',')[0].strip()
                    if skill and len(skill) < 50:
                        processed_skills.append(skill)
            metadata['skills'] = processed_skills
        
        logger.info(f"Extracted metadata: {json.dumps(metadata, indent=2)}")
        return metadata
        
    except Exception as e:
        logger.error(f"Bedrock metadata extraction error: {str(e)}")
        return {
            'full_name': 'Unknown',
            'email': None,
            'phone': None,
            'location': None,
            'skills': [],
            'work_experience': [],
            'certifications': [],
            'projects': [],
            'education': [],
            'summary': None
        }


def get_embedding(text):
    """Generate embedding vector for given text using Bedrock"""
    try:
        if not text or not text.strip():
            logger.warning("Empty text provided for embedding")
            return [0.0] * EMBEDDING_DIMENSION
        
        if len(text) > MAX_EMBEDDING_LENGTH:
            text = text[:MAX_EMBEDDING_LENGTH]
        
        response = bedrock.invoke_model(
            body=json.dumps({"inputText": text.strip()}),
            modelId=EMBEDDING_MODEL_ID,
            accept="application/json",
            contentType="application/json"
        )
        
        response_body = json.loads(response['body'].read())
        embedding = response_body.get('embedding')
        
        if not embedding or len(embedding) != EMBEDDING_DIMENSION:
            logger.warning("Invalid embedding received, using zero vector")
            return [0.0] * EMBEDDING_DIMENSION
            
        return embedding
        
    except Exception as e:
        logger.error(f"Embedding generation error: {str(e)}")
        return [0.0] * EMBEDDING_DIMENSION


def create_section_embeddings(metadata):
    """Create separate embeddings for different resume sections"""
    try:
        # Skills vector
        skills_text = ' '.join(metadata.get('skills', []))
        logger.info(f"Skills text for embedding: '{skills_text}'")
        skills_vector = get_embedding(skills_text)
        
        # Experience vector
        experience_texts = []
        for exp in metadata.get('work_experience', []):
            if isinstance(exp, dict):
                exp_text = f"{exp.get('title', '')} at {exp.get('company', '')} {exp.get('description', '')}"
                experience_texts.append(exp_text.strip())
            elif isinstance(exp, str):
                experience_texts.append(exp)
        experience_text = ' '.join(experience_texts)
        experience_vector = get_embedding(experience_text)
        
        # Certification vector
        certifications_list = metadata.get('certifications', [])
        if isinstance(certifications_list, list):
            certifications_text = ' '.join(certifications_list)
        else:
            certifications_text = str(certifications_list)
        certification_vector = get_embedding(certifications_text)
        
        # Projects vector
        projects_texts = []
        for project in metadata.get('projects', []):
            if isinstance(project, dict):
                proj_text = f"{project.get('title', '')} {project.get('description', '')}"
                projects_texts.append(proj_text.strip())
            elif isinstance(project, str):
                projects_texts.append(project)
        projects_text = ' '.join(projects_texts)
        projects_vector = get_embedding(projects_text)
        
        return {
            'skills_vector': skills_vector,
            'experience_vector': experience_vector,
            'certification_vector': certification_vector,
            'projects_vector': projects_vector
        }
        
    except Exception as e:
        logger.error(f"Section embeddings error: {str(e)}")
        return {
            'skills_vector': [0.0] * EMBEDDING_DIMENSION,
            'experience_vector': [0.0] * EMBEDDING_DIMENSION,
            'certification_vector': [0.0] * EMBEDDING_DIMENSION,
            'projects_vector': [0.0] * EMBEDDING_DIMENSION
        }
import json
import boto3
import logging
import re
from config import AWS_REGION, BEDROCK_ENDPOINT, EMBEDDING_MODEL_ID, LLM_MODEL_ID, MAX_TEXT_LENGTH, MAX_EMBEDDING_LENGTH, EMBEDDING_DIMENSION
from prompts import get_metadata_extraction_prompt
from concurrent.futures import ThreadPoolExecutor, as_completed

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
            "max_tokens": 1536,
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
        # Prepare clean texts for each section
        skills_text = ' '.join([s for s in metadata.get('skills', []) if isinstance(s, str)]).strip()
        logger.info(f"Skills text for embedding length: {len(skills_text)}")

        experience_texts = []
        for exp in metadata.get('work_experience', []):
            if isinstance(exp, dict):
                parts = [exp.get('job_title') or exp.get('title') or '', exp.get('company') or '', exp.get('description') or '']
                exp_text = ' '.join([p for p in parts if p]).strip()
                if exp_text:
                    experience_texts.append(exp_text)
            elif isinstance(exp, str) and exp.strip():
                experience_texts.append(exp.strip())
        experience_text = ' '.join(experience_texts)

        certifications_list = metadata.get('certifications', [])
        if isinstance(certifications_list, list):
            certifications_text = ' '.join([str(c) for c in certifications_list if c]).strip()
        else:
            certifications_text = str(certifications_list)

        projects_texts = []
        for project in metadata.get('projects', []):
            if isinstance(project, dict):
                parts = [project.get('title') or '', project.get('description') or '']
                proj_text = ' '.join([p for p in parts if p]).strip()
                if proj_text:
                    projects_texts.append(proj_text)
            elif isinstance(project, str) and project.strip():
                projects_texts.append(project.strip())
        projects_text = ' '.join(projects_texts)

        # Run Bedrock embedding calls in parallel (up to 4 workers)
        section_texts = {
            'skills_vector': skills_text,
            'experience_vector': experience_text,
            'certification_vector': certifications_text,
            'projects_vector': projects_text,
        }

        results = {k: [0.0] * EMBEDDING_DIMENSION for k in section_texts.keys()}

        with ThreadPoolExecutor(max_workers=4) as executor:
            future_map = {
                executor.submit(get_embedding, text): name
                for name, text in section_texts.items()
            }
            for future in as_completed(future_map):
                name = future_map[future]
                try:
                    results[name] = future.result()
                except Exception as e:
                    logger.error(f"Embedding generation failed for {name}: {str(e)}")
                    results[name] = [0.0] * EMBEDDING_DIMENSION

        return results

    except Exception as e:
        logger.error(f"Section embeddings error: {str(e)}")
        return {
            'skills_vector': [0.0] * EMBEDDING_DIMENSION,
            'experience_vector': [0.0] * EMBEDDING_DIMENSION,
            'certification_vector': [0.0] * EMBEDDING_DIMENSION,
            'projects_vector': [0.0] * EMBEDDING_DIMENSION
        }
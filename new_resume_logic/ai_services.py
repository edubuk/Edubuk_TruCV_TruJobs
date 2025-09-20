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
        if not text or len(text.strip()) < 10:
            logger.warning("Text too short for meaningful extraction")
            return get_fallback_metadata()
        
        # Preprocess text to extract key information
        preprocessed_text = preprocess_resume_text(text)
        
        logger.info(f"Input text length: {len(text)} → Preprocessed: {len(preprocessed_text)}")
        
        if len(preprocessed_text) > MAX_TEXT_LENGTH:
            preprocessed_text = preprocessed_text[:MAX_TEXT_LENGTH] + "..."
        
        prompt_text = get_metadata_extraction_prompt(preprocessed_text)
        
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
        error_msg = str(e)
        logger.error(f"💥 Bedrock metadata extraction error: {error_msg}")
        
        # Provide fallback metadata with error indication
        fallback_metadata = {
            'full_name': 'Unknown',
            'email': None,
            'phone': None,
            'location': None,
            'skills': [],
            'work_experience': [],
            'certifications': [],
            'projects': [],
            'education': [],
            'summary': f"Error extracting metadata: {error_msg[:100]}"
        }
        
        # Don't raise exception - return fallback to allow processing to continue
        logger.warning("🔄 Returning fallback metadata to allow processing to continue")
        return fallback_metadata


def get_fallback_metadata():
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


def preprocess_resume_text(text):
    """Preprocess resume text to extract meaningful content from corrupted PDF"""
    import re
    
    # Extract email addresses
    emails = re.findall(r'mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text)
    
    # Extract LinkedIn URLs and names
    linkedin_matches = re.findall(r'linkedin\.com[/\s]+([a-zA-Z0-9-]+)', text)
    
    # Extract company names and job titles
    company_matches = re.findall(r'(QTechSolutions|Q-Tech|QTech)', text, re.IGNORECASE)
    job_matches = re.findall(r'(AI/GenAi Intern|AI Intern|GenAI Intern|Intern)', text, re.IGNORECASE)
    
    # Extract skills from common patterns
    skill_patterns = [
        r'(Web development|Web Development)',
        r'(Data analysis|Data Analysis)', 
        r'(Artificial Intelligence|AI)',
        r'(Machine Learning|ML)',
        r'(Python|JavaScript|React|Node\.js)',
        r'(HTML|CSS|SQL|MongoDB)'
    ]
    
    found_skills = []
    for pattern in skill_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        found_skills.extend(matches)
    
    # Extract potential names from email (before @)
    name_from_email = []
    for email in emails:
        username = email.split('@')[0]
        # Convert common patterns like "firstname.lastname" or "firstnamelastname"
        if '.' in username:
            parts = username.split('.')
            name_parts = [part.capitalize() for part in parts if len(part) > 1]
            if len(name_parts) >= 2:
                name_from_email.append(' '.join(name_parts))
    
    # Clean up text - remove PDF artifacts
    cleaned_text = text
    
    # Remove PDF technical content
    pdf_artifacts = [
        r'\d+\s+0\s+obj.*?endobj',
        r'Type\s+ExtGState',
        r'URI\s+\(',
        r'Subtype\s+Link',
        r'Type\s+Annot',
        r'Rect\s+Border',
        r'ca\s+1\s+endobj'
    ]
    
    for pattern in pdf_artifacts:
        cleaned_text = re.sub(pattern, ' ', cleaned_text, flags=re.DOTALL)
    
    # Build enhanced text with extracted information
    enhanced_parts = []
    
    # Add extracted names
    if name_from_email:
        enhanced_parts.append(f"Name: {name_from_email[0]}")
    
    # Add extracted emails
    if emails:
        enhanced_parts.append(f"Email: {emails[0]}")
    
    # Add LinkedIn info
    if linkedin_matches:
        enhanced_parts.append(f"LinkedIn: {linkedin_matches[0]}")
    
    # Add company and job info
    if company_matches:
        enhanced_parts.append(f"Company: {company_matches[0]}")
    if job_matches:
        enhanced_parts.append(f"Job Title: {job_matches[0]}")
    
    # Add extracted skills
    if found_skills:
        unique_skills = list(set(found_skills))
        enhanced_parts.append(f"Skills: {', '.join(unique_skills)}")
    
    # Add cleaned original text
    enhanced_parts.append(cleaned_text)
    
    result = '\n'.join(enhanced_parts)
    
    logger.info(f"📝 Preprocessed text: Found {len(emails)} emails, {len(name_from_email)} names, {len(found_skills)} skills, {len(company_matches)} companies")
    if name_from_email:
        logger.info(f"📝 Extracted name: {name_from_email[0]}")
    if found_skills:
        logger.info(f"📝 Extracted skills: {found_skills}")
    if company_matches:
        logger.info(f"📝 Extracted company: {company_matches[0]}")
    
    return result


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

        # Provide fallback content for empty sections
        if not skills_text.strip():
            skills_text = "General professional skills"
        if not experience_text.strip():
            experience_text = "Professional work experience"
        if not certifications_text.strip():
            certifications_text = "Professional certifications"
        if not projects_text.strip():
            projects_text = "Professional projects"

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
'''
Summary
This module is the AI/ML engine for your resume pipeline.
It extracts structured metadata from raw resume text using Bedrock Claude.
It generates high-dimensional embeddings for the entire resume and for each section, enabling advanced semantic search and matching.
It is robust to errors and PDF corruption, and logs all key steps for debugging.
'''
#1. Imports and Logger Setup
'''
Imports standard libraries (json, logging, re, concurrent.futures), AWS SDK (boto3), and project configs/prompts.
Sets up logging and initializes the Bedrock client for AI model calls.
'''
import json
import boto3
import logging
import re
from config import AWS_REGION, BEDROCK_ENDPOINT, EMBEDDING_MODEL_ID, LLM_MODEL_ID, MAX_TEXT_LENGTH, MAX_EMBEDDING_LENGTH, EMBEDDING_DIMENSION
from prompts import get_metadata_extraction_prompt
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger()
bedrock = boto3.client('bedrock-runtime', AWS_REGION, endpoint_url=BEDROCK_ENDPOINT)

#2. Metadata Extraction from Resume Text
'''
Purpose: Extracts structured metadata (name, email, skills, etc.) from resume text using an LLM (Bedrock Claude).
How:
Checks if the text is long enough for extraction.
Preprocesses the text to extract key info and remove noise.
Trims text if too long.
Builds a prompt for the LLM using get_metadata_extraction_prompt.
Calls Bedrock Claude with the prompt and parses the response.
Handles JSON parsing errors robustly (tries to extract JSON from messy output).
Ensures all required metadata fields exist, filling in defaults if missing.
Cleans up the skills list for concise entries.
On error, logs and returns fallback metadata with an error summary.
'''

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
        
        # Enhanced JSON extraction with multiple fallbacks
        try:
            # First attempt: direct JSON parsing
            metadata = json.loads(llm_output)
        except json.JSONDecodeError:
            # Second attempt: extract JSON using regex
            json_match = re.search(r'\{.*\}', llm_output, re.DOTALL)
            if json_match:
                try:
                    metadata = json.loads(json_match.group())
                except json.JSONDecodeError:
                    # Third attempt: fix common JSON issues and try again
                    try:
                        # Fix common JSON issues (unquoted keys, single quotes, trailing commas)
                        potential_json = json_match.group()
                        # Replace single quotes with double quotes
                        potential_json = re.sub(r"'([^']+)'\s*:", r'"\1":', potential_json)
                        # Fix unquoted keys
                        potential_json = re.sub(r"([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:", r'\1"\2":', potential_json)
                        # Remove trailing commas
                        potential_json = re.sub(r',\s*([}\]])', r'\1', potential_json)
                        
                        metadata = json.loads(potential_json)
                        logger.info("Successfully parsed JSON after fixing format issues")
                    except json.JSONDecodeError:
                        logger.error("Failed to parse JSON from LLM response after multiple attempts")
                        # Don't raise, use fallback metadata instead
                        return get_fallback_metadata_with_name_extraction(text, preprocessed_text)
            else:
                logger.error("No JSON found in LLM response")
                # Don't raise, use fallback metadata instead
                return get_fallback_metadata_with_name_extraction(text, preprocessed_text)
        
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
        
        # If full_name is still 'Unknown', try to extract from preprocessed text
        if metadata.get('full_name') == 'Unknown' or not metadata.get('full_name'):
            # Try to extract name from the preprocessed text patterns
            name_patterns = [
                r'Name:\s*([A-Za-z\s]+)',
                r'([A-Z][a-z]+\s+[A-Z][a-z]+)',  # FirstName LastName pattern
                r'([A-Z][A-Z]+\s+[A-Z][a-z]+)',  # FIRSTNAME Lastname pattern
                r'([A-Z][a-z]+\s+[A-Z][A-Z]+)'   # Firstname LASTNAME pattern
            ]
            
            for pattern in name_patterns:
                name_match = re.search(pattern, preprocessed_text)
                if name_match:
                    potential_name = name_match.group(1).strip()
                    # Validate it's not a common false positive
                    if (len(potential_name) > 3 and 
                        not any(word in potential_name.lower() for word in ['pdf', 'obj', 'type', 'link', 'mailto', 'http'])):
                        metadata['full_name'] = potential_name
                        logger.info(f"📝 Extracted name from text patterns: {potential_name}")
                        break
        
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
        
        # Final validation and logging
        candidate_name = metadata.get('full_name', 'Unknown')
        logger.info(f"✅ Final extracted metadata for candidate: {candidate_name}")
        logger.info(f"📧 Email: {metadata.get('email', 'None')}")
        logger.info(f"🔧 Skills count: {len(metadata.get('skills', []))}")
        logger.info(f"💼 Work experience count: {len(metadata.get('work_experience', []))}")
        
        return metadata
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"💥 Bedrock metadata extraction error: {error_msg}")
        
        # Use enhanced fallback with name extraction
        logger.warning("🔄 Using enhanced fallback metadata with name extraction")
        return get_fallback_metadata_with_name_extraction(text, preprocessed_text)

#3. Fallback Metadata
'''
Purpose: Provides a default metadata structure if extraction fails.
How: Returns a dictionary with all fields set to safe defaults.
'''

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


def get_fallback_metadata_with_name_extraction(text, preprocessed_text):
    """Enhanced fallback metadata that attempts to extract name from text"""
    fallback = get_fallback_metadata()
    
    # Try to extract name from the preprocessed text
    name_patterns = [
        r'Name:\s*([A-Za-z\s]+)',
        r'([A-Z][a-z]+\s+[A-Z][a-z]+)',  # FirstName LastName pattern
        r'([A-Z][A-Z]+\s+[A-Z][a-z]+)',  # FIRSTNAME Lastname pattern
        r'([A-Z][a-z]+\s+[A-Z][A-Z]+)',   # Firstname LASTNAME pattern
        r'RESUME[\s\n]*([A-Z][a-zA-Z\s]+)',  # Name after RESUME
        r'CV[\s\n]*([A-Z][a-zA-Z\s]+)',      # Name after CV
        r'([A-Z][A-Z\s]+)'                  # ALL CAPS name
    ]
    
    # Try each pattern
    for pattern in name_patterns:
        name_match = re.search(pattern, preprocessed_text)
        if name_match:
            potential_name = name_match.group(1).strip()
            # Validate it's not a common false positive
            if (len(potential_name) > 3 and 
                ' ' in potential_name and
                not any(word in potential_name.lower() for word in ['pdf', 'obj', 'type', 'link', 'mailto', 'http'])):
                fallback['full_name'] = potential_name
                logger.info(f"📝 Extracted name from text patterns: {potential_name}")
                break
    
    # If we found a name, also try to extract other information
    if fallback['full_name'] != 'Unknown':
        # Try to extract skills
        skill_keywords = ['python', 'java', 'javascript', 'react', 'angular', 'node', 'aws', 'azure', 
                        'devops', 'docker', 'kubernetes', 'sql', 'nosql', 'mongodb', 'testing', 
                        'qa', 'quality', 'automation', 'ci/cd', 'jenkins', 'git', 'agile', 'scrum']
        
        found_skills = []
        for skill in skill_keywords:
            if re.search(r'\b' + re.escape(skill) + r'\b', text.lower()):
                found_skills.append(skill.capitalize())
        
        if found_skills:
            fallback['skills'] = found_skills
            logger.info(f"📝 Extracted {len(found_skills)} skills from text")
    
    logger.info(f"✅ Created enhanced fallback metadata for candidate: {fallback['full_name']}")
    return fallback


#4. Resume Text Preprocessing
'''
Purpose: Cleans and enriches resume text before sending to the LLM.
How:
Extracts emails using several regex patterns (handles common PDF corruption).
Extracts LinkedIn URLs, company names, job titles, and skills using regex.
Attempts to reconstruct names from email addresses.
Removes PDF artifacts and technical content.
Builds an enhanced text block with extracted info and cleaned original text.
Logs what was found for debugging.
'''

def preprocess_resume_text(text):
    """Preprocess resume text to extract meaningful content from corrupted PDF"""
    import re
    
    # Extract email addresses - multiple patterns
    emails = []
    # Pattern 1: mailto: format
    emails.extend(re.findall(r'mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text))
    # Pattern 2: direct email format
    emails.extend(re.findall(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text))
    # Pattern 3: email with spaces (from PDF corruption)
    emails.extend(re.findall(r'([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})', text))
    
    # Clean up emails
    cleaned_emails = []
    for email in emails:
        if isinstance(email, str):
            # Remove spaces and reconstruct
            clean_email = email.replace(' ', '')
            if '@' in clean_email and '.' in clean_email:
                cleaned_emails.append(clean_email)
        elif isinstance(email, tuple) and len(email) == 3:
            # Handle tuple matches from spaced email pattern
            reconstructed = f"{email[0]}@{email[1]}.{email[2]}"
            clean_email = reconstructed.replace(' ', '')
            if '@' in clean_email and '.' in clean_email:
                cleaned_emails.append(clean_email)
    
    emails = list(set(cleaned_emails))  # Remove duplicates
    
    # Extract LinkedIn URLs and names
    linkedin_matches = re.findall(r'linkedin\.com[/\s]+([a-zA-Z0-9-]+)', text)
    
    # Extract company names and job titles - more generic patterns
    company_patterns = [
        r'\b([A-Z][a-zA-Z]+\s*(?:Solutions|Technologies|Systems|Corp|Inc|Ltd|LLC|Pvt|Private|Limited))\b',
        r'\b(QTechSolutions|Q-Tech|QTech|Microsoft|Google|Amazon|IBM|Oracle|TCS|Infosys|Wipro|Accenture)\b'
    ]
    company_matches = []
    for pattern in company_patterns:
        company_matches.extend(re.findall(pattern, text, re.IGNORECASE))
    
    job_patterns = [
        r'\b(Software Engineer|Developer|Analyst|Manager|Intern|Consultant|Specialist|Lead|Senior|Junior)\b',
        r'\b(AI/GenAi Intern|AI Intern|GenAI Intern|Data Scientist|ML Engineer|DevOps Engineer|QA Engineer)\b'
    ]
    job_matches = []
    for pattern in job_patterns:
        job_matches.extend(re.findall(pattern, text, re.IGNORECASE))
    
    # Generic aggressive email search for any candidate
    if not emails:
        # More aggressive email search patterns
        email_patterns = [
            r'([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})',
            r'mailto:\s*([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})',
            r'([a-zA-Z0-9._%+-]+)\s+([a-zA-Z0-9.-]+)\s+([a-zA-Z]{2,})',  # separated parts
            r'([a-zA-Z0-9._%+-]+)\s*([a-zA-Z0-9.-]+)\s*([a-zA-Z]{2,})'   # no @ symbol
        ]
        
        for pattern in email_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple) and len(match) == 3:
                    # Reconstruct email from separated parts
                    reconstructed = f"{match[0]}@{match[1]}.{match[2]}"
                    clean_email = reconstructed.replace(' ', '')
                    # Validate it looks like a real email
                    if len(clean_email) > 5 and '@' in clean_email and '.' in clean_email:
                        emails.append(clean_email)
                elif isinstance(match, str):
                    clean_email = match.replace(' ', '')
                    if '@' in clean_email and '.' in clean_email:
                        emails.append(clean_email)
        
        if emails:
            logger.info(f"🎯 Found emails from aggressive search: {emails}")
    
    # Extract skills from common patterns - be more specific
    skill_patterns = [
        r'(Web development|Web Development)',
        r'(Data analysis|Data Analysis)', 
        r'(Artificial Intelligence)',  # Remove standalone AI to avoid false matches
        r'(Machine Learning)',         # Remove standalone ML to avoid false matches
        r'(Python|JavaScript|React|Node\.js)',
        r'(HTML|CSS|SQL|MongoDB)',
        r'(Java|Spring Boot|AWS|Kubernetes|TensorFlow)'
    ]
    
    found_skills = []
    for pattern in skill_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        found_skills.extend(matches)
    
    # Remove low-quality matches
    found_skills = [skill for skill in found_skills if len(skill) > 2 and skill.lower() not in ['ai', 'ml']]
    
    # Extract potential names from email (before @) - generic approach
    name_from_email = []
    for email in emails:
        username = email.split('@')[0]
        # Convert common patterns like "firstname.lastname" or "firstnamelastname"
        if '.' in username:
            parts = username.split('.')
            name_parts = [part.capitalize() for part in parts if len(part) > 1]
            if len(name_parts) >= 2:
                name_from_email.append(' '.join(name_parts))
        elif '_' in username:
            # Handle underscore separated names
            parts = username.split('_')
            name_parts = [part.capitalize() for part in parts if len(part) > 1]
            if len(name_parts) >= 2:
                name_from_email.append(' '.join(name_parts))
        elif len(username) > 6:  # Long usernames might be concatenated names
            # Try to extract meaningful name from username
            # Remove numbers and common suffixes
            clean_username = re.sub(r'\d+$', '', username)  # Remove trailing numbers
            if len(clean_username) > 4:
                # Capitalize first letter for basic name formatting
                formatted_name = clean_username.capitalize()
                name_from_email.append(formatted_name)
    
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
    if emails:
        logger.info(f"📝 Extracted emails: {emails}")
    
    # Debug: Show what patterns we found
    if emails:
        logger.info(f"🔍 Found emails: {emails}")
    if name_from_email:
        logger.info(f"🔍 Extracted names from emails: {name_from_email}")
    if company_matches:
        logger.info(f"🔍 Found companies: {company_matches[:3]}")
    if job_matches:
        logger.info(f"🔍 Found job titles: {job_matches[:3]}")
    
    return result

#5. Embedding Generation
'''
Purpose: Generates a 1024-dimensional embedding vector for a given text using Bedrock Titan.
How:
Checks for empty or too-long text.
Calls Bedrock Titan embedding model.
Returns the embedding if valid, otherwise returns a zero vector.
On error, logs and returns a zero vector.
'''
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


#6. Section Embedding Creation
'''
Purpose: Generates separate embeddings for different resume sections (skills, experience, certifications, projects).
How:
Prepares clean text for each section from the metadata.
Provides fallback text if a section is empty.
Uses a thread pool to call get_embedding for each section in parallel (improves speed).
Collects results into a dictionary with four vectors.
On error, logs and returns zero vectors for all sections.
'''

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
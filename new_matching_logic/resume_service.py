import json
import time
import re
import boto3
from config import JOB_DESCRIPTION_INDEX, RESUME_INDEX, DEFAULT_TOP_K, logger
from opensearch_client import verify_index_and_mapping, execute_search_with_retry


def verify_job_description_text(job_description_text):
    """Verify if job description text is valid for processing"""
    try:
        if not isinstance(job_description_text, str):
            return {"valid": False, "reason": "Job description must be a string"}
        
        text = job_description_text.strip()
        if not text:
            return {"valid": False, "reason": "Job description cannot be empty"}
        
        if len(text) < 50:
            return {"valid": False, "reason": "Job description is too short (minimum 50 characters)"}
        
        if len(text) > 10000:
            return {"valid": False, "reason": "Job description is too long (maximum 10,000 characters)"}
        
        # Basic content validation
        required_keywords = ['experience', 'skills', 'responsibilities', 'requirements', 'candidate', 'position', 'role', 'job']
        text_lower = text.lower()
        found_keywords = [kw for kw in required_keywords if kw in text_lower]
        
        if len(found_keywords) < 2:
            return {"valid": False, "reason": "Job description doesn't appear to contain typical job posting content"}
        
        logger.info(f"Job description validation passed: {len(text)} characters, keywords found: {found_keywords}")
        return {"valid": True, "reason": "Job description is valid"}
        
    except Exception as e:
        logger.error(f"Error validating job description text: {e}")
        return {"valid": False, "reason": f"Validation error: {str(e)}"}


def get_job_description_text_embedding(job_description_text):
    """Generate embedding for job description text using Bedrock (with fallback)"""
    try:
        if not job_description_text or not isinstance(job_description_text, str):
            logger.error("Invalid job description text provided")
            return None
        
        # Try Bedrock first
        try:
            # Initialize Bedrock client
            bedrock_runtime = boto3.client(
                'bedrock-runtime',
                region_name='us-east-1'  # Adjust region as needed
            )
            
            # Prepare the input for Titan Embeddings V2
            input_text = job_description_text.strip()
            
            # Call Bedrock to generate embedding
            response = bedrock_runtime.invoke_model(
                modelId='amazon.titan-embed-text-v2:0',
                body=json.dumps({
                    "inputText": input_text,
                    "dimensions": 1024,
                    "normalize": True
                }),
                contentType='application/json'
            )
            
            # Parse the response
            result = json.loads(response['body'].read())
            embedding = result.get('embedding')
            
            if embedding:
                logger.info(f"Generated Bedrock embedding for job description: {len(embedding)} dimensions")
                return embedding
                
        except Exception as bedrock_error:
            logger.warning(f"Bedrock embedding failed: {bedrock_error}")
            logger.info("Falling back to mock embedding for testing")
        
        # Fallback: Generate a mock embedding based on text features
        # This is for testing purposes when Bedrock is not available
        import hashlib
        import numpy as np
        
        # Create a deterministic "embedding" based on text content
        text_hash = hashlib.md5(job_description_text.encode()).hexdigest()
        
        # Convert hash to numbers and create a 1024-dimensional vector
        seed = int(text_hash[:8], 16)
        np.random.seed(seed)
        mock_embedding = np.random.normal(0, 1, 1024).tolist()
        
        # Normalize the vector
        norm = np.linalg.norm(mock_embedding)
        if norm > 0:
            mock_embedding = (np.array(mock_embedding) / norm).tolist()
        
        logger.info(f"Generated mock embedding for job description: {len(mock_embedding)} dimensions")
        logger.warning("Using mock embedding - please configure Bedrock access for production use")
        
        return mock_embedding
        
    except Exception as e:
        logger.error(f"Error generating job description embedding: {e}")
        return None


def verify_job_description(client, job_id):
    """Verify if job description exists"""
    start_time = time.time()
    try:
        queries = [
            {"query": {"match": {"job_description_id": job_id}}},
            {"query": {"term": {"job_description_id.keyword": job_id}}},
            {"query": {"term": {"metadata.job_description_id.keyword": job_id}}}
        ]
        
        for query in queries:
            logger.info(f"Executing job description verification query: {json.dumps(query)}")
            response = client.search(index=JOB_DESCRIPTION_INDEX, body=query)
            
            hits = response.get('hits', {}).get('hits', [])
            total = response.get('hits', {}).get('total', {}).get('value', 0)
            
            if hits:
                logger.info(f"Found {total} job descriptions")
                logger.info(f"verify_job_description time taken: {time.time() - start_time:.4f} seconds")
                return hits
        
        logger.warning(f"No job description found with ID: {job_id}")
        return []
        
    except Exception as e:
        logger.error(f"Error verifying job description: {str(e)}")
        raise


def get_job_description_embedding(client, job_id):
    """Retrieve job description embedding with flexible field mapping"""
    start_time = time.time()
    try:
        queries = [
            {
                "query": {"match": {"job_description_id": job_id}},
                "_source": ["embedding", "metadata", "job_title", "text"]
            },
            {
                "query": {"term": {"job_description_id.keyword": job_id}},
                "_source": ["embedding", "metadata", "job_title", "text"]
            },
            {
                "query": {"term": {"metadata.job_description_id.keyword": job_id}},
                "_source": ["embedding", "metadata", "job_title", "text"]
            }
        ]
        
        for query in queries:
            response = client.search(index=JOB_DESCRIPTION_INDEX, body=query)
            
            hits = response.get('hits', {}).get('hits', [])
            if hits:
                source = hits[0]['_source']
                metadata = source.get('metadata', {})
                
                result = {
                    'embedding': source.get('embedding') or metadata.get('embedding'),
                    'metadata': metadata,
                    'job_title': source.get('job_title') or metadata.get('job_title') or metadata.get('title'),
                    'text': source.get('text') or metadata.get('text')
                }
                
                logger.info(f"Found job description: {result.get('job_title')}")
                logger.info(f"get_job_description_embedding time taken: {time.time() - start_time:.4f} seconds")
                return result
        
        raise ValueError(f"Job description not found: {job_id}")
        
    except Exception as e:
        logger.error(f"Error retrieving job description: {str(e)}")
        raise


def normalize_skill(skill):
    """Normalize skill names for flexible matching"""
    if not skill:
        return ""
    
    # Convert to string and normalize
    skill_str = str(skill).lower().strip()
    
    # Handle common variations
    skill_variations = {
        'react': ['react', 'reactjs', 'react.js', 'react js'],
        'javascript': ['javascript', 'js', 'ecmascript'],
        'typescript': ['typescript', 'ts'],
        'python': ['python', 'py'],
        'node': ['node', 'nodejs', 'node.js'],
        'angular': ['angular', 'angularjs'],
        'vue': ['vue', 'vuejs', 'vue.js'],
        'express': ['express', 'expressjs'],
        'mongodb': ['mongodb', 'mongo'],
        'postgresql': ['postgresql', 'postgres', 'pg'],
        'mysql': ['mysql', 'my-sql'],
        'aws': ['aws', 'amazon web services'],
        'docker': ['docker', 'containerization'],
        'kubernetes': ['kubernetes', 'k8s'],
        'css': ['css', 'css3', 'cascading style sheets'],
        'html': ['html', 'html5', 'hypertext markup language'],
        'sql': ['sql', 'structured query language']
    }
    
    # Check for exact matches in variations
    for normalized_name, variations in skill_variations.items():
        if skill_str in variations:
            return normalized_name
    
    # Remove special characters and spaces for fuzzy matching
    normalized = re.sub(r'[.\s\-_]+', '', skill_str)
    return normalized


def skills_match(resume_skills, filter_skills):
    """Check if resume skills match any of the filter skills with improved logic"""
    if not resume_skills or not filter_skills:
        logger.debug("Empty resume skills or filter skills")
        return False
    
    # Ensure both are lists
    if isinstance(resume_skills, str):
        resume_skills = [resume_skills]
    if isinstance(filter_skills, str):
        filter_skills = [filter_skills]
    
    logger.debug(f"Checking skills match: resume_skills={resume_skills}, filter_skills={filter_skills}")
    
    normalized_resume_skills = [normalize_skill(skill) for skill in resume_skills if skill]
    normalized_filter_skills = [normalize_skill(skill) for skill in filter_skills if skill]
    
    logger.debug(f"Normalized skills: resume={normalized_resume_skills}, filter={normalized_filter_skills}")
    
    for filter_skill in normalized_filter_skills:
        if not filter_skill:
            continue
            
        for resume_skill in normalized_resume_skills:
            if not resume_skill:
                continue
                
            # Check for exact match, substring match, or partial match
            if (filter_skill == resume_skill or 
                filter_skill in resume_skill or 
                resume_skill in filter_skill):
                logger.debug(f"Skills match found: {filter_skill} matches {resume_skill}")
                return True
    
    logger.debug("No skills match found")
    return False


def location_match(resume_location, filter_locations):
    """Check if resume location matches any of the filter locations with improved logic"""
    if not resume_location or not filter_locations:
        logger.debug("Empty resume location or filter locations")
        return False
    
    if isinstance(filter_locations, str):
        filter_locations = [filter_locations]
    
    # Convert to string and normalize
    resume_location_str = str(resume_location).lower().strip()
    logger.debug(f"Checking location match: resume_location='{resume_location_str}', filter_locations={filter_locations}")
    
    for filter_location in filter_locations:
        if not filter_location:
            continue
            
        filter_location_str = str(filter_location).lower().strip()
        
        # For very short filters (state codes, etc.), require exact match
        if len(filter_location_str) <= 2:
            if resume_location_str == filter_location_str:
                logger.debug(f"Exact location match: {filter_location_str}")
                return True
        else:
            # For longer filters, check if filter location is contained in resume location
            # Also check for word boundaries to avoid partial word matches
            if filter_location_str in resume_location_str:
                logger.debug(f"Substring location match: {filter_location_str} in {resume_location_str}")
                return True
            
            # Check with word boundaries for more precise matching
            try:
                pattern = r'\b' + re.escape(filter_location_str) + r'\b'
                if re.search(pattern, resume_location_str):
                    logger.debug(f"Word boundary location match: {filter_location_str}")
                    return True
            except re.error:
                # Fallback to simple substring match if regex fails
                if filter_location_str in resume_location_str:
                    logger.debug(f"Fallback location match: {filter_location_str}")
                    return True
    
    logger.debug("No location match found")
    return False


def extract_years_of_experience(experience_data):
    """Extract years of experience from resume experience data with improved parsing"""
    if not experience_data:
        return 0
    
    # Handle if experience_data is not a list
    if not isinstance(experience_data, list):
        logger.debug(f"Experience data is not a list: {type(experience_data)}")
        return 0
    
    total_years = 0.0
    current_year = 2025  # Update this as needed
    
    logger.debug(f"Processing {len(experience_data)} experience entries")
    
    for i, exp in enumerate(experience_data):
        if not isinstance(exp, dict):
            logger.debug(f"Experience entry {i} is not a dict: {type(exp)}")
            continue
            
        start_date = exp.get('start_date', '') or exp.get('startDate', '') or exp.get('from', '')
        end_date = exp.get('end_date', '') or exp.get('endDate', '') or exp.get('to', '') or exp.get('current', False)
        
        logger.debug(f"Experience {i}: start_date='{start_date}', end_date='{end_date}'")
        
        if start_date:
            # Try to extract year from various date formats
            start_year_match = re.search(r'(\d{4})', str(start_date))
            if start_year_match:
                start_year = int(start_year_match.group(1))
                
                # Handle end date
                if end_date and not isinstance(end_date, bool) and str(end_date).lower() not in ['current', 'present', 'now']:
                    end_year_match = re.search(r'(\d{4})', str(end_date))
                    if end_year_match:
                        end_year = int(end_year_match.group(1))
                        years_diff = max(0, end_year - start_year)
                        total_years += years_diff
                        logger.debug(f"Experience {i}: {start_year}-{end_year} = {years_diff} years")
                else:
                    # Current job or no end date specified
                    years_diff = max(0, current_year - start_year)
                    total_years += years_diff
                    logger.debug(f"Experience {i}: {start_year}-present = {years_diff} years")
            else:
                logger.debug(f"Experience {i}: Could not extract start year from '{start_date}'")
    
    logger.debug(f"Total years of experience calculated: {total_years}")
    return int(total_years)


def experience_level_match(resume_experience, filter_experience_levels):
    """Check if resume experience level matches filter with improved logic"""
    if not resume_experience or not filter_experience_levels:
        logger.debug("Empty resume experience or filter experience levels")
        return False
    
    if isinstance(filter_experience_levels, str):
        filter_experience_levels = [filter_experience_levels]
    
    resume_years = extract_years_of_experience(resume_experience)
    logger.debug(f"Checking experience level: resume_years={resume_years}, filter_levels={filter_experience_levels}")
    
    for filter_level in filter_experience_levels:
        if not filter_level:
            continue
            
        filter_level_lower = str(filter_level).lower().strip()
        
        # Define experience level ranges
        if any(keyword in filter_level_lower for keyword in ['entry', 'junior', 'fresher', 'beginner', '0-2']):
            if resume_years <= 2:
                logger.debug(f"Entry level match: {resume_years} years <= 2")
                return True
        elif any(keyword in filter_level_lower for keyword in ['mid', 'intermediate', 'middle', '2-5', '3-5']):
            if 2 < resume_years <= 5:
                logger.debug(f"Mid level match: 2 < {resume_years} years <= 5")
                return True
        elif any(keyword in filter_level_lower for keyword in ['senior', 'lead', 'sr', '5-10']):
            if 5 < resume_years <= 10:
                logger.debug(f"Senior level match: 5 < {resume_years} years <= 10")
                return True
        elif any(keyword in filter_level_lower for keyword in ['principal', 'architect', 'expert', 'staff', '10+']):
            if resume_years > 10:
                logger.debug(f"Expert level match: {resume_years} years > 10")
                return True
        else:
            # Try to extract numeric ranges from the filter level
            numeric_match = re.search(r'(\d+)[\s\-]*(?:to|\-)*\s*(\d+)?', filter_level_lower)
            if numeric_match:
                min_years = int(numeric_match.group(1))
                max_years = int(numeric_match.group(2)) if numeric_match.group(2) else float('inf')
                if min_years <= resume_years <= max_years:
                    logger.debug(f"Numeric range match: {min_years} <= {resume_years} <= {max_years}")
                    return True
    
    logger.debug("No experience level match found")
    return False


def apply_metadata_filters(resume_embeddings, metadata_filters):
    """Apply metadata filters to resume embeddings with enhanced debugging"""
    if not metadata_filters:
        logger.info("No metadata filters provided, returning all resumes")
        return resume_embeddings
    
    filtered_resumes = []
    filter_stats = {}
    
    logger.info(f"Applying metadata filters: {metadata_filters}")
    logger.info(f"Total resumes before filtering: {len(resume_embeddings)}")
    
    for resume_idx, resume in enumerate(resume_embeddings):
        metadata = resume.get('metadata', {})
        include_resume = True
        filter_reasons = []
        
        logger.debug(f"Processing resume {resume_idx + 1}: {resume.get('candidate_name', 'Unknown')} - {resume.get('resume_id', 'Unknown')}")
        logger.debug(f"Resume metadata keys: {list(metadata.keys())}")
        
        for field, filter_values in metadata_filters.items():
            field_matched = False
            
            if field == "skills":
                resume_skills = metadata.get('skills', [])
                logger.debug(f"Resume skills: {resume_skills}")
                
                if isinstance(filter_values, str):
                    filter_values = [filter_values]
                
                field_matched = skills_match(resume_skills, filter_values)
                if not field_matched:
                    filter_reasons.append(f"skills mismatch: resume has {resume_skills}, filter needs {filter_values}")
            
            elif field == "location":
                # Try multiple possible location fields
                resume_location = (metadata.get('location') or 
                                 metadata.get('address') or 
                                 metadata.get('city') or 
                                 metadata.get('current_location') or 
                                 metadata.get('preferred_location'))
                logger.debug(f"Resume location: {resume_location}")
                
                field_matched = location_match(resume_location, filter_values)
                if not field_matched:
                    filter_reasons.append(f"location mismatch: resume has '{resume_location}', filter needs {filter_values}")
            
            elif field == "experience_level":
                # Try multiple possible experience fields
                resume_experience = (metadata.get('work_experience', []) or 
                                   metadata.get('experience', []) or 
                                   metadata.get('professional_experience', []))
                logger.debug(f"Resume experience entries: {len(resume_experience) if isinstance(resume_experience, list) else 'not a list'}")
                
                field_matched = experience_level_match(resume_experience, filter_values)
                if not field_matched:
                    years = extract_years_of_experience(resume_experience)
                    filter_reasons.append(f"experience level mismatch: resume has {years} years, filter needs {filter_values}")
            
            else:
                # Generic field matching
                resume_value = metadata.get(field)
                logger.debug(f"Generic field '{field}': resume has '{resume_value}', filter needs {filter_values}")
                
                if resume_value is not None:
                    if not isinstance(filter_values, list):
                        filter_values = [filter_values]
                    
                    # Try exact match and string contains
                    field_matched = (resume_value in filter_values or 
                                   any(str(fv).lower() in str(resume_value).lower() for fv in filter_values))
                else:
                    field_matched = False
                
                if not field_matched:
                    filter_reasons.append(f"field '{field}' mismatch: resume has '{resume_value}', filter needs {filter_values}")
            
            # Track filter statistics
            if field not in filter_stats:
                filter_stats[field] = {'matched': 0, 'total': 0}
            filter_stats[field]['total'] += 1
            if field_matched:
                filter_stats[field]['matched'] += 1
            
            if not field_matched:
                include_resume = False
                break
        
        if include_resume:
            filtered_resumes.append(resume)
            logger.debug(f"Resume {resume_idx + 1} INCLUDED")
        else:
            logger.debug(f"Resume {resume_idx + 1} EXCLUDED: {'; '.join(filter_reasons)}")
    
    # Log filter statistics
    logger.info(f"Filter statistics:")
    for field, stats in filter_stats.items():
        match_rate = (stats['matched'] / stats['total']) * 100 if stats['total'] > 0 else 0
        logger.info(f"  {field}: {stats['matched']}/{stats['total']} ({match_rate:.1f}%)")
    
    logger.info(f"Filtered {len(resume_embeddings)} resumes down to {len(filtered_resumes)}")
    return filtered_resumes


def get_resume_embeddings(client, job_description_id=None, resume_id=None, top_k=DEFAULT_TOP_K, metadata_filters=None):
    """Retrieve resume embeddings with multi-vector support"""
    start_time = time.time()
    try:
        index_name = RESUME_INDEX
        exists, mapping = verify_index_and_mapping(client, index_name)
        if not exists:
            raise ValueError(f"Index {index_name} does not exist")
        
        # Add refresh before search to ensure consistency
        try:
            client.indices.refresh(index=index_name)
            logger.info("Index refreshed successfully")
        except Exception as e:
            logger.warning(f"Index refresh failed: {str(e)}")
        
        # Build query
        filter_conditions = []
        
        if job_description_id:
            filter_conditions.append({
                "bool": {
                    "should": [
                        {"term": {"job_description_id.keyword": job_description_id}},
                        {"term": {"job_description_id": job_description_id}},
                        {"term": {"metadata.job_description_id.keyword": job_description_id}},
                        {"term": {"metadata.job_description_id": job_description_id}}
                    ],
                    "minimum_should_match": 1
                }
            })
        
        if resume_id:
            filter_conditions.append({
                "term": {"resume_id.keyword": resume_id}
            })

        if filter_conditions:
            # Get count with retry mechanism
            count_query = {
                "query": {
                    "bool": {
                        "filter": filter_conditions
                    }
                }
            }
            
            logger.info(f"Executing count query: {json.dumps(count_query)}")
            
            max_count = 0
            for count_attempt in range(3):
                try:
                    count_response = client.count(
                        index=index_name, 
                        body=count_query,
                        preference='_primary_first'
                    )
                    current_count = count_response.get('count', 0)
                    max_count = max(max_count, current_count)
                    logger.info(f"Count attempt {count_attempt + 1}: {current_count}")
                    
                    if count_attempt > 0 and current_count == max_count and current_count > 0:
                        break
                        
                except Exception as e:
                    logger.warning(f"Count attempt {count_attempt + 1} failed: {str(e)}")
                
                if count_attempt < 2:
                    time.sleep(0.1)
            
            total_count = max_count
            logger.info(f"Final count for job_description_id {job_description_id}: {total_count}")
            
            actual_size = max(top_k, total_count + 100, 10000)
            
            query = {
                "size": actual_size,
                "query": {
                    "bool": {
                        "filter": filter_conditions
                    }
                },
                "_source": [
                    "skills_vector", "experience_vector", "certification_vector", "projects_vector",
                    "candidate_name", "resume_id", "metadata", "job_description_id"
                ],
                "sort": [
                    {"_id": {"order": "asc"}},
                    {"_score": {"order": "desc"}}
                ]
            }
        else:
            query = {
                "size": max(top_k, 10000),
                "query": {"match_all": {}},
                "_source": [
                    "skills_vector", "experience_vector", "certification_vector", "projects_vector",
                    "candidate_name", "resume_id", "metadata", "job_description_id"
                ],
                "sort": [
                    {"_id": {"order": "asc"}},
                    {"_score": {"order": "desc"}}
                ]
            }

        logger.info(f"Executing resume query with size {query.get('size')}: {json.dumps(query)}")
        
        response = execute_search_with_retry(client, index_name, query)
        
        hits = response.get('hits', {}).get('hits', [])
        total_hits = response.get('hits', {}).get('total', {}).get('value', 0)
        
        logger.info(f"Final result: {len(hits)} resume documents out of {total_hits} total")
        
        # Use scroll API if needed for job_description_id queries
        if job_description_id and len(hits) < total_hits and total_hits > 0:
            logger.info(f"Using scroll API to ensure all {total_hits} results are retrieved")
            all_hits = []
            
            scroll_query = query.copy()
            scroll_query['size'] = min(1000, total_hits)
            
            try:
                scroll_response = client.search(
                    index=index_name, 
                    body=scroll_query,
                    scroll='5m',
                    preference='_primary_first',
                    request_cache=False
                )
                
                scroll_id = scroll_response.get('_scroll_id')
                all_hits.extend(scroll_response.get('hits', {}).get('hits', []))
                
                scroll_attempts = 0
                max_scroll_attempts = 50
                
                while len(all_hits) < total_hits and scroll_id and scroll_attempts < max_scroll_attempts:
                    scroll_attempts += 1
                    try:
                        scroll_response = client.scroll(scroll_id=scroll_id, scroll='5m')
                        
                        new_hits = scroll_response.get('hits', {}).get('hits', [])
                        if not new_hits:
                            logger.info("No more hits available from scroll")
                            break
                            
                        all_hits.extend(new_hits)
                        scroll_id = scroll_response.get('_scroll_id')
                        
                        logger.info(f"Scroll attempt {scroll_attempts}: Retrieved {len(new_hits)} more hits, total: {len(all_hits)}")
                        
                    except Exception as e:
                        logger.error(f"Error during scroll attempt {scroll_attempts}: {str(e)}")
                        break
                
                if scroll_id:
                    try:
                        client.clear_scroll(scroll_id=scroll_id)
                    except Exception as e:
                        logger.warning(f"Failed to clear scroll: {str(e)}")
                
                hits = all_hits
                logger.info(f"Final scroll result: Retrieved {len(hits)} total resume documents")
                
            except Exception as e:
                logger.error(f"Error during scroll operation: {str(e)}")
        
        # Process the results
        resume_embeddings = []
        seen_resume_ids = set()
        
        for hit in hits:
            source = hit['_source']
            resume_id_val = source.get('resume_id')
            
            if resume_id_val in seen_resume_ids:
                continue
            seen_resume_ids.add(resume_id_val)
            
            resume_data = {
                'skills_vector': source.get('skills_vector', []),
                'experience_vector': source.get('experience_vector', []),
                'certification_vector': source.get('certification_vector', []),
                'projects_vector': source.get('projects_vector', []),
                'candidate_name': source.get('candidate_name'),
                'resume_id': resume_id_val,
                'job_description_id': source.get('job_description_id'),
                'metadata': source.get('metadata', {})
            }
            resume_embeddings.append(resume_data)
        
        if metadata_filters:
            resume_embeddings = apply_metadata_filters(resume_embeddings, metadata_filters)
        
        logger.info(f"get_resume_embeddings time taken: {time.time() - start_time:.4f} seconds")
        logger.info(f"Final unique resume count: {len(resume_embeddings)}")
        return resume_embeddings
        
    except Exception as e:
        logger.error(f"Error retrieving resume embeddings: {str(e)}")
        raise
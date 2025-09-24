import numpy as np
import time
from config import logger
from resume_service import extract_years_of_experience


def calculate_multi_vector_similarity(job_embedding, resume_embeddings, similarity_threshold=0.0):
    """Calculate average cosine similarity across all 4 resume vectors"""
    start_time = time.time()
    similarities = []
    
    if not job_embedding:
        logger.error("Job embedding is empty")
        return similarities
    
    job_embedding_array = np.array(job_embedding)
    logger.info(f"Job embedding dimension: {len(job_embedding_array)}")
    logger.info(f"Processing {len(resume_embeddings)} resumes for similarity")
    
    for i, resume in enumerate(resume_embeddings):
        try:
            # Get all 4 vectors
            vectors = [
                resume.get('skills_vector', []),
                resume.get('experience_vector', []),
                resume.get('certification_vector', []),
                resume.get('projects_vector', [])
            ]
            
            vector_names = ['skills', 'experience', 'certifications', 'projects']
            
            # Calculate similarity for each vector
            vector_similarities = []
            vector_scores = {}
            
            for j, (vector, name) in enumerate(zip(vectors, vector_names)):
                if vector and len(vector) > 0:  # Check if vector exists and is not empty
                    try:
                        vector_array = np.array(vector)
                        
                        # Ensure vectors have same dimension
                        if len(vector_array) != len(job_embedding_array):
                            logger.warning(f"Dimension mismatch for {name} vector: {len(vector_array)} vs {len(job_embedding_array)}")
                            continue
                        
                        # Calculate cosine similarity
                        dot_product = np.dot(job_embedding_array, vector_array)
                        job_norm = np.linalg.norm(job_embedding_array)
                        vector_norm = np.linalg.norm(vector_array)
                        
                        if job_norm == 0 or vector_norm == 0:
                            similarity = 0.0
                        else:
                            similarity = dot_product / (job_norm * vector_norm)
                        
                        vector_similarities.append(float(similarity))
                        vector_scores[name] = float(similarity)
                        
                    except Exception as e:
                        logger.error(f"Error calculating {name} similarity for resume {resume.get('resume_id')}: {str(e)}")
                        vector_scores[name] = 0.0
                else:
                    vector_scores[name] = 0.0
            
            # Calculate average similarity across all vectors
            if vector_similarities:
                avg_similarity = sum(vector_similarities) / len(vector_similarities)
                
                if avg_similarity >= similarity_threshold:
                    similarities.append({
                        'resume_id': resume['resume_id'],
                        'candidate_name': resume['candidate_name'],
                        'similarity_score': avg_similarity,
                        'vector_scores': vector_scores,
                        'metadata': resume['metadata']
                    })
                    
                    logger.info(f"Resume {i+1}/{len(resume_embeddings)}: {resume['candidate_name']} - Score: {avg_similarity:.4f}")
            else:
                logger.warning(f"No valid vectors found for resume: {resume.get('resume_id')}")
                    
        except Exception as e:
            logger.error(f"Error calculating similarity for resume {resume.get('resume_id')}: {str(e)}")
            continue
    
    # Sort by similarity score in descending order
    similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
    
    logger.info(f"calculate_multi_vector_similarity time taken: {time.time() - start_time:.4f} seconds")
    logger.info(f"Found {len(similarities)} matching resumes above threshold {similarity_threshold}")
    return similarities


def create_match_explanation_from_metadata(metadata, vector_scores):
    """Create match explanation from resume metadata and vector scores"""
    explanations = []
    
    # Add vector score insights
    if vector_scores:
        best_match = max(vector_scores.items(), key=lambda x: x[1])
        explanations.append(f"Best match: {best_match[0]} ({best_match[1]:.2f})")
    
    # Skills
    skills = metadata.get('skills', [])
    if skills:
        skills_text = ', '.join(skills[:3])  # Show top 3 skills
        if len(skills) > 3:
            skills_text += f" +{len(skills) - 3} more"
        explanations.append(f"Skills: {skills_text}")
    
    # Experience
    experience = metadata.get('work_experience', [])
    if experience:
        total_years = extract_years_of_experience(experience)
        if total_years > 0:
            explanations.append(f"Experience: {total_years} years")
    
    # Location
    location = metadata.get('location')
    if location:
        explanations.append(f"Location: {location}")
    
    return " | ".join(explanations) if explanations else "Profile matches requirements" 
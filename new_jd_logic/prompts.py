METADATA_EXTRACTION_PROMPT = """Analyze the following job description text and extract key metadata in JSON format. Include only the following fields:
- job_title: The job title
- job_requirements: Array of required skills, qualifications, and experiences
- job_location: The location of the job

Job description text:
{text}

Return only the JSON object without any additional text or explanation. Wrap the JSON in <output></output> tags.""" 
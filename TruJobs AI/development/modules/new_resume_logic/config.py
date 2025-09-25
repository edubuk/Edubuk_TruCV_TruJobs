'''
Summary
Centralizes all configuration for the resume pipeline.
Makes the system flexible and production-ready by using environment variables.
Provides robust error handling and logging for easier debugging and deployment.
'''
#1. Imports and Logger Setup
'''
Imports:
os for environment variable access.
logging for logging warnings/errors.
Logger:
Sets up a logger for this module.
'''
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)
#2. Environment Variable Helper
'''
Purpose: Safely retrieves environment variables with type conversion, default values, and error handling.
How it works:
Gets the environment variable by key.
If required and not set, raises an error.
Converts the value to the specified type (int, float, bool, or str).
Logs and returns default if conversion fails.'''

def get_env_var(key, default=None, required=False, var_type=str):
    """Safely get environment variable with validation"""
    try:
        value = os.environ.get(key, default)
        if required and value is None:
            raise ValueError(f"Required environment variable {key} is not set")
        
        if value is not None and var_type != str:
            if var_type == int:
                return int(value)
            elif var_type == float:
                return float(value)
            elif var_type == bool:
                return value.lower() in ('true', '1', 'yes', 'on')
        
        return value
    except (ValueError, TypeError) as e:
        logger.error(f"Error processing environment variable {key}: {e}")
        if required:
            raise
        return default

#3. AWS & Service Configuration
AWS_REGION = get_env_var('AWS_REGION', 'ap-south-1')
BEDROCK_ENDPOINT = f'https://bedrock-runtime.{AWS_REGION}.amazonaws.com'

#4. S3 Configuration
BUCKET_NAME = get_env_var('S3_BUCKET_NAME', 'trujobs-db', required=True)
RESUME_PREFIX = get_env_var('RESUME_PREFIX', 'resumes/')

#5. Bedrock Models
EMBEDDING_MODEL_ID = get_env_var('EMBEDDING_MODEL_ID', 'amazon.titan-embed-text-v2:0')
LLM_MODEL_ID = get_env_var('LLM_MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')

#6. OpenSearch Configuration
OPENSEARCH_ENDPOINT = get_env_var('OPENSEARCH_ENDPOINT', 'https://1jivpq1n907fmvddqgy9.ap-south-1.aoss.amazonaws.com', required=True)
OPENSEARCH_INDEX = get_env_var('OPENSEARCH_INDEX', 'resumes')

#7. Processing Limits with validation
MAX_TEXT_LENGTH = get_env_var('MAX_TEXT_LENGTH', 8000, var_type=int)
MAX_EMBEDDING_LENGTH = get_env_var('MAX_EMBEDDING_LENGTH', 2000, var_type=int)
EMBEDDING_DIMENSION = get_env_var('EMBEDDING_DIMENSION', 1024, var_type=int)

#8. Timeout Configuration
PDF_PROCESSING_TIMEOUT = get_env_var('PDF_PROCESSING_TIMEOUT', 25, var_type=int)  # seconds
TEXTRACT_TIMEOUT = get_env_var('TEXTRACT_TIMEOUT', 20, var_type=int)  # seconds
BEDROCK_TIMEOUT = get_env_var('BEDROCK_TIMEOUT', 30, var_type=int)  # seconds

#9. Validation
if MAX_TEXT_LENGTH <= 0 or MAX_TEXT_LENGTH > 50000:
    logger.warning(f"MAX_TEXT_LENGTH {MAX_TEXT_LENGTH} is outside recommended range (1-50000)")

if EMBEDDING_DIMENSION not in [512, 1024, 1536]:
    logger.warning(f"EMBEDDING_DIMENSION {EMBEDDING_DIMENSION} may not be compatible with standard models")

logger.info(f"Configuration loaded: Region={AWS_REGION}, Bucket={BUCKET_NAME}, Index={OPENSEARCH_INDEX}") 
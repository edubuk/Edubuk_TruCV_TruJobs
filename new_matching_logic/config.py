import os
import logging

# Environment variables - Updated to match your infrastructure
REGION = os.environ.get('AWS_REGION', 'ap-south-1')
SERVICE = os.environ.get('OPENSEARCH_SERVICE', 'aoss')
OPENSEARCH_ENDPOINT = os.environ.get('OPENSEARCH_ENDPOINT', 'https://1jivpq1n907fmvddqgy9.ap-south-1.aoss.amazonaws.com')
COLLECTION_NAME = os.environ.get('COLLECTION_NAME', 'recruitment-search')
JOB_DESCRIPTION_INDEX = os.environ.get('JOB_DESCRIPTION_INDEX', 'job_descriptions')
RESUME_INDEX = os.environ.get('RESUME_INDEX', 'resumes')
DEFAULT_TOP_K = int(os.environ.get('DEFAULT_TOP_K', '100'))
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
DEBUG_FILTERING = os.environ.get('DEBUG_FILTERING', 'false').lower() == 'true'

# Configure logging
logger = logging.getLogger()
logger.setLevel(getattr(logging, LOG_LEVEL))

# If debug filtering is enabled, ensure debug level for detailed filtering logs
if DEBUG_FILTERING and LOG_LEVEL != 'DEBUG':
    logger.setLevel(logging.DEBUG)

# Constants
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
}
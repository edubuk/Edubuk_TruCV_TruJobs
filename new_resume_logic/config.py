import os

# AWS Configuration
AWS_REGION = os.environ.get('AWS_REGION', 'ap-south-1')
BEDROCK_ENDPOINT = f'https://bedrock-runtime.{AWS_REGION}.amazonaws.com'

# S3 Configuration
BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'trujobs-db')
RESUME_PREFIX = os.environ.get('RESUME_PREFIX', 'resumes/')

# Bedrock Models
EMBEDDING_MODEL_ID = os.environ.get('EMBEDDING_MODEL_ID', 'amazon.titan-embed-text-v2:0')
LLM_MODEL_ID = os.environ.get('LLM_MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')

# OpenSearch Configuration
OPENSEARCH_ENDPOINT = os.environ.get('OPENSEARCH_ENDPOINT', 'https://1jivpq1n907fmvddqgy9.ap-south-1.aoss.amazonaws.com')
OPENSEARCH_INDEX = os.environ.get('OPENSEARCH_INDEX', 'resumes')

# Processing Limits
MAX_TEXT_LENGTH = int(os.environ.get('MAX_TEXT_LENGTH', '8000'))
MAX_EMBEDDING_LENGTH = int(os.environ.get('MAX_EMBEDDING_LENGTH', '2000'))
EMBEDDING_DIMENSION = int(os.environ.get('EMBEDDING_DIMENSION', '1024')) 
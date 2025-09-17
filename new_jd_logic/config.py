import os
import logging

logger = logging.getLogger()

class Config:
    """Configuration class to handle environment variables with defaults"""
    
    # Required environment variables
    OPENSEARCH_ENDPOINT = os.environ.get('OPENSEARCH_ENDPOINT', 'https://1jivpq1n907fmvddqgy9.ap-south-1.aoss.amazonaws.com')
    
    # Optional environment variables with defaults
    BUCKET_NAME = os.environ.get('BUCKET_NAME', 'trujobs-db')
    JD_PREFIX = os.environ.get('JD_PREFIX', 'JD/')
    AWS_REGION = os.environ.get('AWS_REGION', 'ap-south-1')
    BEDROCK_ENDPOINT = os.environ.get('BEDROCK_ENDPOINT', 'https://bedrock-runtime.ap-south-1.amazonaws.com')
    CLAUDE_MODEL_ID = os.environ.get('CLAUDE_MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')
    EMBEDDING_MODEL_ID = os.environ.get('EMBEDDING_MODEL_ID', 'amazon.titan-embed-text-v2:0')
    OPENSEARCH_INDEX = os.environ.get('OPENSEARCH_INDEX', 'job_descriptions')
    OPENSEARCH_COLLECTION = os.environ.get('OPENSEARCH_COLLECTION', 'recruitment-search')
    
    @classmethod
    def validate(cls):
        """Validate required environment variables"""
        missing_vars = []
        
        if not cls.OPENSEARCH_ENDPOINT:
            missing_vars.append('OPENSEARCH_ENDPOINT')
            
        if missing_vars:
            error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
            
        logger.info("Configuration validation passed")
        return True
    
    @classmethod
    def get_s3_config(cls):
        """Get S3 configuration"""
        return {
            'bucket_name': cls.BUCKET_NAME,
            'jd_prefix': cls.JD_PREFIX
        }
    
    @classmethod
    def get_bedrock_config(cls):
        """Get Bedrock configuration"""
        return {
            'region': cls.AWS_REGION,
            'endpoint_url': cls.BEDROCK_ENDPOINT,
            'claude_model_id': cls.CLAUDE_MODEL_ID,
            'embedding_model_id': cls.EMBEDDING_MODEL_ID
        }
    
    @classmethod
    def get_opensearch_config(cls):
        """Get OpenSearch configuration"""
        return {
            'endpoint': cls.OPENSEARCH_ENDPOINT,
            'region': cls.AWS_REGION,
            'index_name': cls.OPENSEARCH_INDEX,
            'collection_name': cls.OPENSEARCH_COLLECTION
        } 
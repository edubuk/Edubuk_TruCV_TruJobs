import time
import logging
import json
from storage_service import extract_text_from_pdf as _extract_text_from_pdf
from ai_service import get_metadata_from_bedrock as _get_metadata_from_bedrock, get_embedding as _get_embedding
from config import Config

logger = logging.getLogger()

def time_function(func):
    """Decorator to log function execution time"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            end_time = time.time()
            logger.info(f"{func.__name__} executed in {(end_time - start_time)*1000:.2f} ms")
            return result
        except Exception as e:
            end_time = time.time()
            logger.error(f"{func.__name__} failed after {(end_time - start_time)*1000:.2f} ms. Error: {str(e)}")
            raise
    return wrapper

# Export commonly used functions with timing
@time_function
def extract_text_from_pdf(pdf_content):
    """Extract text content from PDF bytes (with timing)"""
    return _extract_text_from_pdf(pdf_content)

@time_function
def get_metadata_from_bedrock(text):
    """Extract metadata from job description text using Bedrock (with timing)"""
    return _get_metadata_from_bedrock(text)

@time_function
def get_embedding(text):
    """Generate embedding for text using Bedrock (with timing)"""
    return _get_embedding(text)

def get_config():
    """Get the current configuration"""
    return Config

def validate_config():
    """Validate the current configuration"""
    return Config.validate()

# Helper functions for common operations
def format_response(status_code, body, headers=None):
    """Format a standard API response"""
    default_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    if headers:
        default_headers.update(headers)
    
    return {
        'statusCode': status_code,
        'headers': default_headers,
        'body': json.dumps(body) if isinstance(body, dict) else body
    }

def success_response(data, message="Success"):
    """Format a success response"""
    return format_response(200, {
        'message': message,
        **data
    })

def error_response(error_message, status_code=400):
    """Format an error response"""
    return format_response(status_code, {
        'error': error_message,
        'message': 'Failed to process request'
    }) 
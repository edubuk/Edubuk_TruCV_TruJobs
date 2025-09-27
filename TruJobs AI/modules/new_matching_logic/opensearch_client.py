import boto3
import json
import time
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
from botocore.exceptions import ClientError
from config import REGION, SERVICE, COLLECTION_NAME, OPENSEARCH_ENDPOINT, logger


def get_opensearch_collection_endpoint(name, region):
    """Get OpenSearch collection endpoint - using configured endpoint directly"""
    start_time = time.time()
    try:
        # Use the configured endpoint directly for better performance
        endpoint = OPENSEARCH_ENDPOINT
        logger.info(f"Using configured OpenSearch endpoint: {endpoint}")
        logger.info(f"get_opensearch_collection_endpoint time taken: {time.time() - start_time:.4f} seconds")
        return endpoint
    
    except ClientError as e:
        logger.exception("ClientError in get_opensearch_collection_endpoint")
        raise
    except Exception as e:
        logger.exception("Error in get_opensearch_collection_endpoint")
        raise


def get_opensearch_client(collection_name=COLLECTION_NAME, region=REGION):
    """Initialize OpenSearch client with AWS authentication"""
    start_time = time.time()
    try:
        credentials = boto3.Session().get_credentials()
        auth = AWSV4SignerAuth(credentials, region, SERVICE)
        
        opensearch_endpoint = get_opensearch_collection_endpoint(collection_name, region)
        logger.info("Connecting to endpoint: %s", opensearch_endpoint)
        
        client = OpenSearch(
            hosts=[{'host': opensearch_endpoint.replace('https://', ''), 'port': 443}],
            http_auth=auth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection,
            pool_maxsize=300,
            timeout=30
        )
        
        logger.info(f"get_opensearch_client time taken: {time.time() - start_time:.4f} seconds")
        return client
    except Exception as e:
        logger.exception("Error creating OpenSearch client")
        raise


def verify_index_and_mapping(client, index_name):
    """Verify index exists and get mapping information"""
    start_time = time.time()
    try:
        exists = client.indices.exists(index=index_name)
        if not exists:
            logger.error(f"Index {index_name} does not exist")
            return False, None
            
        mapping = client.indices.get_mapping(index=index_name)
        logger.info(f"Index {index_name} mapping: {json.dumps(mapping, indent=2)}")
        
        logger.info(f"verify_index_and_mapping time taken: {time.time() - start_time:.4f} seconds")
        return True, mapping
    except Exception as e:
        logger.error(f"Error verifying index: {str(e)}")
        return False, None


def execute_search_with_retry(client, index_name, query, max_retries=5):
    """Execute search with retry mechanism and consistency preferences"""
    best_result = None
    max_hits = 0
    
    for attempt in range(max_retries):
        try:
            search_params = {
                'index': index_name,
                'body': query,
                'preference': f'_primary_first',
                'request_cache': False
            }
            
            logger.info(f"Search attempt {attempt + 1}/{max_retries}")
            response = client.search(**search_params)
            
            hits = response.get('hits', {}).get('hits', [])
            total_hits = response.get('hits', {}).get('total', {}).get('value', 0)
            
            logger.info(f"Attempt {attempt + 1}: Found {len(hits)} hits, total: {total_hits}")
            
            if len(hits) > max_hits:
                max_hits = len(hits)
                best_result = response
            
            if attempt > 0 and len(hits) == max_hits and total_hits > 0:
                logger.info(f"Consistent result achieved at attempt {attempt + 1}")
                break
                
        except Exception as e:
            logger.warning(f"Search attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                if best_result:
                    return best_result
                raise
        
        if attempt < max_retries - 1:
            wait_time = (2 ** attempt) * 0.1
            time.sleep(wait_time)
    
    return best_result or response 
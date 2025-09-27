import boto3
import logging
import time
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
from config import Config

logger = logging.getLogger()

def get_opensearch_client():
    """Initialize OpenSearch client with proper AOSS authentication"""
    try:
        opensearch_config = Config.get_opensearch_config()
        service = 'aoss'
        credentials = boto3.Session().get_credentials()
        auth = AWSV4SignerAuth(credentials, opensearch_config['region'], service)
        
        endpoint = opensearch_config['endpoint']
        if '://' in endpoint:
            endpoint = endpoint.split('://')[-1]
        endpoint = endpoint.replace('[', '').replace(']', '').strip()
        
        logger.info(f"Connecting to OpenSearch endpoint: {endpoint}")
        
        opensearch = OpenSearch(
            hosts=[{'host': endpoint, 'port': 443}],
            http_auth=auth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection,
            timeout=30
        )
        
        index_name = opensearch_config['index_name']
        if not opensearch.indices.exists(index=index_name):
            create_index(opensearch, index_name)
        
        return opensearch
    except Exception as e:
        logger.error(f"Failed to initialize OpenSearch client: {str(e)}")
        raise

def create_index(client, index_name):
    """Create OpenSearch index with mappings"""
    try:
        index_body = {
            'mappings': {
                'properties': {
                    'metadata': {'type': 'object'},
                    'embedding': {'type': 'knn_vector', 'dimension': 1024},
                    'job_title': {'type': 'text'},
                    'job_description_id': {'type': 'keyword'}
                }
            }
        }
        client.indices.create(index=index_name, body=index_body)
        logger.info(f"Created '{index_name}' index with mappings")
    except Exception as e:
        logger.error(f"Error creating index: {str(e)}")
        raise

def check_and_create_opensearch_index(client):
    """Function to check if an OpenSearch index exists, and if not, create it"""
    opensearch_config = Config.get_opensearch_config()
    index_name = opensearch_config['index_name']
    
    if client.indices.exists(index=index_name):
        logger.info(f"Index '{index_name}' already exists.")
        return
    else:
        collection_name = opensearch_config['collection_name']
        client.create_index(
            CollectionName=collection_name,
            IndexName=index_name,
            VectorFieldName='job_description',
            VectorType='VECTOR',
            VectorDimensions=1024,
            Engine='faiss',
            Precision='FP32',
            DistanceMetric='EUCLIDEAN',
            M=16,
            EfConstruction=512,
            EfSearch=512
        )

def index_document(client, doc_id, document):
    """Index document in OpenSearch with retry logic"""
    opensearch_config = Config.get_opensearch_config()
    index_name = opensearch_config['index_name']
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            response = client.index(
                index=index_name,
                body=document
            )
            logger.info(f"Successfully indexed document. Generated ID: {response['_id']}, Job Description ID: {doc_id}")
            return response
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"Failed to index document after {max_retries} attempts: {str(e)}")
                raise
            logger.warning(f"Indexing attempt {attempt + 1} failed, retrying... Error: {str(e)}")
            time.sleep(1 * (attempt + 1)) 
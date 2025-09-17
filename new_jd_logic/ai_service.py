import json
import boto3
import logging
from prompts import METADATA_EXTRACTION_PROMPT
from config import Config

logger = logging.getLogger()

def get_bedrock_client():
    """Initialize Bedrock client"""
    bedrock_config = Config.get_bedrock_config()
    return boto3.client('bedrock-runtime', bedrock_config['region'], endpoint_url=bedrock_config['endpoint_url'])

def get_metadata_from_bedrock(text):
    """Extract metadata from job description text using Bedrock's Claude model"""
    client = get_bedrock_client()
    bedrock_config = Config.get_bedrock_config()
    model_id = bedrock_config['claude_model_id']
    
    prompt_text = METADATA_EXTRACTION_PROMPT.format(text=text)

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0.1,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt_text
                    }
                ]
            }
        ],
    })

    try:
        response = client.invoke_model(
            body=body,
            modelId=model_id,
            accept="application/json",
            contentType="application/json"
        )
        response_body = json.loads(response.get('body').read())
        
        llm_output = response_body['content'][0]['text']
        start_index = llm_output.find('<output>') + len('<output>')
        end_index = llm_output.find('</output>')
        json_output = llm_output[start_index:end_index]
        
        metadata = json.loads(json_output)
        logger.info("Successfully extracted metadata using Bedrock")
        return metadata
    except Exception as e:
        logger.error(f"Error extracting metadata using Bedrock: {str(e)}")
        raise

def get_embedding(text):
    """Generate embedding for text using Bedrock's embedding model"""
    client = get_bedrock_client()
    bedrock_config = Config.get_bedrock_config()
    embedding_model_id = bedrock_config['embedding_model_id']
    
    try:
        response = client.invoke_model(
            body=json.dumps({"inputText": text}),
            modelId=embedding_model_id,
            accept="application/json",
            contentType="application/json"
        )

        response_body = json.loads(response.get('body').read())
        embedding = response_body.get('embedding')
        logger.info(f"Successfully generated embedding vector of dimension: {len(embedding)}")
        return embedding
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        raise 
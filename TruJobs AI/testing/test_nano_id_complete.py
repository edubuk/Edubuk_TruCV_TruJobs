#!/usr/bin/env python3
"""Complete test for nano_Id feature"""

import json
import time
import requests
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

API_BASE = 'https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod'
API_KEY = 'KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47'
REGION = 'ap-south-1'
JOB_DESCRIPTION_ID = '2e0eeec6-3f80-4e00-a4c1-f9ca804f6fd9'
OPENSEARCH_ENDPOINT = '1jivpq1n907fmvddqgy9.ap-south-1.aoss.amazonaws.com'

TEST_RESUME_JSON = {
    "nano_Id": "Test-User-" + str(int(time.time())),
    "name": "Test User",
    "contact": {"email": "test@example.com", "location": "Test City"},
    "skills": [{"skillName": "Python"}, {"skillName": "JavaScript"}],
    "experience": [{
        "company_name": "Test Company",
        "job_role": "Software Engineer",
        "description": "Developed web applications"
    }]
}

def get_opensearch_client():
    session = boto3.Session()
    credentials = session.get_credentials()
    auth = AWSV4SignerAuth(credentials, REGION, 'aoss')
    return OpenSearch(
        hosts=[{'host': OPENSEARCH_ENDPOINT, 'port': 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        timeout=30
    )

def check_opensearch_for_nano_id(resume_id):
    """Check if nano_Id is stored in OpenSearch"""
    try:
        client = get_opensearch_client()
        body = {'query': {'term': {'resume_id': resume_id}}}
        resp = client.search(index='resumes', body=body)
        hits = resp.get('hits', {}).get('hits', [])
        if hits:
            source = hits[0]['_source']
            return source.get('nano_Id')
        return None
    except Exception as e:
        print(f"OpenSearch check failed: {e}")
        return None

def main():
    print(f'🧪 Testing nano_Id feature with ID: {TEST_RESUME_JSON["nano_Id"]}')
    
    headers = {'x-api-key': API_KEY, 'Content-Type': 'application/json'}
    
    # Step 1: Upload resume with nano_Id
    print('\n📤 Step 1: Uploading resume...')
    upload_payload = {
        'resume_json': TEST_RESUME_JSON,
        'job_description_id': JOB_DESCRIPTION_ID
    }
    
    resp = requests.post(f'{API_BASE}/ResumeUpload', headers=headers, json=upload_payload)
    
    if resp.status_code != 200:
        print(f'❌ Upload failed: {resp.status_code} - {resp.text}')
        return
    
    body = resp.json()
    resume_id = body.get('resume_id')
    print(f'✅ Upload successful: {resume_id}')
    print(f'   Candidate: {body.get("candidate_name")}')
    
    # Step 2: Wait and check OpenSearch
    print('\n🔍 Step 2: Checking OpenSearch for nano_Id...')
    time.sleep(5)  # Wait for indexing
    
    stored_nano_id = check_opensearch_for_nano_id(resume_id)
    if stored_nano_id:
        print(f'✅ Found nano_Id in OpenSearch: {stored_nano_id}')
        if stored_nano_id == TEST_RESUME_JSON["nano_Id"]:
            print('🎉 nano_Id matches expected value!')
        else:
            print(f'❌ Mismatch! Expected: {TEST_RESUME_JSON["nano_Id"]}, Got: {stored_nano_id}')
    else:
        print('❌ nano_Id not found in OpenSearch')
    
    # Step 3: Test similarity API
    print('\n🎯 Step 3: Testing similarity API...')
    sim_payload = {
        'job_description_id': JOB_DESCRIPTION_ID,
        'top_k': 10,
        'calculate_similarity': True
    }
    
    try:
        sim_resp = requests.post(f'{API_BASE}/resume_Similarity', headers=headers, json=sim_payload, timeout=30)
        
        if sim_resp.status_code == 200:
            sim_data = sim_resp.json()
            matches = sim_data.get('matches', [])
            print(f'✅ Similarity API successful: {len(matches)} matches found')
            
            # Look for our resume in the matches
            our_match = None
            for match in matches:
                if match.get('resume_id') == resume_id:
                    our_match = match
                    break
            
            if our_match:
                match_nano_id = our_match.get('nano_Id')
                print(f'✅ Found our resume in similarity results')
                print(f'   nano_Id in response: {match_nano_id}')
                print(f'   Similarity score: {our_match.get("similarity_score", "N/A")}')
                
                if match_nano_id == TEST_RESUME_JSON["nano_Id"]:
                    print('🎉 SUCCESS: nano_Id feature working correctly!')
                    return True
                else:
                    print(f'❌ nano_Id mismatch in response!')
                    return False
            else:
                print('⚠️ Our resume not found in similarity results')
                # Show first few matches for debugging
                print('First few matches:')
                for i, match in enumerate(matches[:3]):
                    print(f'  {i+1}. {match.get("candidate_name")} (nano_Id: {match.get("nano_Id")})')
                return False
        else:
            print(f'❌ Similarity API failed: {sim_resp.status_code} - {sim_resp.text[:200]}')
            return False
            
    except requests.exceptions.Timeout:
        print('❌ Similarity API timed out')
        return False
    except Exception as e:
        print(f'❌ Similarity API error: {e}')
        return False

if __name__ == '__main__':
    success = main()
    print(f'\n📊 Overall result: {"🎉 SUCCESS" if success else "❌ FAILED"}')

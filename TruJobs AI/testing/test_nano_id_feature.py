#!/usr/bin/env python3
"""Test nano_Id feature end-to-end"""

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
    "nano_Id": "Ajeet-Verma-8LgGByRevQmeWdwp",
    "name": "Ajeet Verma",
    "contact": {"email": "ajeet@edubukeseal.org", "location": "Lucknow"},
    "skills": [{"skillName": "Project management"}]
}

def main():
    print('Testing nano_Id feature...')
    
    headers = {'x-api-key': API_KEY, 'Content-Type': 'application/json'}
    payload = {'resume_json': TEST_RESUME_JSON, 'job_description_id': JOB_DESCRIPTION_ID}

    # Upload resume
    resp = requests.post(f'{API_BASE}/ResumeUpload', headers=headers, json=payload)
    
    if resp.status_code == 200:
        body = resp.json()
        resume_id = body.get('resume_id')
        print(f'✅ Upload successful: {resume_id}')
        
        # Test similarity API
        time.sleep(3)
        sim_payload = {'job_description_id': JOB_DESCRIPTION_ID, 'top_k': 5, 'calculate_similarity': True}
        sim_resp = requests.post(f'{API_BASE}/resume_Similarity', headers=headers, json=sim_payload)
        
        if sim_resp.status_code == 200:
            sim_data = sim_resp.json()
            matches = sim_data.get('matches', [])
            
            for match in matches:
                if match.get('resume_id') == resume_id:
                    nano_id = match.get('nano_Id')
                    print(f'✅ Found nano_Id in response: {nano_id}')
                    if nano_id == TEST_RESUME_JSON["nano_Id"]:
                        print('🎉 nano_Id feature working correctly!')
                    else:
                        print('❌ nano_Id mismatch')
                    break
        else:
            print(f'❌ Similarity API failed: {sim_resp.status_code}')
    else:
        print(f'❌ Upload failed: {resp.status_code}')

if __name__ == '__main__':
    main()

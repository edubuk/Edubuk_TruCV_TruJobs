#!/usr/bin/env python3
"""
Test the enhanced certifications feature - courses and awards should now be included
"""

import json
import time
from pathlib import Path
from typing import Dict, Any

import requests
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

API_BASE = 'https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod'
API_KEY = 'KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47'
REGION = 'ap-south-1'

JOB_DESCRIPTION_ID = '2e0eeec6-3f80-4e00-a4c1-f9ca804f6fd9'

S3_BUCKET = 'trujobs-db'
RESUMES_INDEX = 'resumes'
OPENSEARCH_ENDPOINT = '1jivpq1n907fmvddqgy9.ap-south-1.aoss.amazonaws.com'

OS_VERIFY_RETRIES = 5
OS_VERIFY_DELAY_SEC = 5

# Ajeet's resume with courses and awards
AJEET_RESUME_JSON = {
    "name": "Ajeet Verma",
    "contact": {
        "email": "ajeet@edubukeseal.org",
        "location": "Lucknow",
        "profession": "student",
        "yearOfExperience": "1"
    },
    "education": {
        "underGraduateDuration": {
            "duration": {
                "from": "Sep 01 2025",
                "to": "Sep 20 2025"
            }
        },
        "postGraduateDuration": {
            "duration": {
                "from": "Date",
                "to": "Date"
            }
        },
        "class10School": "LPS",
        "class10Board": "UP",
        "class10Grade": 66,
        "class12College": "LPS",
        "class12Board": "UP",
        "class12Grade": 88,
        "underGraduateCollege": "IIIT Naya Raipur",
        "underGraduateDegree": "BTech",
        "underGraduateGPA": 9
    },
    "experience": [
        {
            "duration": {
                "from": "2025-08-31T18:30:00.000Z",
                "to": "1970-01-01T00:00:00.000Z"
            },
            "company_name": "Edubuk Pvt Ltd",
            "description": "Designed and deployed smart contracts in Solidity across multiple blockchains including Ethereum, XDC, SKALE, and BNB Chain, enabling Holder, Finder, Share, and Revoke functionality for the Edubuk web application. Integrated Okto custodial wallets to deliver a seamless Web3 experience with Web2 usability, and collaborated directly with the Okto team to troubleshoot and resolve critical integration errors. Developed a full-stack EBUK Token Presale platform and integrated Synaps KYC tool to automated user KYC verification. Created and deployed ERC-721 NFT smart contracts on multiple chains and uses openzepplin library for role management and secure the functionality",
            "job_role": "SDE",
            "experienceCertUrl": "",
            "_id": "68d6d6bc841801bb56ecb6bb"
        }
    ],
    "achievements": {
        "awards": [
            {
                "award_name": "IEEE",
                "awarding_organization": "IIIT Naya Raipur",
                "date_of_achievement": "Sep 01 2025",
                "description": "Received on hosting and managing the IEEE-WIECON-23 event",
                "_id": "68d6d6bc841801bb56ecb6be"
            }
        ],
        "courses": [
            {
                "duration": {
                    "from": "Sep 01 2025",
                    "to": "Sep 15 2025"
                },
                "course_name": "Full stack dev",
                "organization": "Coding Ninja",
                "description": "Learned to build full stack web application. Got the hand on experience to build frontend and backend",
                "_id": "68d6d6bc841801bb56ecb6bf"
            }
        ],
        "projects": [
            {
                "duration": {
                    "from": "Sep 01 2025",
                    "to": "Sep 22 2025"
                },
                "project_name": "EHR",
                "project_url": "",
                "description": "Developed a blockchain-based EHR management system ensuring patient data security and privacy, addressing concerns raised by recent server attacks on AIIMS Delhi. Implemented direct private consultations with the director and seamless sharing of health records with doctors to enhance patient care. Enhanced emergency care with quick access to stored patient data on the secure blockchain, mitigating risks arising from potential server attack",
                "_id": "68d6d6bc841801bb56ecb6c0"
            }
        ]
    },
    "skills": [
        {
            "skillName": "Project management",
            "skillUrl": "",
            "_id": "68d6d6bc841801bb56ecb6bc"
        },
        {
            "skillName": "Software proficiency",
            "skillUrl": "",
            "_id": "68d6d6bc841801bb56ecb6bd"
        }
    ]
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


def poll_os_for_resume(resume_id: str) -> Dict[str, Any]:
    client = get_opensearch_client()
    for attempt in range(1, OS_VERIFY_RETRIES + 1):
        try:
            body = { 'query': { 'term': { 'resume_id': resume_id } } }
            resp = client.search(index=RESUMES_INDEX, body=body)
            hits = resp.get('hits', {}).get('hits', [])
            if hits:
                src = hits[0]['_source']
                return {
                    'found': True,
                    'candidate_name': src.get('candidate_name'),
                    'metadata': src.get('metadata', {}),
                    'attempt': attempt,
                    'full_document': src
                }
        except Exception as e:
            print(f"OpenSearch attempt {attempt} failed: {e}")
        time.sleep(OS_VERIFY_DELAY_SEC)
    return {'found': False, 'attempts': OS_VERIFY_RETRIES}


def verify_s3_text(s3_key: str) -> Dict[str, Any]:
    s3 = boto3.client('s3', region_name=REGION)
    info = {'exists': False, 'size': 0, 'content_type': None, 'content_preview': None}
    try:
        head = s3.head_object(Bucket=S3_BUCKET, Key=s3_key)
        info['exists'] = True
        info['size'] = head.get('ContentLength', 0)
        info['content_type'] = head.get('ContentType')
        
        # Get first 2000 characters of content
        obj = s3.get_object(Bucket=S3_BUCKET, Key=s3_key)
        content = obj['Body'].read().decode('utf-8')
        info['content_preview'] = content[:2000]
        info['full_content_length'] = len(content)
    except Exception as e:
        info['error'] = str(e)
    return info


def main():
    headers = {'x-api-key': API_KEY, 'Content-Type': 'application/json'}
    payload = {
        'resume_json': AJEET_RESUME_JSON,
        'job_description_id': JOB_DESCRIPTION_ID
    }

    print('Testing enhanced certifications feature (courses and awards should be included)...')
    print(f'Expected certifications to include:')
    print('  - Course: Full stack dev')
    print('  - Award: IEEE')
    
    t0 = time.time()
    resp = requests.post(f'{API_BASE}/ResumeUpload', headers=headers, json=payload)
    dt = time.time() - t0

    report: Dict[str, Any] = {
        'test_description': 'Testing enhanced certifications - courses and awards should be included',
        'http_status': resp.status_code,
        'api_time_sec': dt,
        'response': None,
        's3_verification': None,
        'opensearch_verification': None,
        'certifications_analysis': None
    }

    if resp.status_code == 200:
        body = {}
        try:
            body = resp.json()
        except Exception:
            pass
        resume_id = body.get('resume_id')
        s3_key = body.get('s3_key')
        report['response'] = body
        print(f'✅ SUCCESS: resume_id={resume_id}, s3_key={s3_key}')
        print(f'   Candidate: {body.get("candidate_name")}')
        
        if resume_id:
            print('🔍 Verifying OpenSearch indexing and certifications...')
            os_info = poll_os_for_resume(resume_id)
            report['opensearch_verification'] = os_info
            if os_info.get('found'):
                print(f'   ✅ Found in OpenSearch after {os_info["attempt"]} attempts')
                metadata = os_info.get('metadata', {})
                
                # Analyze certifications
                certifications = metadata.get('certifications', '')
                print(f'   📜 Certifications field: "{certifications}"')
                
                # Check if courses and awards are included
                has_course = 'full stack' in certifications.lower() or 'course' in certifications.lower()
                has_award = 'ieee' in certifications.lower() or 'award' in certifications.lower()
                
                cert_analysis = {
                    'certifications_text': certifications,
                    'has_course': has_course,
                    'has_award': has_award,
                    'enhancement_successful': has_course and has_award
                }
                report['certifications_analysis'] = cert_analysis
                
                if has_course and has_award:
                    print('   🎉 SUCCESS: Both courses and awards are included in certifications!')
                else:
                    print('   ❌ ISSUE: Missing courses or awards in certifications')
                    print(f'      Has course: {has_course}')
                    print(f'      Has award: {has_award}')
                
                print(f'   Skills: {metadata.get("skills", "N/A")}')
                print(f'   Education: {metadata.get("education_text", "N/A")[:100]}...')
                print(f'   Experience: {metadata.get("work_experience_text", "N/A")[:100]}...')
            else:
                print(f'   ❌ Not found in OpenSearch after {os_info["attempts"]} attempts')
        
        if s3_key:
            print('🔍 Verifying S3 content...')
            s3_info = verify_s3_text(s3_key)
            report['s3_verification'] = s3_info
            if s3_info.get('exists'):
                print(f'   S3 exists: {s3_info["size"]} bytes, type: {s3_info["content_type"]}')
            else:
                print(f'   ❌ S3 object not found: {s3_info.get("error")}')
    else:
        print(f'❌ FAILED: {resp.status_code}')
        print(f'   Response: {resp.text[:500]}')
        try:
            report['response'] = resp.json()
        except Exception:
            report['response'] = resp.text

    out_dir = Path('/home/ganesh/Desktop/new_project_X/testing')
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f'enhanced_certifications_test_{int(time.time())}.json'
    out_path.write_text(json.dumps(report, indent=2))
    print(f'\n📝 Saved detailed report to: {out_path}')


if __name__ == '__main__':
    main()

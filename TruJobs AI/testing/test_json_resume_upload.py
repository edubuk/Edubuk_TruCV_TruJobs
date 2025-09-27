#!/usr/bin/env python3
"""
Test JSON resume upload and verification
- Posts a structured resume JSON to /ResumeUpload with the given job_description_id
- Verifies S3 object for JSON text exists at resumes_text/{resume_id}.txt
- Polls OpenSearch for the resume_id
- Saves a report under /home/ganesh/Desktop/new_project_X/testing/
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

JOB_DESCRIPTION_ID = 'f3efb55a-8ae1-4e32-ba91-cdeedb2e3ff2'

S3_BUCKET = 'trujobs-db'
RESUMES_INDEX = 'resumes'
OPENSEARCH_ENDPOINT = '1jivpq1n907fmvddqgy9.ap-south-1.aoss.amazonaws.com'

OS_VERIFY_RETRIES = 5
OS_VERIFY_DELAY_SEC = 5

SAMPLE_RESUME_JSON = {
  "name": "Ajeet Ram Verma",
  "contact": {
    "phone": "9555437698",
    "email": "ajeetramverma10@gmail.com",
    "alt_email": "ajeet20101@iiitnr.edu.in",
    "linkedin": "https://www.linkedin.com/in/ajeet-ram-verma-953605244/",
    "github": "https://github.com/ajeetram"
  },
  "education": [
    {
      "institution": "IIIT Naya Raipur",
      "degree": "B.Tech in Electronics and Communication",
      "grade": "8.34/10",
      "duration": "Dec. 2020 – June 2024"
    },
    {
      "institution": "Haji Nurool Hasan Memorial Inter College",
      "degree": "Class-XII",
      "board": "UP Board",
      "grade": "84.2%",
      "duration": "April 2019"
    },
    {
      "institution": "Haji Nurool Hasan Memorial Inter College",
      "degree": "Class-X",
      "board": "UP Board",
      "grade": "87.1%",
      "duration": "May 2017"
    }
  ],
  "experience": [
    {
      "title": "Full Stack Blockchain Developer",
      "organization": "Edubuk",
      "type": "Full-Time",
      "duration": "Sep 2024 – Present",
      "responsibilities": [
        "Designed and deployed smart contracts in Solidity across Ethereum, XDC, SKALE, and BNB Chain.",
        "Integrated Okto custodial wallets and collaborated with Okto team for error resolution.",
        "Developed full-stack EBUK Token Presale platform with Synaps KYC integration.",
        "Created ERC-721 NFT contracts using OpenZeppelin library.",
        "Automated blockchain certificate registration and LinkedIn attachment.",
        "Built responsive web applications ensuring performance across devices.",
        "Won 3rd place in DeSci category in Educhain Hackathon."
      ]
    },
    {
      "title": "Founding Engineer",
      "organization": "FastrPayments",
      "type": "Internship",
      "duration": "Jan 2024 – May 2024",
      "responsibilities": [
        "Developed responsive payment interface with CRUD operations.",
        "Designed RESTful APIs for credit/debit card data.",
        "Resolved transaction reliability issues with third-party APIs."
      ]
    }
  ],
  "projects": [
    {
      "title": "Electronic Health Record Management System",
      "stack": ["React-js", "Node-js", "IPFS", "Ether-js", "Solidity"],
      "repo": "https://github.com/ajeetram/Electronic-Health-Record-Management-System",
      "description": "Blockchain-based EHR ensuring security, private consultations, and quick emergency access."
    },
    {
      "title": "E-commerce App",
      "stack": ["React-js", "CSS", "Node-js", "MongoDB", "Express-js", "Stripe API"],
      "repo": "https://github.com/ajeetram/e-shop",
      "description": "Full e-commerce platform with authentication, dashboards, product management, and Stripe integration."
    },
    {
      "title": "Identity Verification DApp",
      "stack": ["Solidity", "React-js", "CSS", "Node-js", "IPFS", "Ether-js", "MetaMask", "Hardhat"],
      "repo": "https://github.com/ajeetram/SSI-Management-System",
      "description": "Privacy-focused DApp enabling issuers, holders, and verifiers to manage credentials securely."
    },
    {
      "title": "Task-Manager",
      "stack": ["React-js", "TypeScript", "Node-js", "Express-js", "MongoDB"],
      "repo": "https://github.com/ajeetram/Task-Manager",
      "description": "Task management app with CRUD, drag-and-drop, priority states, and JWT authentication."
    }
  ],
  "skills": {
    "languages": ["C", "C++", "Python", "SQL", "HTML/CSS", "JavaScript", "TypeScript", "Solidity"],
    "frameworks_libraries": ["React-js", "Express-js", "Ether-js", "Node-js", "Firebase", "Tailwind CSS", "IPFS", "MongoDB"],
    "developer_tools": ["Git", "VSCode", "Windsurf", "Remix IDE", "Excel", "PowerPoint", "MS Word"],
    "soft_skills": ["Communication", "Leadership", "Teamwork"]
  },
  "responsibilities": [
    {
      "role": "NSS Educator",
      "duration": "2021 – 2022",
      "description": "Taught village students every weekend."
    },
    {
      "role": "NSS Educator Head",
      "duration": "2022 – Present",
      "description": "Organized free tuition classes, patriotic and sports events."
    },
    {
      "role": "IEEE Student Branch Member",
      "duration": "Jan 2023 – Present",
      "description": "Conducted educational events at college."
    }
  ],
  "achievements": [
    "IEEE International WIECON Volunteering Certificate for hosting technical sessions.",
    "Volunteered in technical event 'Electrobliz' during college fest.",
    "Solved 500+ coding questions on platforms like LeetCode, GFG, HackerRank, and CodeChef."
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
                    'attempt': attempt
                }
        except Exception:
            pass
        time.sleep(OS_VERIFY_DELAY_SEC)
    return {'found': False, 'attempts': OS_VERIFY_RETRIES}


def verify_s3_text(s3_key: str) -> Dict[str, Any]:
    s3 = boto3.client('s3', region_name=REGION)
    info = {'exists': False, 'size': 0, 'content_type': None}
    try:
        head = s3.head_object(Bucket=S3_BUCKET, Key=s3_key)
        info['exists'] = True
        info['size'] = head.get('ContentLength', 0)
        info['content_type'] = head.get('ContentType')
    except Exception:
        pass
    return info


def main():
    headers = {'x-api-key': API_KEY, 'Content-Type': 'application/json'}
    payload = {
        'resume_json': SAMPLE_RESUME_JSON,
        'job_description_id': JOB_DESCRIPTION_ID
    }

    print('Posting JSON resume to /ResumeUpload ...')
    t0 = time.time()
    resp = requests.post(f'{API_BASE}/ResumeUpload', headers=headers, json=payload)
    dt = time.time() - t0

    report: Dict[str, Any] = {
        'http_status': resp.status_code,
        'api_time_sec': dt,
        'response': None,
        's3_verification': None,
        'opensearch_verification': None
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
        print(f'OK resume_id={resume_id}, s3_key={s3_key}')
        if s3_key:
            report['s3_verification'] = verify_s3_text(s3_key)
        if resume_id:
            report['opensearch_verification'] = poll_os_for_resume(resume_id)
    else:
        print('Upload failed:', resp.status_code, resp.text[:200])
        try:
            report['response'] = resp.json()
        except Exception:
            report['response'] = resp.text

    out_dir = Path('/home/ganesh/Desktop/new_project_X/testing')
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f'json_resume_test_report_{int(time.time())}.json'
    out_path.write_text(json.dumps(report, indent=2))
    print('Saved report to', out_path)


if __name__ == '__main__':
    main()

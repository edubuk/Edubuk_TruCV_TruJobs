#!/usr/bin/env python3
"""
End-to-end pipeline test:
1) Upload 10 JDs (JSON) via /JDUpload
2) Apply all resumes (including Hemlata_anna_rajkumar.pdf) to each uploaded JD via /ResumeUpload
3) Verify S3 and OpenSearch results and gather Lambda logs
4) Produce a consolidated report

Notes:
- This test will make many API calls (N_resumes * 10 JDs). It may take 10-20 minutes depending on rate limits.
- Requires AWS credentials configured locally for OpenSearch signed requests and S3/CloudWatch reads.
"""

import os
import json
import time
import math
import traceback
from pathlib import Path
from typing import List, Dict, Any

import requests
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

# =========================
# Configuration
# =========================
API_BASE = 'https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod'
API_KEY = 'KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47'
REGION = 'ap-south-1'

JD_JSON_PATH = '/home/ganesh/Desktop/new_project_X/tests/samples/sample_jd/jd.json'
RESUME_DIR = '/home/ganesh/Desktop/new_project_X/tests/samples/sample_pdfs'

# Resume pipeline storage and search
S3_BUCKET = 'trujobs-db'
RESUMES_INDEX = 'resumes'  # from resume pipeline config
JDS_INDEX = 'job_descriptions'  # from JD pipeline config
OPENSEARCH_ENDPOINT = '1jivpq1n907fmvddqgy9.ap-south-1.aoss.amazonaws.com'

# Controls
APPLY_SLEEP_SECONDS = 1.0  # between uploads to reduce throttling
OS_VERIFY_RETRIES = 5
OS_VERIFY_DELAY_SEC = 5

# CloudWatch
LOG_GROUP_RESUME = '/aws/lambda/resume-processor'
LOG_GROUP_JD = '/aws/lambda/jd-processor'

# =========================
# Helpers
# =========================

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


def verify_resume_in_opensearch(client: OpenSearch, resume_id: str) -> Dict[str, Any]:
    """Poll OpenSearch for the document by resume_id and return verification info."""
    for attempt in range(1, OS_VERIFY_RETRIES + 1):
        try:
            body = {
                'query': {
                    'term': {
                        'resume_id': resume_id
                    }
                }
            }
            resp = client.search(index=RESUMES_INDEX, body=body)
            hits = resp.get('hits', {}).get('hits', [])
            if hits:
                src = hits[0]['_source']
                metadata = src.get('metadata', {})
                return {
                    'found': True,
                    'candidate_name': src.get('candidate_name'),
                    'skills_count': len(metadata.get('skills_list', [])) if isinstance(metadata.get('skills_list', []), list) else 0,
                    'metadata_full_name': metadata.get('full_name'),
                    'doc': src,
                    'attempt': attempt
                }
        except Exception as e:
            # Continue retrying
            pass
        time.sleep(OS_VERIFY_DELAY_SEC)

    return {'found': False, 'attempts': OS_VERIFY_RETRIES}


def verify_s3_pdf_readable(s3_client, s3_key: str) -> Dict[str, Any]:
    info = {'exists': False, 'pdf_header': False, 'size': 0}
    try:
        # Head object
        head = s3_client.head_object(Bucket=S3_BUCKET, Key=s3_key)
        info['exists'] = True
        size = head.get('ContentLength', 0)
        info['size'] = size

        # Get first bytes to check header
        rng = 'bytes=0-9'
        part = s3_client.get_object(Bucket=S3_BUCKET, Key=s3_key, Range=rng)
        first_bytes = part['Body'].read()
        info['pdf_header'] = first_bytes.startswith(b'%PDF')
    except Exception:
        pass
    return info


def fetch_lambda_errors(logs_client, start_ms: int, end_ms: int, log_group: str) -> Dict[str, int]:
    """Fetch counts of ERROR/WARNING in window."""
    counts = {'ERROR': 0, 'WARNING': 0}
    try:
        # ERROR
        res = logs_client.filter_log_events(
            logGroupName=log_group,
            startTime=start_ms,
            endTime=end_ms,
            filterPattern='ERROR'
        )
        counts['ERROR'] = len(res.get('events', []))
        # WARNING
        res2 = logs_client.filter_log_events(
            logGroupName=log_group,
            startTime=start_ms,
            endTime=end_ms,
            filterPattern='WARNING'
        )
        counts['WARNING'] = len(res2.get('events', []))
    except Exception:
        pass
    return counts


# =========================
# Main test workflow
# =========================

def upload_jds() -> List[Dict[str, Any]]:
    print('📤 Uploading JDs from JSON...')
    p = Path(JD_JSON_PATH)
    data = json.loads(p.read_text())
    results = []
    headers = {'x-api-key': API_KEY, 'Content-Type': 'application/json'}

    for i, item in enumerate(data, 1):
        payload = {'job_description': item.get('job_description', '')}
        print(f"   [{i}/{len(data)}] Uploading JD... text_len={len(payload['job_description'])}")
        t0 = time.time()
        resp = requests.post(f'{API_BASE}/JDUpload', headers=headers, json=payload)
        dt = time.time() - t0
        if resp.status_code == 200:
            body = resp.json()
            jd_id = body.get('job_description_id')
            job_title = body.get('job_title')
            s3_key = body.get('s3_key')
            print(f"   ✅ JD OK in {dt:.2f}s → id={jd_id} title={job_title}")
            results.append({'ok': True, 'id': jd_id, 'title': job_title, 's3_key': s3_key, 'time': dt})
        else:
            print(f"   ❌ JD FAIL {resp.status_code}: {resp.text[:200]}")
            results.append({'ok': False, 'status': resp.status_code, 'error': resp.text, 'time': dt})
        time.sleep(0.5)  # brief space

    return results


def apply_resumes_to_each_jd(jds: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    print('📤 Applying all sample resumes to each JD...')
    resumes = sorted(Path(RESUME_DIR).glob('*.pdf'))
    headers = {'x-api-key': API_KEY}
    s3_client = boto3.client('s3', region_name=REGION)

    all_results = []
    for j, jd in enumerate(jds, 1):
        if not jd.get('ok'):
            print(f"   ⚠️ Skipping JD {j} due to previous upload failure")
            continue
        jd_id = jd['id']
        print(f"   ▶️ JD {j}/{len(jds)} → {jd_id} | {jd.get('title')}")

        for r, pdf in enumerate(resumes, 1):
            print(f"      [{r}/{len(resumes)}] Uploading resume: {pdf.name}")
            with open(pdf, 'rb') as f:
                files = {'pdf_file': (pdf.name, f, 'application/pdf')}
                data = {'job_description_id': jd_id}
                t0 = time.time()
                resp = requests.post(f'{API_BASE}/ResumeUpload', headers=headers, files=files, data=data)
                dt = time.time() - t0

            record = {
                'jd_id': jd_id,
                'pdf': pdf.name,
                'http': resp.status_code,
                'api_time': dt,
                'resume_id': None,
                'candidate_name': None,
                's3_key': None,
                'os_found': False,
                'os_candidate_name': None,
                'os_skills_count': 0,
                's3_exists': False,
                's3_pdf_header': False,
                's3_size': 0,
                'errors': {'ERROR': 0, 'WARNING': 0}
            }

            start_ms = int((time.time() - 5) * 1000)  # small window before upload end
            if resp.status_code == 200:
                body = {}
                try:
                    body = resp.json()
                except Exception:
                    pass
                record['resume_id'] = body.get('resume_id')
                record['candidate_name'] = body.get('candidate_name')
                record['s3_key'] = body.get('s3_key')
                print(f"         ✅ Upload OK in {dt:.2f}s → resume_id={record['resume_id']} candidate={record['candidate_name']}")

                # Verify S3
                if record['s3_key']:
                    s3info = verify_s3_pdf_readable(s3_client, record['s3_key'])
                    record['s3_exists'] = s3info['exists']
                    record['s3_pdf_header'] = s3info['pdf_header']
                    record['s3_size'] = s3info['size']
                    print(f"         📦 S3: exists={record['s3_exists']} pdf={record['s3_pdf_header']} size={record['s3_size']}")

                # Verify OpenSearch
                try:
                    os_client = get_opensearch_client()
                    osres = verify_resume_in_opensearch(os_client, record['resume_id'])
                    record['os_found'] = osres.get('found', False)
                    record['os_candidate_name'] = osres.get('candidate_name')
                    record['os_skills_count'] = osres.get('skills_count', 0)
                    print(f"         🔎 OS: found={record['os_found']} name={record['os_candidate_name']} skills={record['os_skills_count']}")
                except Exception as e:
                    print(f"         ⚠️ OS verify failed: {e}")

                # Fetch logs (errors/warnings)
                try:
                    logs = boto3.client('logs', region_name=REGION)
                    end_ms = int((time.time() + 2) * 1000)
                    record['errors'] = fetch_lambda_errors(logs, start_ms, end_ms, LOG_GROUP_RESUME)
                    print(f"         🧾 Logs: ERR={record['errors']['ERROR']} WARN={record['errors']['WARNING']}")
                except Exception as e:
                    print(f"         ⚠️ Log fetch failed: {e}")

            else:
                print(f"         ❌ Upload FAIL {resp.status_code}: {resp.text[:200]}")

            all_results.append(record)
            time.sleep(APPLY_SLEEP_SECONDS)

    return all_results


def summarize(jd_results: List[Dict[str, Any]], resume_results: List[Dict[str, Any]]):
    ok_jds = sum(1 for x in jd_results if x.get('ok'))
    total_jds = len(jd_results)

    # Group results by JD
    by_jd: Dict[str, List[Dict[str, Any]]] = {}
    for rec in resume_results:
        by_jd.setdefault(rec['jd_id'], []).append(rec)

    print('\n' + '=' * 80)
    print('📊 END-TO-END TEST SUMMARY')
    print('=' * 80)
    print(f"JDs uploaded: {ok_jds}/{total_jds}")

    # Calculate aggregate stats
    total_uploads = len(resume_results)
    http200 = sum(1 for r in resume_results if r['http'] == 200)
    os_found = sum(1 for r in resume_results if r['os_found'])
    s3_ok = sum(1 for r in resume_results if r['s3_exists'] and r['s3_pdf_header'])
    unknown_names = sum(1 for r in resume_results if (r['candidate_name'] or 'Unknown') == 'Unknown')

    print(f"Total resume uploads: {total_uploads}")
    print(f" - HTTP 200: {http200}")
    print(f" - OpenSearch found: {os_found}")
    print(f" - S3 PDF OK: {s3_ok}")
    print(f" - Responses with candidate_name='Unknown': {unknown_names}")

    # Per-JD brief summary
    print('\nPer-JD results:')
    for jd in jd_results:
        if not jd.get('ok'):
            print(f" - JD {jd.get('id')} (FAILED UPLOAD)")
            continue
        recs = by_jd.get(jd['id'], [])
        if not recs:
            print(f" - JD {jd['id']} | {jd.get('title')} → 0 resumes")
            continue
        os_found_jd = sum(1 for r in recs if r['os_found'])
        unknown_jd = sum(1 for r in recs if (r['candidate_name'] or 'Unknown') == 'Unknown')
        print(f" - JD {jd['id']} | {jd.get('title')} → uploads={len(recs)} os_found={os_found_jd} unknown={unknown_jd}")

    # Save JSON report
    report = {
        'jds': jd_results,
        'resumes': resume_results,
        'summary': {
            'jds_ok': ok_jds,
            'jds_total': total_jds,
            'uploads_total': total_uploads,
            'http200': http200,
            'os_found': os_found,
            's3_ok': s3_ok,
            'unknown_names': unknown_names,
            'timestamp': time.time()
        }
    }

    out_dir = Path('/home/ganesh/Desktop/new_project_X/reports/e2e')
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f'report_{int(time.time())}.json'
    out_path.write_text(json.dumps(report, indent=2))
    print(f"\n📝 Saved detailed report to: {out_path}")


if __name__ == '__main__':
    print('🚀 Starting end-to-end pipeline test (JDs + Resumes)...')
    try:
        jd_results = upload_jds()
        # Filter JDs that succeeded
        ok_jds = [j for j in jd_results if j.get('ok') and j.get('id')]
        if not ok_jds:
            print('❌ No JDs uploaded successfully; aborting resume uploads')
            summarize(jd_results, [])
            raise SystemExit(1)

        resume_results = apply_resumes_to_each_jd(ok_jds)
        summarize(jd_results, resume_results)
    except Exception as e:
        print(f"💥 Fatal error: {e}")
        traceback.print_exc()
        raise

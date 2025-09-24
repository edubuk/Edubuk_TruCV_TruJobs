#!/usr/bin/env python3
"""
FINAL PRODUCTION VALIDATION - All 17 Sample Resumes
"""

import os
import requests
import boto3
import PyPDF2
from io import BytesIO
import time
from pathlib import Path

# Configuration
API_BASE = 'https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod'
API_KEY = 'KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47'
JOB_DESCRIPTION_ID = '69e7c813-326c-4e2a-a4a3-87077c8c9186'
BUCKET = 'trujobs-db'
REGION = 'ap-south-1'

def test_resume(pdf_path, s3_client):
    """Test single resume"""
    filename = os.path.basename(pdf_path)
    original_size = os.path.getsize(pdf_path)
    
    print(f"📄 {filename} ({original_size:,} bytes)")
    
    # Upload
    with open(pdf_path, 'rb') as f:
        files = {'pdf_file': f}
        data = {'job_description_id': JOB_DESCRIPTION_ID}
        headers = {'x-api-key': API_KEY}
        response = requests.post(f'{API_BASE}/ResumeUpload', files=files, data=data, headers=headers)
    
    if response.status_code != 200:
        print(f"   ❌ Upload failed: {response.status_code}")
        return False, 0, 0
    
    resume_id = response.json().get('resume_id')
    
    # Download and verify
    temp_file = f'/tmp/test_{resume_id}.pdf'
    s3_client.download_file(BUCKET, f'resumes/{resume_id}.pdf', temp_file)
    s3_size = os.path.getsize(temp_file)
    preservation = (s3_size / original_size) * 100
    
    # Text extraction
    with open(temp_file, 'rb') as f:
        reader = PyPDF2.PdfReader(f, strict=False)
        text = ""
        for page in reader.pages:
            try:
                text += page.extract_text()
            except:
                pass
    
    text_len = len(text.strip())
    success = preservation >= 95.0 and text_len > 50
    
    print(f"   S3: {s3_size:,} bytes ({preservation:.1f}%), Text: {text_len} chars")
    print(f"   {'✅ SUCCESS' if success else '❌ FAILED'}")
    
    os.remove(temp_file)
    return success, preservation, text_len

def main():
    """Test all sample resumes"""
    print("🚀 FINAL PRODUCTION VALIDATION - ALL 17 SAMPLE RESUMES")
    print("="*60)
    
    samples_dir = Path("/home/ganesh/Desktop/new_project_X/tests/samples/sample_pdfs")
    pdf_files = list(samples_dir.glob("*.pdf"))
    
    print(f"📁 Testing {len(pdf_files)} PDF files")
    
    s3_client = boto3.client('s3', region_name=REGION)
    results = []
    
    for i, pdf_path in enumerate(sorted(pdf_files), 1):
        print(f"\n[{i}/{len(pdf_files)}]", end=" ")
        success, preservation, text_len = test_resume(pdf_path, s3_client)
        results.append((pdf_path.name, success, preservation, text_len))
        time.sleep(0.5)  # Rate limiting
    
    # Summary
    successful = sum(1 for _, success, _, _ in results if success)
    perfect = sum(1 for _, _, pres, _ in results if pres >= 99.9)
    
    print(f"\n{'='*60}")
    print("📊 FINAL RESULTS")
    print(f"{'='*60}")
    print(f"Success rate: {successful}/{len(results)} ({successful/len(results)*100:.1f}%)")
    print(f"Perfect preservation: {perfect}/{len(results)} ({perfect/len(results)*100:.1f}%)")
    
    if successful == len(results):
        print("\n🎉 SYSTEM IS PRODUCTION READY!")
        print("✅ All tests passed - 100% success rate")
    else:
        print(f"\n⚠️ {len(results)-successful} files failed - needs investigation")
    
    return successful == len(results)

if __name__ == "__main__":
    main()

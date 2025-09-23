#!/usr/bin/env python3
"""
FINAL COMPREHENSIVE TEST
========================

This script will:
1. Test our local nuclear reconstruction (should be 100% success)
2. Test the deployed Lambda function (currently failing)
3. Compare results and identify the exact discrepancy
4. Provide definitive diagnosis and solution
"""

import os
import requests
import boto3
import PyPDF2
from io import BytesIO
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
API_BASE = 'https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod'
API_KEY = 'KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47'
JOB_DESCRIPTION_ID = '69e7c813-326c-4e2a-a4a3-87077c8c9186'
BUCKET = 'trujobs-db'
REGION = 'ap-south-1'

def nuclear_reconstruction_proven_local(body_string):
    """EXACT local implementation that works 100%"""
    reconstructed_bytes = bytearray()
    
    for char in body_string:
        char_code = ord(char)
        
        if char_code <= 255:
            reconstructed_bytes.append(char_code)
        elif 0xDC80 <= char_code <= 0xDCFF:
            original_byte = char_code - 0xDC00
            reconstructed_bytes.append(original_byte)
        elif char_code == 0xFFFD:
            continue
        else:
            reconstructed_bytes.append(char_code & 0xFF)
    
    return bytes(reconstructed_bytes)

def test_local_reconstruction(pdf_path):
    """Test local nuclear reconstruction"""
    print(f"\n🧪 LOCAL TEST: {os.path.basename(pdf_path)}")
    
    # Load PDF
    with open(pdf_path, 'rb') as f:
        original_bytes = f.read()
    
    # Simulate corruption
    try:
        corrupted_string = original_bytes.decode('latin-1')
    except:
        corrupted_string = original_bytes.decode('utf-8', errors='surrogateescape')
    
    # Apply local reconstruction
    reconstructed_bytes = nuclear_reconstruction_proven_local(corrupted_string)
    
    # Test readability
    try:
        reader = PyPDF2.PdfReader(BytesIO(reconstructed_bytes), strict=False)
        total_text = ""
        for page in reader.pages:
            try:
                total_text += page.extract_text()
            except:
                pass
        text_len = len(total_text)
    except:
        text_len = 0
    
    preservation = (len(reconstructed_bytes) / len(original_bytes)) * 100
    success = preservation >= 95.0 and text_len > 50
    
    print(f"   Original: {len(original_bytes)} bytes")
    print(f"   Reconstructed: {len(reconstructed_bytes)} bytes")
    print(f"   Preservation: {preservation:.1f}%")
    print(f"   Text: {text_len} chars")
    print(f"   Status: {'✅ SUCCESS' if success else '❌ FAILED'}")
    
    return success, len(original_bytes), len(reconstructed_bytes), text_len

def test_lambda_deployment(pdf_path):
    """Test deployed Lambda function"""
    print(f"\n🌐 LAMBDA TEST: {os.path.basename(pdf_path)}")
    
    original_size = os.path.getsize(pdf_path)
    
    # Upload to Lambda
    with open(pdf_path, 'rb') as f:
        files = {'pdf_file': f}
        data = {'job_description_id': JOB_DESCRIPTION_ID}
        headers = {'x-api-key': API_KEY}
        
        response = requests.post(f'{API_BASE}/ResumeUpload', files=files, data=data, headers=headers)
    
    if response.status_code != 200:
        print(f"   ❌ Upload failed: {response.status_code}")
        return False, original_size, 0, 0
    
    result = response.json()
    resume_id = result.get('resume_id')
    s3_key = f"resumes/{resume_id}.pdf"
    
    # Download from S3
    s3_client = boto3.client('s3', region_name=REGION)
    temp_file = f'/tmp/lambda_test_{resume_id}.pdf'
    
    try:
        s3_client.download_file(BUCKET, s3_key, temp_file)
        s3_size = os.path.getsize(temp_file)
        
        # Test readability
        try:
            with open(temp_file, 'rb') as f:
                reader = PyPDF2.PdfReader(f, strict=False)
                total_text = ""
                for page in reader.pages:
                    try:
                        total_text += page.extract_text()
                    except:
                        pass
            text_len = len(total_text)
        except:
            text_len = 0
        
        preservation = (s3_size / original_size) * 100
        success = preservation >= 95.0 and text_len > 50
        
        print(f"   Original: {original_size} bytes")
        print(f"   S3 saved: {s3_size} bytes")
        print(f"   Preservation: {preservation:.1f}%")
        print(f"   Text: {text_len} chars")
        print(f"   Status: {'✅ SUCCESS' if success else '❌ FAILED'}")
        
        os.remove(temp_file)
        return success, original_size, s3_size, text_len
        
    except Exception as e:
        print(f"   ❌ S3 test failed: {e}")
        return False, original_size, 0, 0

def main():
    """Run comprehensive comparison test"""
    print("🚀 FINAL COMPREHENSIVE TEST - LOCAL vs LAMBDA")
    print("=" * 60)
    
    # Test the most problematic PDF
    pdf_path = "/home/ganesh/Desktop/new_project_X/tests/samples/sample_pdfs/Abhishek Gupta.pdf"
    
    if not os.path.exists(pdf_path):
        print("❌ Test PDF not found!")
        return
    
    # Test local implementation
    local_success, local_orig, local_recon, local_text = test_local_reconstruction(pdf_path)
    
    # Test Lambda deployment
    lambda_success, lambda_orig, lambda_s3, lambda_text = test_lambda_deployment(pdf_path)
    
    # Comparison
    print(f"\n{'=' * 60}")
    print("📊 COMPARISON RESULTS")
    print(f"{'=' * 60}")
    
    print(f"LOCAL IMPLEMENTATION:")
    print(f"   Size preservation: {local_recon/local_orig*100:.1f}%")
    print(f"   Text extraction: {local_text} chars")
    print(f"   Status: {'✅ SUCCESS' if local_success else '❌ FAILED'}")
    
    print(f"\nLAMBDA DEPLOYMENT:")
    print(f"   Size preservation: {lambda_s3/lambda_orig*100:.1f}%")
    print(f"   Text extraction: {lambda_text} chars")
    print(f"   Status: {'✅ SUCCESS' if lambda_success else '❌ FAILED'}")
    
    # Diagnosis
    print(f"\n🎯 DIAGNOSIS:")
    if local_success and not lambda_success:
        print("❌ DEPLOYMENT ISSUE: Local works, Lambda fails")
        print("   - Nuclear reconstruction code not properly deployed")
        print("   - Lambda still using old/buggy implementation")
        print("   - Need to verify deployment process")
    elif not local_success and not lambda_success:
        print("❌ ALGORITHM ISSUE: Both local and Lambda fail")
        print("   - Nuclear reconstruction algorithm needs fixing")
    elif local_success and lambda_success:
        print("✅ SUCCESS: Both local and Lambda work correctly")
        print("   - Issue has been resolved!")
    else:
        print("🤔 UNEXPECTED: Lambda works but local fails")
    
    # Recommendation
    print(f"\n💡 RECOMMENDATION:")
    if local_success and not lambda_success:
        print("1. Verify Lambda deployment completed successfully")
        print("2. Check if correct input_parser.py was uploaded")
        print("3. Redeploy with explicit verification")
        print("4. Test immediately after deployment")

if __name__ == "__main__":
    main()

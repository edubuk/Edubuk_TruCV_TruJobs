#!/usr/bin/env python3

import requests
import json
import time
import os
import boto3
import PyPDF2
from io import BytesIO

# Test the critical fix for PDF processing
API_BASE = "https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod"
API_KEY = "KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47"
JOB_DESCRIPTION_ID = "69e7c813-326c-4e2a-a4a3-87077c8c9186"
BUCKET = "trujobs-db"
REGION = "ap-south-1"

def test_pdf_upload_and_validation(pdf_file_path):
    """Test PDF upload and validate S3 content + text extraction"""
    
    pdf_name = os.path.basename(pdf_file_path)
    print(f"\n🧪 TESTING CRITICAL FIX: {pdf_name}")
    print("=" * 60)
    
    # Step 1: Upload PDF
    print("📤 Step 1: Uploading PDF...")
    start_time = time.time()
    
    with open(pdf_file_path, 'rb') as f:
        files = {'pdf_file': f}
        data = {'job_description_id': JOB_DESCRIPTION_ID}
        headers = {'x-api-key': API_KEY}
        
        response = requests.post(
            f"{API_BASE}/ResumeUpload",
            files=files,
            data=data,
            headers=headers
        )
    
    upload_time = time.time() - start_time
    print(f"⏱️ Upload time: {upload_time:.2f}s")
    print(f"📊 HTTP Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"❌ UPLOAD FAILED: {response.text}")
        return False
    
    # Parse response
    try:
        result = response.json()
        resume_id = result.get('resume_id')
        s3_key = result.get('s3_key')
        candidate_name = result.get('candidate_name', 'Unknown')
        
        print(f"✅ Upload successful!")
        print(f"   Resume ID: {resume_id}")
        print(f"   S3 Key: {s3_key}")
        print(f"   Candidate: {candidate_name}")
        
    except Exception as e:
        print(f"❌ Failed to parse response: {e}")
        return False
    
    # Step 2: Validate S3 content
    print(f"\n📥 Step 2: Validating S3 content...")
    
    try:
        s3_client = boto3.client('s3', region_name=REGION)
        
        # Download from S3
        temp_file = f"/tmp/test_{resume_id}.pdf"
        s3_client.download_file(BUCKET, s3_key, temp_file)
        
        # Check file size
        s3_size = os.path.getsize(temp_file)
        original_size = os.path.getsize(pdf_file_path)
        
        print(f"📊 File sizes:")
        print(f"   Original: {original_size} bytes")
        print(f"   S3 saved: {s3_size} bytes")
        
        if s3_size < 100:
            print(f"❌ S3 FILE TOO SMALL - BLANK PDF DETECTED!")
            return False
        
        # Test PDF readability
        print(f"\n🔍 Step 3: Testing PDF readability...")
        
        try:
            with open(temp_file, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                pages = len(reader.pages)
                
                total_text = ""
                for i, page in enumerate(reader.pages):
                    try:
                        page_text = page.extract_text()
                        total_text += page_text
                        print(f"   Page {i+1}: {len(page_text)} chars")
                    except Exception as e:
                        print(f"   Page {i+1}: ERROR - {e}")
                
                print(f"📊 Total extracted text: {len(total_text)} characters")
                
                if len(total_text) > 50:
                    print(f"✅ PDF IS READABLE!")
                    print(f"📝 Sample text: {repr(total_text[:100])}")
                    
                    # Clean up
                    os.remove(temp_file)
                    return True
                else:
                    print(f"❌ NO TEXT EXTRACTED - PDF IS BLANK!")
                    return False
                    
        except Exception as e:
            print(f"❌ PDF READ ERROR: {e}")
            return False
            
    except Exception as e:
        print(f"❌ S3 VALIDATION FAILED: {e}")
        return False

def main():
    """Test critical fix with problematic PDFs"""
    
    print("🎯 CRITICAL FIX VALIDATION TEST")
    print("Testing the lambda_function.py fix: extract_text_from_pdf(pdf_content)")
    print("Expected: Enhanced PDF processor should now receive clean_pdf_bytes")
    print()
    
    # Test with known problematic PDFs
    test_files = [
        "/home/ganesh/Desktop/new_project_X/sample_pdfs/vikas_sir.pdf",
        "/home/ganesh/Desktop/new_project_X/sample_pdfs/anurag_gupta_cv.pdf",
        "/home/ganesh/Desktop/new_project_X/sample_pdfs/Abhishek Gupta.pdf"
    ]
    
    results = []
    
    for pdf_file in test_files:
        if os.path.exists(pdf_file):
            success = test_pdf_upload_and_validation(pdf_file)
            results.append((os.path.basename(pdf_file), success))
        else:
            print(f"⚠️ File not found: {pdf_file}")
            results.append((os.path.basename(pdf_file), False))
    
    # Summary
    print("\n" + "=" * 60)
    print("🎯 CRITICAL FIX TEST RESULTS")
    print("=" * 60)
    
    total_tests = len(results)
    successful = sum(1 for _, success in results if success)
    failed = total_tests - successful
    
    print(f"📊 Total Tests: {total_tests}")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Success Rate: {successful/total_tests*100:.1f}%")
    
    print(f"\n📋 Individual Results:")
    for filename, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {filename}: {status}")
    
    if failed == 0:
        print(f"\n🎉 CRITICAL FIX SUCCESSFUL!")
        print(f"✅ All PDFs now save correctly to S3 with readable content!")
        print(f"✅ Enhanced PDF processor is working as expected!")
    else:
        print(f"\n⚠️ CRITICAL FIX PARTIALLY SUCCESSFUL")
        print(f"❌ {failed} PDFs still have issues")
        print(f"🔍 Further investigation needed")

if __name__ == "__main__":
    main()

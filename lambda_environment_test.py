#!/usr/bin/env python3
"""
LAMBDA ENVIRONMENT SIMULATION TEST
==================================

Since local nuclear reconstruction works 100%, but Lambda fails,
let's simulate the exact Lambda environment conditions to find
where the corruption actually occurs.
"""

import os
import json
import base64
import logging
from io import BytesIO
import PyPDF2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def nuclear_reconstruction_proven(body_string):
    """PROVEN method - works 100% locally"""
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

def simulate_lambda_multipart_parsing(pdf_path):
    """
    Simulate the EXACT multipart parsing that happens in Lambda
    This might reveal where the corruption actually occurs
    """
    print(f"\n🔬 LAMBDA ENVIRONMENT SIMULATION: {os.path.basename(pdf_path)}")
    
    # Step 1: Load original PDF
    with open(pdf_path, 'rb') as f:
        original_bytes = f.read()
    
    print(f"📄 Original PDF: {len(original_bytes)} bytes")
    
    # Step 2: Simulate API Gateway base64 encoding (if isBase64Encoded=true)
    print("\n🌐 Simulating API Gateway base64 encoding...")
    base64_encoded = base64.b64encode(original_bytes).decode('utf-8')
    print(f"   Base64 length: {len(base64_encoded)} characters")
    
    # Step 3: Simulate Lambda receiving base64 and decoding
    print("\n🔄 Simulating Lambda base64 decoding...")
    try:
        decoded_bytes = base64.b64decode(base64_encoded)
        print(f"   Decoded length: {len(decoded_bytes)} bytes")
        print(f"   Matches original: {decoded_bytes == original_bytes}")
        
        if decoded_bytes != original_bytes:
            print("❌ BASE64 DECODE CORRUPTION DETECTED!")
            return False
            
    except Exception as e:
        print(f"❌ Base64 decode failed: {e}")
        return False
    
    # Step 4: Simulate multipart boundary parsing
    print("\n📦 Simulating multipart boundary parsing...")
    
    # Create a realistic multipart body like API Gateway sends
    boundary = "----formdata-boundary-123456789"
    multipart_body = f"""------formdata-boundary-123456789\r
Content-Disposition: form-data; name="pdf_file"; filename="test.pdf"\r
Content-Type: application/pdf\r
\r
{original_bytes.decode('latin-1', errors='replace')}\r
------formdata-boundary-123456789\r
Content-Disposition: form-data; name="job_description_id"\r
\r
test-job-id\r
------formdata-boundary-123456789--\r
"""
    
    print(f"   Multipart body length: {len(multipart_body)} characters")
    
    # Step 5: Simulate finding PDF content in multipart
    print("\n🔍 Simulating PDF extraction from multipart...")
    
    # Find PDF content between boundaries (simplified)
    pdf_start = multipart_body.find('\r\n\r\n') + 4  # After headers
    pdf_end = multipart_body.find('\r\n------formdata-boundary', pdf_start)
    
    if pdf_start < 4 or pdf_end == -1:
        print("❌ Failed to find PDF content in multipart!")
        return False
    
    extracted_pdf_string = multipart_body[pdf_start:pdf_end]
    print(f"   Extracted PDF string: {len(extracted_pdf_string)} characters")
    
    # Step 6: Apply nuclear reconstruction
    print("\n🔥 Applying nuclear reconstruction...")
    reconstructed_bytes = nuclear_reconstruction_proven(extracted_pdf_string)
    print(f"   Reconstructed: {len(reconstructed_bytes)} bytes")
    
    # Step 7: Test final result
    preservation = (len(reconstructed_bytes) / len(original_bytes)) * 100
    print(f"   Size preservation: {preservation:.1f}%")
    
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
        print(f"   Extracted text: {text_len} characters")
        
        success = preservation >= 95.0 and text_len > 50
        print(f"   Status: {'✅ SUCCESS' if success else '❌ FAILED'}")
        
        return success
        
    except Exception as e:
        print(f"❌ PDF readability test failed: {e}")
        return False

def test_lambda_environment_issues():
    """Test various Lambda environment scenarios"""
    samples_dir = "/home/ganesh/Desktop/new_project_X/tests/samples/sample_pdfs"
    test_pdfs = ["Abhishek Gupta.pdf", "vikas_sir.pdf"]
    
    print("🚀 LAMBDA ENVIRONMENT ISSUE INVESTIGATION")
    print("="*60)
    
    results = []
    
    for pdf_name in test_pdfs:
        pdf_path = os.path.join(samples_dir, pdf_name)
        if os.path.exists(pdf_path):
            success = simulate_lambda_multipart_parsing(pdf_path)
            results.append((pdf_name, success))
    
    print(f"\n{'='*60}")
    print("📊 LAMBDA SIMULATION RESULTS")
    print(f"{'='*60}")
    
    for pdf_name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {pdf_name}")
    
    successful = sum(1 for _, success in results if success)
    total = len(results)
    print(f"\nSuccess rate: {successful}/{total} ({successful/total*100:.1f}%)")

if __name__ == "__main__":
    test_lambda_environment_issues()

#!/usr/bin/env python3
"""
Test to understand how API Gateway sends multipart data
"""

import base64
import json

def simulate_api_gateway_multipart():
    """Simulate how API Gateway might send the multipart data"""
    
    # Read the actual PDF
    with open("Ganesh Agrahari.pdf", "rb") as f:
        pdf_bytes = f.read()
    
    print(f"Original PDF: {len(pdf_bytes)} bytes")
    print(f"PDF header: {pdf_bytes[:20]}")
    
    # Create a simple multipart form
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    # Build multipart body
    multipart_body = f"""------WebKitFormBoundary7MA4YWxkTrZu0gW\r
Content-Disposition: form-data; name="resume"; filename="ganesh.pdf"\r
Content-Type: application/pdf\r
\r
""".encode() + pdf_bytes + f"""\r
------WebKitFormBoundary7MA4YWxkTrZu0gW\r
Content-Disposition: form-data; name="job_description_id"\r
\r
69e7c813-326c-4e2a-a4a3-87077c8c9186\r
------WebKitFormBoundary7MA4YWxkTrZu0gW--\r
""".encode()

    print(f"\nMultipart body: {len(multipart_body)} bytes")
    print(f"Multipart header: {multipart_body[:200]}")
    
    # Test different API Gateway scenarios
    
    # Scenario 1: API Gateway sends as base64
    print("\n" + "="*60)
    print("SCENARIO 1: API Gateway base64 encoding")
    print("="*60)
    
    base64_body = base64.b64encode(multipart_body).decode('ascii')
    print(f"Base64 encoded: {len(base64_body)} chars")
    
    # Decode it back
    decoded = base64.b64decode(base64_body)
    print(f"Decoded back: {len(decoded)} bytes")
    print(f"Matches original: {decoded == multipart_body}")
    
    # Scenario 2: API Gateway sends as string (problematic)
    print("\n" + "="*60)
    print("SCENARIO 2: API Gateway string encoding (PROBLEMATIC)")
    print("="*60)
    
    try:
        # This is what happens when API Gateway tries to send binary as string
        string_body = multipart_body.decode('utf-8')
        print("❌ This should fail for binary PDF data")
    except UnicodeDecodeError as e:
        print(f"✅ CONFIRMED: UTF-8 decoding fails: {e}")
        
        # Try latin-1 (what our fix attempts)
        try:
            string_body = multipart_body.decode('latin-1')
            print(f"✅ Latin-1 decoding works: {len(string_body)} chars")
            
            # Encode back
            recovered = string_body.encode('latin-1')
            print(f"✅ Latin-1 encoding back: {len(recovered)} bytes")
            print(f"✅ Data preserved: {recovered == multipart_body}")
            
        except Exception as e2:
            print(f"❌ Latin-1 also fails: {e2}")

if __name__ == "__main__":
    simulate_api_gateway_multipart()

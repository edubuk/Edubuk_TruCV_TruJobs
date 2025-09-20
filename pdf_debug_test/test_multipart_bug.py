#!/usr/bin/env python3
"""
Test to reproduce the multipart parsing bug
"""

def test_encoding_bug():
    """Test the encoding issue that corrupts PDF data"""
    
    # Read the actual PDF file
    with open("Ganesh Agrahari.pdf", "rb") as f:
        original_pdf_bytes = f.read()
    
    print(f"Original PDF size: {len(original_pdf_bytes)} bytes")
    print(f"Original PDF header: {original_pdf_bytes[:20]}")
    
    # Simulate what happens in Lambda when isBase64Encoded=False
    try:
        # This is what line 107 does - convert bytes to string then back to bytes
        pdf_as_string = original_pdf_bytes.decode('utf-8')  # This will fail!
        corrupted_bytes = pdf_as_string.encode('utf-8')
        print("❌ This should not work for binary PDF data")
    except UnicodeDecodeError as e:
        print(f"✅ CONFIRMED: UTF-8 decoding fails for binary PDF: {e}")
        print("This proves the bug in line 107 of input_parser.py")
    
    # Test what happens if we treat body as already bytes (the fix)
    print(f"\n🔧 TESTING THE FIX:")
    
    # Simulate receiving PDF data as string (from API Gateway)
    import base64
    pdf_as_base64 = base64.b64encode(original_pdf_bytes).decode('ascii')
    
    # Correct handling (the fix)
    decoded_bytes = base64.b64decode(pdf_as_base64)
    print(f"Fixed PDF size: {len(decoded_bytes)} bytes")
    print(f"Fixed PDF header: {decoded_bytes[:20]}")
    print(f"Bytes match original: {decoded_bytes == original_pdf_bytes}")

if __name__ == "__main__":
    test_encoding_bug()

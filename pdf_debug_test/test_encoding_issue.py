#!/usr/bin/env python3
"""
Test to identify the exact encoding issue causing PDF corruption
"""

import base64
import PyPDF2
from io import BytesIO

def test_encoding_scenarios():
    """Test different encoding scenarios to find the corruption source"""
    
    print("🔍 TESTING ENCODING SCENARIOS FOR PDF CORRUPTION")
    print("="*60)
    
    # Read the original PDF
    with open("Ganesh Agrahari.pdf", "rb") as f:
        original_pdf_bytes = f.read()
    
    print(f"📁 Original PDF: {len(original_pdf_bytes)} bytes")
    print(f"📄 Original header: {original_pdf_bytes[:20]}")
    
    # Test extraction from original
    original_text = extract_text_with_pypdf2(original_pdf_bytes)
    print(f"📝 Original extraction: {len(original_text)} characters")
    if original_text:
        print(f"📝 Original sample: {original_text[:100]}...")
    
    # Create multipart body (simulating API Gateway)
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    multipart_body = create_multipart_body(original_pdf_bytes, boundary)
    
    print(f"\n📦 Multipart body: {len(multipart_body)} bytes")
    
    # Test scenarios
    scenarios = [
        ("1. Direct multipart (baseline)", multipart_body),
        ("2. Latin-1 round-trip", test_latin1_roundtrip(multipart_body)),
        ("3. Unicode cleaning", test_unicode_cleaning(multipart_body)),
        ("4. Base64 round-trip", test_base64_roundtrip(multipart_body)),
    ]
    
    for name, processed_body in scenarios:
        print(f"\n" + "="*50)
        print(f"🧪 {name}")
        print("="*50)
        
        if processed_body is None:
            print("❌ Processing failed")
            continue
            
        try:
            # Extract PDF from processed multipart
            pdf_bytes = extract_pdf_from_multipart(processed_body, boundary)
            
            if pdf_bytes:
                print(f"📄 Extracted PDF: {len(pdf_bytes)} bytes")
                print(f"📄 Header: {pdf_bytes[:20]}")
                print(f"📄 Matches original size: {len(pdf_bytes) == len(original_pdf_bytes)}")
                print(f"📄 Bytes identical: {pdf_bytes == original_pdf_bytes}")
                
                # Test text extraction
                text = extract_text_with_pypdf2(pdf_bytes)
                print(f"📝 Extracted text: {len(text)} characters")
                
                if text and len(text) > 100:
                    print(f"📝 Sample: {text[:100]}...")
                    
                    # Check for expected content
                    has_name = "Ganesh Agrahari" in text
                    has_skills = any(skill in text for skill in ["Web development", "Data analysis", "QTechSolutions"])
                    
                    print(f"🔍 Contains name: {has_name}")
                    print(f"🔍 Contains expected skills/company: {has_skills}")
                    
                    if has_name and has_skills:
                        print("✅ SUCCESS: Correct content extracted!")
                    else:
                        print("⚠️ PARTIAL: Some content missing")
                else:
                    print("❌ FAILED: No meaningful text extracted")
            else:
                print("❌ FAILED: Could not extract PDF from multipart")
                
        except Exception as e:
            print(f"❌ ERROR: {e}")

def create_multipart_body(pdf_bytes, boundary):
    """Create multipart body like API Gateway"""
    return f"""------{boundary}\r
Content-Disposition: form-data; name="pdf_file"; filename="ganesh.pdf"\r
Content-Type: application/pdf\r
\r
""".encode() + pdf_bytes + f"""\r
------{boundary}\r
Content-Disposition: form-data; name="job_description_id"\r
\r
test-id\r
------{boundary}--\r
""".encode()

def test_latin1_roundtrip(multipart_bytes):
    """Test Latin-1 decode/encode (current Lambda approach)"""
    try:
        # Decode as Latin-1
        string_data = multipart_bytes.decode('latin-1')
        print(f"  Latin-1 decode: {len(string_data)} chars")
        
        # Encode back
        result = string_data.encode('latin-1')
        print(f"  Latin-1 encode: {len(result)} bytes")
        return result
    except Exception as e:
        print(f"  Latin-1 failed: {e}")
        return None

def test_unicode_cleaning(multipart_bytes):
    """Test Unicode cleaning (current Lambda fallback)"""
    try:
        # Try to decode as Latin-1 first
        try:
            string_data = multipart_bytes.decode('latin-1')
            return string_data.encode('latin-1')
        except:
            pass
        
        # If that fails, try our Unicode cleaning approach
        string_data = multipart_bytes.decode('utf-8', errors='ignore')
        print(f"  UTF-8 decode (with errors='ignore'): {len(string_data)} chars")
        
        # Clean Unicode characters > 255
        cleaned = ""
        for char in string_data:
            if ord(char) <= 255:
                cleaned += char
            else:
                # Convert to UTF-8 bytes then back to chars
                try:
                    char_bytes = char.encode('utf-8')
                    for byte_val in char_bytes:
                        cleaned += chr(byte_val)
                except:
                    cleaned += '?'
        
        result = cleaned.encode('latin-1')
        print(f"  Cleaned and encoded: {len(result)} bytes")
        return result
    except Exception as e:
        print(f"  Unicode cleaning failed: {e}")
        return None

def test_base64_roundtrip(multipart_bytes):
    """Test Base64 encode/decode"""
    try:
        # Encode to base64
        b64_string = base64.b64encode(multipart_bytes).decode('ascii')
        print(f"  Base64 encode: {len(b64_string)} chars")
        
        # Decode back
        result = base64.b64decode(b64_string)
        print(f"  Base64 decode: {len(result)} bytes")
        return result
    except Exception as e:
        print(f"  Base64 failed: {e}")
        return None

def extract_pdf_from_multipart(body_bytes, boundary):
    """Extract PDF bytes from multipart body"""
    try:
        boundary_bytes = f'--{boundary}'.encode()
        parts = body_bytes.split(boundary_bytes)
        
        for part in parts:
            if b'Content-Disposition: form-data' in part and b'filename=' in part:
                # Find content after headers
                header_end = part.find(b'\r\n\r\n')
                if header_end == -1:
                    header_end = part.find(b'\n\n')
                if header_end == -1:
                    continue
                
                content_start = header_end + (4 if b'\r\n\r\n' in part else 2)
                content = part[content_start:]
                
                # Clean trailing markers
                for suffix in [b'--\r\n', b'--\n', b'\r\n', b'\n']:
                    if content.endswith(suffix):
                        content = content[:-len(suffix)]
                        break
                
                if content.startswith(b'%PDF'):
                    return content
        
        return None
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return None

def extract_text_with_pypdf2(pdf_bytes):
    """Extract text using PyPDF2"""
    try:
        reader = PyPDF2.PdfReader(BytesIO(pdf_bytes), strict=False)
        text_parts = []
        
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        
        return '\n'.join(text_parts)
    except Exception as e:
        print(f"PyPDF2 extraction error: {e}")
        return ""

if __name__ == "__main__":
    test_encoding_scenarios()

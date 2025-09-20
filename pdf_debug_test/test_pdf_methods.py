#!/usr/bin/env python3
"""
Local testing environment for PDF processing methods
Test multiple PDFs to find the best encoding/processing approach
"""

import os
import sys
import json
import base64
from io import BytesIO
import PyPDF2
from pathlib import Path

# Add parent directory to import Lambda modules
sys.path.append('/home/ganesh/Desktop/new_project_X/new_resume_logic')

def create_multipart_body(pdf_bytes, boundary="----WebKitFormBoundary7MA4YWxkTrZu0gW"):
    """Create multipart body like API Gateway"""
    return f"""------{boundary}\r
Content-Disposition: form-data; name="pdf_file"; filename="test.pdf"\r
Content-Type: application/pdf\r
\r
""".encode() + pdf_bytes + f"""\r
------{boundary}\r
Content-Disposition: form-data; name="job_description_id"\r
\r
test-job-id\r
------{boundary}--\r
""".encode()

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
        
        for page_num, page in enumerate(reader.pages, 1):
            try:
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text_parts.append(page_text)
                    print(f"    Page {page_num}: {len(page_text)} chars")
                else:
                    print(f"    Page {page_num}: no text")
            except Exception as e:
                print(f"    Page {page_num}: error - {e}")
        
        return '\n'.join(text_parts)
    except Exception as e:
        print(f"    PyPDF2 error: {e}")
        return ""

def method_1_simple_latin1(multipart_string):
    """Method 1: Simple latin-1 encoding"""
    try:
        return multipart_string.encode('latin-1')
    except UnicodeEncodeError as e:
        print(f"    Method 1 failed: {e}")
        return None

def method_2_nuclear_reconstruction(multipart_string):
    """Method 2: Nuclear byte-by-byte reconstruction"""
    try:
        reconstructed_bytes = bytearray()
        
        for i, char in enumerate(multipart_string):
            char_code = ord(char)
            
            if char_code <= 255:
                reconstructed_bytes.append(char_code)
            elif 0xDC80 <= char_code <= 0xDCFF:
                # Surrogate escape - convert back to original byte
                original_byte = char_code - 0xDC00
                reconstructed_bytes.append(original_byte)
            elif char_code == 0xFFFD:
                # Replacement character - guess original
                reconstructed_bytes.append(0xFF)
            else:
                # High Unicode - use lower 8 bits
                reconstructed_bytes.append(char_code & 0xFF)
        
        return bytes(reconstructed_bytes)
    except Exception as e:
        print(f"    Method 2 failed: {e}")
        return None

def method_3_surrogate_escape(multipart_string):
    """Method 3: Surrogate escape handling"""
    try:
        # Try surrogate escape decoding
        body_bytes = multipart_string.encode('utf-8', 'surrogateescape')
        clean_string = body_bytes.decode('latin1', 'ignore')
        return clean_string.encode('latin1')
    except Exception as e:
        print(f"    Method 3 failed: {e}")
        return None

def method_4_utf8_ignore(multipart_string):
    """Method 4: UTF-8 with ignore errors"""
    try:
        return multipart_string.encode('utf-8', 'ignore')
    except Exception as e:
        print(f"    Method 4 failed: {e}")
        return None

def method_5_manual_cleaning(multipart_string):
    """Method 5: Manual character cleaning"""
    try:
        cleaned_body = ""
        for char in multipart_string:
            char_code = ord(char)
            if char_code <= 255:
                cleaned_body += char
            elif 0xDC80 <= char_code <= 0xDCFF:
                # Surrogate escape
                cleaned_body += chr(char_code - 0xDC00)
            else:
                # Try to preserve as UTF-8 bytes
                try:
                    char_bytes = char.encode('utf-8')
                    for byte_val in char_bytes:
                        if byte_val <= 255:
                            cleaned_body += chr(byte_val)
                except:
                    pass  # Skip problematic character
        
        return cleaned_body.encode('latin1')
    except Exception as e:
        print(f"    Method 5 failed: {e}")
        return None

def test_pdf_file(pdf_path):
    """Test a single PDF file with all methods"""
    print(f"\n{'='*60}")
    print(f"🧪 TESTING: {pdf_path}")
    print(f"{'='*60}")
    
    # Read original PDF
    with open(pdf_path, "rb") as f:
        original_pdf_bytes = f.read()
    
    print(f"📁 Original PDF: {len(original_pdf_bytes)} bytes")
    
    # Test original extraction
    original_text = extract_text_with_pypdf2(original_pdf_bytes)
    print(f"📝 Original text: {len(original_text)} chars")
    if original_text:
        sample = original_text[:100].replace('\n', ' ')
        print(f"📝 Sample: {repr(sample)}")
    
    # Create multipart body and simulate API Gateway string conversion
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    multipart_body = create_multipart_body(original_pdf_bytes, boundary)
    
    # Simulate API Gateway's string conversion (this is where corruption happens)
    try:
        # This simulates what API Gateway does - converts bytes to string
        multipart_string = multipart_body.decode('latin-1')
        print(f"📦 Multipart string: {len(multipart_string)} chars")
    except Exception as e:
        print(f"❌ Failed to create multipart string: {e}")
        return
    
    # Test all methods
    methods = [
        ("Method 1: Simple latin-1", method_1_simple_latin1),
        ("Method 2: Nuclear reconstruction", method_2_nuclear_reconstruction),
        ("Method 3: Surrogate escape", method_3_surrogate_escape),
        ("Method 4: UTF-8 ignore", method_4_utf8_ignore),
        ("Method 5: Manual cleaning", method_5_manual_cleaning),
    ]
    
    results = {}
    
    for method_name, method_func in methods:
        print(f"\n🔧 {method_name}")
        print("-" * 40)
        
        # Apply method
        processed_body = method_func(multipart_string)
        
        if processed_body is None:
            print("    ❌ Method failed")
            results[method_name] = {"status": "failed"}
            continue
        
        # Extract PDF from processed multipart
        pdf_bytes = extract_pdf_from_multipart(processed_body, boundary)
        
        if pdf_bytes is None:
            print("    ❌ Could not extract PDF")
            results[method_name] = {"status": "no_pdf"}
            continue
        
        print(f"    📄 Extracted PDF: {len(pdf_bytes)} bytes")
        print(f"    📄 Header: {pdf_bytes[:20]}")
        print(f"    📄 Size match: {len(pdf_bytes) == len(original_pdf_bytes)}")
        print(f"    📄 Bytes identical: {pdf_bytes == original_pdf_bytes}")
        
        # Test text extraction
        extracted_text = extract_text_with_pypdf2(pdf_bytes)
        print(f"    📝 Extracted text: {len(extracted_text)} chars")
        
        if extracted_text:
            sample = extracted_text[:100].replace('\n', ' ')
            print(f"    📝 Sample: {repr(sample)}")
            
            # Compare with original
            text_match = extracted_text == original_text
            print(f"    📝 Text matches original: {text_match}")
            
            results[method_name] = {
                "status": "success",
                "pdf_size": len(pdf_bytes),
                "text_length": len(extracted_text),
                "text_matches": text_match,
                "bytes_identical": pdf_bytes == original_pdf_bytes
            }
            
            if text_match:
                print("    ✅ PERFECT MATCH!")
            else:
                print("    ⚠️ Text differs from original")
        else:
            print("    ❌ No text extracted")
            results[method_name] = {
                "status": "no_text",
                "pdf_size": len(pdf_bytes),
                "bytes_identical": pdf_bytes == original_pdf_bytes
            }
    
    return results

def run_comprehensive_test(pdf_directory):
    """Run tests on all PDFs in directory"""
    pdf_dir = Path(pdf_directory)
    pdf_files = list(pdf_dir.glob("*.pdf"))
    
    if not pdf_files:
        print(f"❌ No PDF files found in {pdf_directory}")
        return
    
    print(f"🎯 COMPREHENSIVE PDF PROCESSING TEST")
    print(f"📁 Testing {len(pdf_files)} PDFs from {pdf_directory}")
    
    all_results = {}
    
    for pdf_file in pdf_files:
        try:
            results = test_pdf_file(pdf_file)
            all_results[pdf_file.name] = results
        except Exception as e:
            print(f"❌ Error testing {pdf_file}: {e}")
            all_results[pdf_file.name] = {"error": str(e)}
    
    # Summary
    print(f"\n{'='*60}")
    print(f"📊 SUMMARY RESULTS")
    print(f"{'='*60}")
    
    method_scores = {}
    for pdf_name, pdf_results in all_results.items():
        print(f"\n📄 {pdf_name}:")
        if "error" in pdf_results:
            print(f"    ❌ Error: {pdf_results['error']}")
            continue
            
        for method, result in pdf_results.items():
            if method not in method_scores:
                method_scores[method] = {"success": 0, "total": 0}
            
            method_scores[method]["total"] += 1
            
            if result.get("status") == "success" and result.get("text_matches"):
                print(f"    ✅ {method}: PERFECT")
                method_scores[method]["success"] += 1
            elif result.get("status") == "success":
                print(f"    ⚠️ {method}: Text extracted but differs")
            else:
                print(f"    ❌ {method}: {result.get('status', 'failed')}")
    
    # Final ranking
    print(f"\n🏆 METHOD RANKING:")
    print("-" * 40)
    
    for method, scores in sorted(method_scores.items(), key=lambda x: x[1]["success"], reverse=True):
        success_rate = scores["success"] / scores["total"] * 100 if scores["total"] > 0 else 0
        print(f"{method}: {scores['success']}/{scores['total']} ({success_rate:.1f}%)")
    
    return all_results

if __name__ == "__main__":
    print("🧪 PDF PROCESSING METHOD TESTER")
    print("=" * 60)
    print("This tool tests different encoding methods to find the best approach")
    print("for handling API Gateway's multipart encoding corruption.")
    print()
    
    # Test current directory automatically
    test_dir = "."
    print(f"🎯 Testing PDFs in current directory: {os.getcwd()}")
    
    run_comprehensive_test(test_dir)

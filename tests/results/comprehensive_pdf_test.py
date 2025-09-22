#!/usr/bin/env python3

import PyPDF2
import pdfplumber
import os

def test_pdf_readability(filename):
    """Comprehensive PDF readability test"""
    print(f"\n{'='*60}")
    print(f"TESTING: {filename}")
    print(f"{'='*60}")
    
    if not os.path.exists(filename):
        print(f"❌ File not found: {filename}")
        return
    
    file_size = os.path.getsize(filename)
    print(f"📁 File size: {file_size} bytes")
    
    # Test 1: Basic file properties
    try:
        result = os.popen(f'file "{filename}"').read().strip()
        print(f"🔍 File type: {result}")
    except:
        print("❌ Could not determine file type")
    
    # Test 2: PyPDF2 Test
    print(f"\n📖 PyPDF2 Test:")
    try:
        with open(filename, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            pages = len(reader.pages)
            print(f"  ✅ Pages: {pages}")
            
            total_text = ""
            for i, page in enumerate(reader.pages):
                try:
                    text = page.extract_text()
                    total_text += text
                    print(f"  📄 Page {i+1}: {len(text)} chars")
                    if text.strip():
                        print(f"    Sample: {repr(text[:100])}")
                    else:
                        print(f"    ❌ NO TEXT EXTRACTED")
                except Exception as e:
                    print(f"    ❌ Page {i+1} error: {e}")
            
            print(f"  📊 Total text: {len(total_text)} characters")
            if len(total_text) > 0:
                print(f"  ✅ PyPDF2: READABLE")
            else:
                print(f"  ❌ PyPDF2: NOT READABLE (no text)")
                
    except Exception as e:
        print(f"  ❌ PyPDF2 failed: {e}")
    
    # Test 3: pdfplumber Test
    print(f"\n🔧 pdfplumber Test:")
    try:
        with pdfplumber.open(filename) as pdf:
            pages = len(pdf.pages)
            print(f"  ✅ Pages: {pages}")
            
            total_text = ""
            for i, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text()
                    if text:
                        total_text += text
                        print(f"  📄 Page {i+1}: {len(text)} chars")
                        print(f"    Sample: {repr(text[:100])}")
                    else:
                        print(f"  📄 Page {i+1}: NO TEXT")
                except Exception as e:
                    print(f"    ❌ Page {i+1} error: {e}")
            
            print(f"  📊 Total text: {len(total_text)} characters")
            if len(total_text) > 0:
                print(f"  ✅ pdfplumber: READABLE")
            else:
                print(f"  ❌ pdfplumber: NOT READABLE (no text)")
                
    except Exception as e:
        print(f"  ❌ pdfplumber failed: {e}")
    
    # Test 4: Raw binary inspection
    print(f"\n🔍 Raw Binary Test:")
    try:
        with open(filename, 'rb') as f:
            content = f.read()
            
        # Check PDF header
        if content.startswith(b'%PDF'):
            version = content[:8].decode('ascii', errors='ignore')
            print(f"  ✅ Valid PDF header: {version}")
        else:
            print(f"  ❌ Invalid PDF header: {content[:20]}")
        
        # Look for text patterns
        text_indicators = [b'/Type/Page', b'/Contents', b'stream', b'endstream']
        found_indicators = []
        for indicator in text_indicators:
            if indicator in content:
                found_indicators.append(indicator.decode('ascii', errors='ignore'))
        
        print(f"  📋 PDF structure indicators: {found_indicators}")
        
        # Check for corruption indicators
        corruption_signs = [b'incorrect', b'corrupted', b'damaged']
        corrupted = any(sign in content.lower() for sign in corruption_signs)
        if corrupted:
            print(f"  ⚠️ Corruption indicators found")
        else:
            print(f"  ✅ No obvious corruption markers")
            
    except Exception as e:
        print(f"  ❌ Raw binary test failed: {e}")

if __name__ == "__main__":
    # Test all downloaded PDFs
    test_files = [
        "ganesh_latest_test.pdf",
        "ganesh_s3_test.pdf", 
        "vikash_s3_test.pdf",
        "test_s3_download.pdf"
    ]
    
    for filename in test_files:
        test_pdf_readability(filename)
    
    print(f"\n{'='*60}")
    print("SUMMARY: PDF READABILITY TEST COMPLETE")
    print(f"{'='*60}")

#!/usr/bin/env python3
"""
Comprehensive PDF extraction testing script
Tests multiple libraries and methods to identify extraction issues
"""

import sys
import io
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def test_pypdf2_extraction(pdf_path):
    """Test PyPDF2 extraction (same method as Lambda)"""
    print("\n" + "="*60)
    print("🔍 TESTING PyPDF2 EXTRACTION")
    print("="*60)
    
    try:
        import PyPDF2
        
        with open(pdf_path, 'rb') as file:
            # Test with strict=False (same as Lambda)
            reader = PyPDF2.PdfReader(file, strict=False)
            print(f"📄 PDF Pages: {len(reader.pages)}")
            
            all_text = []
            for page_num, page in enumerate(reader.pages, 1):
                try:
                    text = page.extract_text()
                    print(f"📝 Page {page_num}: {len(text)} characters")
                    if text.strip():
                        all_text.append(text)
                        print(f"   First 100 chars: {repr(text[:100])}")
                    else:
                        print(f"   ⚠️  No text extracted from page {page_num}")
                except Exception as e:
                    print(f"   ❌ Error extracting page {page_num}: {e}")
            
            combined_text = '\n'.join(all_text)
            print(f"\n✅ PyPDF2 Total: {len(combined_text)} characters")
            return combined_text
            
    except Exception as e:
        print(f"❌ PyPDF2 failed: {e}")
        return ""

def test_pdfminer_extraction(pdf_path):
    """Test pdfminer.six extraction"""
    print("\n" + "="*60)
    print("🔍 TESTING pdfminer.six EXTRACTION")
    print("="*60)
    
    try:
        from pdfminer.high_level import extract_text
        
        text = extract_text(pdf_path)
        print(f"✅ pdfminer.six: {len(text)} characters")
        if text:
            print(f"   First 200 chars: {repr(text[:200])}")
        return text
        
    except Exception as e:
        print(f"❌ pdfminer.six failed: {e}")
        return ""

def test_pymupdf_extraction(pdf_path):
    """Test PyMuPDF extraction (additional library for comparison)"""
    print("\n" + "="*60)
    print("🔍 TESTING PyMuPDF EXTRACTION")
    print("="*60)
    
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(pdf_path)
        all_text = []
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            print(f"📝 Page {page_num + 1}: {len(text)} characters")
            if text.strip():
                all_text.append(text)
        
        combined_text = '\n'.join(all_text)
        print(f"✅ PyMuPDF Total: {len(combined_text)} characters")
        doc.close()
        return combined_text
        
    except Exception as e:
        print(f"❌ PyMuPDF failed: {e}")
        return ""

def test_lambda_style_extraction(pdf_path):
    """Test extraction exactly like Lambda function"""
    print("\n" + "="*60)
    print("🔍 TESTING LAMBDA-STYLE EXTRACTION")
    print("="*60)
    
    try:
        import PyPDF2
        
        # Read file into bytes (like Lambda)
        with open(pdf_path, 'rb') as f:
            pdf_bytes = f.read()
        
        print(f"📁 PDF file size: {len(pdf_bytes)} bytes")
        
        # Create BytesIO stream (like Lambda)
        pdf_stream = io.BytesIO(pdf_bytes)
        
        # Extract using PyPDF2 with same settings as Lambda
        reader = PyPDF2.PdfReader(pdf_stream, strict=False)
        print(f"📄 PDF Pages: {len(reader.pages)}")
        
        all_text = []
        for page_num, page in enumerate(reader.pages, 1):
            try:
                text = page.extract_text()
                if text and text.strip():
                    all_text.append(text)
                    print(f"✅ Page {page_num}: {len(text)} characters extracted")
                else:
                    print(f"⚠️  Page {page_num}: no text extracted")
            except Exception as e:
                print(f"❌ Page {page_num} error: {e}")
        
        if all_text:
            combined_text = '\n'.join(all_text)
            print(f"\n🎯 Lambda-style result: {len(combined_text)} characters")
            print(f"   Sample: {repr(combined_text[:150])}")
            return combined_text
        else:
            print(f"\n❌ Lambda-style: No text extracted from any page")
            return ""
            
    except Exception as e:
        print(f"❌ Lambda-style extraction failed: {e}")
        return ""

def analyze_pdf_structure(pdf_path):
    """Analyze PDF internal structure"""
    print("\n" + "="*60)
    print("🔍 ANALYZING PDF STRUCTURE")
    print("="*60)
    
    try:
        import PyPDF2
        
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file, strict=False)
            
            print(f"📄 Total pages: {len(reader.pages)}")
            print(f"📋 Metadata: {reader.metadata}")
            print(f"🔒 Encrypted: {reader.is_encrypted}")
            
            # Check first page details
            if len(reader.pages) > 0:
                page = reader.pages[0]
                print(f"📐 Page 0 mediabox: {page.mediabox}")
                
                # Check for text objects
                if '/Contents' in page:
                    print("✅ Page has /Contents (text streams)")
                else:
                    print("⚠️  Page missing /Contents")
                    
                # Check for fonts
                if '/Font' in page.get('/Resources', {}):
                    fonts = page['/Resources']['/Font']
                    print(f"🔤 Fonts found: {len(fonts)} fonts")
                else:
                    print("⚠️  No fonts found")
                    
    except Exception as e:
        print(f"❌ Structure analysis failed: {e}")

def main():
    """Main testing function"""
    print("🧪 PDF EXTRACTION DEBUGGING TOOL")
    print("="*60)
    
    # Check if PDF path provided
    if len(sys.argv) != 2:
        print("Usage: python pdf_extraction_test.py <path_to_pdf>")
        print("\nExample: python pdf_extraction_test.py /path/to/ganesh_resume.pdf")
        return
    
    pdf_path = sys.argv[1]
    
    # Verify file exists
    if not Path(pdf_path).exists():
        print(f"❌ File not found: {pdf_path}")
        return
    
    print(f"📁 Testing PDF: {pdf_path}")
    print(f"📊 File size: {Path(pdf_path).stat().st_size} bytes")
    
    # Run all tests
    analyze_pdf_structure(pdf_path)
    
    pypdf2_result = test_pypdf2_extraction(pdf_path)
    pdfminer_result = test_pdfminer_extraction(pdf_path)
    pymupdf_result = test_pymupdf_extraction(pdf_path)
    lambda_result = test_lambda_style_extraction(pdf_path)
    
    # Summary
    print("\n" + "="*60)
    print("📊 EXTRACTION RESULTS SUMMARY")
    print("="*60)
    print(f"PyPDF2:       {len(pypdf2_result):>6} characters")
    print(f"pdfminer.six: {len(pdfminer_result):>6} characters")
    print(f"PyMuPDF:      {len(pymupdf_result):>6} characters")
    print(f"Lambda-style: {len(lambda_result):>6} characters")
    
    # Identify the issue
    if len(lambda_result) == 0 and len(pdfminer_result) > 0:
        print("\n🎯 ISSUE IDENTIFIED: Lambda PyPDF2 method failing, but pdfminer works!")
        print("   Recommendation: Fix PyPDF2 extraction or prioritize pdfminer fallback")
    elif len(lambda_result) == 0 and len(pymupdf_result) > 0:
        print("\n🎯 ISSUE IDENTIFIED: All Python libraries failing except PyMuPDF")
        print("   Recommendation: PDF may have compatibility issues")
    elif all(len(r) > 0 for r in [pypdf2_result, pdfminer_result, lambda_result]):
        print("\n✅ ALL METHODS WORKING: Issue may be in Lambda environment or multipart parsing")
    else:
        print("\n❓ MIXED RESULTS: Need further investigation")

if __name__ == "__main__":
    main()

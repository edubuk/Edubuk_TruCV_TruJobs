#!/usr/bin/env python3
"""
Quick PDF test - just provide the path and we'll test it
"""
import PyPDF2
import io

def quick_test(pdf_path):
    print(f"Testing: {pdf_path}")
    
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f, strict=False)
            print(f"Pages: {len(reader.pages)}")
            
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                print(f"Page {i+1}: {len(text)} chars - '{text[:50]}...'")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        quick_test(sys.argv[1])
    else:
        print("Usage: python quick_test.py /path/to/pdf")

#!/usr/bin/env python3
"""
Test script to verify the Lambda layer works correctly
"""
import sys
import os

# Add the layer path to Python path (simulating Lambda environment)
sys.path.insert(0, '/home/ganesh/Desktop/new_project_X/lambda_layer_build/python')

def test_imports():
    """Test that all required packages can be imported"""
    try:
        print("Testing pdfminer.six import...")
        from pdfminer.high_level import extract_text
        print("✅ pdfminer.six imported successfully")
        
        print("Testing chardet import...")
        import chardet
        print("✅ chardet imported successfully")
        
        print("Testing cryptography import...")
        import cryptography
        print("✅ cryptography imported successfully")
        
        return True
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

def test_pdfminer_functionality():
    """Test basic pdfminer functionality"""
    try:
        from pdfminer.high_level import extract_text
        from io import BytesIO
        
        # Create a minimal PDF for testing
        test_pdf = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF"""
        
        # Test extraction
        text = extract_text(BytesIO(test_pdf))
        print(f"✅ pdfminer.six extraction test: extracted text length = {len(text)}")
        return True
        
    except Exception as e:
        print(f"❌ pdfminer functionality test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Lambda Layer Components...")
    print("=" * 50)
    
    imports_ok = test_imports()
    functionality_ok = test_pdfminer_functionality()
    
    print("=" * 50)
    if imports_ok and functionality_ok:
        print("🎉 All tests passed! Layer is ready for deployment.")
    else:
        print("❌ Some tests failed. Check the layer build.")

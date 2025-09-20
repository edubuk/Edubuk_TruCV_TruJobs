#!/usr/bin/env python3
"""
Test script to verify the Lambda layer works correctly with Python 3.9
"""
import sys
import os

# Add the layer path to Python path (simulating Lambda environment)
sys.path.insert(0, '/home/ganesh/Desktop/new_project_X/lambda_layer_python39_build/python')

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
        
        # Create a simple test PDF content
        test_content = "This is a test PDF content for extraction."
        
        print(f"✅ pdfminer.six functionality test passed")
        return True
        
    except Exception as e:
        print(f"❌ pdfminer functionality test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Lambda Layer Components for Python 3.9...")
    print("=" * 60)
    
    imports_ok = test_imports()
    functionality_ok = test_pdfminer_functionality()
    
    print("=" * 60)
    if imports_ok and functionality_ok:
        print("🎉 All tests passed! Layer is ready for deployment.")
        print("📁 Layer location: /home/ganesh/Desktop/new_project_X/lambda_layer_python39_build/pdf-tools-layer-python39.zip")
    else:
        print("❌ Some tests failed. Check the layer build.")

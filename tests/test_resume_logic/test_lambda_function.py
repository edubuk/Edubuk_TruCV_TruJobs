#!/usr/bin/env python3

import json
import uuid
import logging
import time
import io
from io import BytesIO
import os
import sys

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from test_pdf_processor import test_all_pdf_methods
from test_input_parser import parse_multipart_form_test

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger()

def test_lambda_handler(pdf_file_path, job_description_id="test-job-id"):
    """Test lambda handler that mimics the real one but for local testing"""
    start_time = time.time()
    resume_id = str(uuid.uuid4())
    
    logger.info(f"🧪 Starting test processing for: {os.path.basename(pdf_file_path)}")
    logger.info(f"📋 Resume ID: {resume_id}")
    
    try:
        # Step 1: Read the PDF file
        with open(pdf_file_path, 'rb') as f:
            pdf_content_bytes = f.read()
        
        logger.info(f"📁 File size: {len(pdf_content_bytes)} bytes")
        
        # Step 2: Create BytesIO object and attach clean bytes (mimicking multipart parsing)
        pdf_content = BytesIO(pdf_content_bytes)
        pdf_content.clean_pdf_bytes = pdf_content_bytes
        logger.info(f"✅ Attached clean_pdf_bytes attribute: {len(pdf_content_bytes)} bytes")
        
        # Step 3: Test all PDF processing methods
        logger.info("🔍 Testing all PDF processing methods...")
        text_results = test_all_pdf_methods(pdf_content_bytes, os.path.basename(pdf_file_path))
        
        # Step 4: Determine best extraction method
        best_method = None
        best_text = ""
        best_score = 0
        
        for method, result in text_results.items():
            if result['success'] and result['text_length'] > best_score:
                best_method = method
                best_text = result['text']
                best_score = result['text_length']
        
        if best_method:
            logger.info(f"🎯 Best method: {best_method} ({best_score} chars)")
        else:
            logger.warning("⚠️ No method successfully extracted text")
        
        # Step 5: Test S3 save simulation
        s3_test_result = test_s3_save_simulation(pdf_content_bytes, resume_id)
        
        # Step 6: Generate test report
        elapsed_time = time.time() - start_time
        
        test_report = {
            "resume_id": resume_id,
            "filename": os.path.basename(pdf_file_path),
            "file_size": len(pdf_content_bytes),
            "processing_time": elapsed_time,
            "extraction_methods": text_results,
            "best_method": best_method,
            "best_text_length": best_score,
            "s3_simulation": s3_test_result,
            "status": "success" if best_method else "failed"
        }
        
        logger.info(f"✅ Test completed in {elapsed_time:.2f}s")
        return test_report
        
    except Exception as e:
        logger.error(f"💥 Test failed: {str(e)}")
        return {
            "resume_id": resume_id,
            "filename": os.path.basename(pdf_file_path),
            "error": str(e),
            "status": "error"
        }

def test_s3_save_simulation(pdf_content_bytes, resume_id):
    """Simulate S3 save and test readability"""
    logger.info("🪣 Testing S3 save simulation...")
    
    try:
        # Save to local file (simulating S3)
        test_s3_path = f"/tmp/s3_sim_{resume_id}.pdf"
        
        with open(test_s3_path, 'wb') as f:
            f.write(pdf_content_bytes)
        
        # Test if saved file is readable
        saved_size = os.path.getsize(test_s3_path)
        
        # Test with PyPDF2
        try:
            import PyPDF2
            with open(test_s3_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                pages = len(reader.pages)
                
                total_text = ""
                for page in reader.pages:
                    try:
                        total_text += page.extract_text()
                    except:
                        pass
                
                readability_status = "readable" if len(total_text) > 0 else "structure_only"
                
        except Exception as e:
            readability_status = f"error: {str(e)}"
            pages = 0
        
        # Clean up
        os.remove(test_s3_path)
        
        return {
            "saved_size": saved_size,
            "original_size": len(pdf_content_bytes),
            "size_match": saved_size == len(pdf_content_bytes),
            "pages": pages,
            "readability": readability_status,
            "status": "success"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    # Test with a sample PDF
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
        if os.path.exists(pdf_path):
            result = test_lambda_handler(pdf_path)
            print(json.dumps(result, indent=2))
        else:
            print(f"Error: File not found: {pdf_path}")
    else:
        print("Usage: python test_lambda_function.py <pdf_file_path>")

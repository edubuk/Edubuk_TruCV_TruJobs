#!/usr/bin/env python3
"""
Test the complete Lambda pipeline locally to identify where corruption occurs
"""

import sys
import os
import json
import base64
from io import BytesIO

# Add the parent directory to path to import Lambda modules
sys.path.append('/home/ganesh/Desktop/new_project_X/new_resume_logic')

# Import Lambda functions
from pdf_processor import extract_text_from_pdf
from ai_services import get_metadata_from_bedrock

def test_pdf_processing_pipeline():
    """Test the complete PDF processing pipeline"""
    
    print("🧪 TESTING COMPLETE PDF PROCESSING PIPELINE")
    print("="*60)
    
    # Step 1: Read the original PDF
    with open("Ganesh Agrahari.pdf", "rb") as f:
        original_pdf_bytes = f.read()
    
    print(f"📁 Original PDF: {len(original_pdf_bytes)} bytes")
    print(f"📄 PDF header: {original_pdf_bytes[:20]}")
    
    # Step 2: Simulate multipart encoding (what API Gateway does)
    print(f"\n🔄 SIMULATING API GATEWAY MULTIPART ENCODING")
    
    # Create multipart body like API Gateway
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    multipart_body = f"""------WebKitFormBoundary7MA4YWxkTrZu0gW\r
Content-Disposition: form-data; name="pdf_file"; filename="ganesh.pdf"\r
Content-Type: application/pdf\r
\r
""".encode() + original_pdf_bytes + f"""\r
------WebKitFormBoundary7MA4YWxkTrZu0gW\r
Content-Disposition: form-data; name="job_description_id"\r
\r
69e7c813-326c-4e2a-a4a3-87077c8c9186\r
------WebKitFormBoundary7MA4YWxkTrZu0gW--\r
""".encode()

    print(f"📦 Multipart body: {len(multipart_body)} bytes")
    
    # Step 3: Test different encoding scenarios
    scenarios = [
        ("Direct bytes", multipart_body),
        ("Latin-1 decode/encode", None),
        ("UTF-8 decode/encode (will fail)", None),
        ("Base64 encode/decode", base64.b64encode(multipart_body))
    ]
    
    for scenario_name, data in scenarios:
        print(f"\n" + "="*50)
        print(f"🧪 TESTING: {scenario_name}")
        print("="*50)
        
        try:
            if scenario_name == "Latin-1 decode/encode":
                # Simulate what our Lambda fix does
                string_data = multipart_body.decode('latin-1')
                print(f"✅ Decoded to string: {len(string_data)} chars")
                
                # Apply our Unicode cleaning
                cleaned_data = ""
                for char in string_data:
                    if ord(char) <= 255:
                        cleaned_data += char
                    else:
                        # Convert Unicode to bytes
                        try:
                            char_bytes = char.encode('utf-8')
                            for byte_val in char_bytes:
                                cleaned_data += chr(byte_val)
                        except:
                            cleaned_data += '?'
                
                data = cleaned_data.encode('latin-1')
                print(f"✅ Cleaned and re-encoded: {len(data)} bytes")
                
            elif scenario_name == "UTF-8 decode/encode (will fail)":
                try:
                    string_data = multipart_body.decode('utf-8')
                    data = string_data.encode('utf-8')
                except UnicodeDecodeError as e:
                    print(f"❌ UTF-8 decoding failed as expected: {e}")
                    continue
                    
            elif scenario_name == "Base64 encode/decode":
                # data is already base64 encoded
                data = base64.b64decode(data)
                print(f"✅ Base64 decoded: {len(data)} bytes")
            
            # Extract PDF from multipart data
            pdf_bytes = extract_pdf_from_multipart(data, boundary)
            if pdf_bytes:
                print(f"📄 Extracted PDF: {len(pdf_bytes)} bytes")
                print(f"📄 PDF header: {pdf_bytes[:20]}")
                
                # Test text extraction
                text = extract_text_from_pdf(pdf_bytes)
                print(f"📝 Extracted text: {len(text)} characters")
                
                if text:
                    print(f"📝 Text sample: {text[:200]}...")
                    
                    # Test if we can find expected content
                    expected_skills = ["Web development", "Data analysis", "Artificial Intelligence"]
                    expected_company = "QTechSolutions"
                    
                    found_skills = sum(1 for skill in expected_skills if skill in text)
                    found_company = expected_company in text
                    
                    print(f"🔍 Found {found_skills}/{len(expected_skills)} expected skills")
                    print(f"🔍 Found company '{expected_company}': {found_company}")
                    
                    if found_skills > 0 or found_company:
                        print(f"✅ {scenario_name}: EXTRACTION SUCCESSFUL!")
                    else:
                        print(f"❌ {scenario_name}: Wrong content extracted")
                else:
                    print(f"❌ {scenario_name}: No text extracted")
            else:
                print(f"❌ {scenario_name}: Failed to extract PDF from multipart")
                
        except Exception as e:
            print(f"❌ {scenario_name}: Failed with error: {e}")

def extract_pdf_from_multipart(body_bytes, boundary):
    """Extract PDF bytes from multipart body"""
    try:
        boundary_bytes = f'--{boundary}'.encode()
        parts = body_bytes.split(boundary_bytes)
        
        for part in parts:
            if b'Content-Disposition: form-data' in part and b'filename=' in part:
                # Find the content after headers
                header_end = part.find(b'\r\n\r\n')
                if header_end == -1:
                    header_end = part.find(b'\n\n')
                if header_end == -1:
                    continue
                
                content_start = header_end + (4 if b'\r\n\r\n' in part else 2)
                content = part[content_start:]
                
                # Clean up trailing boundary markers
                if content.endswith(b'--\r\n'):
                    content = content[:-4]
                elif content.endswith(b'--\n'):
                    content = content[:-3]
                elif content.endswith(b'\r\n'):
                    content = content[:-2]
                elif content.endswith(b'\n'):
                    content = content[:-1]
                
                if content.startswith(b'%PDF'):
                    return content
        
        return None
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return None

def test_ai_extraction():
    """Test AI extraction with known good text"""
    print(f"\n🤖 TESTING AI EXTRACTION WITH CORRECT TEXT")
    print("="*60)
    
    # Use the text we know should be extracted
    correct_text = """
    Ganesh Agrahari
    9044232872
    ganeshagrahari108@gmail.com
    LinkedIn
    Github
    by Edubuk: Click to view verifiable CV
    
    Education
    BBD University
    BCA DS&AI
    
    Skills
    Web development
    Data analysis
    Artificial Intelligence
    Machine Learning
    Version Control
    
    Experience
    QTechSolutions
    AI/GenAi Intern
    1 Mar 2025 - 1 Aug 2025
    • Working on a real-world healthcare site to develop and integrate an AI-
    powered chatbot for doctor consultations, medicine delivery, and
    prescription recommendations
    • Implementing NLP and machine learning techniques to enhance chatbot
    accuracy, ensuring seamless and efficient user interactions in a scalable AI-driven
    system
    • Leveraging Retrieval-Augmented Generation (RAG) to provide dynamic,
    context-aware responses by combining LLM capabilities with real-time retrieval
    from healthcare databases
    """
    
    print(f"📝 Input text length: {len(correct_text)} characters")
    print(f"📝 Text sample: {correct_text[:200]}...")
    
    try:
        # Test metadata extraction (this will call Bedrock)
        print(f"\n🔄 Calling Bedrock for metadata extraction...")
        metadata = get_metadata_from_bedrock(correct_text)
        
        print(f"\n📊 EXTRACTED METADATA:")
        print(json.dumps(metadata, indent=2))
        
        # Verify extraction quality
        expected_skills = ["Web development", "Data analysis", "Artificial Intelligence", "Machine Learning"]
        extracted_skills = metadata.get('skills', [])
        
        print(f"\n🔍 VALIDATION:")
        print(f"Expected skills: {expected_skills}")
        print(f"Extracted skills: {extracted_skills}")
        
        skill_matches = sum(1 for skill in expected_skills if any(skill.lower() in str(ext_skill).lower() for ext_skill in extracted_skills))
        print(f"Skill match rate: {skill_matches}/{len(expected_skills)} ({skill_matches/len(expected_skills)*100:.1f}%)")
        
        # Check work experience
        work_exp = metadata.get('work_experience', [])
        if work_exp and len(work_exp) > 0:
            exp = work_exp[0]
            print(f"Work experience extracted: {exp}")
        else:
            print(f"❌ No work experience extracted")
            
    except Exception as e:
        print(f"❌ AI extraction failed: {e}")

if __name__ == "__main__":
    test_pdf_processing_pipeline()
    test_ai_extraction()

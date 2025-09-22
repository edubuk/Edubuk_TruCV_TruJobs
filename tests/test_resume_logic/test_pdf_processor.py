#!/usr/bin/env python3

import logging
import io
from io import BytesIO
import traceback

logger = logging.getLogger()

def test_all_pdf_methods(pdf_content_bytes, filename):
    """Test all available PDF processing methods and return results"""
    
    methods_results = {}
    
    logger.info(f"🧪 Testing PDF processing methods for: {filename}")
    
    # Method 1: PyPDF2 Standard
    methods_results['pypdf2_standard'] = test_pypdf2_standard(pdf_content_bytes)
    
    # Method 2: PyPDF2 with Error Handling
    methods_results['pypdf2_robust'] = test_pypdf2_robust(pdf_content_bytes)
    
    # Method 3: pdfplumber
    methods_results['pdfplumber'] = test_pdfplumber(pdf_content_bytes)
    
    # Method 4: pdfminer.six
    methods_results['pdfminer'] = test_pdfminer(pdf_content_bytes)
    
    # Method 5: Raw Binary Extraction
    methods_results['raw_binary'] = test_raw_binary_extraction(pdf_content_bytes)
    
    # Method 6: Multiple Method Combination
    methods_results['combined_approach'] = test_combined_approach(pdf_content_bytes)
    
    # Method 7: OCR Simulation (for image-based PDFs)
    methods_results['ocr_simulation'] = test_ocr_simulation(pdf_content_bytes)
    
    return methods_results

def test_pypdf2_standard(pdf_content_bytes):
    """Test standard PyPDF2 extraction"""
    try:
        import PyPDF2
        
        pdf_stream = BytesIO(pdf_content_bytes)
        reader = PyPDF2.PdfReader(pdf_stream)
        
        text = ""
        pages = len(reader.pages)
        
        for page in reader.pages:
            text += page.extract_text()
        
        return {
            "success": True,
            "method": "PyPDF2 Standard",
            "pages": pages,
            "text_length": len(text.strip()),
            "text": text[:500] + "..." if len(text) > 500 else text,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "method": "PyPDF2 Standard",
            "pages": 0,
            "text_length": 0,
            "text": "",
            "error": str(e)
        }

def test_pypdf2_robust(pdf_content_bytes):
    """Test PyPDF2 with robust error handling"""
    try:
        import PyPDF2
        
        pdf_stream = BytesIO(pdf_content_bytes)
        reader = PyPDF2.PdfReader(pdf_stream)
        
        text = ""
        pages = len(reader.pages)
        successful_pages = 0
        
        for i, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    text += page_text
                    successful_pages += 1
            except Exception as page_error:
                logger.warning(f"Page {i+1} extraction failed: {page_error}")
                continue
        
        return {
            "success": len(text.strip()) > 0,
            "method": "PyPDF2 Robust",
            "pages": pages,
            "successful_pages": successful_pages,
            "text_length": len(text.strip()),
            "text": text[:500] + "..." if len(text) > 500 else text,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "method": "PyPDF2 Robust",
            "pages": 0,
            "text_length": 0,
            "text": "",
            "error": str(e)
        }

def test_pdfplumber(pdf_content_bytes):
    """Test pdfplumber extraction"""
    try:
        import pdfplumber
        
        pdf_stream = BytesIO(pdf_content_bytes)
        
        text = ""
        pages = 0
        
        with pdfplumber.open(pdf_stream) as pdf:
            pages = len(pdf.pages)
            
            for page in pdf.pages:
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text
                except Exception as page_error:
                    continue
        
        return {
            "success": len(text.strip()) > 0,
            "method": "pdfplumber",
            "pages": pages,
            "text_length": len(text.strip()),
            "text": text[:500] + "..." if len(text) > 500 else text,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "method": "pdfplumber",
            "pages": 0,
            "text_length": 0,
            "text": "",
            "error": str(e)
        }

def test_pdfminer(pdf_content_bytes):
    """Test pdfminer.six extraction"""
    try:
        from pdfminer.high_level import extract_text
        from pdfminer.pdfpage import PDFPage
        
        pdf_stream = BytesIO(pdf_content_bytes)
        
        # Count pages
        pages = len(list(PDFPage.get_pages(BytesIO(pdf_content_bytes))))
        
        # Extract text
        text = extract_text(BytesIO(pdf_content_bytes))
        
        return {
            "success": len(text.strip()) > 0,
            "method": "pdfminer.six",
            "pages": pages,
            "text_length": len(text.strip()),
            "text": text[:500] + "..." if len(text) > 500 else text,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "method": "pdfminer.six",
            "pages": 0,
            "text_length": 0,
            "text": "",
            "error": str(e)
        }

def test_raw_binary_extraction(pdf_content_bytes):
    """Test raw binary text extraction"""
    try:
        # Look for text patterns in binary data
        text_content = ""
        
        # Convert to string and look for readable text
        try:
            # Try different encodings
            for encoding in ['latin-1', 'utf-8', 'cp1252']:
                try:
                    decoded = pdf_content_bytes.decode(encoding, errors='ignore')
                    
                    # Extract text between stream markers
                    import re
                    
                    # Look for text streams
                    stream_pattern = r'stream\s*(.*?)\s*endstream'
                    streams = re.findall(stream_pattern, decoded, re.DOTALL | re.IGNORECASE)
                    
                    for stream in streams:
                        # Clean up the stream content
                        cleaned = re.sub(r'[^\w\s@.-]', ' ', stream)
                        words = cleaned.split()
                        
                        # Filter for likely text content
                        text_words = [w for w in words if len(w) > 2 and w.isalnum()]
                        
                        if text_words:
                            text_content += ' '.join(text_words) + ' '
                    
                    if text_content:
                        break
                        
                except:
                    continue
        
        except Exception as decode_error:
            pass
        
        return {
            "success": len(text_content.strip()) > 0,
            "method": "Raw Binary Extraction",
            "pages": "unknown",
            "text_length": len(text_content.strip()),
            "text": text_content[:500] + "..." if len(text_content) > 500 else text_content,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "method": "Raw Binary Extraction",
            "pages": 0,
            "text_length": 0,
            "text": "",
            "error": str(e)
        }

def test_combined_approach(pdf_content_bytes):
    """Test combined approach using multiple methods"""
    try:
        all_text = ""
        methods_used = []
        
        # Try each method and combine results
        methods = [
            test_pypdf2_robust,
            test_pdfplumber,
            test_pdfminer,
            test_raw_binary_extraction
        ]
        
        for method in methods:
            try:
                result = method(pdf_content_bytes)
                if result['success'] and result['text_length'] > 0:
                    all_text += result['text'] + "\n"
                    methods_used.append(result['method'])
            except:
                continue
        
        # Remove duplicates and clean up
        unique_text = ' '.join(list(dict.fromkeys(all_text.split())))
        
        return {
            "success": len(unique_text.strip()) > 0,
            "method": f"Combined ({', '.join(methods_used)})",
            "pages": "multiple",
            "text_length": len(unique_text.strip()),
            "text": unique_text[:500] + "..." if len(unique_text) > 500 else unique_text,
            "methods_used": methods_used,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "method": "Combined Approach",
            "pages": 0,
            "text_length": 0,
            "text": "",
            "error": str(e)
        }

def test_ocr_simulation(pdf_content_bytes):
    """Simulate OCR approach for image-based PDFs"""
    try:
        # This is a simulation - in real implementation would use pytesseract + pdf2image
        
        # Check if PDF might be image-based by looking for image markers
        pdf_str = pdf_content_bytes.decode('latin-1', errors='ignore')
        
        image_indicators = ['JFIF', 'PNG', '/Image', '/DCTDecode', '/FlateDecode']
        image_score = sum(1 for indicator in image_indicators if indicator in pdf_str)
        
        if image_score > 2:
            # Simulate OCR result for image-based PDF
            simulated_text = "OCR_SIMULATION: This PDF appears to be image-based and would require OCR processing"
            
            return {
                "success": True,
                "method": "OCR Simulation",
                "pages": "unknown",
                "text_length": len(simulated_text),
                "text": simulated_text,
                "image_indicators": image_score,
                "note": "This is a simulation - real OCR would be needed",
                "error": None
            }
        else:
            return {
                "success": False,
                "method": "OCR Simulation",
                "pages": 0,
                "text_length": 0,
                "text": "",
                "note": "PDF doesn't appear to be image-based",
                "error": "Not an image-based PDF"
            }
        
    except Exception as e:
        return {
            "success": False,
            "method": "OCR Simulation",
            "pages": 0,
            "text_length": 0,
            "text": "",
            "error": str(e)
        }

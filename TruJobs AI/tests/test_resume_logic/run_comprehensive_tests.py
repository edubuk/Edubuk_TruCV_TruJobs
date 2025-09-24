#!/usr/bin/env python3

import os
import sys
import json
import logging
from datetime import datetime
import traceback

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('pdf_test_results.log')
    ]
)
logger = logging.getLogger()

# Import our test modules
from test_lambda_function import test_lambda_handler
from test_pdf_processor import test_all_pdf_methods
from test_input_parser import parse_multipart_form_test

def run_comprehensive_pdf_tests(sample_pdfs_dir):
    """Run comprehensive tests on all sample PDFs"""
    
    logger.info("🧪 Starting Comprehensive PDF Processing Tests")
    logger.info("=" * 60)
    
    # Get all PDF files
    pdf_files = []
    if os.path.exists(sample_pdfs_dir):
        pdf_files = [f for f in os.listdir(sample_pdfs_dir) if f.endswith('.pdf')]
        pdf_files.sort()
    else:
        logger.error(f"Sample PDFs directory not found: {sample_pdfs_dir}")
        return
    
    logger.info(f"📁 Found {len(pdf_files)} PDF files to test")
    
    # Test results storage
    all_results = {
        "test_date": datetime.now().isoformat(),
        "total_files": len(pdf_files),
        "results": {},
        "summary": {}
    }
    
    # Test each PDF
    for i, pdf_file in enumerate(pdf_files, 1):
        pdf_path = os.path.join(sample_pdfs_dir, pdf_file)
        
        logger.info(f"\n📄 Testing {i}/{len(pdf_files)}: {pdf_file}")
        logger.info("-" * 50)
        
        try:
            # Run comprehensive test
            result = test_lambda_handler(pdf_path)
            all_results["results"][pdf_file] = result
            
            # Log key findings
            if result.get("status") == "success":
                logger.info(f"✅ SUCCESS: {result.get('best_method', 'Unknown')} - {result.get('best_text_length', 0)} chars")
            else:
                logger.warning(f"⚠️ FAILED: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"💥 ERROR testing {pdf_file}: {str(e)}")
            all_results["results"][pdf_file] = {
                "status": "error",
                "error": str(e),
                "traceback": traceback.format_exc()
            }
    
    # Generate summary
    generate_test_summary(all_results)
    
    # Save results to file
    results_file = f"comprehensive_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, 'w') as f:
        json.dump(all_results, f, indent=2)
    
    logger.info(f"\n💾 Results saved to: {results_file}")
    
    return all_results

def generate_test_summary(all_results):
    """Generate comprehensive test summary"""
    
    logger.info("\n" + "=" * 60)
    logger.info("📊 COMPREHENSIVE TEST SUMMARY")
    logger.info("=" * 60)
    
    results = all_results["results"]
    total_files = len(results)
    
    # Count successes and failures
    successful = sum(1 for r in results.values() if r.get("status") == "success")
    failed = sum(1 for r in results.values() if r.get("status") in ["failed", "error"])
    
    logger.info(f"📈 Total Files Tested: {total_files}")
    logger.info(f"✅ Successful: {successful} ({successful/total_files*100:.1f}%)")
    logger.info(f"❌ Failed: {failed} ({failed/total_files*100:.1f}%)")
    
    # Method effectiveness analysis
    method_stats = {}
    text_extraction_stats = []
    
    for filename, result in results.items():
        if result.get("status") == "success":
            best_method = result.get("best_method")
            if best_method:
                method_stats[best_method] = method_stats.get(best_method, 0) + 1
            
            text_length = result.get("best_text_length", 0)
            text_extraction_stats.append({
                "file": filename,
                "method": best_method,
                "text_length": text_length
            })
    
    # Log method effectiveness
    logger.info(f"\n🔧 Method Effectiveness:")
    for method, count in sorted(method_stats.items(), key=lambda x: x[1], reverse=True):
        percentage = count / successful * 100 if successful > 0 else 0
        logger.info(f"  {method}: {count} files ({percentage:.1f}%)")
    
    # Log best performing files
    logger.info(f"\n🏆 Top Text Extraction Results:")
    top_results = sorted(text_extraction_stats, key=lambda x: x["text_length"], reverse=True)[:5]
    for i, result in enumerate(top_results, 1):
        logger.info(f"  {i}. {result['file']}: {result['text_length']} chars ({result['method']})")
    
    # Log problematic files
    logger.info(f"\n⚠️ Problematic Files:")
    problem_files = [filename for filename, result in results.items() 
                    if result.get("status") in ["failed", "error"]]
    
    for filename in problem_files[:5]:  # Show top 5 problem files
        result = results[filename]
        error = result.get("error", "Unknown error")
        logger.info(f"  ❌ {filename}: {error}")
    
    # S3 simulation results
    logger.info(f"\n🪣 S3 Save Simulation Results:")
    s3_success = 0
    s3_readable = 0
    
    for result in results.values():
        s3_sim = result.get("s3_simulation", {})
        if s3_sim.get("status") == "success":
            s3_success += 1
            if s3_sim.get("readability") == "readable":
                s3_readable += 1
    
    logger.info(f"  ✅ S3 Save Success: {s3_success}/{total_files} ({s3_success/total_files*100:.1f}%)")
    logger.info(f"  📖 S3 Readable: {s3_readable}/{total_files} ({s3_readable/total_files*100:.1f}%)")
    
    # Store summary in results
    all_results["summary"] = {
        "total_files": total_files,
        "successful": successful,
        "failed": failed,
        "success_rate": successful/total_files*100 if total_files > 0 else 0,
        "method_stats": method_stats,
        "s3_save_success": s3_success,
        "s3_readable": s3_readable,
        "top_performers": top_results[:3],
        "problem_files": problem_files[:3]
    }

def analyze_best_approach(all_results):
    """Analyze results to find the best approach for resume maker PDFs"""
    
    logger.info("\n" + "=" * 60)
    logger.info("🎯 BEST APPROACH ANALYSIS")
    logger.info("=" * 60)
    
    results = all_results["results"]
    
    # Categorize files by source type (heuristic)
    resume_maker_files = []
    clean_files = []
    
    for filename, result in results.items():
        # Heuristic: files with very low text extraction are likely from resume makers
        text_length = result.get("best_text_length", 0)
        
        if text_length == 0:
            resume_maker_files.append(filename)
        elif text_length > 100:
            clean_files.append(filename)
    
    logger.info(f"📊 File Categorization:")
    logger.info(f"  🏭 Likely Resume Maker PDFs: {len(resume_maker_files)}")
    logger.info(f"  ✨ Clean PDFs: {len(clean_files)}")
    
    # Analyze what works for each category
    logger.info(f"\n🔍 Resume Maker PDF Analysis:")
    for filename in resume_maker_files[:3]:  # Show top 3
        result = results.get(filename, {})
        extraction_methods = result.get("extraction_methods", {})
        
        logger.info(f"  📄 {filename}:")
        for method, method_result in extraction_methods.items():
            if method_result.get("success"):
                logger.info(f"    ✅ {method}: {method_result.get('text_length', 0)} chars")
            else:
                logger.info(f"    ❌ {method}: {method_result.get('error', 'Failed')}")
    
    # Recommend best approach
    logger.info(f"\n💡 RECOMMENDATIONS:")
    
    if len(resume_maker_files) > len(clean_files):
        logger.info("  🎯 Most files appear to be from resume makers (corrupted)")
        logger.info("  📋 Recommended approach:")
        logger.info("    1. Implement OCR processing for image-based PDFs")
        logger.info("    2. Enhance raw binary extraction")
        logger.info("    3. Use combined approach with multiple fallbacks")
        logger.info("    4. Consider PDF repair/reconstruction")
    else:
        logger.info("  🎯 Most files are clean and processable")
        logger.info("  📋 Current approach should work well")
        logger.info("    1. Continue with current PyPDF2/pdfplumber approach")
        logger.info("    2. Add OCR as fallback for problematic files")

if __name__ == "__main__":
    # Configuration
    SAMPLE_PDFS_DIR = "/home/ganesh/Desktop/new_project_X/sample_pdfs"
    
    if len(sys.argv) > 1:
        SAMPLE_PDFS_DIR = sys.argv[1]
    
    # Run comprehensive tests
    try:
        results = run_comprehensive_pdf_tests(SAMPLE_PDFS_DIR)
        analyze_best_approach(results)
        
        logger.info("\n🎉 Comprehensive testing completed!")
        logger.info("Check the generated JSON file for detailed results.")
        
    except Exception as e:
        logger.error(f"💥 Testing failed: {str(e)}")
        logger.error(traceback.format_exc())

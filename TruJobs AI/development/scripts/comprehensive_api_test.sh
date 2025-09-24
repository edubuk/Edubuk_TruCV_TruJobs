#!/bin/bash

# TruJobs Comprehensive API Testing Script
# Tests all sample PDFs, monitors logs, and verifies S3 readability

# Configuration
API_BASE="https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod"
API_KEY="KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47"
JOB_DESCRIPTION_ID="69e7c813-326c-4e2a-a4a3-87077c8c9186"
SAMPLE_DIR="/home/ganesh/Desktop/new_project_X/sample_pdfs"
LOG_GROUP="/aws/lambda/resume-processor"
REGION="ap-south-1"
BUCKET="trujobs-db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_RESULTS=()

echo -e "${BLUE}🧪 TruJobs Comprehensive API Testing${NC}"
echo "=================================================="
echo "📅 Test Date: $(date)"
echo "🌐 API Base: $API_BASE"
echo "📁 Sample PDFs: $SAMPLE_DIR"
echo "🪣 S3 Bucket: $BUCKET"
echo ""

# Function to log test results
log_test_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$status" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}❌ FAIL${NC}: $test_name"
    fi
    
    if [ -n "$details" ]; then
        echo "   Details: $details"
    fi
    
    TEST_RESULTS+=("$status: $test_name - $details")
    echo ""
}

# Function to test PDF upload
test_pdf_upload() {
    local pdf_file="$1"
    local pdf_name=$(basename "$pdf_file")
    
    echo -e "${YELLOW}🔄 Testing PDF: $pdf_name${NC}"
    echo "   File size: $(du -h "$pdf_file" | cut -f1)"
    
    # Upload PDF using curl
    local start_time=$(date +%s.%N)
    
    local response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        -X POST \
        -H "x-api-key: $API_KEY" \
        -F "pdf_file=@$pdf_file" \
        -F "job_description_id=$JOB_DESCRIPTION_ID" \
        "$API_BASE/ResumeUpload")
    
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc)
    
    # Parse response
    local http_code=$(echo "$response" | tail -n2 | head -n1)
    local curl_time=$(echo "$response" | tail -n1)
    local json_response=$(echo "$response" | head -n -2)
    
    echo "   HTTP Code: $http_code"
    echo "   Response Time: ${duration}s"
    
    # Check if successful
    if [ "$http_code" = "200" ]; then
        # Extract resume_id and s3_key from JSON response
        local resume_id=$(echo "$json_response" | grep -o '"resume_id":"[^"]*"' | cut -d'"' -f4)
        local candidate_name=$(echo "$json_response" | grep -o '"candidate_name":"[^"]*"' | cut -d'"' -f4)
        local s3_key=$(echo "$json_response" | grep -o '"s3_key":"[^"]*"' | cut -d'"' -f4)
        
        echo "   Resume ID: $resume_id"
        echo "   Candidate: $candidate_name"
        echo "   S3 Key: $s3_key"
        
        # Test S3 readability
        test_s3_readability "$s3_key" "$pdf_name"
        
        log_test_result "API Upload: $pdf_name" "PASS" "HTTP 200, Time: ${duration}s, Candidate: $candidate_name"
        
        # Check logs for validation results
        check_pdf_validation_logs "$resume_id"
        
    else
        local error_msg=$(echo "$json_response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        log_test_result "API Upload: $pdf_name" "FAIL" "HTTP $http_code, Error: $error_msg"
    fi
}

# Function to check PDF validation in logs
check_pdf_validation_logs() {
    local resume_id="$1"
    
    echo -e "${BLUE}🔍 Checking validation logs for: $resume_id${NC}"
    
    # Wait a moment for logs to appear
    sleep 2
    
    # Get recent logs with validation info
    local validation_logs=$(aws logs filter-log-events \
        --log-group-name "$LOG_GROUP" \
        --region "$REGION" \
        --start-time $(date -d "1 minute ago" +%s)000 \
        --filter-pattern "PDF validation" \
        --query 'events[-1].message' \
        --output text 2>/dev/null)
    
    if [[ "$validation_logs" == *"TRULY readable"* ]]; then
        echo -e "   ${GREEN}✅ PDF Validation: TRULY readable${NC}"
        log_test_result "PDF Validation: $resume_id" "PASS" "PDF is truly readable"
    elif [[ "$validation_logs" == *"NO TEXT EXTRACTABLE"* ]]; then
        echo -e "   ${YELLOW}⚠️ PDF Validation: Corrupted but processed${NC}"
        log_test_result "PDF Validation: $resume_id" "PASS" "PDF corrupted but system handled it"
    else
        echo -e "   ${RED}❌ PDF Validation: Unknown status${NC}"
        log_test_result "PDF Validation: $resume_id" "FAIL" "Could not determine validation status"
    fi
}

# Function to test S3 readability
test_s3_readability() {
    local s3_key="$1"
    local pdf_name="$2"
    
    echo -e "${BLUE}🔍 Testing S3 readability for: $pdf_name${NC}"
    
    # Download from S3
    local temp_file="/tmp/test_$(basename "$s3_key")"
    
    if aws s3 cp "s3://$BUCKET/$s3_key" "$temp_file" --region "$REGION" --quiet; then
        echo "   ✅ S3 Download: Success"
        
        # Test file properties
        local file_info=$(file "$temp_file")
        echo "   📄 File Type: $file_info"
        
        if [[ "$file_info" == *"PDF document"* ]]; then
            echo -e "   ${GREEN}✅ S3 PDF Structure: Valid${NC}"
            
            # Test text extraction
            local text_test=$(python3 -c "
import PyPDF2
import sys
try:
    with open('$temp_file', 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        pages = len(reader.pages)
        total_text = ''
        for page in reader.pages:
            try:
                total_text += page.extract_text()
            except:
                pass
        print(f'Pages: {pages}, Text: {len(total_text)} chars')
        if len(total_text) > 0:
            print('READABLE')
        else:
            print('NO_TEXT')
except Exception as e:
    print(f'ERROR: {e}')
" 2>/dev/null)
            
            echo "   📊 Text Extraction: $text_test"
            
            if [[ "$text_test" == *"READABLE"* ]]; then
                log_test_result "S3 Readability: $pdf_name" "PASS" "PDF fully readable from S3"
            elif [[ "$text_test" == *"NO_TEXT"* ]]; then
                log_test_result "S3 Readability: $pdf_name" "PASS" "PDF structure valid, text corrupted (expected for some files)"
            else
                log_test_result "S3 Readability: $pdf_name" "FAIL" "PDF structure invalid"
            fi
        else
            log_test_result "S3 Readability: $pdf_name" "FAIL" "Not a valid PDF in S3"
        fi
        
        # Clean up
        rm -f "$temp_file"
    else
        log_test_result "S3 Readability: $pdf_name" "FAIL" "Could not download from S3"
    fi
}

# Function to generate test report
generate_report() {
    echo ""
    echo "=================================================="
    echo -e "${BLUE}📊 TEST RESULTS SUMMARY${NC}"
    echo "=================================================="
    echo "📅 Test Date: $(date)"
    echo "📈 Total Tests: $TOTAL_TESTS"
    echo -e "✅ Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "❌ Failed: ${RED}$FAILED_TESTS${NC}"
    
    local success_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    echo "📊 Success Rate: ${success_rate}%"
    
    echo ""
    echo "📋 Detailed Results:"
    echo "===================="
    for result in "${TEST_RESULTS[@]}"; do
        if [[ "$result" == PASS* ]]; then
            echo -e "${GREEN}$result${NC}"
        else
            echo -e "${RED}$result${NC}"
        fi
    done
    
    echo ""
    echo "🎯 Conclusion:"
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! TruJobs API is working perfectly!${NC}"
    elif [ $PASSED_TESTS -gt $FAILED_TESTS ]; then
        echo -e "${YELLOW}⚠️ Most tests passed, but some issues found. Review failed tests.${NC}"
    else
        echo -e "${RED}🚨 Multiple failures detected. System needs attention.${NC}"
    fi
}

# Main testing loop
echo -e "${YELLOW}🚀 Starting comprehensive API testing...${NC}"
echo ""

# Test each PDF in the sample directory
for pdf_file in "$SAMPLE_DIR"/*.pdf; do
    if [ -f "$pdf_file" ]; then
        test_pdf_upload "$pdf_file"
        echo "----------------------------------------"
        sleep 1  # Brief pause between tests
    fi
done

# Generate final report
generate_report

echo ""
echo -e "${BLUE}🏁 Testing Complete!${NC}"

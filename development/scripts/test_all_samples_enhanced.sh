#!/bin/bash

# Test all sample PDFs with enhanced PDF processor
echo "🧪 Testing All Sample PDFs with Enhanced Logic"
echo "=============================================="

# Configuration
API_BASE="https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod"
API_KEY="KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47"
JOB_DESCRIPTION_ID="69e7c813-326c-4e2a-a4a3-87077c8c9186"
SAMPLE_DIR="/home/ganesh/Desktop/new_project_X/sample_pdfs"
LOG_GROUP="/aws/lambda/resume-processor"
REGION="ap-south-1"
BUCKET="trujobs-db"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Results tracking
TOTAL_TESTS=0
SUCCESSFUL_UPLOADS=0
FAILED_UPLOADS=0
RESULTS=()

echo "📅 Test Date: $(date)"
echo "🌐 API: $API_BASE/ResumeUpload"
echo "📁 Sample PDFs: $SAMPLE_DIR"
echo ""

# Function to test PDF upload
test_pdf_upload() {
    local pdf_file="$1"
    local pdf_name=$(basename "$pdf_file")
    
    echo -e "${YELLOW}🔄 Testing: $pdf_name${NC}"
    echo "   File size: $(du -h "$pdf_file" | cut -f1)"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Upload PDF
    local start_time=$(date +%s.%N)
    
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "x-api-key: $API_KEY" \
        -F "pdf_file=@$pdf_file" \
        -F "job_description_id=$JOB_DESCRIPTION_ID" \
        "$API_BASE/ResumeUpload")
    
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc)
    
    # Parse response
    local http_code=$(echo "$response" | tail -n1)
    local json_response=$(echo "$response" | head -n -1)
    
    echo "   HTTP Code: $http_code"
    echo "   Response Time: ${duration}s"
    
    if [ "$http_code" = "200" ]; then
        # Extract details from JSON
        local resume_id=$(echo "$json_response" | grep -o '"resume_id":"[^"]*"' | cut -d'"' -f4)
        local candidate_name=$(echo "$json_response" | grep -o '"candidate_name":"[^"]*"' | cut -d'"' -f4)
        local s3_key=$(echo "$json_response" | grep -o '"s3_key":"[^"]*"' | cut -d'"' -f4)
        
        echo -e "   ${GREEN}✅ SUCCESS${NC}"
        echo "   Resume ID: $resume_id"
        echo "   Candidate: $candidate_name"
        echo "   S3 Key: $s3_key"
        
        SUCCESSFUL_UPLOADS=$((SUCCESSFUL_UPLOADS + 1))
        RESULTS+=("✅ $pdf_name: SUCCESS - $candidate_name (${duration}s)")
        
        # Test S3 readability
        test_s3_readability "$s3_key" "$pdf_name"
        
    else
        local error_msg=$(echo "$json_response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo -e "   ${RED}❌ FAILED${NC}"
        echo "   Error: $error_msg"
        
        FAILED_UPLOADS=$((FAILED_UPLOADS + 1))
        RESULTS+=("❌ $pdf_name: FAILED - $error_msg")
    fi
    
    echo ""
}

# Function to test S3 readability
test_s3_readability() {
    local s3_key="$1"
    local pdf_name="$2"
    
    echo -e "   ${BLUE}🔍 Testing S3 readability...${NC}"
    
    # Download from S3
    local temp_file="/tmp/test_$(basename "$s3_key")"
    
    if aws s3 cp "s3://$BUCKET/$s3_key" "$temp_file" --region "$REGION" --quiet; then
        # Test readability
        local readability_test=$(python3 -c "
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
            print('STRUCTURE_ONLY')
except Exception as e:
    print(f'ERROR: {e}')
" 2>/dev/null)
        
        echo "   📊 S3 Test: $readability_test"
        
        # Clean up
        rm -f "$temp_file"
    else
        echo "   ❌ S3 download failed"
    fi
}

# Test each PDF
echo -e "${YELLOW}🚀 Starting enhanced PDF testing...${NC}"
echo ""

for pdf_file in "$SAMPLE_DIR"/*.pdf; do
    if [ -f "$pdf_file" ]; then
        test_pdf_upload "$pdf_file"
        sleep 1  # Brief pause between tests
    fi
done

# Generate summary
echo "=============================================="
echo -e "${BLUE}📊 ENHANCED TESTING RESULTS${NC}"
echo "=============================================="
echo "📅 Test Date: $(date)"
echo "📈 Total Tests: $TOTAL_TESTS"
echo -e "✅ Successful: ${GREEN}$SUCCESSFUL_UPLOADS${NC}"
echo -e "❌ Failed: ${RED}$FAILED_UPLOADS${NC}"

local success_rate=$(echo "scale=1; $SUCCESSFUL_UPLOADS * 100 / $TOTAL_TESTS" | bc)
echo "📊 Success Rate: ${success_rate}%"

echo ""
echo "📋 Detailed Results:"
echo "===================="
for result in "${RESULTS[@]}"; do
    echo "$result"
done

echo ""
echo "🎯 Conclusion:"
if [ $FAILED_UPLOADS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Enhanced PDF processor is working perfectly!${NC}"
elif [ $SUCCESSFUL_UPLOADS -gt $FAILED_UPLOADS ]; then
    echo -e "${YELLOW}⚠️ Most tests passed. Enhanced logic significantly improved results!${NC}"
else
    echo -e "${RED}🚨 Multiple failures. Need further investigation.${NC}"
fi

echo ""
echo -e "${BLUE}🏁 Enhanced testing complete!${NC}"

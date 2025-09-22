#!/bin/bash

# TruJobs S3 PDF Fix Test Script
echo "🧪 Testing S3 PDF Fix for TruJobs Resume Processor"
echo "=================================================="

# Configuration
FUNCTION_NAME="resume-processor"
BUCKET_NAME="trujobs-db"
API_ENDPOINT="https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod/ResumeUpload"
API_KEY="KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47"

echo "📋 Test Configuration:"
echo "  Function: $FUNCTION_NAME"
echo "  Bucket: $BUCKET_NAME"
echo "  API: $API_ENDPOINT"
echo ""

# Test 1: Check current S3 contents
echo "🔍 Test 1: Current S3 Resume Contents"
echo "------------------------------------"
aws s3 ls s3://$BUCKET_NAME/resumes/ --region ap-south-1 --human-readable --summarize

echo ""
echo "📊 S3 Resume Count:"
RESUME_COUNT=$(aws s3 ls s3://$BUCKET_NAME/resumes/ --region ap-south-1 | wc -l)
echo "  Total files: $RESUME_COUNT"

# Test 2: Check Lambda function status
echo ""
echo "⚡ Test 2: Lambda Function Status"
echo "--------------------------------"
aws lambda get-function --function-name $FUNCTION_NAME --region ap-south-1 --query 'Configuration.[FunctionName,State,LastUpdateStatus,CodeSize]' --output table

# Test 3: Check recent Lambda logs
echo ""
echo "📝 Test 3: Recent Lambda Logs (Last 10 minutes)"
echo "-----------------------------------------------"
echo "Checking for recent executions..."

# Get log group
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"

# Get recent log streams
aws logs describe-log-streams \
    --log-group-name "$LOG_GROUP" \
    --region ap-south-1 \
    --order-by LastEventTime \
    --descending \
    --max-items 3 \
    --query 'logStreams[].{Stream:logStreamName,LastEvent:lastEventTime}' \
    --output table

echo ""
echo "🎯 Test 4: Function Environment Variables"
echo "----------------------------------------"
aws lambda get-function-configuration \
    --function-name $FUNCTION_NAME \
    --region ap-south-1 \
    --query 'Environment.Variables' \
    --output table

echo ""
echo "📦 Test 5: Lambda Layers"
echo "------------------------"
aws lambda get-function \
    --function-name $FUNCTION_NAME \
    --region ap-south-1 \
    --query 'Configuration.Layers[].{Arn:Arn,CodeSize:CodeSize}' \
    --output table

echo ""
echo "🔧 Ready for Manual Testing!"
echo "============================"
echo "Now upload a test PDF using Postman to:"
echo "  URL: $API_ENDPOINT"
echo "  Method: POST"
echo "  Headers: x-api-key: $API_KEY"
echo "  Body: multipart/form-data"
echo "    - pdf_file: [your test PDF]"
echo "    - job_description_id: 69e7c813-326c-4e2a-a4a3-87077c8c9186"
echo ""
echo "After upload, run this command to check the new PDF:"
echo "  aws s3 ls s3://$BUCKET_NAME/resumes/ --region ap-south-1 --human-readable"
echo ""
echo "To download and verify the PDF:"
echo "  aws s3 cp s3://$BUCKET_NAME/resumes/[filename].pdf ./test_download.pdf"
echo ""
echo "To check logs after upload:"
echo "  aws logs tail $LOG_GROUP --region ap-south-1 --follow"

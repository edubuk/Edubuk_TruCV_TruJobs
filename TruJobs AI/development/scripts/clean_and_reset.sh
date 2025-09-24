#!/bin/bash

# Clean S3 and OpenSearch for fresh testing
echo "🧹 Cleaning S3 and OpenSearch for fresh start..."

# Configuration
BUCKET="trujobs-db"
REGION="ap-south-1"
OPENSEARCH_ENDPOINT="https://1jivpq1n907fmvddqgy9.ap-south-1.aoss.amazonaws.com"
INDEX_NAME="resumes"

echo "📅 Cleanup Date: $(date)"
echo "🪣 S3 Bucket: $BUCKET"
echo "🔍 OpenSearch Endpoint: $OPENSEARCH_ENDPOINT"
echo ""

# Step 1: Clean S3 resumes
echo "🗑️ Step 1: Cleaning S3 resumes..."
echo "Current S3 resume count:"
aws s3 ls s3://$BUCKET/resumes/ --region $REGION --recursive | wc -l

echo "Deleting all resumes from S3..."
aws s3 rm s3://$BUCKET/resumes/ --region $REGION --recursive

echo "✅ S3 cleanup complete. Remaining files:"
aws s3 ls s3://$BUCKET/resumes/ --region $REGION --recursive | wc -l

# Step 2: Clean OpenSearch index
echo ""
echo "🔍 Step 2: Cleaning OpenSearch index..."

# Delete the entire resumes index
echo "Deleting resumes index..."
curl -X DELETE "$OPENSEARCH_ENDPOINT/$INDEX_NAME" \
  --aws-sigv4 "aws:amz:ap-south-1:aoss" \
  --user "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" \
  -H "Content-Type: application/json"

echo ""
echo "✅ OpenSearch cleanup complete."

echo ""
echo "🎯 Cleanup Summary:"
echo "✅ S3 resumes deleted"
echo "✅ OpenSearch index deleted"
echo "🚀 Ready for fresh testing with enhanced PDF processor!"

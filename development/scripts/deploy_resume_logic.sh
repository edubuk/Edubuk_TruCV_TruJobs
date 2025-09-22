#!/bin/bash

# TruJobs Resume Logic Deployment Script
echo "🚀 Deploying TruJobs Resume Logic updates..."

# Navigate to project directory
cd /home/ganesh/Desktop/new_project_X

# Create deployment package
echo "📦 Creating deployment package..."
cd new_resume_logic
zip -r ../resume_logic_deployment.zip . -x "*.pyc" "__pycache__/*" "*.git*"
cd ..

# Get the Lambda function name
FUNCTION_NAME="resume-processor"

echo "⬆️ Uploading to Lambda function: $FUNCTION_NAME"

# Update Lambda function code
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://resume_logic_deployment.zip \
    --region ap-south-1

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔍 Function info:"
    aws lambda get-function --function-name "$FUNCTION_NAME" --region ap-south-1 --query 'Configuration.[FunctionName,LastModified,CodeSize]'
else
    echo "❌ Deployment failed!"
    exit 1
fi

# Clean up
rm resume_logic_deployment.zip

echo "🎉 Deployment complete! Ready for testing."

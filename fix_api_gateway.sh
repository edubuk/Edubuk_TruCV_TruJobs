#!/bin/bash

# FIX API GATEWAY BINARY MEDIA TYPES
# ==================================

echo "🔧 FIXING API GATEWAY BINARY MEDIA TYPES"
echo "=================================================="

API_ID="ctlzux7bee"
REGION="ap-south-1"

echo "📊 Current configuration:"
aws apigateway get-rest-api --rest-api-id $API_ID --region $REGION --query 'binaryMediaTypes' || echo "   ❌ No binary media types configured"

echo ""
echo "🎯 Adding required binary media types..."

# Method 1: Try to add binary media types using put-rest-api
echo "⚙️ Method 1: Using put-rest-api..."

# Create a temporary JSON file with the binary media types
cat > /tmp/api_config.json << EOF
{
  "binaryMediaTypes": [
    "multipart/form-data",
    "application/pdf",
    "*/*"
  ]
}
EOF

# Try to update the API configuration
aws apigateway put-rest-api \
  --rest-api-id $API_ID \
  --region $REGION \
  --mode merge \
  --body file:///tmp/api_config.json

if [ $? -eq 0 ]; then
    echo "✅ Successfully updated binary media types!"
    
    echo ""
    echo "📋 Verification:"
    aws apigateway get-rest-api --rest-api-id $API_ID --region $REGION --query 'binaryMediaTypes'
    
    echo ""
    echo "🚀 Deploying changes to production stage..."
    aws apigateway create-deployment \
      --rest-api-id $API_ID \
      --region $REGION \
      --stage-name prod \
      --description "Fix binary media types for PDF uploads"
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo ""
        echo "🎉 API GATEWAY FIX COMPLETE!"
        echo "   - Binary media types configured"
        echo "   - Changes deployed to production"
        echo "   - PDF uploads should now work correctly"
        
        echo ""
        echo "💡 NEXT STEPS:"
        echo "1. Test PDF upload to verify fix"
        echo "2. Check for 100% data preservation"
        echo "3. Confirm text extraction works"
        echo "4. Validate OpenSearch indexing"
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo "❌ Failed to update binary media types"
    echo ""
    echo "🔧 Alternative: Manual configuration required"
    echo "   1. Go to AWS Console → API Gateway"
    echo "   2. Select API: ctlzux7bee"
    echo "   3. Go to Settings"
    echo "   4. Add Binary Media Types:"
    echo "      - multipart/form-data"
    echo "      - application/pdf"
    echo "      - */*"
    echo "   5. Deploy to 'prod' stage"
    exit 1
fi

# Clean up
rm -f /tmp/api_config.json

#!/usr/bin/env python3
"""
FIX API GATEWAY BINARY MEDIA TYPES
==================================

This script will configure API Gateway to properly handle binary data
by setting the appropriate binary media types.
"""

import boto3
import json

def fix_api_gateway_binary_media_types():
    """Configure API Gateway binary media types"""
    
    client = boto3.client('apigateway', region_name='ap-south-1')
    api_id = 'ctlzux7bee'
    
    print("🔧 FIXING API GATEWAY BINARY MEDIA TYPES")
    print("="*50)
    
    try:
        # Get current configuration
        print("📊 Current configuration:")
        response = client.get_rest_api(restApiId=api_id)
        current_binary_types = response.get('binaryMediaTypes', [])
        
        if current_binary_types:
            for media_type in current_binary_types:
                print(f"   - {media_type}")
        else:
            print("   ❌ No binary media types configured")
        
        # Define the binary media types we need
        required_types = [
            "multipart/form-data",
            "application/pdf", 
            "*/*"
        ]
        
        print(f"\n🎯 Required binary media types:")
        for media_type in required_types:
            print(f"   - {media_type}")
        
        # Update the API Gateway configuration
        print(f"\n⚙️ Updating API Gateway configuration...")
        
        # API Gateway expects individual operations for each media type
        patch_ops = []
        
        # First, clear existing binary media types
        patch_ops.append({
            'op': 'replace',
            'path': '/binaryMediaTypes',
            'value': []
        })
        
        # Then add each required type
        for i, media_type in enumerate(required_types):
            patch_ops.append({
                'op': 'add',
                'path': f'/binaryMediaTypes/{i}',
                'value': media_type
            })
        
        response = client.update_rest_api(
            restApiId=api_id,
            patchOperations=patch_ops
        )
        
        print("✅ Successfully updated binary media types!")
        
        # Verify the update
        print(f"\n📋 Verification:")
        updated_response = client.get_rest_api(restApiId=api_id)
        updated_binary_types = updated_response.get('binaryMediaTypes', [])
        
        for media_type in updated_binary_types:
            print(f"   ✅ {media_type}")
        
        # Deploy the changes
        print(f"\n🚀 Deploying changes to production stage...")
        
        deploy_response = client.create_deployment(
            restApiId=api_id,
            stageName='prod',
            description='Fix binary media types for PDF uploads'
        )
        
        print(f"✅ Deployment successful! Deployment ID: {deploy_response['id']}")
        
        print(f"\n🎉 API GATEWAY FIX COMPLETE!")
        print("   - Binary media types configured")
        print("   - Changes deployed to production")
        print("   - PDF uploads should now work correctly")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to fix API Gateway: {e}")
        return False

if __name__ == "__main__":
    success = fix_api_gateway_binary_media_types()
    
    if success:
        print(f"\n💡 NEXT STEPS:")
        print("1. Test PDF upload to verify fix")
        print("2. Check for 100% data preservation")
        print("3. Confirm text extraction works")
        print("4. Validate OpenSearch indexing")
    else:
        print(f"\n❌ Fix failed - manual intervention required")

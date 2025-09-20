#!/bin/bash

# Alternative script to build Lambda Layer for Python 3.9 without Docker
# Uses local Python 3.9 or creates a virtual environment

set -e

echo "🐍 Building Lambda Layer for Python 3.9..."

# Clean up any existing build
rm -rf lambda_layer_python39_build
mkdir -p lambda_layer_python39_build

cd lambda_layer_python39_build

# Create requirements.txt
cat > requirements.txt << EOF
pdfminer.six==20231228
chardet==5.2.0
cryptography==41.0.7
EOF

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | grep -oP '\d+\.\d+')
echo "📋 Current Python version: $PYTHON_VERSION"

if [[ "$PYTHON_VERSION" != "3.9" ]]; then
    echo "⚠️  Warning: Current Python is $PYTHON_VERSION, not 3.9"
    echo "   The layer may not be compatible with Lambda Python 3.9 runtime"
    echo "   Consider using Docker or installing Python 3.9"
    echo ""
    echo "   Proceeding anyway..."
fi

# Create python directory
mkdir -p python

echo "📦 Installing packages..."
pip3 install --no-cache-dir --target python --platform linux_x86_64 --only-binary=:all: -r requirements.txt

# If that fails, try without platform specification
if [ $? -ne 0 ]; then
    echo "⚠️  Platform-specific install failed, trying generic install..."
    pip3 install --no-cache-dir --target python -r requirements.txt
fi

echo "🗜️  Creating zip file..."
zip -r pdf-tools-layer-python39.zip python/

echo "✅ Layer built successfully!"
ls -lh pdf-tools-layer-python39.zip

echo "🧪 Testing layer contents..."
unzip -l pdf-tools-layer-python39.zip | head -15

echo "📁 Layer file location: $(pwd)/pdf-tools-layer-python39.zip"
echo "📊 Layer size: $(du -h pdf-tools-layer-python39.zip | cut -f1)"

echo ""
echo "🚀 Next steps:"
echo "1. Upload $(pwd)/pdf-tools-layer-python39.zip to AWS Lambda Layers"
echo "2. Set compatible runtime to Python 3.9"
echo "3. Attach to your Resume Processor Lambda function"
echo "4. Test with both PDFs to verify pdfminer.six works"

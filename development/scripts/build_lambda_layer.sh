#!/bin/bash

# Script to build Lambda Layer using Python 3.9 Docker container
# This ensures compatibility with AWS Lambda Python 3.9 runtime

set -e

echo "🐳 Building Lambda Layer with Python 3.9 Docker Container..."

# Clean up any existing build
rm -rf lambda_layer_docker_build
mkdir -p lambda_layer_docker_build

# Create requirements.txt
cat > lambda_layer_docker_build/requirements.txt << EOF
pdfminer.six==20231228
chardet==5.2.0
cryptography==41.0.7
EOF

# Create Dockerfile for Python 3.9
cat > lambda_layer_docker_build/Dockerfile << EOF
FROM python:3.9-slim

WORKDIR /build

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Create python directory and install packages
RUN mkdir -p python && \\
    pip install --no-cache-dir --target python -r requirements.txt

# Create the zip file
RUN cd /build && zip -r pdf-tools-layer-python39.zip python/

CMD ["cp", "/build/pdf-tools-layer-python39.zip", "/output/"]
EOF

echo "📦 Building Docker image..."
cd lambda_layer_docker_build
docker build -t lambda-layer-builder .

echo "🔧 Creating layer zip file..."
docker run --rm -v "$(pwd):/output" lambda-layer-builder

echo "✅ Layer built successfully!"
ls -lh pdf-tools-layer-python39.zip

echo "🧪 Testing layer contents..."
unzip -l pdf-tools-layer-python39.zip | head -10

echo "📁 Layer file location: $(pwd)/pdf-tools-layer-python39.zip"
echo "📊 Layer size: $(du -h pdf-tools-layer-python39.zip | cut -f1)"

echo ""
echo "🚀 Next steps:"
echo "1. Upload this zip file to AWS Lambda Layers"
echo "2. Set compatible runtime to Python 3.9"
echo "3. Attach to your Resume Processor Lambda function"

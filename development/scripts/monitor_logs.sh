#!/bin/bash

# Real-time Lambda log monitoring for TruJobs
echo "📡 Starting real-time log monitoring for resume-processor..."
echo "Press Ctrl+C to stop"
echo "=========================================================="

aws logs tail /aws/lambda/resume-processor --region ap-south-1 --follow --format short

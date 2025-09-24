#!/usr/bin/env python3

# Create a simple test PDF to verify our S3 fix works
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

def create_test_resume():
    """Create a simple test resume PDF"""
    filename = "test_resume_clean.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    
    # Add content
    c.drawString(100, 750, "GANESH AGRAHARI")
    c.drawString(100, 730, "Email: ganeshagrahari108@gmail.com")
    c.drawString(100, 710, "Phone: +91-9876543210")
    c.drawString(100, 690, "Location: Mumbai, India")
    
    c.drawString(100, 650, "SKILLS:")
    c.drawString(120, 630, "• Python Programming")
    c.drawString(120, 610, "• Machine Learning")
    c.drawString(120, 590, "• AWS Services")
    c.drawString(120, 570, "• Data Analysis")
    
    c.drawString(100, 530, "EXPERIENCE:")
    c.drawString(120, 510, "• AI/ML Engineer at TechCorp (2022-2024)")
    c.drawString(120, 490, "• Data Scientist at DataInc (2020-2022)")
    
    c.drawString(100, 450, "EDUCATION:")
    c.drawString(120, 430, "• B.Tech Computer Science - IIT Mumbai (2020)")
    
    c.drawString(100, 390, "PROJECTS:")
    c.drawString(120, 370, "• AI Recruitment System")
    c.drawString(120, 350, "• PDF Processing Pipeline")
    
    c.drawString(100, 310, "CERTIFICATIONS:")
    c.drawString(120, 290, "• AWS Certified Solutions Architect")
    c.drawString(120, 270, "• Google Cloud Professional ML Engineer")
    
    c.save()
    
    print(f"✅ Created test PDF: {filename}")
    print(f"📁 Size: {os.path.getsize(filename)} bytes")
    return filename

if __name__ == "__main__":
    try:
        filename = create_test_resume()
        print(f"🎯 Test this PDF with your API to verify S3 fix works!")
        print(f"📋 Use this file: {os.path.abspath(filename)}")
    except ImportError:
        print("❌ reportlab not installed. Install with: pip install reportlab")
        print("🔧 Alternative: Use any clean PDF file for testing")

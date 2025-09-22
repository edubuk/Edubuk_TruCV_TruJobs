# 🧪 TruJobs API Testing Guide

> **FOR TESTING TEAM:** Complete API testing documentation for TruJobs AI Recruitment System. Follow this guide to validate all three production endpoints.

## 🎯 **Testing Overview**

This guide covers testing for **3 main API endpoints** that power the TruJobs recruitment platform:

1. **📄 Job Description Upload** - Process and store job descriptions
2. **👤 Resume Upload** - Process and store candidate resumes  
3. **🎯 Candidate Matching** - Match resumes to job descriptions

---

## 🔧 **API Configuration**

### **Base Configuration:**
- **Base URL**: `https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod/`
- **Region**: ap-south-1 (Mumbai)
- **Authentication**: API Key required in headers
- **Content-Type**: `multipart/form-data` (for uploads), `application/json` (for matching)

### **Required Headers:**
```
x-api-key: KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47
Content-Type: multipart/form-data (for uploads) | application/json (for matching)
```

---

## 📄 **TEST 1: Job Description Upload**

### **Endpoint Details:**
- **URL**: `POST /JDUpload`
- **Purpose**: Upload and process job description PDFs or text
- **Expected Response Time**: < 3 seconds

### **Test Scenarios:**

#### **Scenario 1A: PDF Upload (Recommended)**
```
Method: POST
URL: https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod/JDUpload
Headers:
  x-api-key: KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47
  Content-Type: multipart/form-data

Body (form-data):
  file: [Select PDF file - Job Description]
```

#### **Scenario 1B: JSON Text Upload**
```
Method: POST
URL: https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod/JDUpload
Headers:
  x-api-key: KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47
  Content-Type: application/json

Body (raw JSON):
{
  "job_description": "Software Engineer position requiring 3+ years experience in Python, React, and AWS. Responsibilities include developing web applications, API design, and database management. Location: Mumbai. Salary: 8-12 LPA."
}
```

### **✅ Expected Success Response:**
```json
{
  "message": "Successfully processed job description",
  "job_description_id": "abc123-def456-ghi789",
  "job_title": "Software Engineer",
  "filename": "abc123-def456-ghi789.pdf",
  "s3_key": "JD/abc123-def456-ghi789.pdf",
  "input_type": "pdf"
}
```

### **🚨 Test Validation Points:**
- ✅ Status Code: `200 OK`
- ✅ Response contains `job_description_id` (save this for matching tests)
- ✅ Response time < 3 seconds
- ✅ `job_title` extracted correctly
- ✅ S3 key shows proper file storage

---

## 👤 **TEST 2: Resume Upload**

### **Endpoint Details:**
- **URL**: `POST /ResumeUpload`
- **Purpose**: Upload and process candidate resume PDFs
- **Expected Response Time**: < 4 seconds

### **Test Scenario:**

#### **Resume PDF Upload**
```
Method: POST
URL: https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod/ResumeUpload
Headers:
  x-api-key: KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47
  Content-Type: multipart/form-data

Body (form-data):
  file: [Select PDF file - Resume]
  job_description_id: abc123-def456-ghi789  // Use ID from Test 1
```

### **✅ Expected Success Response:**
```json
{
  "message": "Successfully processed resume",
  "resume_id": "xyz789-abc123-def456",
  "filename": "xyz789-abc123-def456.pdf",
  "job_description_id": "abc123-def456-ghi789",
  "candidate_name": "John Doe",
  "s3_key": "resumes/xyz789-abc123-def456.pdf"
}
```

### **🚨 Test Validation Points:**
- ✅ Status Code: `200 OK`
- ✅ Response contains `resume_id` (save this for matching tests)
- ✅ Response time < 4 seconds
- ✅ `candidate_name` extracted correctly
- ✅ `job_description_id` matches the one from Test 1
- ✅ S3 key shows proper file storage

---

## 🎯 **TEST 3: Candidate Matching**

### **Endpoint Details:**
- **URL**: `POST /resume_Similarity`
- **Purpose**: Find and rank candidates for a specific job description
- **Expected Response Time**: < 3 seconds

### **Test Scenarios:**

#### **Scenario 3A: Basic Candidate Matching (Functional)**
```
Method: POST
URL: https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod/resume_Similarity
Headers:
  x-api-key: KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47
  Content-Type: application/json

Body (raw JSON):
{
  "job_description_id": "caec0719-ec4d-4340-aa1e-e673ec0181f9",
  "top_k": 5,
  "similarity_threshold": 0.0,
  "calculate_similarity": true
}
```

#### **Scenario 3B: Test with Your Job Description ID**
```
Method: POST
URL: https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod/resume_Similarity
Headers:
  x-api-key: KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47
  Content-Type: application/json

Body (raw JSON):
{
  "job_description_id": "[Use ID from Test 1 results]",
  "top_k": 5,
  "similarity_threshold": 0.0,
  "calculate_similarity": true
}
```

### **✅ Expected Success Response:**
```json
{
  "job_description": {
    "id": "caec0719-ec4d-4340-aa1e-e673ec0181f9",
    "title": "AI Intern Job Description"
  },
  "matches": [
    {
      "resume_id": "4686d2dd-f849-4daa-9fdd-13cad795fbc0",
      "candidate_name": "Vishul",
      "similarity_score": 0.8234,
      "vector_scores": {
        "skills": 0.8567,
        "experience": 0.7892,
        "certifications": 0.8123,
        "projects": 0.8354
      },
      "match_explanation": "Strong match for AI role with relevant machine learning skills",
      "metadata": {
        "summary": "AI specialist with machine learning experience...",
        "skills": "Python, TensorFlow, Machine Learning, Data Science",
        "full_name": "Vishul",
        "email": "vishul@email.com",
        "location": "Mumbai"
      }
    }
  ],
  "total_matches": 1,
  "execution_time": "1.5234s",
  "debug_info": {
    "total_resumes_found": 1,
    "job_embedding_dimension": 1024,
    "similarity_threshold": 0.0,
    "job_title": "AI Intern Job Description"
  }
}
```

### **🚨 Test Validation Points:**
- ✅ Status Code: `200 OK`
- ✅ Response time < 3 seconds
- ✅ `total_matches` > 0 (if resumes were uploaded for this job)
- ✅ Each match contains candidate details
- ✅ `execution_time` is reasonable
- ✅ `debug_info` shows resumes were found

---

## 🔍 **COMPREHENSIVE TEST SCENARIOS**

### **End-to-End Workflow Test:**

#### **Test Case: Complete Hiring Workflow**

1. **Step 1**: Upload Job Description (Test 1)
   - Save the returned `job_description_id`

2. **Step 2**: Upload Multiple Resumes (Test 2)
   - Upload 2-3 different resume PDFs
   - Use the same `job_description_id` for all
   - Save all returned `resume_id`s

3. **Step 3**: Test Matching (Test 3)
   - Use the `job_description_id` from Step 1
   - Verify all uploaded resumes appear in matches

#### **Expected Results:**
- All 3 API calls should return `200 OK`
- Matching should return all uploaded candidates
- Each candidate should have extracted metadata

---

## 📊 **TEST DATA SAMPLES**

### **Sample Job Description Text:**
```
Position: Senior Software Engineer
Company: Tech Innovations Pvt Ltd
Location: Mumbai, India
Experience: 5+ years

Requirements:
- Strong experience in Python, Django, React
- AWS cloud services (EC2, S3, RDS)
- Database design (PostgreSQL, MongoDB)
- API development and microservices
- Agile development methodologies

Responsibilities:
- Lead development of web applications
- Design and implement RESTful APIs
- Collaborate with cross-functional teams
- Mentor junior developers
- Ensure code quality and best practices

Benefits:
- Competitive salary (15-20 LPA)
- Health insurance
- Flexible work hours
- Learning and development opportunities
```

### **Sample Test Files:**
- **Job Description PDF**: Create a PDF with the above content
- **Resume PDFs**: Create 2-3 sample resumes with different skill sets
  - Resume 1: Python developer with 3 years experience
  - Resume 2: React developer with 2 years experience  
  - Resume 3: Full-stack developer with 5 years experience

---

## ❌ **ERROR SCENARIOS TO TEST**

### **Authentication Errors:**
```
Test: Missing API Key
Expected: 401 Unauthorized or 403 Forbidden

Test: Invalid API Key
Expected: 401 Unauthorized or 403 Forbidden
```

### **Invalid Data Errors:**
```
Test: Upload non-PDF file to resume endpoint
Expected: 400 Bad Request with error message

Test: Empty job description text
Expected: 400 Bad Request with validation error

Test: Invalid job_description_id in matching
Expected: 404 Not Found or empty matches
```

### **File Size Errors:**
```
Test: Upload very large PDF (>10MB)
Expected: 413 Payload Too Large or timeout

Test: Upload corrupted PDF
Expected: 400 Bad Request with processing error
```

---

## 🎯 **SUCCESS CRITERIA**

### **For Each Endpoint:**
- ✅ **Response Time**: All APIs respond within expected time limits
- ✅ **Status Codes**: Proper HTTP status codes for success/error scenarios
- ✅ **Data Extraction**: AI successfully extracts relevant information
- ✅ **Data Storage**: Files stored in S3, metadata in OpenSearch
- ✅ **Error Handling**: Graceful error responses with helpful messages

### **For End-to-End Flow:**
- ✅ **Data Consistency**: IDs match across all three endpoints
- ✅ **Workflow Completion**: Can complete full hire-to-match workflow
- ✅ **Business Logic**: Only resumes uploaded for specific jobs appear in matches

---

## 🔧 **TROUBLESHOOTING GUIDE**

### **Common Issues:**

#### **1. 401/403 Authentication Errors**
- **Check**: API key is correct and included in headers
- **Solution**: Verify `x-api-key: KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47`

#### **2. Empty Matches in Similarity API**
- **Check**: Are you using the correct `job_description_id`?
- **Check**: Were resumes uploaded with the same `job_description_id`?
- **Solution**: Upload resumes first, then test matching

#### **3. PDF Processing Failures**
- **Check**: Is the PDF readable and not password-protected?
- **Check**: File size < 10MB?
- **Solution**: Try with a simple, text-based PDF

#### **4. Slow Response Times**
- **Expected**: First request may be slower (cold start)
- **Normal**: Subsequent requests should be faster
- **Escalate**: If consistently > 10 seconds

---

## 📞 **SUPPORT & ESCALATION**

### **For Testing Issues:**
- **Check CloudWatch logs** for detailed error information
- **Verify all prerequisites** (API key, file formats, required fields)
- **Test with provided sample data** before using custom files

### **Test Report Template:**
```
Endpoint: [/JDUpload | /ResumeUpload | /resume_Similarity]
Test Case: [Brief description]
Status: [PASS | FAIL]
Response Time: [X.XX seconds]
Issues Found: [Description of any problems]
Expected vs Actual: [What you expected vs what happened]
```

---

## ✅ **TESTING CHECKLIST**

### **Pre-Testing Setup:**
- [ ] API key configured correctly
- [ ] Postman/testing tool set up with base URL
- [ ] Sample PDF files prepared
- [ ] Test job description text ready

### **Functional Testing:**
- [ ] Job Description Upload (PDF)
- [ ] Job Description Upload (JSON)
- [ ] Resume Upload (single PDF)
- [ ] Resume Upload (multiple PDFs for same job)
- [ ] Candidate Matching (basic)
- [ ] Candidate Matching (with parameters)

### **Error Testing:**
- [ ] Invalid API key
- [ ] Missing required fields
- [ ] Invalid file formats
- [ ] Non-existent job_description_id

### **Performance Testing:**
- [ ] Response times within limits
- [ ] Multiple concurrent requests
- [ ] Large file uploads

**🎉 Happy Testing! The TruJobs API is ready for comprehensive validation.**
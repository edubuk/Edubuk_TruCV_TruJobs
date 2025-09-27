# 📄 TruJobs Resume Processing System Documentation

> **Complete Guide:** Understanding the AI-powered resume processing pipeline, metadata extraction, embedding generation, and document indexing system.

## 📋 **Table of Contents**

1. [System Architecture & File Structure](#-system-architecture--file-structure)
2. [Processing Pipeline Overview](#-processing-pipeline-overview)
3. [AI-Powered Metadata Extraction](#-ai-powered-metadata-extraction)
4. [Multi-Vector Embedding System](#-multi-vector-embedding-system)
5. [Input Methods & Data Handling](#-input-methods--data-handling)
6. [OpenSearch Integration](#-opensearch-integration)
7. [API Configuration & Parameters](#-api-configuration--parameters)
8. [Error Handling & Validation](#-error-handling--validation)
9. [Performance Optimization](#-performance-optimization)
10. [Troubleshooting Guide](#-troubleshooting-guide)

---

## 📁 **System Architecture & File Structure**

### **Core Resume Processing Files:**

#### **`lambda_function.py`** - Main Processing Orchestrator
- **Purpose**: Entry point for all resume processing requests
- **Responsibilities**:
  - Handle multiple input types (JSON, multipart form, S3 events)
  - Coordinate the complete processing pipeline
  - Generate unique resume IDs and manage file storage
  - Orchestrate AI processing and database indexing
  - Manage error handling and response formatting
- **Key Functions**: `lambda_handler()`, main processing workflow coordination

#### **`pdf_processor.py`** - Document Processing Engine
- **Purpose**: Handle PDF document parsing and text extraction
- **Responsibilities**:
  - Extract text content from PDF files using PyPDF2
  - Parse multipart form data from API Gateway
  - Save PDF documents to S3 storage
  - Handle binary data encoding/decoding
  - Validate PDF document structure and content
- **Key Functions**: `extract_text_from_pdf()`, `save_pdf_to_s3()`, `parse_multipart_form()`

#### **`ai_services.py`** - AI Processing Core
- **Purpose**: AI-powered content analysis and embedding generation
- **Responsibilities**:
  - Extract structured metadata using AWS Bedrock LLM
  - Generate specialized embeddings for different resume sections
  - Create 4 distinct vector representations (skills, experience, certifications, projects)
  - Handle AI model interactions and response parsing
  - Manage text preprocessing and chunking
- **Key Functions**: `get_metadata_from_bedrock()`, `create_section_embeddings()`

#### **`input_parser.py`** - Multi-Format Input Handler
- **Purpose**: Parse and validate different input formats
- **Responsibilities**:
  - Detect input type (JSON, multipart, S3 event)
  - Parse JSON payloads for direct text processing
  - Handle S3 event notifications for file uploads
  - Extract PDF content from various input sources
  - Validate input data structure and content
- **Key Functions**: `determine_input_type()`, `parse_json_input()`, `parse_s3_event()`

#### **`opensearch_client.py`** - Database Management Layer
- **Purpose**: Handle OpenSearch database operations and indexing
- **Responsibilities**:
  - Initialize authenticated OpenSearch connections
  - Create and manage index mappings
  - Index resume documents with multi-vector embeddings
  - Normalize metadata for search optimization
  - Handle database schema updates and migrations
- **Key Functions**: `get_opensearch_client()`, `index_resume_document()`, `normalize_metadata_for_opensearch()`

#### **`prompts.py`** - AI Prompt Engineering
- **Purpose**: Define structured prompts for AI metadata extraction
- **Responsibilities**:
  - Provide optimized prompts for Bedrock LLM
  - Ensure consistent metadata extraction format
  - Define strict rules for literal data extraction
  - Prevent AI hallucination and inference errors
- **Key Functions**: `get_metadata_extraction_prompt()`

#### **`config.py`** - Configuration Management
- **Purpose**: Centralized configuration and environment settings
- **Responsibilities**:
  - Define AWS regions and service endpoints
  - Configure Bedrock model IDs and parameters
  - Set S3 bucket names and storage paths
  - Manage processing limits and dimensions
  - Configure OpenSearch connection settings
- **Contains**: `EMBEDDING_MODEL_ID`, `LLM_MODEL_ID`, `MAX_TEXT_LENGTH`, `BUCKET_NAME`

### **Data Flow Architecture:**

```
PDF Upload → input_parser.py → pdf_processor.py → Text Extraction
     ↓            ↓                    ↓                ↓
Input Detection  Format Parsing    PDF Processing    Raw Text
     ↓            ↓                    ↓                ↓
Validation   ai_services.py       Bedrock LLM      Metadata Extraction
     ↓            ↓                    ↓                ↓
Processing   Embedding Generation  Vector Creation   Multi-Vector System
     ↓            ↓                    ↓                ↓
Storage      opensearch_client.py  Index Creation   Database Storage
```

### **Integration Points:**

- **AWS Lambda**: Serverless compute for resume processing
- **AWS Bedrock**: AI models for metadata extraction and embeddings
- **AWS S3**: Document storage and retrieval
- **AWS OpenSearch**: Vector database for similarity search
- **API Gateway**: HTTP endpoint for multipart and JSON uploads (Resume PDF or JSON via `/ResumeUpload`)

---

## 🔄 **Processing Pipeline Overview**

### **Complete Resume Processing Workflow:**

```
1. Input Reception → 2. Content Extraction → 3. AI Analysis → 4. Vector Generation → 5. Database Indexing
     ↓                      ↓                   ↓               ↓                    ↓
Multiple Input Types    PDF Text Extraction   LLM Metadata    4-Vector Embeddings   OpenSearch Storage
• JSON (text)           • PyPDF2 parsing      • Structured    • Skills vector        • Multi-vector index
• Multipart (file)      • S3 storage         extraction      • Experience vector    • Metadata fields
• S3 Events             • Binary handling     • JSON format   • Certification vector • Search optimization
                                                              • Projects vector
```

### **Processing Stages in Detail:**

#### **Stage 1: Input Reception & Validation**
- **Input Type Detection**: Automatically identify JSON, multipart form, or S3 event
- **Content Validation**: Verify file format, size limits, and required parameters
- **Security Checks**: Validate file types and prevent malicious uploads
- **ID Generation**: Create unique resume identifiers for tracking

#### **Stage 2: Content Extraction & Storage**
- **PDF Processing**: Extract text using PyPDF2 with error handling
- **S3 Storage**: Save original PDF files with organized naming conventions
- **Text Preprocessing**: Clean and normalize extracted text content
- **Format Validation**: Ensure text quality and completeness

#### **Stage 3: AI-Powered Analysis**
- **Metadata Extraction**: Use Claude LLM to extract structured information
- **Strict Parsing**: Apply literal extraction rules to prevent hallucination
- **Data Validation**: Verify extracted metadata format and completeness
- **Error Recovery**: Handle AI model failures and partial extractions

#### **Stage 4: Multi-Vector Embedding Generation**
- **Section Segmentation**: Divide resume into specialized sections
- **Vector Creation**: Generate 1024-dimensional embeddings for each section
- **Quality Assurance**: Validate embedding dimensions and completeness
- **Performance Optimization**: Batch processing for efficiency

#### **Stage 5: Database Indexing & Storage**
- **Index Preparation**: Normalize metadata for OpenSearch compatibility
- **Multi-Vector Storage**: Index all 4 embedding vectors with metadata
- **Search Optimization**: Configure field mappings for efficient retrieval
- **Consistency Checks**: Verify successful indexing and data integrity

---

## 🧠 **AI-Powered Metadata Extraction**

### **Bedrock LLM Integration:**

#### **Model Configuration:**
```json
{
  "model_id": "anthropic.claude-3-haiku-20240307-v1:0",
  "max_tokens": 4096,
  "temperature": 0.1,
  "extraction_mode": "literal_only"
}
```

#### **Extraction Rules & Principles:**

##### **1. Literal Extraction Only**
- Extract information **EXACTLY** as written in the resume
- No inference, interpretation, or assumption allowed
- Treat as pure text parsing task, not content analysis

##### **2. Strict Field Validation**
- **Skills**: Only from explicit "Skills" or "Technical Skills" sections
- **Experience**: Job titles, companies, dates as literally stated
- **Education**: Degrees, institutions, graduation years only
- **Certifications**: Exact certification names and issuers

##### **3. No Hallucination Prevention**
```python
# CORRECT: Explicit skills section
"Skills: Java, Python, React" → ["Java", "Python", "React"]

# INCORRECT: Inferred from job description  
"Worked on Java projects" → [] (NOT ["Java"])
```

#### **Extracted Metadata Structure:**
```json
{
  "full_name": "John Smith",
  "email": "john.smith@email.com",
  "phone": "+1-555-0123",
  "location": "San Francisco, CA",
  "skills": ["Python", "JavaScript", "AWS"],
  "work_experience": [
    {
      "job_title": "Software Engineer",
      "company": "Tech Corp",
      "start_date": "2020-01",
      "end_date": "2023-12",
      "description": "Developed web applications..."
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University of Technology",
      "graduation_year": "2020"
    }
  ],
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect",
      "issuer": "Amazon Web Services",
      "date": "2022-06"
    }
  ],
  "projects": [
    {
      "name": "E-commerce Platform",
      "description": "Built using React and Node.js",
      "technologies": ["React", "Node.js"]
    }
  ]
}
```

---

## 🔢 **Multi-Vector Embedding System**

### **4-Vector Architecture:**

#### **Vector Specialization:**
1. **Skills Vector** - Technical and soft skills representation
2. **Experience Vector** - Work history and professional roles
3. **Certification Vector** - Formal qualifications and certifications
4. **Projects Vector** - Project experience and achievements

#### **Embedding Generation Process:**

##### **Step 1: Section Text Preparation**
```python
sections = {
    "skills": extract_skills_text(metadata),
    "experience": extract_experience_text(metadata),
    "certifications": extract_certifications_text(metadata),
    "projects": extract_projects_text(metadata)
}
```

##### **Step 2: Titan Embedding Model Processing**
```json
{
  "model_id": "amazon.titan-embed-text-v2:0",
  "dimensions": 1024,
  "normalize": true,
  "input_type": "search_document"
}
```

##### **Step 3: Vector Quality Validation**
- **Dimension Check**: Ensure 1024-dimensional vectors
- **Normalization**: Apply L2 normalization for cosine similarity
- **Completeness**: Handle missing sections gracefully
- **Quality Score**: Validate embedding quality metrics

#### **Vector Storage Structure:**
```json
{
  "resume_id": "uuid-4-format",
  "candidate_name": "John Smith",
  "skills_vector": [1024 float values],
  "experience_vector": [1024 float values],
  "certification_vector": [1024 float values],
  "projects_vector": [1024 float values],
  "metadata": { /* structured metadata */ },
  "timestamp": "2025-09-17T10:30:00Z"
}
```

---

## 📥 **Input Methods & Data Handling**

### **Supported Input Types:**

#### **1. JSON Direct Input** (Testing & Integration)
```json
{
  "resume_content": "Full resume text content...",
  "job_description_id": "jd-12345",
  "metadata": {
    "source": "api_integration",
    "processing_mode": "immediate"
  }
}
```

Option B (structured resume object):
```json
{
  "resume_json": {
    "name": "Jane Doe",
    "contact": {"email": "jane@example.com", "phone": "+91-9000000000"},
    "education": [{"institution": "XYZ University", "degree": "B.Tech", "duration": "2019-2023"}],
    "experience": [{"title": "Software Engineer", "organization": "ACME", "duration": "2023–Present"}],
    "skills": {"languages": ["Python", "JavaScript"], "frameworks_libraries": ["React", "Node"]}
  },
  "job_description_id": "jd-12345"
}
```

#### **2. Multipart Form Upload** (Web Interface)
```http
POST /ResumeUpload
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="resume.pdf"
Content-Type: application/pdf

[PDF Binary Content]
------WebKitFormBoundary
Content-Disposition: form-data; name="job_description_id"

jd-67890
------WebKitFormBoundary--
```

#### **JSON Resume Upload via API** (Text-only)
```http
POST /ResumeUpload
Content-Type: application/json

Option A (simple text):
{
  "resume_content": "Full resume text content pasted here...",
  "job_description_id": "jd-12345"
}

Option B (structured resume object):
{
  "resume_json": {
    "name": "Jane Doe",
    "contact": {"email": "jane@example.com", "phone": "+91-9000000000"},
    "education": [{"institution": "XYZ University", "degree": "B.Tech", "duration": "2019-2023"}],
    "experience": [{"title": "Software Engineer", "organization": "ACME", "duration": "2023–Present"}],
    "skills": {"languages": ["Python", "JavaScript"], "frameworks_libraries": ["React", "Node"]}
  },
  "job_description_id": "jd-12345"
}
```

JSON uploads bypass PDF parsing, but the flattened resume text is now persisted to S3 for audit/traceability under:
- `s3://trujobs-db/resumes/{resume_id}.txt`

The API response contains `s3_key` pointing to this `.txt` object.

JSON Schema (required fields):
```json
{
  "type": "object",
  "required": ["job_description_id"],
  "properties": {
    "resume_content": {"type": "string", "minLength": 1, "description": "Full resume text"},
    "resume_json": {"type": "object", "description": "Structured resume object", "additionalProperties": true},
    "job_description_id": {"type": "string", "minLength": 1},
    "metadata": {"type": "object", "additionalProperties": true}
  }
}
```

Postman steps (JSON Resume Upload):
1) Method: POST
2) URL: https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod/ResumeUpload
3) Headers:
   - x-api-key: KXXpej8bvb6TGQ9Rs8hcXB7WRLC7eoe5XYkMbd47
   - Content-Type: application/json
4) Body: Select raw → JSON, then use Option A (`resume_content`) or Option B (`resume_json`)
5) Send and verify 200 OK
6) Validate response contains `resume_id`, `candidate_name`, and `s3_key` (should be `resumes/{resume_id}.txt`)

#### **3. S3 Event Trigger** (Automated Processing)
```json
{
  "Records": [
    {
      "s3": {
        "bucket": {"name": "trujobs-db"},
        "object": {"key": "resumes/resume-12345.pdf"}
      }
    }
  ]
}
```

### **Input Processing Features:**

#### **Automatic Format Detection**
- Content-Type header analysis
- Boundary detection for multipart data
- S3 event structure recognition
- Fallback mechanisms for ambiguous inputs

#### **File Handling Capabilities**
- **PDF Support**: Primary document format
- **Base64 Encoding**: Binary content transport
- **Size Limits**: Configurable maximum file sizes
- **Validation**: File format and content verification

#### **Error Recovery**
- **Partial Processing**: Continue with available data
- **Format Fallbacks**: Multiple parsing attempts
- **Graceful Degradation**: Handle missing components
- **Detailed Logging**: Comprehensive error tracking

---

## 🔍 **OpenSearch Integration**

### **Index Configuration:**

#### **Index Mapping Structure:**
```json
{
  "mappings": {
    "properties": {
      "resume_id": {"type": "keyword"},
      "candidate_name": {"type": "text"},
      "skills_vector": {
        "type": "knn_vector",
        "dimension": 1024,
        "method": {
          "name": "hnsw",
          "space_type": "cosinesimil"
        }
      },
      "experience_vector": {
        "type": "knn_vector",
        "dimension": 1024,
        "method": {
          "name": "hnsw", 
          "space_type": "cosinesimil"
        }
      },
      "certification_vector": {
        "type": "knn_vector",
        "dimension": 1024,
        "method": {
          "name": "hnsw",
          "space_type": "cosinesimil"
        }
      },
      "projects_vector": {
        "type": "knn_vector",
        "dimension": 1024,
        "method": {
          "name": "hnsw",
          "space_type": "cosinesimil"
        }
      },
      "metadata": {
        "type": "object",
        "properties": {
          "skills": {"type": "keyword"},
          "location": {"type": "keyword"},
          "experience_years": {"type": "integer"}
        }
      }
    }
  }
}
```

#### **Indexing Process:**

##### **Step 1: Document Preparation**
- Normalize metadata fields for search optimization
- Validate vector dimensions and data types
- Prepare document ID and routing information
- Add timestamp and versioning metadata

##### **Step 2: Multi-Vector Indexing**
- Index all 4 vectors simultaneously
- Ensure atomic operations for consistency
- Configure similarity search parameters
- Set up field mappings for metadata

##### **Step 3: Search Optimization**
- Configure HNSW algorithm parameters
- Set up cosine similarity calculations
- Optimize index refresh settings
- Enable real-time search capabilities

---

## ⚙️ **API Configuration & Parameters**

### **Environment Configuration:**

#### **AWS Services:**
```python
AWS_REGION = 'ap-south-1'
BEDROCK_ENDPOINT = 'https://bedrock-runtime.ap-south-1.amazonaws.com'
OPENSEARCH_ENDPOINT = 'https://xyz.ap-south-1.aoss.amazonaws.com'
```

#### **Model Configuration:**
```python
EMBEDDING_MODEL_ID = 'amazon.titan-embed-text-v2:0'
LLM_MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0'
EMBEDDING_DIMENSION = 1024
```

#### **Processing Limits:**
```python
MAX_TEXT_LENGTH = 8000      # Maximum resume text length
MAX_EMBEDDING_LENGTH = 2000 # Maximum text per embedding
BUCKET_NAME = 'trujobs-db'  # S3 storage bucket
RESUME_PREFIX = 'resumes/'  # S3 object prefix
```

### **API Response Format:**

#### **Success Response:**
```json
{
  "statusCode": 200,
  "resume_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "processing_status": "completed",
  "metadata_extracted": true,
  "vectors_generated": 4,
  "indexed_successfully": true,
  "processing_time": "3.45s",
  "s3_location": "s3://trujobs-db/resumes/resume-12345.pdf",
  "extracted_metadata": {
    "candidate_name": "John Smith",
    "skills_count": 15,
    "experience_years": 5,
    "certifications_count": 2
  }
}
```

#### **Error Response:**
```json
{
  "statusCode": 400,
  "error": true,
  "message": "PDF processing failed: Invalid file format",
  "error_details": {
    "stage": "pdf_extraction",
    "original_error": "PyPDF2.PdfReadError: EOF marker not found"
  },
  "resume_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "processing_time": "1.23s"
}
```

---

## 🛡️ **Error Handling & Validation**

### **Processing Stage Error Handling:**

#### **1. Input Validation Errors**
```python
# File format validation
if not content_type.startswith('application/pdf'):
    raise ValueError('Only PDF files are supported')

# Size limit enforcement  
if len(pdf_content) > MAX_FILE_SIZE:
    raise ValueError('File size exceeds maximum limit')

# Content validation
if not extracted_text or len(extracted_text.strip()) < 100:
    raise ValueError('Insufficient text content extracted')
```

#### **2. AI Processing Errors**
```python
# Bedrock API failures
try:
    response = bedrock.invoke_model(body=body, modelId=model_id)
except Exception as e:
    logger.error(f"Bedrock invocation failed: {str(e)}")
    # Implement fallback processing or graceful degradation
```

#### **3. Database Indexing Errors**
```python
# OpenSearch connection issues
try:
    opensearch.index(index=index_name, body=document)
except Exception as e:
    logger.error(f"Indexing failed: {str(e)}")
    # Retry with exponential backoff
```

### **Validation Checkpoints:**

#### **Content Validation:**
- **PDF Structure**: Valid PDF format and readability
- **Text Quality**: Minimum content length and readability
- **Character Encoding**: UTF-8 compliance and special character handling
- **File Integrity**: Complete file transfer and no corruption

#### **Metadata Validation:**
- **Required Fields**: Presence of essential information
- **Data Types**: Correct field types and formats
- **Value Ranges**: Reasonable values for dates, numbers
- **Consistency**: Cross-field validation and logical checks

#### **Vector Validation:**
- **Dimension Consistency**: All vectors are 1024-dimensional
- **Numerical Validity**: No NaN or infinite values
- **Normalization**: Proper L2 normalization applied
- **Completeness**: All expected vectors generated

---

## 🚀 **Performance Optimization**

### **Processing Optimizations:**

#### **1. Concurrent Processing**
```python
# Parallel embedding generation
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = {
        executor.submit(create_embedding, skills_text): 'skills',
        executor.submit(create_embedding, exp_text): 'experience',
        executor.submit(create_embedding, cert_text): 'certifications', 
        executor.submit(create_embedding, proj_text): 'projects'
    }
```

#### **2. Batch Operations**
- **Multi-Vector Indexing**: Index all vectors in single operation
- **Metadata Batching**: Group metadata operations
- **S3 Parallel Uploads**: Concurrent file storage
- **Connection Pooling**: Reuse database connections

#### **3. Memory Management**
```python
# Stream processing for large files
with BytesIO(pdf_content) as pdf_stream:
    text = extract_text_from_pdf(pdf_stream)
    # Process in chunks to manage memory
```

### **Caching Strategies:**

#### **1. Model Response Caching**
- Cache Bedrock model responses for identical inputs
- Implement TTL-based cache expiration
- Use content hashing for cache keys

#### **2. Embedding Caching**
- Store frequently used embeddings
- Implement semantic similarity caching
- Use Redis for distributed caching

#### **3. Connection Caching**
- Reuse OpenSearch connections
- Pool S3 client connections
- Cache authentication tokens

---

## 🔧 **Troubleshooting Guide**

### **Common Issues & Solutions:**

#### **1. PDF Processing Failures**

**Problem**: `PyPDF2.PdfReadError: EOF marker not found`
```python
# Solution: Implement multiple PDF parsing libraries
try:
    text = extract_with_pypdf2(pdf_content)
except PyPDF2.PdfReadError:
    try:
        text = extract_with_pdfplumber(pdf_content)
    except:
        text = extract_with_pymupdf(pdf_content)
```

**Problem**: Garbled or empty text extraction
```python
# Solution: Enhanced text cleaning and validation
def clean_extracted_text(text):
    # Remove non-printable characters
    text = ''.join(char for char in text if char.isprintable() or char.isspace())
    # Normalize whitespace
    text = ' '.join(text.split())
    return text
```

#### **2. AI Model Issues**

**Problem**: Bedrock model rate limiting
```python
# Solution: Implement exponential backoff
import time
import random

def call_bedrock_with_retry(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            return bedrock.invoke_model(...)
        except ClientError as e:
            if 'ThrottlingException' in str(e):
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                time.sleep(wait_time)
            else:
                raise
```

**Problem**: Metadata extraction returning invalid JSON
```python
# Solution: Enhanced JSON parsing with fallbacks
def parse_llm_response(response_text):
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        # Extract JSON from markdown code blocks
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        raise ValueError("No valid JSON found in response")
```

#### **3. OpenSearch Issues**

**Problem**: Index mapping conflicts
```python
# Solution: Dynamic mapping updates
def update_index_mapping(client, index_name, new_mapping):
    try:
        client.indices.put_mapping(index=index_name, body=new_mapping)
    except Exception as e:
        if 'mapper_parsing_exception' in str(e):
            # Create new index with updated mapping
            create_new_index_version(client, index_name, new_mapping)
```

**Problem**: Vector dimension mismatches
```python
# Solution: Vector validation and padding
def validate_vector_dimension(vector, expected_dim=1024):
    if len(vector) != expected_dim:
        if len(vector) < expected_dim:
            # Pad with zeros
            vector.extend([0.0] * (expected_dim - len(vector)))
        else:
            # Truncate to expected dimension
            vector = vector[:expected_dim]
    return vector
```

### **Performance Troubleshooting:**

#### **1. Slow Processing Times**

**Diagnostic Steps:**
```python
# Add timing measurements
import time

def time_operation(operation_name, func, *args, **kwargs):
    start_time = time.time()
    result = func(*args, **kwargs)
    duration = time.time() - start_time
    logger.info(f"{operation_name} took {duration:.2f} seconds")
    return result
```

**Common Bottlenecks:**
- **PDF Processing**: Large file sizes or complex layouts
- **AI Model Calls**: Network latency or model processing time
- **Database Operations**: Index size or connection issues
- **Memory Usage**: Large document processing

#### **2. High Error Rates**

**Monitoring Approach:**
```python
# Error rate tracking
error_counts = defaultdict(int)

def track_error(error_type, error_message):
    error_counts[error_type] += 1
    logger.error(f"Error type: {error_type}, Message: {error_message}")
    
    # Alert if error rate is high
    if error_counts[error_type] > ERROR_THRESHOLD:
        send_alert(f"High error rate for {error_type}")
```

### **Debugging Tools:**

#### **1. Comprehensive Logging**
```python
# Enhanced logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('resume_processing.log')
    ]
)
```

#### **2. Request Tracing**
```python
# Add correlation IDs for request tracking
import uuid

def process_resume_with_tracing(event, context):
    correlation_id = str(uuid.uuid4())
    logger.info(f"[{correlation_id}] Starting resume processing")
    
    try:
        # Process resume with correlation ID in all logs
        result = process_resume(event, correlation_id)
        logger.info(f"[{correlation_id}] Processing completed successfully")
        return result
    except Exception as e:
        logger.error(f"[{correlation_id}] Processing failed: {str(e)}")
        raise
```

---

## 📊 **Monitoring & Metrics**

### **Key Performance Indicators:**

#### **Processing Metrics:**
- **Throughput**: Resumes processed per minute
- **Success Rate**: Percentage of successful processings
- **Average Processing Time**: End-to-end processing duration
- **Error Rate**: Percentage of failed processings by stage

#### **Quality Metrics:**
- **Metadata Extraction Accuracy**: Successful field extractions
- **Vector Generation Success**: Complete 4-vector creation rate
- **Indexing Success**: Successful OpenSearch indexing rate
- **Text Extraction Quality**: Readable text extraction percentage

#### **Resource Utilization:**
- **Lambda Duration**: Function execution time distribution
- **Memory Usage**: Peak memory consumption per processing
- **API Call Costs**: Bedrock model invocation costs
- **Storage Costs**: S3 storage and OpenSearch index costs

### **Alerting Configuration:**

#### **Critical Alerts:**
- Processing success rate < 95%
- Average processing time > 30 seconds
- Error rate > 5% for any processing stage
- Vector generation failures > 2%

#### **Warning Alerts:**
- Processing time > 20 seconds
- Memory usage > 80% of allocated
- API call rate approaching limits
- Storage costs exceeding budget

---

**🎯 Ready to Process Resumes!** This comprehensive guide covers all aspects of the TruJobs resume processing system, from initial PDF upload to final vector indexing in the matching database.
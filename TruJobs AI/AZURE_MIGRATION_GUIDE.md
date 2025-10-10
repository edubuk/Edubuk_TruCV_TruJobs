# 🔄 TruJobs AWS to Azure Migration Guide

> **Production-Ready Migration Plan**: Complete guide for migrating the TruJobs AI-powered recruitment system from AWS to Microsoft Azure with zero downtime.

---

## 📋 Executive Summary

### Migration Overview

This document provides a comprehensive, step-by-step guide for migrating the TruJobs AI recruitment system from AWS to Microsoft Azure. The migration is designed to be completed in **6-8 weeks** with zero downtime using a parallel operation strategy.

### Current State (AWS)
- **Deployment**: Production-ready on AWS (ap-south-1 region)
- **Architecture**: Serverless, event-driven, AI-powered
- **Daily Volume**: 1000+ resumes/day processing capacity
- **Performance**: Sub-3-second response times
- **Uptime**: 99.9% availability

### Target State (Azure)
- **Deployment**: Azure (East US or West Europe region)
- **Architecture**: Equivalent serverless architecture with enhanced AI capabilities
- **Expected Performance**: Similar or better (3072-dim vectors vs 1024-dim)
- **Enhanced Features**: Superior monitoring with Application Insights

### Timeline
```
Week 1: Planning & Assessment
Week 2-3: Azure Environment Setup
Week 3-4: Data Migration (CRITICAL: Vector Re-generation)
Week 4-5: Application Deployment
Week 5-6: Testing & Validation
Week 6: Cutover & Go-Live
Week 7-8: Optimization & AWS Decommissioning
```

### Key Success Factors
✅ Zero downtime migration using parallel operation  
✅ Complete vector re-generation (1024-dim → 3072-dim)  
✅ Gradual traffic shift with rollback capability  
✅ Comprehensive testing at each phase  
✅ Detailed monitoring and validation  

---

## 🗺️ Service Mapping: AWS → Azure

### Complete Service Translation Table

| AWS Service | Azure Equivalent | Migration Complexity | Notes |
|-------------|------------------|---------------------|-------|
| **AWS Lambda** | **Azure Functions** | 🟡 Medium | Python 3.11 runtime, similar programming model |
| **Amazon Bedrock (Claude 3 Haiku)** | **Azure OpenAI Service (GPT-4)** | 🔴 High | API changes required, prompt adjustments needed |
| **Amazon Titan Embeddings (1024-dim)** | **Azure OpenAI text-embedding-3-large (3072-dim)** | 🔴 Critical | **ALL vectors must be regenerated** |
| **Amazon S3** | **Azure Blob Storage** | 🟢 Low | Direct file transfer with AzCopy |
| **Amazon OpenSearch Serverless** | **Azure AI Search** | 🔴 High | Query syntax differences, vector index recreation |
| **AWS API Gateway** | **Azure API Management (APIM)** | 🟡 Medium | Endpoint URLs change, client updates required |
| **AWS IAM Roles** | **Azure Managed Identity + RBAC** | 🟡 Medium | Credential management eliminated |
| **AWS CloudWatch** | **Azure Monitor + App Insights** | 🟢 Low | Enhanced monitoring capabilities |
| **AWS Secrets Manager** | **Azure Key Vault** | 🟢 Low | Direct secret migration |
| **AWS SDK (boto3)** | **Azure SDK** | 🟡 Medium | Code changes in all Lambda functions |

**Legend:**  
🟢 Low Complexity (1-2 days)  
🟡 Medium Complexity (3-5 days)  
🔴 High/Critical Complexity (1-2 weeks)

---

## 🏗️ Azure Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                                   │
│                   (Web App, Mobile App, External ATS)                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ HTTPS + API Key Authentication
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AZURE API MANAGEMENT (APIM)                               │
│                         (East US / West Europe)                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │  /JDUpload       │  │  /ResumeUpload   │  │ /resume_Similarity│         │
│  │  POST            │  │  POST            │  │  POST             │         │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬──────────┘         │
└───────────┼────────────────────┼────────────────────┼─────────────────────┘
            │                    │                    │
            │                    │                    │
            ▼                    ▼                    ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│  Azure Function   │  │  Azure Function   │  │  Azure Function   │
│  jd-processor     │  │  resume-processor │  │  matching-engine  │
│  (Python 3.11)    │  │  (Python 3.11)    │  │  (Python 3.11)    │
│                   │  │                   │  │                   │
│ • Parse JD PDF    │  │ • Parse Resume    │  │ • Retrieve Data   │
│ • Extract Text    │  │ • Extract Text    │  │ • Calculate Sim   │
│ • AI Metadata     │  │ • AI Metadata     │  │ • Rank Candidates │
│ • Generate Embed  │  │ • nano_Id Extract │  │ • Return nano_Id  │
│ • Index to Search │  │ • Enhance Certs   │  │ • Match Explain   │
└─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘
          │                      │                      │
          │    Azure Managed Identity (No Credentials)  │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AZURE OPENAI SERVICE                                    │
│                    (East US / West Europe)                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  GPT-4 Deployment - Metadata Extraction                              │  │
│  │  • Extracts: name, email, skills, experience, education, projects    │  │
│  │  • Structured JSON output with 12+ fields                            │  │
│  │  • Equivalent to Claude 3 Haiku functionality                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  text-embedding-3-large - Vector Generation                          │  │
│  │  • Generates 3072-dimensional vectors (vs 1024 on AWS)               │  │
│  │  • Higher accuracy and semantic understanding                         │  │
│  │  • 4 specialized vectors per resume (Skills, Exp, Certs, Projects)   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
          │                      │                      │
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA STORAGE & SEARCH LAYER                               │
│  ┌────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │   Azure Blob Storage       │  │   Azure AI Search                    │  │
│  │   Account: trujobsstore    │  │   Service: trujobs-search            │  │
│  │                            │  │                                      │  │
│  │  📦 Container: jd          │  │  📊 Index: job-descriptions          │  │
│  │     └─ {jd_id}.txt         │  │     • embedding_vector[3072]         │  │
│  │                            │  │     • job_title, company, location   │  │
│  │  📦 Container: resumes     │  │                                      │  │
│  │     └─ {resume_id}.pdf     │  │  📊 Index: resumes                   │  │
│  │     └─ {resume_id}.txt     │  │     • skills_vector[3072]            │  │
│  │                            │  │     • experience_vector[3072]        │  │
│  │  • Lifecycle policies      │  │     • certification_vector[3072]     │  │
│  │  • Geo-redundancy (GRS)    │  │     • projects_vector[3072]          │  │
│  │  • Encryption at rest      │  │     • nano_Id (external tracking)    │  │
│  │                            │  │     • metadata (name, email, etc.)   │  │
│  │                            │  │     • Vector search enabled          │  │
│  └────────────────────────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
          │                      │                      │
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MONITORING & SECURITY                                     │
│  ┌────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Azure Monitor             │  │   Azure Key Vault                    │  │
│  │  • Metrics & Alerts        │  │   • API Keys                         │  │
│  │  • Log Analytics           │  │   • Connection Strings               │  │
│  │                            │  │   • Certificates                     │  │
│  │  Application Insights      │  │                                      │  │
│  │  • Request tracking        │  │   Azure Active Directory             │  │
│  │  • Performance monitoring  │  │   • Managed Identities               │  │
│  │  • Dependency mapping      │  │   • RBAC Policies                    │  │
│  │  • Live metrics            │  │   • Service Principals               │  │
│  └────────────────────────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📅 Detailed Migration Phases

### **Phase 1: Planning & Assessment (Week 1)**

#### Objectives
- Complete infrastructure audit
- Map all dependencies
- Assess migration risks
- Estimate Azure costs
- Create detailed migration plan

#### Tasks

**Day 1-2: Infrastructure Audit**
- [ ] Document all AWS resources currently in use
- [ ] List all Lambda functions with dependencies
- [ ] Inventory S3 buckets and object counts
- [ ] Document OpenSearch indices and document counts
- [ ] Map API Gateway endpoints and routes
- [ ] List all IAM roles and policies
- [ ] Document CloudWatch alarms and dashboards

**Day 3-4: Dependency Mapping**
- [ ] Create dependency graph for all services
- [ ] Identify external integrations (if any)
- [ ] Document data flow between services
- [ ] List all environment variables and secrets
- [ ] Map boto3 SDK usage across codebase
- [ ] Identify hardcoded AWS-specific configurations

**Day 5: Risk Assessment**
- [ ] Identify critical migration risks
- [ ] Document vector dimension mismatch impact
- [ ] Assess downtime tolerance
- [ ] Plan rollback scenarios
- [ ] Identify single points of failure

**Day 6-7: Azure Cost Estimation**
- [ ] Calculate Azure Functions costs (Consumption vs Premium)
- [ ] Estimate Azure OpenAI Service costs (GPT-4 + embeddings)
- [ ] Calculate Azure Blob Storage costs
- [ ] Estimate Azure AI Search costs
- [ ] Calculate Azure API Management costs
- [ ] Compare total AWS vs Azure monthly costs

#### Deliverables
✅ Infrastructure audit document  
✅ Dependency map diagram  
✅ Risk assessment matrix  
✅ Azure cost comparison spreadsheet  
✅ Detailed migration timeline  

---

### **Phase 2: Azure Environment Setup (Week 2-3)**

#### Objectives
- Create Azure resource groups and resources
- Configure Azure OpenAI Service
- Setup Azure Blob Storage
- Configure Azure AI Search with vector indexes
- Deploy Azure Functions infrastructure
- Setup Azure API Management

#### Tasks

**Week 2, Day 1-2: Resource Group & Networking**

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name trujobs-prod-rg \
  --location eastus \
  --tags Environment=Production Application=TruJobs

# Create virtual network (if needed for private endpoints)
az network vnet create \
  --resource-group trujobs-prod-rg \
  --name trujobs-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name functions-subnet \
  --subnet-prefix 10.0.1.0/24
```

- [ ] Create resource group: `trujobs-prod-rg`
- [ ] Setup virtual network (optional, for private endpoints)
- [ ] Configure network security groups
- [ ] Plan subnet allocation

**Week 2, Day 3-4: Azure Blob Storage Setup**

```bash
# Create storage account
az storage account create \
  --name trujobsstore \
  --resource-group trujobs-prod-rg \
  --location eastus \
  --sku Standard_GRS \
  --kind StorageV2 \
  --encryption-services blob \
  --https-only true

# Create containers
az storage container create \
  --name jd \
  --account-name trujobsstore \
  --public-access off

az storage container create \
  --name resumes \
  --account-name trujobsstore \
  --public-access off

# Enable lifecycle management (optional)
az storage account management-policy create \
  --account-name trujobsstore \
  --policy @lifecycle-policy.json
```

- [ ] Create storage account: `trujobsstore`
- [ ] Create container: `jd` (for job descriptions)
- [ ] Create container: `resumes` (for resume files)
- [ ] Configure geo-redundancy (GRS)
- [ ] Enable encryption at rest
- [ ] Setup lifecycle policies for cost optimization
- [ ] Configure CORS if needed

**Week 2, Day 5-7: Azure OpenAI Service Setup**

```bash
# Create Azure OpenAI resource
az cognitiveservices account create \
  --name trujobs-openai \
  --resource-group trujobs-prod-rg \
  --location eastus \
  --kind OpenAI \
  --sku S0 \
  --custom-domain trujobs-openai

# Deploy GPT-4 model
az cognitiveservices account deployment create \
  --name trujobs-openai \
  --resource-group trujobs-prod-rg \
  --deployment-name gpt-4-deployment \
  --model-name gpt-4 \
  --model-version "0613" \
  --model-format OpenAI \
  --scale-settings-scale-type "Standard"

# Deploy text-embedding-3-large model
az cognitiveservices account deployment create \
  --name trujobs-openai \
  --resource-group trujobs-prod-rg \
  --deployment-name embedding-deployment \
  --model-name text-embedding-3-large \
  --model-version "1" \
  --model-format OpenAI \
  --scale-settings-scale-type "Standard"
```

⚠️ **CRITICAL NOTES:**
- Azure OpenAI Service is only available in **East US, West Europe, and select regions**
- Check current region availability: https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/
- GPT-4 requires approval - apply for access if not already granted
- text-embedding-3-large generates **3072-dimensional vectors** (vs 1024 on AWS)

- [ ] Create Azure OpenAI Service resource
- [ ] Deploy GPT-4 model (equivalent to Claude 3 Haiku)
- [ ] Deploy text-embedding-3-large model
- [ ] Test API connectivity
- [ ] Document endpoint URLs and API keys
- [ ] Configure rate limits and quotas

**Week 3, Day 1-3: Azure AI Search Setup**

```bash
# Create Azure AI Search service
az search service create \
  --name trujobs-search \
  --resource-group trujobs-prod-rg \
  --location eastus \
  --sku Standard \
  --partition-count 1 \
  --replica-count 2

# Get admin key
az search admin-key show \
  --service-name trujobs-search \
  --resource-group trujobs-prod-rg
```

**Create Vector Index for Job Descriptions:**

```json
{
  "name": "job-descriptions",
  "fields": [
    {"name": "job_description_id", "type": "Edm.String", "key": true, "filterable": true},
    {"name": "job_title", "type": "Edm.String", "searchable": true, "filterable": true},
    {"name": "company", "type": "Edm.String", "searchable": true, "filterable": true},
    {"name": "location", "type": "Edm.String", "filterable": true},
    {"name": "upload_date", "type": "Edm.DateTimeOffset", "filterable": true, "sortable": true},
    {"name": "s3_key", "type": "Edm.String"},
    {
      "name": "embedding_vector",
      "type": "Collection(Edm.Single)",
      "dimensions": 3072,
      "vectorSearchProfile": "vector-profile",
      "searchable": true
    },
    {"name": "metadata", "type": "Edm.ComplexType", "fields": [...]}
  ],
  "vectorSearch": {
    "profiles": [
      {
        "name": "vector-profile",
        "algorithm": "hnsw-config"
      }
    ],
    "algorithms": [
      {
        "name": "hnsw-config",
        "kind": "hnsw",
        "hnswParameters": {
          "metric": "cosine",
          "m": 4,
          "efConstruction": 400,
          "efSearch": 500
        }
      }
    ]
  }
}
```

**Create Vector Index for Resumes:**

```json
{
  "name": "resumes",
  "fields": [
    {"name": "resume_id", "type": "Edm.String", "key": true, "filterable": true},
    {"name": "job_description_id", "type": "Edm.String", "filterable": true},
    {"name": "candidate_name", "type": "Edm.String", "searchable": true},
    {"name": "nano_Id", "type": "Edm.String", "filterable": true},
    {"name": "upload_date", "type": "Edm.DateTimeOffset", "filterable": true, "sortable": true},
    {"name": "s3_key", "type": "Edm.String"},
    {
      "name": "skills_vector",
      "type": "Collection(Edm.Single)",
      "dimensions": 3072,
      "vectorSearchProfile": "vector-profile",
      "searchable": true
    },
    {
      "name": "experience_vector",
      "type": "Collection(Edm.Single)",
      "dimensions": 3072,
      "vectorSearchProfile": "vector-profile",
      "searchable": true
    },
    {
      "name": "certification_vector",
      "type": "Collection(Edm.Single)",
      "dimensions": 3072,
      "vectorSearchProfile": "vector-profile",
      "searchable": true
    },
    {
      "name": "projects_vector",
      "type": "Collection(Edm.Single)",
      "dimensions": 3072,
      "vectorSearchProfile": "vector-profile",
      "searchable": true
    },
    {"name": "metadata", "type": "Edm.ComplexType", "fields": [...]}
  ],
  "vectorSearch": {
    "profiles": [
      {
        "name": "vector-profile",
        "algorithm": "hnsw-config"
      }
    ],
    "algorithms": [
      {
        "name": "hnsw-config",
        "kind": "hnsw",
        "hnswParameters": {
          "metric": "cosine",
          "m": 4,
          "efConstruction": 400,
          "efSearch": 500
        }
      }
    ]
  }
}
```

- [ ] Create Azure AI Search service (Standard tier minimum)
- [ ] Create `job-descriptions` index with vector search
- [ ] Create `resumes` index with 4 vector fields
- [ ] Configure HNSW algorithm for vector search
- [ ] Set cosine similarity metric
- [ ] Test index creation and basic queries

**Week 3, Day 4-5: Azure Functions Setup**

```bash
# Create Function App (Premium Plan for no cold starts)
az functionapp plan create \
  --name trujobs-premium-plan \
  --resource-group trujobs-prod-rg \
  --location eastus \
  --sku EP1 \
  --is-linux

# Create Function Apps
az functionapp create \
  --name trujobs-jd-processor \
  --resource-group trujobs-prod-rg \
  --plan trujobs-premium-plan \
  --runtime python \
  --runtime-version 3.11 \
  --functions-version 4 \
  --storage-account trujobsstore \
  --os-type Linux

az functionapp create \
  --name trujobs-resume-processor \
  --resource-group trujobs-prod-rg \
  --plan trujobs-premium-plan \
  --runtime python \
  --runtime-version 3.11 \
  --functions-version 4 \
  --storage-account trujobsstore \
  --os-type Linux

az functionapp create \
  --name trujobs-matching-engine \
  --resource-group trujobs-prod-rg \
  --plan trujobs-premium-plan \
  --runtime python \
  --runtime-version 3.11 \
  --functions-version 4 \
  --storage-account trujobsstore \
  --os-type Linux

# Enable Managed Identity
az functionapp identity assign \
  --name trujobs-jd-processor \
  --resource-group trujobs-prod-rg

az functionapp identity assign \
  --name trujobs-resume-processor \
  --resource-group trujobs-prod-rg

az functionapp identity assign \
  --name trujobs-matching-engine \
  --resource-group trujobs-prod-rg
```

- [ ] Create Azure Functions Premium Plan (EP1 or higher)
- [ ] Create 3 Function Apps (jd-processor, resume-processor, matching-engine)
- [ ] Configure Python 3.11 runtime
- [ ] Enable Managed Identity for each Function App
- [ ] Configure application settings (environment variables)
- [ ] Setup deployment slots for blue-green deployment

**Week 3, Day 6-7: Azure Key Vault & API Management**

```bash
# Create Key Vault
az keyvault create \
  --name trujobs-keyvault \
  --resource-group trujobs-prod-rg \
  --location eastus \
  --enable-rbac-authorization true

# Grant Function Apps access to Key Vault
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <function-app-managed-identity-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/trujobs-prod-rg/providers/Microsoft.KeyVault/vaults/trujobs-keyvault

# Store secrets
az keyvault secret set \
  --vault-name trujobs-keyvault \
  --name "OpenAI-API-Key" \
  --value "<your-openai-api-key>"

az keyvault secret set \
  --vault-name trujobs-keyvault \
  --name "AI-Search-API-Key" \
  --value "<your-search-api-key>"

# Create API Management
az apim create \
  --name trujobs-apim \
  --resource-group trujobs-prod-rg \
  --location eastus \
  --publisher-email admin@trujobs.com \
  --publisher-name "TruJobs" \
  --sku-name Developer
```

- [ ] Create Azure Key Vault
- [ ] Migrate secrets from AWS Secrets Manager
- [ ] Grant Managed Identities access to Key Vault
- [ ] Create Azure API Management instance
- [ ] Configure API policies and rate limiting
- [ ] Setup custom domain (if needed)

#### Deliverables
✅ All Azure resources created and configured  
✅ Azure OpenAI Service with GPT-4 and embeddings deployed  
✅ Azure AI Search with vector indexes created  
✅ Azure Functions infrastructure ready  
✅ Azure Key Vault with all secrets  
✅ Azure API Management configured  

---

### **Phase 3: Data Migration (Week 3-4)**

⚠️ **CRITICAL PHASE**: This is the most time-consuming and critical phase due to vector re-generation requirements.

#### Objectives
- Migrate documents from S3 to Azure Blob Storage
- **Re-generate ALL vectors** (1024-dim → 3072-dim)
- Migrate metadata to Azure AI Search
- Validate data integrity

#### Tasks

**Week 3-4, Day 1-2: Document Migration (S3 → Blob Storage)**

```bash
# Install AzCopy
wget https://aka.ms/downloadazcopy-v10-linux
tar -xvf downloadazcopy-v10-linux
sudo cp ./azcopy_linux_amd64_*/azcopy /usr/local/bin/

# Get SAS token for Azure Blob Storage
az storage container generate-sas \
  --account-name trujobsstore \
  --name resumes \
  --permissions rwl \
  --expiry 2024-12-31T23:59:59Z \
  --https-only \
  --output tsv

# Sync S3 to Azure Blob (Job Descriptions)
aws s3 sync s3://trujobs-db/JD/ ./temp-jd/
azcopy copy './temp-jd/*' \
  'https://trujobsstore.blob.core.windows.net/jd?<SAS-token>' \
  --recursive

# Sync S3 to Azure Blob (Resumes)
aws s3 sync s3://trujobs-db/resumes/ ./temp-resumes/
azcopy copy './temp-resumes/*' \
  'https://trujobsstore.blob.core.windows.net/resumes?<SAS-token>' \
  --recursive
```

- [ ] Download all files from S3 to local staging
- [ ] Upload files to Azure Blob Storage using AzCopy
- [ ] Verify file counts match (S3 vs Blob)
- [ ] Verify file integrity (checksums)
- [ ] Test file access from Azure Functions

**Estimated Time**: 1-2 days for 10,000 documents (depends on file sizes and bandwidth)

**Week 3-4, Day 3-7: Vector Re-generation (CRITICAL)**

⚠️ **MANDATORY STEP**: Cannot directly migrate vectors due to dimension mismatch (1024 → 3072)

**Strategy**: Create a migration script that:
1. Reads documents from OpenSearch (AWS)
2. Extracts original text content
3. Generates new 3072-dim vectors using Azure OpenAI
4. Indexes into Azure AI Search

**Migration Script Example:**

```python
# vector_migration.py
import boto3
import json
from opensearchpy import OpenSearch
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from openai import AzureOpenAI
import time

# AWS OpenSearch connection
aws_os_client = OpenSearch(
    hosts=[{'host': 'your-opensearch-endpoint.aoss.amazonaws.com', 'port': 443}],
    http_auth=('username', 'password'),
    use_ssl=True
)

# Azure AI Search connection
azure_search_client = SearchClient(
    endpoint="https://trujobs-search.search.windows.net",
    index_name="resumes",
    credential=AzureKeyCredential("your-search-api-key")
)

# Azure OpenAI connection
azure_openai_client = AzureOpenAI(
    api_key="your-openai-api-key",
    api_version="2024-02-01",
    azure_endpoint="https://trujobs-openai.openai.azure.com/"
)

def generate_azure_embedding(text):
    """Generate 3072-dim embedding using Azure OpenAI"""
    response = azure_openai_client.embeddings.create(
        input=text,
        model="text-embedding-3-large"
    )
    return response.data[0].embedding

def migrate_resume(resume_doc):
    """Migrate a single resume with vector re-generation"""
    try:
        # Extract text sections
        skills_text = resume_doc['metadata'].get('skills', '')
        experience_text = resume_doc['metadata'].get('work_experience_text', '')
        certifications_text = resume_doc['metadata'].get('certifications', '')
        projects_text = resume_doc['metadata'].get('projects_text', '')
        
        # Generate new 3072-dim vectors
        skills_vector = generate_azure_embedding(skills_text)
        experience_vector = generate_azure_embedding(experience_text)
        certification_vector = generate_azure_embedding(certifications_text)
        projects_vector = generate_azure_embedding(projects_text)
        
        # Create Azure AI Search document
        azure_doc = {
            "resume_id": resume_doc['resume_id'],
            "job_description_id": resume_doc['job_description_id'],
            "candidate_name": resume_doc['candidate_name'],
            "nano_Id": resume_doc.get('nano_Id'),
            "upload_date": resume_doc['upload_date'],
            "s3_key": resume_doc['s3_key'],
            "skills_vector": skills_vector,
            "experience_vector": experience_vector,
            "certification_vector": certification_vector,
            "projects_vector": projects_vector,
            "metadata": resume_doc['metadata']
        }
        
        # Index to Azure AI Search
        azure_search_client.upload_documents(documents=[azure_doc])
        
        return True
    except Exception as e:
        print(f"Error migrating resume {resume_doc['resume_id']}: {e}")
        return False

def migrate_all_resumes():
    """Migrate all resumes from OpenSearch to Azure AI Search"""
    # Query all resumes from OpenSearch
    query = {"query": {"match_all": {}}, "size": 100}
    
    total_migrated = 0
    total_failed = 0
    
    # Scroll through all documents
    response = aws_os_client.search(index="resumes", body=query, scroll='5m')
    scroll_id = response['_scroll_id']
    
    while len(response['hits']['hits']) > 0:
        for hit in response['hits']['hits']:
            if migrate_resume(hit['_source']):
                total_migrated += 1
            else:
                total_failed += 1
            
            # Rate limiting (Azure OpenAI has rate limits)
            time.sleep(0.1)
        
        # Get next batch
        response = aws_os_client.scroll(scroll_id=scroll_id, scroll='5m')
        
        print(f"Progress: {total_migrated} migrated, {total_failed} failed")
    
    print(f"Migration complete: {total_migrated} successful, {total_failed} failed")

if __name__ == "__main__":
    migrate_all_resumes()
```

**Migration Execution Steps:**

- [ ] Create migration script with error handling and retry logic
- [ ] Test migration with 10 sample resumes
- [ ] Validate vector generation and indexing
- [ ] Run full migration in batches (100-500 at a time)
- [ ] Monitor Azure OpenAI rate limits and adjust throttling
- [ ] Track progress and log any failures
- [ ] Verify document counts (OpenSearch vs Azure AI Search)
- [ ] Validate random sample of migrated vectors

**Estimated Time**: 3-5 days for 10,000 resumes
- Azure OpenAI rate limits: ~3,000 requests/minute
- Vector generation time: ~100ms per vector
- 4 vectors per resume = 400ms per resume
- 10,000 resumes = ~67 minutes (theoretical)
- With rate limiting and error handling: 3-5 days realistic

⚠️ **CRITICAL CONSIDERATIONS:**
- Azure OpenAI has rate limits - implement exponential backoff
- Monitor costs - embedding generation is charged per token
- Implement checkpointing to resume from failures
- Keep AWS OpenSearch running during this phase
- Validate data integrity at each batch

**Week 3-4, Day 8-10: Job Description Vector Migration**

- [ ] Extract job descriptions from OpenSearch
- [ ] Re-generate embeddings using Azure OpenAI
- [ ] Index to Azure AI Search `job-descriptions` index
- [ ] Verify all job descriptions migrated successfully

**Week 3-4, Day 11-12: Data Validation**

```bash
# Compare document counts
# AWS OpenSearch
curl -X GET "https://your-opensearch-endpoint.aoss.amazonaws.com/resumes/_count"

# Azure AI Search
curl -X GET "https://trujobs-search.search.windows.net/indexes/resumes/docs/$count?api-version=2023-11-01" \
  -H "api-key: your-search-api-key"
```

- [ ] Compare document counts (AWS vs Azure)
- [ ] Validate random sample of 100 documents
- [ ] Test vector search queries on Azure AI Search
- [ ] Verify metadata integrity
- [ ] Test nano_Id field presence and accuracy
- [ ] Document any data discrepancies

#### Deliverables
✅ All documents migrated to Azure Blob Storage  
✅ All vectors re-generated (3072-dim)  
✅ All data indexed in Azure AI Search  
✅ Data validation report  
✅ Migration logs and error reports  

---

### **Phase 4: Application Deployment (Week 4-5)**

#### Objectives
- Update code for Azure SDK
- Deploy Azure Functions
- Configure API Management
- Setup authentication and authorization

#### Tasks

**Week 4, Day 1-3: Code Updates**

**Required Code Changes:**

1. **Replace boto3 with Azure SDK:**

```python
# OLD (AWS)
import boto3
s3_client = boto3.client('s3')
s3_client.put_object(Bucket='trujobs-db', Key='resumes/test.pdf', Body=file_content)

# NEW (Azure)
from azure.storage.blob import BlobServiceClient
blob_service_client = BlobServiceClient.from_connection_string(conn_str)
blob_client = blob_service_client.get_blob_client(container="resumes", blob="test.pdf")
blob_client.upload_blob(file_content)
```

2. **Replace Bedrock with Azure OpenAI:**

```python
# OLD (AWS Bedrock)
import boto3
bedrock_client = boto3.client('bedrock-runtime')
response = bedrock_client.invoke_model(
    modelId='anthropic.claude-3-haiku-20240307-v1:0',
    body=json.dumps({"prompt": prompt})
)

# NEW (Azure OpenAI)
from openai import AzureOpenAI
client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2024-02-01",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)
response = client.chat.completions.create(
    model="gpt-4-deployment",
    messages=[{"role": "user", "content": prompt}]
)
```

3. **Replace OpenSearch with Azure AI Search:**

```python
# OLD (OpenSearch)
from opensearchpy import OpenSearch
client = OpenSearch(hosts=[...])
client.index(index='resumes', body=document)

# NEW (Azure AI Search)
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
search_client = SearchClient(
    endpoint="https://trujobs-search.search.windows.net",
    index_name="resumes",
    credential=AzureKeyCredential(api_key)
)
search_client.upload_documents(documents=[document])
```

4. **Update Vector Search Queries:**

```python
# OLD (OpenSearch KNN)
query = {
    "size": 10,
    "query": {
        "knn": {
            "skills_vector": {
                "vector": job_embedding,
                "k": 10
            }
        }
    }
}

# NEW (Azure AI Search Vector Search)
from azure.search.documents.models import VectorizedQuery
vector_query = VectorizedQuery(
    vector=job_embedding,
    k_nearest_neighbors=10,
    fields="skills_vector"
)
results = search_client.search(
    search_text=None,
    vector_queries=[vector_query],
    select=["resume_id", "candidate_name", "nano_Id"]
)
```

5. **Update Environment Variables:**

```python
# OLD (AWS)
AWS_REGION = os.getenv('AWS_REGION')
S3_BUCKET = os.getenv('S3_BUCKET_NAME')
OPENSEARCH_ENDPOINT = os.getenv('OPENSEARCH_ENDPOINT')

# NEW (Azure)
AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
AZURE_OPENAI_ENDPOINT = os.getenv('AZURE_OPENAI_ENDPOINT')
AZURE_OPENAI_KEY = os.getenv('AZURE_OPENAI_KEY')
AZURE_SEARCH_ENDPOINT = os.getenv('AZURE_SEARCH_ENDPOINT')
AZURE_SEARCH_KEY = os.getenv('AZURE_SEARCH_KEY')
```

- [ ] Update all boto3 calls to Azure SDK
- [ ] Replace Bedrock calls with Azure OpenAI
- [ ] Update OpenSearch queries to Azure AI Search syntax
- [ ] Update environment variable references
- [ ] Update vector dimensions (1024 → 3072)
- [ ] Test code changes locally
- [ ] Update requirements.txt with Azure packages

**Week 4, Day 4-5: Azure Functions Deployment**

```bash
# Package and deploy jd-processor
cd modules/new_jd_logic
func azure functionapp publish trujobs-jd-processor --python

# Package and deploy resume-processor
cd modules/new_resume_logic
func azure functionapp publish trujobs-resume-processor --python

# Package and deploy matching-engine
cd modules/new_matching_logic
func azure functionapp publish trujobs-matching-engine --python

# Configure application settings
az functionapp config appsettings set \
  --name trujobs-resume-processor \
  --resource-group trujobs-prod-rg \
  --settings \
    AZURE_STORAGE_CONNECTION_STRING="@Microsoft.KeyVault(SecretUri=https://trujobs-keyvault.vault.azure.net/secrets/StorageConnectionString/)" \
    AZURE_OPENAI_ENDPOINT="https://trujobs-openai.openai.azure.com/" \
    AZURE_OPENAI_KEY="@Microsoft.KeyVault(SecretUri=https://trujobs-keyvault.vault.azure.net/secrets/OpenAI-API-Key/)" \
    AZURE_SEARCH_ENDPOINT="https://trujobs-search.search.windows.net" \
    AZURE_SEARCH_KEY="@Microsoft.KeyVault(SecretUri=https://trujobs-keyvault.vault.azure.net/secrets/AI-Search-API-Key/)"
```

- [ ] Deploy jd-processor Function App
- [ ] Deploy resume-processor Function App
- [ ] Deploy matching-engine Function App
- [ ] Configure application settings with Key Vault references
- [ ] Test each Function App individually
- [ ] Verify Managed Identity access to resources
- [ ] Check Function App logs for errors

**Week 4-5, Day 6-7: Azure API Management Configuration**

```bash
# Import Function Apps as APIs
az apim api import \
  --resource-group trujobs-prod-rg \
  --service-name trujobs-apim \
  --path /JDUpload \
  --specification-format OpenApi \
  --specification-url https://trujobs-jd-processor.azurewebsites.net/api/openapi.json

# Configure API policies
az apim api policy create \
  --resource-group trujobs-prod-rg \
  --service-name trujobs-apim \
  --api-id jd-upload-api \
  --policy-file api-policy.xml
```

**API Policy Example (api-policy.xml):**

```xml
<policies>
    <inbound>
        <base />
        <check-header name="x-api-key" failed-check-httpcode="401" failed-check-error-message="API key is missing or invalid" />
        <rate-limit calls="1000" renewal-period="60" />
        <cors>
            <allowed-origins>
                <origin>*</origin>
            </allowed-origins>
            <allowed-methods>
                <method>POST</method>
                <method>GET</method>
            </allowed-methods>
        </cors>
    </inbound>
    <backend>
        <base />
    </backend>
    <outbound>
        <base />
    </outbound>
    <on-error>
        <base />
    </on-error>
</policies>
```

- [ ] Import Function Apps as APIs in APIM
- [ ] Configure API routes (/JDUpload, /ResumeUpload, /resume_Similarity)
- [ ] Setup API key authentication
- [ ] Configure rate limiting policies
- [ ] Setup CORS policies
- [ ] Test API endpoints through APIM
- [ ] Document new API endpoint URLs

**Week 5, Day 1-2: Monitoring Setup**

```bash
# Enable Application Insights
az monitor app-insights component create \
  --app trujobs-app-insights \
  --location eastus \
  --resource-group trujobs-prod-rg \
  --application-type web

# Link Function Apps to Application Insights
az functionapp config appsettings set \
  --name trujobs-resume-processor \
  --resource-group trujobs-prod-rg \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="<instrumentation-key>"

# Create alerts
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group trujobs-prod-rg \
  --scopes /subscriptions/<sub-id>/resourceGroups/trujobs-prod-rg/providers/Microsoft.Web/sites/trujobs-resume-processor \
  --condition "avg Percentage HTTP 5xx > 5" \
  --window-size 5m \
  --evaluation-frequency 1m
```

- [ ] Create Application Insights resource
- [ ] Link all Function Apps to Application Insights
- [ ] Configure custom metrics and traces
- [ ] Setup alert rules (error rates, latency, availability)
- [ ] Create Azure Monitor dashboard
- [ ] Configure log retention policies
- [ ] Test monitoring and alerting

#### Deliverables
✅ All code updated for Azure services  
✅ All Azure Functions deployed and tested  
✅ Azure API Management configured  
✅ Monitoring and alerting setup  
✅ New API endpoint documentation  

---

### **Phase 5: Testing & Validation (Week 5-6)**

#### Objectives
- Comprehensive functional testing
- Performance and load testing
- Data validation (AWS vs Azure)
- Security testing

#### Tasks

**Week 5, Day 3-4: Functional Testing**

**Test Scenario 1: Job Description Upload (PDF)**
```bash
curl -X POST https://trujobs-apim.azure-api.net/JDUpload \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@job_description.pdf"
```

- [ ] Test PDF job description upload
- [ ] Test JSON job description upload
- [ ] Verify AI metadata extraction (GPT-4)
- [ ] Verify embedding generation (3072-dim)
- [ ] Verify Azure Blob Storage upload
- [ ] Verify Azure AI Search indexing
- [ ] Compare results with AWS system

**Test Scenario 2: Resume Upload (PDF)**
```bash
curl -X POST https://trujobs-apim.azure-api.net/ResumeUpload \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@resume.pdf" \
  -F "job_description_id=test-jd-001"
```

- [ ] Test PDF resume upload
- [ ] Test JSON resume upload with nano_Id
- [ ] Verify AI metadata extraction
- [ ] Verify 4-vector embedding generation
- [ ] Verify certification enhancement (courses/awards)
- [ ] Verify nano_Id extraction and storage
- [ ] Verify Azure Blob Storage upload
- [ ] Verify Azure AI Search indexing
- [ ] Compare results with AWS system

**Test Scenario 3: Candidate Matching**
```bash
curl -X POST https://trujobs-apim.azure-api.net/resume_Similarity \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "job_description_id": "test-jd-001",
    "top_k": 5,
    "calculate_similarity": true
  }'
```

- [ ] Test similarity matching with various job IDs
- [ ] Verify multi-vector similarity calculation
- [ ] Verify nano_Id in response
- [ ] Verify ranking accuracy
- [ ] Compare similarity scores with AWS (expect differences due to 3072-dim)
- [ ] Test with different top_k values
- [ ] Test with similarity thresholds

**Week 5, Day 5-7: Performance Testing**

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 -p resume.json -T application/json \
  -H "x-api-key: your-api-key" \
  https://trujobs-apim.azure-api.net/ResumeUpload

# Load testing with Azure Load Testing
az load test create \
  --name trujobs-load-test \
  --resource-group trujobs-prod-rg \
  --test-plan load-test-plan.yaml
```

- [ ] Load test: 100 concurrent resume uploads
- [ ] Load test: 500 concurrent similarity requests
- [ ] Measure response times (target: < 3 seconds)
- [ ] Measure throughput (target: 1000+ resumes/day)
- [ ] Monitor Azure Function scaling behavior
- [ ] Monitor Azure OpenAI rate limiting
- [ ] Monitor Azure AI Search query performance
- [ ] Compare performance with AWS baseline

**Week 6, Day 1-2: Data Validation**

- [ ] Compare 100 random resumes (AWS vs Azure)
- [ ] Validate metadata accuracy
- [ ] Validate vector dimensions (3072)
- [ ] Validate nano_Id preservation
- [ ] Validate certification enhancement
- [ ] Test edge cases (malformed PDFs, large files)
- [ ] Validate error handling and logging

**Week 6, Day 3: Security Testing**

- [ ] Test API key authentication
- [ ] Test CORS policies
- [ ] Test rate limiting
- [ ] Verify Managed Identity access
- [ ] Test Key Vault secret access
- [ ] Verify encryption at rest (Blob Storage)
- [ ] Verify encryption in transit (HTTPS)
- [ ] Test unauthorized access attempts
- [ ] Review security logs

#### Deliverables
✅ Functional test report (all scenarios passed)  
✅ Performance test report (meets SLAs)  
✅ Data validation report (AWS vs Azure comparison)  
✅ Security test report (no vulnerabilities)  
✅ Test automation scripts  

---

### **Phase 6: Cutover & Go-Live (Week 6)**

⚠️ **CRITICAL PHASE**: Zero-downtime migration using parallel operation and gradual traffic shift.

#### Objectives
- Implement parallel operation (AWS + Azure)
- Gradual traffic shift to Azure
- Monitor and validate at each stage
- Maintain rollback capability

#### Strategy: Gradual Traffic Shift

```
Day 1-2: 10% Azure, 90% AWS
Day 3-4: 25% Azure, 75% AWS
Day 5: 50% Azure, 50% AWS
Day 6: 75% Azure, 25% AWS
Day 7: 100% Azure, 0% AWS
```

#### Tasks

**Week 6, Day 1-2: Parallel Operation Setup (10% Traffic)**

**Option 1: DNS-based Traffic Split (Recommended)**
```bash
# Update DNS with weighted routing
# Route 10% to Azure, 90% to AWS
# Use Azure Traffic Manager or external DNS provider
```

**Option 2: API Gateway Routing**
```xml
<!-- APIM Policy for traffic split -->
<policies>
    <inbound>
        <choose>
            <when condition="@(new Random().Next(100) < 10)">
                <!-- Route to Azure -->
                <set-backend-service base-url="https://trujobs-resume-processor.azurewebsites.net" />
            </when>
            <otherwise>
                <!-- Route to AWS -->
                <set-backend-service base-url="https://ctlzux7bee.execute-api.ap-south-1.amazonaws.com/prod" />
            </otherwise>
        </choose>
    </inbound>
</policies>
```

- [ ] Configure traffic split (10% Azure)
- [ ] Monitor both AWS and Azure systems
- [ ] Compare response times
- [ ] Compare error rates
- [ ] Validate data consistency
- [ ] Check Application Insights metrics
- [ ] Verify no data loss

**Week 6, Day 3-4: Increase to 25% Traffic**

- [ ] Update traffic split to 25% Azure
- [ ] Monitor for 24 hours
- [ ] Compare metrics (AWS vs Azure)
- [ ] Validate similarity score accuracy
- [ ] Check for any errors or anomalies
- [ ] Verify Azure Function scaling
- [ ] Monitor Azure OpenAI usage and costs

**Week 6, Day 5: Increase to 50% Traffic**

- [ ] Update traffic split to 50% Azure
- [ ] Monitor closely for 12 hours
- [ ] Compare performance metrics
- [ ] Validate data integrity
- [ ] Check Azure resource utilization
- [ ] Monitor costs
- [ ] Prepare rollback plan if needed

**Week 6, Day 6: Increase to 75% Traffic**

- [ ] Update traffic split to 75% Azure
- [ ] Monitor for 6 hours
- [ ] Final validation of all workflows
- [ ] Check for any edge cases
- [ ] Verify monitoring and alerting
- [ ] Prepare for 100% cutover

**Week 6, Day 7: Complete Cutover (100% Traffic)**

- [ ] Update traffic split to 100% Azure
- [ ] Monitor intensively for 24 hours
- [ ] Validate all metrics
- [ ] Check error logs
- [ ] Verify data consistency
- [ ] Update client documentation with new endpoints
- [ ] Announce migration completion

#### Rollback Procedures

**If Issues Detected at Any Stage:**

1. **Immediate Rollback (< 5 minutes)**
   ```bash
   # Revert traffic to 100% AWS
   # Update DNS or APIM policy
   ```

2. **Investigate Issue**
   - Check Application Insights logs
   - Review Azure Function errors
   - Check Azure OpenAI rate limits
   - Verify Azure AI Search queries

3. **Fix and Re-attempt**
   - Deploy fix to Azure
   - Test in isolation
   - Resume gradual traffic shift

**Rollback Triggers:**
- Error rate > 5%
- Response time > 5 seconds (p95)
- Data inconsistency detected
- Azure service outage
- Cost overrun (> 150% of estimate)

#### Deliverables
✅ Parallel operation successfully implemented  
✅ Gradual traffic shift completed  
✅ 100% traffic on Azure with no issues  
✅ Rollback plan tested and documented  
✅ Client documentation updated  

---

### **Phase 7: Optimization & Decommissioning (Week 7-8)**

#### Objectives
- Optimize Azure resources for cost and performance
- Decommission AWS resources
- Final documentation and handover

#### Tasks

**Week 7, Day 1-3: Azure Optimization**

- [ ] Analyze Application Insights performance data
- [ ] Optimize Azure Function memory allocation
- [ ] Tune Azure AI Search replica count
- [ ] Optimize Azure OpenAI token usage
- [ ] Configure Azure Blob Storage lifecycle policies
- [ ] Setup auto-scaling rules
- [ ] Implement caching where applicable
- [ ] Review and optimize costs

**Week 7, Day 4-7: AWS Decommissioning**

⚠️ **Wait 7 days after 100% cutover before decommissioning AWS**

```bash
# Backup AWS data before deletion
aws s3 sync s3://trujobs-db/ ./aws-backup/ --recursive

# Delete AWS resources (in order)
# 1. Stop Lambda functions
aws lambda delete-function --function-name resume-processor
aws lambda delete-function --function-name jd-processor
aws lambda delete-function --function-name resume-jd-matcher

# 2. Delete API Gateway
aws apigateway delete-rest-api --rest-api-id <api-id>

# 3. Delete OpenSearch domain (after final backup)
aws opensearch delete-domain --domain-name recruitment-search

# 4. Delete S3 bucket (after verification)
aws s3 rb s3://trujobs-db --force

# 5. Delete IAM roles
aws iam delete-role --role-name lambda-execution-role

# 6. Delete CloudWatch log groups
aws logs delete-log-group --log-group-name /aws/lambda/resume-processor
```

- [ ] Create final backup of all AWS data
- [ ] Verify Azure system stability (7 days)
- [ ] Delete Lambda functions
- [ ] Delete API Gateway
- [ ] Delete OpenSearch domain
- [ ] Delete S3 bucket
- [ ] Delete IAM roles and policies
- [ ] Delete CloudWatch log groups
- [ ] Cancel AWS Bedrock subscriptions
- [ ] Document AWS resource deletion

**Week 8, Day 1-5: Final Documentation**

- [ ] Update all documentation with Azure endpoints
- [ ] Create Azure architecture diagrams
- [ ] Document Azure resource configuration
- [ ] Create runbook for common operations
- [ ] Document monitoring and alerting setup
- [ ] Create disaster recovery plan
- [ ] Update API documentation
- [ ] Create cost optimization guide
- [ ] Handover to operations team

#### Deliverables
✅ Azure resources optimized  
✅ AWS resources decommissioned  
✅ Final migration report  
✅ Complete Azure documentation  
✅ Operations runbook  
✅ Cost optimization recommendations  

---

## ⚠️ Critical Considerations & Risks

### 1. Vector Dimension Mismatch (CRITICAL)

**Issue**: AWS Titan generates 1024-dimensional vectors, Azure OpenAI generates 3072-dimensional vectors.

**Impact**: 
- Cannot directly migrate vectors
- Must re-generate ALL vectors
- Time-consuming (3-5 days for 10,000 resumes)
- Similarity scores will differ between AWS and Azure

**Mitigation**:
- Allocate sufficient time for vector re-generation
- Implement batch processing with error handling
- Monitor Azure OpenAI rate limits
- Test similarity accuracy before cutover

### 2. Azure OpenAI Service Regional Availability

**Issue**: Azure OpenAI Service is only available in select regions (East US, West Europe, etc.)

**Impact**:
- May increase latency for users in other regions
- Region selection affects data residency

**Mitigation**:
- Choose region closest to primary user base
- Consider Azure Front Door for global distribution
- Test latency from target user locations

### 3. API Endpoint Changes

**Issue**: Client applications must update API endpoints from AWS to Azure.

**Impact**:
- Requires client application updates
- Potential downtime if not coordinated

**Mitigation**:
- Use custom domain with DNS-based routing
- Implement gradual traffic shift
- Provide advance notice to clients
- Maintain AWS endpoints during transition

### 4. Cost Differences

**Issue**: Azure and AWS pricing models differ significantly.

**Potential Surprises**:
- Azure OpenAI charges per token (input + output)
- Azure AI Search charges per replica and partition
- Azure Functions Premium Plan has minimum charge
- Data egress charges may differ

**Mitigation**:
- Detailed cost estimation before migration
- Monitor costs daily during migration
- Set up budget alerts
- Optimize resource allocation post-migration

### 5. Query Syntax Differences

**Issue**: OpenSearch and Azure AI Search have different query syntaxes.

**Impact**:
- Code changes required for all search queries
- Different filtering and aggregation syntax
- Vector search API differences

**Mitigation**:
- Comprehensive testing of all query patterns
- Create abstraction layer for search operations
- Document query syntax differences

### 6. Rate Limiting

**Issue**: Azure OpenAI has strict rate limits (tokens per minute, requests per minute).

**Impact**:
- Vector generation may be throttled
- Potential delays during migration
- Production traffic may hit limits

**Mitigation**:
- Request rate limit increases from Azure
- Implement exponential backoff and retry logic
- Monitor rate limit usage
- Consider Premium tier for higher limits

### 7. Data Consistency During Migration

**Issue**: Data may be added to AWS during migration period.

**Impact**:
- Azure may be missing recent data
- Inconsistent results between AWS and Azure

**Mitigation**:
- Implement dual-write during migration (write to both AWS and Azure)
- Final data sync before cutover
- Validation checks during parallel operation

---

## 💰 Cost Comparison: AWS vs Azure

### Monthly Cost Estimates (Based on 1000 resumes/day, 30,000/month)

| Service Category | AWS Monthly Cost | Azure Monthly Cost | Difference |
|-----------------|------------------|-------------------|------------|
| **Compute** | | | |
| Lambda / Functions | $150 | $200 (Premium Plan) | +$50 |
| **AI Services** | | | |
| Bedrock (Claude 3 Haiku) | $300 | - | -$300 |
| Bedrock (Titan Embeddings) | $200 | - | -$200 |
| Azure OpenAI (GPT-4) | - | $400 | +$400 |
| Azure OpenAI (Embeddings) | - | $250 | +$250 |
| **Storage** | | | |
| S3 | $50 | - | -$50 |
| Azure Blob Storage | - | $45 | +$45 |
| **Search/Database** | | | |
| OpenSearch Serverless | $400 | - | -$400 |
| Azure AI Search | - | $350 | +$350 |
| **API Gateway** | | | |
| AWS API Gateway | $100 | - | -$100 |
| Azure APIM | - | $150 | +$150 |
| **Monitoring** | | | |
| CloudWatch | $50 | - | -$50 |
| Application Insights | - | $75 | +$75 |
| **Secrets Management** | | | |
| Secrets Manager | $10 | - | -$10 |
| Key Vault | - | $5 | +$5 |
| **TOTAL** | **$1,260/month** | **$1,475/month** | **+$215/month (+17%)** |

**Notes:**
- Azure costs are ~17% higher primarily due to:
  - Premium Functions Plan (eliminates cold starts)
  - GPT-4 is more expensive than Claude 3 Haiku
  - 3072-dim embeddings cost more than 1024-dim
- Costs can be optimized post-migration:
  - Switch to Consumption Plan if cold starts acceptable
  - Use GPT-3.5-turbo for some tasks
  - Optimize token usage
  - Reduce AI Search replicas during off-peak

**Cost Optimization Opportunities:**
- Azure Reserved Instances (up to 30% savings)
- Azure Hybrid Benefit (if applicable)
- Optimize Azure Function memory allocation
- Implement caching to reduce AI API calls
- Use Azure Blob Storage lifecycle policies

---

## 📋 Migration Checklist

### Pre-Migration
- [ ] Azure subscription with sufficient quota
- [ ] Azure OpenAI Service access approved
- [ ] All stakeholders informed
- [ ] Migration team assembled
- [ ] Rollback plan documented
- [ ] Cost budget approved

### Phase 1: Planning (Week 1)
- [ ] Infrastructure audit completed
- [ ] Dependency map created
- [ ] Risk assessment documented
- [ ] Azure cost estimate approved
- [ ] Migration timeline finalized

### Phase 2: Azure Setup (Week 2-3)
- [ ] Resource group created
- [ ] Azure Blob Storage configured
- [ ] Azure OpenAI Service deployed
- [ ] Azure AI Search with vector indexes created
- [ ] Azure Functions infrastructure ready
- [ ] Azure Key Vault configured
- [ ] Azure API Management setup

### Phase 3: Data Migration (Week 3-4)
- [ ] Documents migrated to Blob Storage
- [ ] Vector re-generation completed
- [ ] Data indexed in Azure AI Search
- [ ] Data validation passed
- [ ] Migration logs reviewed

### Phase 4: Application Deployment (Week 4-5)
- [ ] Code updated for Azure SDK
- [ ] Azure Functions deployed
- [ ] API Management configured
- [ ] Monitoring setup completed
- [ ] All tests passed

### Phase 5: Testing (Week 5-6)
- [ ] Functional testing completed
- [ ] Performance testing passed
- [ ] Data validation completed
- [ ] Security testing passed
- [ ] Test reports documented

### Phase 6: Cutover (Week 6)
- [ ] 10% traffic shifted successfully
- [ ] 25% traffic shifted successfully
- [ ] 50% traffic shifted successfully
- [ ] 75% traffic shifted successfully
- [ ] 100% traffic on Azure
- [ ] No critical issues detected
- [ ] Client documentation updated

### Phase 7: Optimization & Cleanup (Week 7-8)
- [ ] Azure resources optimized
- [ ] AWS resources backed up
- [ ] AWS resources decommissioned
- [ ] Final documentation completed
- [ ] Operations team trained
- [ ] Migration report delivered

---

## 🛠️ Tools & Prerequisites

### Required Tools

```bash
# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# AzCopy (for data migration)
wget https://aka.ms/downloadazcopy-v10-linux
tar -xvf downloadazcopy-v10-linux
sudo cp ./azcopy_linux_amd64_*/azcopy /usr/local/bin/

# Azure Storage Explorer (GUI tool)
# Download from: https://azure.microsoft.com/en-us/products/storage/storage-explorer/

# Python 3.11
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# Azure SDK for Python
pip install azure-functions azure-storage-blob azure-search-documents openai azure-identity azure-keyvault-secrets
```

### Required Access & Permissions

**Azure Subscription:**
- [ ] Owner or Contributor role on subscription
- [ ] Ability to create resource groups
- [ ] Ability to create Azure OpenAI Service (requires approval)
- [ ] Ability to create Azure AI Search
- [ ] Ability to assign RBAC roles

**AWS Account:**
- [ ] Read access to all existing resources
- [ ] Access to S3 buckets
- [ ] Access to OpenSearch domain
- [ ] Access to Lambda functions
- [ ] Access to CloudWatch logs

**Development Environment:**
- [ ] Git repository access
- [ ] Python 3.11 development environment
- [ ] Azure CLI installed and configured
- [ ] AWS CLI installed and configured

---

## 🔍 Testing Scenarios

### Scenario 1: Job Description Upload (PDF)

**Test Steps:**
1. Upload PDF job description via API
2. Verify AI extraction (GPT-4)
3. Verify embedding generation (3072-dim)
4. Verify Blob Storage upload
5. Verify Azure AI Search indexing

**Expected Result:**
```json
{
  "message": "Successfully processed job description",
  "job_description_id": "uuid-format",
  "job_title": "Senior Java Developer",
  "s3_key": "jd/uuid.txt",
  "processing_time": 1.8
}
```

**Validation:**
- [ ] Response time < 3 seconds
- [ ] Job title extracted correctly
- [ ] File uploaded to Blob Storage
- [ ] Document indexed in Azure AI Search
- [ ] Embedding vector has 3072 dimensions

### Scenario 2: Resume Upload (JSON with nano_Id)

**Test Steps:**
1. Upload JSON resume with nano_Id
2. Verify nano_Id extraction
3. Verify certification enhancement
4. Verify 4-vector generation
5. Verify indexing with nano_Id

**Expected Result:**
```json
{
  "message": "Successfully processed resume",
  "resume_id": "uuid-format",
  "candidate_name": "John Doe",
  "job_description_id": "jd-uuid",
  "s3_key": "resumes/uuid.txt",
  "processing_time": 2.3
}
```

**Validation:**
- [ ] nano_Id extracted and stored
- [ ] Courses and awards included in certifications
- [ ] 4 vectors generated (each 3072-dim)
- [ ] Document indexed with nano_Id field
- [ ] Response time < 3 seconds

### Scenario 3: Candidate Matching

**Test Steps:**
1. Request similarity matching for job
2. Verify multi-vector calculation
3. Verify nano_Id in response
4. Verify ranking accuracy

**Expected Result:**
```json
{
  "job_description": {
    "id": "jd-uuid",
    "title": "Senior Java Developer"
  },
  "matches": [
    {
      "nano_Id": "candidate-001",
      "resume_id": "resume-uuid",
      "candidate_name": "John Doe",
      "similarity_score": 0.85,
      "vector_scores": {
        "skills": 0.82,
        "experience": 0.89,
        "certifications": 0.78,
        "projects": 0.91
      }
    }
  ]
}
```

**Validation:**
- [ ] Candidates ranked by similarity
- [ ] nano_Id present in response
- [ ] Vector scores calculated correctly
- [ ] Response time < 2.5 seconds
- [ ] Top-k limit respected

### Scenario 4: Error Handling

**Test Steps:**
1. Upload invalid PDF
2. Upload malformed JSON
3. Request matching for non-existent job
4. Test rate limiting

**Expected Results:**
- [ ] Appropriate error messages
- [ ] HTTP status codes correct (400, 404, 429)
- [ ] No data corruption
- [ ] Errors logged in Application Insights

---

## 📊 Monitoring & Alerting Setup

### Application Insights Configuration

**Key Metrics to Monitor:**

1. **Request Metrics**
   - Request rate (requests/minute)
   - Response time (p50, p95, p99)
   - Failed requests (count and percentage)

2. **Dependency Metrics**
   - Azure OpenAI API calls
   - Azure AI Search queries
   - Blob Storage operations

3. **Custom Metrics**
   - Vector generation time
   - Similarity calculation time
   - nano_Id extraction success rate
   - Certification enhancement rate

**Alert Rules:**

```bash
# High error rate alert
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group trujobs-prod-rg \
  --scopes /subscriptions/<sub-id>/resourceGroups/trujobs-prod-rg/providers/Microsoft.Web/sites/trujobs-resume-processor \
  --condition "avg Percentage HTTP 5xx > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action email admin@trujobs.com

# High latency alert
az monitor metrics alert create \
  --name "High Latency" \
  --resource-group trujobs-prod-rg \
  --scopes /subscriptions/<sub-id>/resourceGroups/trujobs-prod-rg/providers/Microsoft.Web/sites/trujobs-resume-processor \
  --condition "avg Http Response Time > 3000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action email admin@trujobs.com

# Azure OpenAI rate limit alert
az monitor metrics alert create \
  --name "OpenAI Rate Limit" \
  --resource-group trujobs-prod-rg \
  --scopes /subscriptions/<sub-id>/resourceGroups/trujobs-prod-rg/providers/Microsoft.CognitiveServices/accounts/trujobs-openai \
  --condition "avg Throttled Requests > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action email admin@trujobs.com
```

**Dashboard Configuration:**

Create Azure Monitor dashboard with:
- [ ] Request rate over time
- [ ] Response time percentiles
- [ ] Error rate by function
- [ ] Azure OpenAI token usage
- [ ] Azure AI Search query latency
- [ ] Cost tracking
- [ ] Availability metrics

---

## 🔄 Rollback Strategy

### When to Rollback

**Immediate Rollback Triggers:**
- Error rate > 10%
- Response time > 10 seconds (p95)
- Data loss detected
- Azure service outage
- Critical functionality broken

**Evaluation Rollback Triggers:**
- Error rate 5-10%
- Response time 5-10 seconds (p95)
- Cost overrun > 200% of estimate
- Performance degradation

### Rollback Procedures

**Step 1: Immediate Traffic Revert (< 5 minutes)**

```bash
# Option 1: DNS-based rollback
# Update DNS to point 100% to AWS
# TTL: 60 seconds

# Option 2: APIM policy rollback
# Update APIM policy to route 100% to AWS
az apim api policy create \
  --resource-group trujobs-prod-rg \
  --service-name trujobs-apim \
  --api-id resume-upload-api \
  --policy-file rollback-policy.xml
```

**Step 2: Verify AWS System**
- [ ] Check AWS Lambda functions are running
- [ ] Verify AWS API Gateway is responding
- [ ] Check OpenSearch is accessible
- [ ] Verify S3 bucket access
- [ ] Monitor CloudWatch for errors

**Step 3: Investigate Azure Issue**
- [ ] Check Application Insights logs
- [ ] Review Azure Function errors
- [ ] Check Azure OpenAI status
- [ ] Verify Azure AI Search availability
- [ ] Check network connectivity

**Step 4: Communicate**
- [ ] Notify stakeholders of rollback
- [ ] Document issue and root cause
- [ ] Create action plan for resolution
- [ ] Schedule re-attempt timeline

**Step 5: Fix and Re-attempt**
- [ ] Deploy fix to Azure
- [ ] Test in isolation
- [ ] Validate fix with synthetic traffic
- [ ] Resume gradual traffic shift

---

## ✅ Post-Migration Validation

### Week 1 Post-Migration

**Daily Checks:**
- [ ] Monitor error rates (target: < 1%)
- [ ] Monitor response times (target: < 3 seconds)
- [ ] Check Azure costs vs estimates
- [ ] Review Application Insights logs
- [ ] Validate data consistency
- [ ] Check for any user complaints

**Weekly Checks:**
- [ ] Review performance trends
- [ ] Analyze cost trends
- [ ] Review security logs
- [ ] Check for optimization opportunities
- [ ] Update documentation as needed

### Month 1 Post-Migration

**Monthly Review:**
- [ ] Complete cost analysis (actual vs estimated)
- [ ] Performance benchmarking report
- [ ] User satisfaction survey
- [ ] Identify optimization opportunities
- [ ] Plan for continuous improvement
- [ ] Update disaster recovery plan

---

## 🐛 Troubleshooting Common Issues

### Issue 1: Azure OpenAI Rate Limiting

**Symptoms:**
- 429 errors in logs
- Slow vector generation
- Timeouts during processing

**Solutions:**
1. Implement exponential backoff
2. Request rate limit increase from Azure
3. Implement request queuing
4. Consider multiple Azure OpenAI deployments
5. Cache embeddings where possible

### Issue 2: Azure AI Search Query Timeouts

**Symptoms:**
- Search queries timing out
- Slow similarity matching
- 503 errors from Azure AI Search

**Solutions:**
1. Increase replica count
2. Optimize query filters
3. Reduce result set size
4. Implement query caching
5. Review index configuration

### Issue 3: Azure Functions Cold Starts

**Symptoms:**
- First request takes > 10 seconds
- Intermittent slow responses
- Timeout errors

**Solutions:**
1. Use Premium Plan (always-on)
2. Implement pre-warming
3. Optimize function initialization
4. Reduce package dependencies
5. Use connection pooling

### Issue 4: High Azure Costs

**Symptoms:**
- Costs exceeding estimates
- Unexpected charges
- Budget alerts triggered

**Solutions:**
1. Review Azure OpenAI token usage
2. Optimize AI Search replica count
3. Implement caching strategies
4. Review Function App scaling settings
5. Use Reserved Instances
6. Implement lifecycle policies for Blob Storage

### Issue 5: Data Inconsistency

**Symptoms:**
- Missing documents in Azure
- Incorrect similarity scores
- nano_Id not present

**Solutions:**
1. Re-run data migration for affected documents
2. Verify vector re-generation completed
3. Check Azure AI Search indexing status
4. Validate data mapping logic
5. Review migration logs for errors

---

## 📚 Support & Documentation

### Azure Documentation Links

- **Azure Functions**: https://learn.microsoft.com/en-us/azure/azure-functions/
- **Azure OpenAI Service**: https://learn.microsoft.com/en-us/azure/ai-services/openai/
- **Azure AI Search**: https://learn.microsoft.com/en-us/azure/search/
- **Azure Blob Storage**: https://learn.microsoft.com/en-us/azure/storage/blobs/
- **Azure API Management**: https://learn.microsoft.com/en-us/azure/api-management/
- **Application Insights**: https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview
- **Azure Key Vault**: https://learn.microsoft.com/en-us/azure/key-vault/

### Migration Resources

- **Azure Migration Center**: https://azure.microsoft.com/en-us/migration/
- **Azure Migrate**: https://azure.microsoft.com/en-us/products/azure-migrate/
- **AWS to Azure Services Comparison**: https://learn.microsoft.com/en-us/azure/architecture/aws-professional/services

### Support Channels

- **Azure Support**: https://azure.microsoft.com/en-us/support/options/
- **Azure Community**: https://techcommunity.microsoft.com/t5/azure/ct-p/Azure
- **Stack Overflow**: Tag questions with `azure`, `azure-functions`, `azure-openai`

### Internal Documentation

After migration, update:
- [ ] TruJobs system architecture documentation
- [ ] API endpoint documentation
- [ ] Operations runbook
- [ ] Disaster recovery plan
- [ ] Cost optimization guide
- [ ] Monitoring and alerting guide

---

## 🎯 Success Criteria

### Technical Success Criteria

✅ **Zero Data Loss**: All documents and metadata migrated successfully  
✅ **Performance**: Response times ≤ 3 seconds (p95)  
✅ **Availability**: 99.9% uptime maintained  
✅ **Accuracy**: Similarity scores within acceptable range  
✅ **Security**: All security tests passed  
✅ **Monitoring**: Complete observability with Application Insights  

### Business Success Criteria

✅ **Zero Downtime**: No service interruption during migration  
✅ **Cost Control**: Azure costs within 120% of estimates  
✅ **Timeline**: Migration completed within 8 weeks  
✅ **User Satisfaction**: No user complaints or issues  
✅ **Documentation**: Complete and up-to-date  

### Post-Migration Success Criteria (30 days)

✅ **Stability**: No critical incidents  
✅ **Performance**: Meets or exceeds AWS baseline  
✅ **Cost**: Actual costs match optimized estimates  
✅ **Optimization**: At least 3 optimization opportunities implemented  
✅ **Team Readiness**: Operations team fully trained  

---

## 📝 Final Notes

### Key Takeaways

1. **Vector Re-generation is Mandatory**: Budget 3-5 days for this critical task
2. **Gradual Traffic Shift**: Never switch 100% at once - use 10% → 25% → 50% → 75% → 100%
3. **Monitoring is Critical**: Application Insights provides superior visibility
4. **Cost Management**: Monitor daily, optimize continuously
5. **Rollback Capability**: Always maintain ability to revert to AWS

### Migration Team Roles

- **Migration Lead**: Overall coordination and decision-making
- **Cloud Architect**: Azure infrastructure design and setup
- **DevOps Engineer**: Deployment automation and CI/CD
- **Data Engineer**: Data migration and vector re-generation
- **QA Engineer**: Testing and validation
- **Security Engineer**: Security review and compliance
- **Operations Engineer**: Monitoring and support

### Post-Migration Optimization Roadmap

**Month 1-2:**
- Fine-tune Azure Function memory allocation
- Optimize Azure AI Search configuration
- Implement caching strategies
- Review and optimize costs

**Month 3-6:**
- Implement auto-scaling policies
- Setup disaster recovery
- Optimize AI model usage
- Implement advanced monitoring

**Month 6-12:**
- Consider multi-region deployment
- Implement advanced security features
- Explore Azure AI enhancements
- Continuous cost optimization

---

## 🚀 Ready to Migrate?

This guide provides a comprehensive roadmap for migrating TruJobs from AWS to Azure. Follow each phase carefully, validate at every step, and maintain rollback capability throughout the process.

**Before starting:**
1. Review this entire document
2. Assemble your migration team
3. Get stakeholder approval
4. Secure budget and resources
5. Schedule migration timeline

**Good luck with your migration!** 🎉

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Maintained By**: TruJobs DevOps Team  
**Contact**: devops@trujobs.com

---

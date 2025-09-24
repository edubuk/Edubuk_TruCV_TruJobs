# 🔧 **TruJobs Development - Source Code & Fixes**

## 📁 **Development Structure**

### 🏗️ **Core Modules** (`modules/`)
- `new_resume_logic/` - Resume PDF processing ❌ **NEEDS FIX**
- `new_jd_logic/` - Job description processing ✅ Working
- `new_matching_logic/` - AI-powered matching ✅ Working

### 🛠️ **Scripts** (`scripts/`)
- `deploy_resume_logic.sh` - Deploy to AWS Lambda
- `test_critical_fix.py` - Validate PDF fix
- `comprehensive_api_test.sh` - Full system test

### 🩹 **Patches** (`patches/`)
- `CRITICAL_FIX_PATCH.py` - Nuclear reconstruction fix 🔄 **IN PROGRESS**
- `enhanced_pdf_processor.py` - Multi-method extraction ✅ **DEPLOYED**

## 🎯 **Critical Issue Location**

**File:** `modules/new_resume_logic/input_parser.py`
**Function:** `apply_proven_pdf_reconstruction()`
**Issue:** Nuclear reconstruction losing 40-50% of PDF data

## 🚀 **Quick Commands**

```bash
# Deploy fix
./scripts/deploy_resume_logic.sh

# Test fix
python3 tests/results/test_critical_fix.py

# Check logs
aws logs filter-log-events --log-group-name "/aws/lambda/resume-processor"
```

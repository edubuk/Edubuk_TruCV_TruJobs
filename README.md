# Edubuk - Academic Credentials & Skills Verification Platform #
Edubuk is an AI and Blockchain-powered platform designed to tackle the global issue of fake credentials. 
By leveraging blockchain technology, Edubuk provides a secure, cost-effective, and instant verification system for academic credentials.


## Problem Statement
- 10 Million fake degrees sold annually.
- $20bn global fake degree market.
- Fraudulent CVs and LinkedIn profiles.
# Edubuk introduces an e-Seal & e-Verify system powered by blockchain:
- ## e-Seal Layer:
   - Records academic credentials securely on the blockchain.
- ## e-Verify Layer: 
   - Ensures the authenticity of credentials, preventing fraud.
 

## Advantages Over Traditional Verification Methods
| Traditional Background Verification | Blockchain-Based Verification |
| ----------------------------------- | ----------------------------- |
| Slow                                | Instant                       |
| Costly                              | Cost-Effective                |
| Fraud-Prone                         | Secure                        |


## Resume and Job Description Matching Application  

This application leverages *AI and NLP (Natural Language Processing)* to intelligently compare *resumes (CVs) and job descriptions (JDs)* and rank resumes based on their relevance to the job.  

### How It Works (Step-by-Step)  

#### 1. Reading Input Files (Preprocessing - NLP)  
- The application takes a folder of resumes (CVs/) and a job description file (jd.txt).  
- It extracts text from *PDF and TXT files* using *PyMuPDF (fitz)*.  

#### 2. Cleaning and Processing Text (Preprocessing - NLP)  
- The extracted text is cleaned by removing *special characters, punctuation, and extra spaces*.  
- Converts text to *lowercase* to maintain uniformity.  

#### 3. Converting Text into Numerical Representation (AI & Machine Learning - NLP)  
- Uses *SentenceTransformer (all-MiniLM-L6-v2)* to generate *numerical embeddings* for both the *resume and job description*.  
- These embeddings capture the *meaning of words and sentences* rather than just exact word matches.  

#### 4. Matching Resumes with JD (AI - Deep Learning & ML)  
- Computes *cosine similarity* between the resume embedding and job description embedding using *SentenceTransformer & PyTorch*.  
- A *base similarity score* is calculated between the resume and the job description.  

#### 5. Skill-Based Weighting (AI - NLP & Machine Learning)  
- The user can provide skill categories: *Must-Have, Good-to-Have, and Bonus Skills*.  
- Each category has a *weight (importance level)*.  
- The similarity of each skill with the resume is calculated, and a *weighted score* is computed.  

#### 6. Ranking and Output (AI & Data Processing)  
- Resumes are *sorted based on their weighted matching percentage*.  
- The results are saved in a *results.csv* file, listing resumes with their *similarity scores*.  

This *AI-powered approach* ensures *accurate and meaningful resume-job matching*, rather than relying on simple keyword-based matching.


## Product Overview

- ### CV Creation
    - Fill a Simple Form – Enter credential details.

    - Upload Certificates – Submit documents for verification.

    - Issuer Verification – The certificate issuer receives an email for authentication.

    - Verified CV Creation – Credentials are verified and stored on the blockchain.

    - NFT Storage – Each certificate is stored as a Non-Fungible Token (NFT) for secure and permanent validation.

- ### HR Portal

     - HR of any organization can post a job.

     - HR can fetch the most matching CV/Resume based on the job description.

    - Matching results are powered by an AI-driven model.

- ### Jobs

  - Users must download the CV template from the platform.

  - The same formatted CV should be uploaded while applying for a job.
<!-- ## Screenshots -->
<!-- ![image](https://github.com/user-attachments/assets/9994c785-9140-4c44-bc10-a5d3dfd6b561)
![image](https://github.com/user-attachments/assets/9990924e-15f4-4336-930b-206bebb8501b)
![image](https://github.com/user-attachments/assets/5fc00194-e1b9-40d7-a6cd-7092a8e793be)
![image](https://github.com/user-attachments/assets/ce4c5986-dd5a-4b80-b0b6-d32a3066ff96)
![image](https://github.com/user-attachments/assets/1111cf86-71fd-4a8c-9ebd-8823bcd2a094)
![image](https://github.com/user-attachments/assets/ffdb2a25-e498-49f7-a2ef-fe1a7cb81b0c)
![image](https://github.com/user-attachments/assets/25ac455f-f0a3-461d-9ef0-56c716abde53)
![image](https://github.com/user-attachments/assets/922baa0d-6441-4483-95ef-d20b0ec5e252)
![image](https://github.com/user-attachments/assets/6b0ce388-5284-42b1-b044-3baa294c6aea)
![image](https://github.com/user-attachments/assets/1b2e6139-5d43-4d1e-8147-f3328f5e1e1c) -->

 
  <!-- ## Tech Stack
  - Frontend: *React,TypeScript, Tailwind,CSS.*
  - Backend: *Nodejs, ExpressJs, MongoDB.*
  - Smart Contract: *Solidity.*
  - IDE: *Remix-Ethereum.*
  - Blockchain Network: *Educhain Testnet.*
  - Libraries: *etherjs,JWT,crypto etc.*
  - Decentralized cloud storage: *IPFS.*
  - AI & NLP: *SentenceTransformer, PyTorch, Word Embeddings.*  
  - Machine Learning: *Cosine Similarity for text matching.*
  - Data Processing: *Pandas for CSV export*  
  - Backend: *Flask for REST API* -->
    






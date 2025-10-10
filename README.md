# **Edubuk – Academic Credentials & Skills Verification Platform**

Edubuk is an **AI + Blockchain–powered platform** designed to tackle the global issue of **fake academic credentials**.  
By leveraging **blockchain technology**, Edubuk provides a **secure, cost-effective, and instant verification system** for academic credentials.

---

## **Smart Contract Address(U2U Solaris Mainnet)**
```0x560c1787b2C9DcD33AD0df3fd29E4F43cE7ea481```
<!-- ```0x75968e46D4699128e97631b1bb89Be9ddD27cB01``` -->

## **Demo Video**
``` https://drive.google.com/file/d/1Jvdi_mKvv0xx6ekhVunNqd3D-eDm5qzH/view?usp=sharing```

## **Problem Statement**
- **10 Million** fake degrees sold annually.  
- **$20 Billion** global fake degree market.  
- Fraudulent CVs and LinkedIn profiles are common.

### Edubuk’s Solution – *e-Seal & e-Verify System Powered by Blockchain*
#### **e-Seal Layer**
- Records academic credentials securely on the blockchain.

#### **e-Verify Layer**
- Ensures the authenticity of credentials, preventing fraud.

---

## **Advantages Over Traditional Verification**

| Traditional Background Verification | Blockchain-Based Verification |
|--------------------------------------|--------------------------------|
| Slow                                 | Instant                        |
| Costly                               | Cost-Effective                 |
| Fraud-Prone                          | Secure                         |

---

## **Resume & Job Description Matching Application**

This application leverages **AI + NLP (Natural Language Processing)** to intelligently compare **resumes (CVs)** and **job descriptions (JDs)** and rank resumes based on their relevance.

### **How It Works**

1. **Reading Input Files (Preprocessing – NLP)**  
   - Takes a folder of resumes (`CVs/`) and a job description file (`jd.txt`).  
   - Extracts text from **PDF** and **TXT** files using **PyMuPDF (fitz)**.

2. **Cleaning & Processing Text**  
   - Removes special characters, punctuation, and extra spaces.  
   - Converts text to lowercase for uniformity.

3. **Converting Text into Numerical Representation**  
   - Uses **SentenceTransformer (all-MiniLM-L6-v2)** to generate **numerical embeddings**.  
   - Embeddings capture the **semantic meaning** of sentences.

4. **Matching Resumes with JD**  
   - Computes **cosine similarity** between resume and job description embeddings.  
   - Calculates a **base similarity score**.

5. **Skill-Based Weighting**  
   - Supports *Must-Have*, *Good-to-Have*, and *Bonus Skills* with custom weights.  
   - Computes a **weighted score** based on skill similarity.

6. **Ranking & Output**  
   - Resumes are sorted by their **weighted matching percentage**.  
   - Generates a `results.csv` file with resumes and their similarity scores.

✅ **Result:** A far more **accurate and meaningful resume-job matching**, beyond simple keyword checks.

---

## **Product Overview**

### **TruCv – CV Creation**
- Fill a simple form with academic credential details.
- Upload certificates for verification.
- Issuer verifies credentials via email.
- A **verified CV** is created and stored on the blockchain.
- Certificates are stored as **NFTs** for permanent validation.

### **Admin Panel**
- Verify and approve companies.
- Approve or reject HR accounts.

### **TruJobs – HR Portal**
- HR can post jobs after admin approval.
- Fetch the most relevant CVs/Resumes based on JD using **AI-driven matching**.
- View and analyze resumes, including blockchain-verified documents.
- Quickly check valid credentials in the **Analyze section**.
- Schedule interviews with **one-click scheduling**.

### **TruJobs – Jobs Portal**
- Users do not need to upload a CV.
- System automatically fetches the blockchain-verified resume.
- User can apply directly from the job listing.

---

## **Deployment & U2U Network Solaris Mainnet Integration**

Edubuk’s smart contract is deployed on the **U2U Solaris Mainnet**, following the official U2U documentation for network configuration.

### **Steps to Deploy Smart Contract**

1. **Remix IDE**  
   - Open [Remix](https://remix.ethereum.org/).  
   - Paste the **Solidity smart contract** code.  
   - Compile and deploy using **Injected Web3** environment.

2. **MetaMask Configuration**  
   - Add a **Custom RPC Network** in MetaMask using U2U Solaris Mainnet details:
     - **Network Name:** `U2U Network Solaris`  
     - **RPC URL:** `https://rpc-mainnet.u2u.xyz` (*from U2U docs*)  
     - **Chain ID:** `39` (*from U2U docs*)  
     - **Currency Symbol:** `U2U`  
   - Save and switch to the U2U Solaris Mainnet.

3. **Faucet**  
   - Claim test U2U tokens from the **U2U Faucet** to test the smart contract.  
   - Deposit these tokens to your MetaMask wallet to cover deployment gas fees.
   - Faucet URL: `https://faucet.uniultra.xyz/`
4. **Testing Smart Contract**  
   - Use the **U2U Testnet** to test the smart contract.
   - Network Name: `U2U Network Nebulas`
   - RPC URL: `https://rpc-nebulas-testnet.u2u.xyz`
   - Chain ID: `2484`
   - Currency Symbol: `U2U`

5. **Contract Deployment**  
   - In Remix, select **Injected Web3** with MetaMask connected to the U2U Solaris Mainnet.  
   - Deploy the contract and note the **contract address**.

✅ The contract is now live and ready for integration with the Edubuk platform.

---

## **Tech Stack**

- **Frontend:** React, TypeScript, Tailwind CSS  
- **Backend:** Node.js, Express.js, MongoDB, Flask (for AI APIs)  
- **Blockchain & Smart Contracts:** Solidity, Remix IDE, OpenZeppelin, ethers.js  
- **Network:** U2U Solaris Mainnet  
- **AI & NLP:** SentenceTransformer, PyTorch  
- **Machine Learning:** Cosine Similarity for text matching  
- **Data Processing:** Pandas for CSV export  
- **Decentralized Storage:** IPFS  
- **Authentication & Security:** JWT, OAuth, crypto libraries  

---

## **Screenshots**

<img width="2878" height="1636" alt="image" src="https://github.com/user-attachments/assets/1d791462-aca1-4b1e-a4b5-eb876e95f647" />
<img width="2878" height="1636" alt="image" src="https://github.com/user-attachments/assets/a4fa48a4-40fa-4543-b240-2be6c5aca560" />
<img width="2878" height="1640" alt="image" src="https://github.com/user-attachments/assets/5b184646-3526-4d9a-b2a3-c68b19dc9de0" />

<img width="2878" height="1636" alt="image" src="https://github.com/user-attachments/assets/a2df5a53-ec4e-4f86-a5de-2d5a62a99999" />
<img width="2878" height="1636" alt="image" src="https://github.com/user-attachments/assets/2de9b2d1-f0f5-44ed-af8a-6f10b98fe573" />
<img width="2878" height="1640" alt="image" src="https://github.com/user-attachments/assets/1b343689-95b1-47d8-8a5a-25167eff22e6" />
<img width="2878" height="1640" alt="image" src="https://github.com/user-attachments/assets/baba3ca4-c2ff-48af-aa7f-48e67ae13446" />



<img width="2878" height="1636" alt="image" src="https://github.com/user-attachments/assets/ff46e3b4-a6a6-4933-a057-d963abdfa959" />
<img width="2878" height="1636" alt="image" src="https://github.com/user-attachments/assets/595ddef3-f3bf-46dc-b2d2-13c17e61d217" />
<img width="2878" height="1792" alt="image" src="https://github.com/user-attachments/assets/76a44747-bbc6-45a6-ba7a-40cfdac59631" />
<img width="1439" height="861" alt="Screenshot 2025-09-28 at 01 58 45" src="https://github.com/user-attachments/assets/851425c6-107d-44d3-8ca5-ef832f529c6a" />
<img width="2878" height="1792" alt="image" src="https://github.com/user-attachments/assets/c8e2a956-40de-4b5b-8c09-6ff65c388ca5" />



<img width="2878" height="1636" alt="image" src="https://github.com/user-attachments/assets/c12a8072-2fe8-4227-8764-ab7ba5f1de9d" />
<img width="2878" height="1640" alt="image" src="https://github.com/user-attachments/assets/7e3c3e62-f014-4f5c-b6b7-3497cd7c076e" />

<img width="2878" height="1636" alt="image" src="https://github.com/user-attachments/assets/2e77e728-43e4-495c-9d61-5ee86541f94f" />
<img width="2878" height="1636" alt="image" src="https://github.com/user-attachments/assets/5bc7447d-d573-47f4-a07b-726f7de01774" />
<img width="2878" height="1636" alt="image" src="https://github.com/user-attachments/assets/486c2ba4-9537-45a0-b9a1-077aa87fcfb2" />
<img width="2878" height="1636" alt="image" src="https://github.com/user-attachments/assets/0511130b-4087-41d6-92ab-23531bad9f8a" />

---

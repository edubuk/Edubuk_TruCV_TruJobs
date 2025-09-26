import { Request, Response } from "express";
import crypto from "crypto";
import { BlobServiceClient } from "@azure/storage-blob";
import { configDotenv } from "dotenv";
import axios from "axios";
configDotenv();
console.log("process.env.AWS_API_KEY",process.env.AWS_API_KEY);
interface MulterRequest extends Request {
  file?: Express.Multer.File; 
}

interface UploadJDRes {
  data:{
    message:string;
    job_description_id:string;
    job_title:string;
    fileName:string;
  }
}


const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = "uploads";

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

export const uploadFileController = async (req: MulterRequest, res: Response) => {
  try {
    const userFile = req.file;
   console.log("userfile",userFile);
    if (!userFile) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    // if (userFile.size > 512000) {
    //   res.status(400).json({
    //     success: false,
    //     error: "File size should be less than 500KB"
    //   });
    //   return;
    // }

    const fileBuffer = userFile.buffer;
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const mimeType = userFile.mimetype;
    const ext = userFile.originalname.split(".").pop();
    const timestamp = Math.floor(Date.now() / 1000);

    const fileName = `${fileHash}_${timestamp}.${ext}`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: {
        blobContentType: mimeType
      }
    });

    const fileUrl = blockBlobClient.url;

    res.status(200).json({ success: true, url: fileUrl,fileHashWithTimeStampExt:fileName});
  } catch (err: any) {
    console.error("Azure upload failed", err);
    res.status(500).json({ success: false, error: err.message || "Upload error" });
  }
};



export const uploadJDController = async(req:Request,res:Response)=>{
  try {
    const job_description = req.body.job_description;
    if(!job_description){
      res.status(400).json({ success: false, error: "No job description provided" });
      return;
    }
    const uploadRes:UploadJDRes = await axios.post(`${process.env.AWS_BASE_URL}/prod/JDUpload`,
      {job_description:job_description},
      {
        headers:{
          "Content-Type": "application/json",
          "x-api-key": `${process.env.AWS_API_KEY}`
        },
        timeout: 15000,
    })
   // console.log("uploadRes",uploadRes);
    
    res.status(200).json({ success: true, job_description_id: uploadRes.data.job_description_id });
  } catch (error:any) {
    console.error("uploadJD failed", error);
    res.status(500).json({ success: false, error: error?.data?.message || "Upload error" });
  }
}
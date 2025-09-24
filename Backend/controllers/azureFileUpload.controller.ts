import { Request, Response } from "express";
import crypto from "crypto";
import { BlobServiceClient } from "@azure/storage-blob";
import { configDotenv } from "dotenv";
configDotenv();

interface MulterRequest extends Request {
  file?: Express.Multer.File; 
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

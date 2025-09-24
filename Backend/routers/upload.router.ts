import { Router } from "express";
import multer from 'multer';
import { uploadFileController } from "../controllers/azureFileUpload.controller";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

router.post("/upload",upload.single('file'),uploadFileController);

export default router;
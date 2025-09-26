import { Router } from "express";
import multer from 'multer';
import { uploadFileController,uploadJDController } from "../controllers/upload.controller";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

router.post("/upload",upload.single('file'),uploadFileController);
router.post("/uploadJD",uploadJDController);

export default router;
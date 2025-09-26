// routes/jobRoutes.ts
import express from "express";
import { createJob, listJobs, getJobById, getAllJobByHrId, applyJob } from "../controllers/job.controller";
import { ensureAuthenticatedGoogle, attachHR, ensureApprovedHR } from "../middleware/auth";

const router = express.Router();

// Create job: must be an approved HR
router.post("/post-job", ensureAuthenticatedGoogle, attachHR, ensureApprovedHR, createJob);

// Public list
router.get("/hr-jobs", getAllJobByHrId);
router.get("/all-jobs", listJobs);
router.get("/:jobId", getJobById);
router.post("/apply-job", ensureAuthenticatedGoogle, applyJob);

export default router;

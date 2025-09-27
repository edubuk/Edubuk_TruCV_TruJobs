// routes/hrRoutes.ts
import express from "express";
import { registerHR, listPendingHRs, approveHR, rejectHR, getMyHRProfile, getSimilarityScore, deleteJob } from "../controllers/hr.controller";
import { ensureAuthenticatedGoogle, attachHR, ensureAdmin } from "../middleware/auth";

const router = express.Router();

// Register new HR (after Google login)
router.post("/register", ensureAuthenticatedGoogle, registerHR);

// Get current HR (if exists for logged-in Google account)
router.get("/me", ensureAuthenticatedGoogle, attachHR, getMyHRProfile);
router.delete("/deleteJob/:job_id", ensureAuthenticatedGoogle,deleteJob);

// Admin-only endpoints
router.get("/companies-list/", ensureAuthenticatedGoogle, ensureAdmin, listPendingHRs);//list based on query
router.post("/approve/:hrId", ensureAuthenticatedGoogle,ensureAdmin, approveHR);
router.post("/reject/:hrId", ensureAuthenticatedGoogle,ensureAdmin, rejectHR);
router.get("/getSimilarityScore",getSimilarityScore);


export default router;

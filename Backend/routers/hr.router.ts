// routes/hrRoutes.ts
import express from "express";
import { registerHR, listPendingHRs, approveHR, rejectHR, getMyHRProfile } from "../controllers/hr.controller";
import { ensureAuthenticatedGoogle, attachHR, ensureAdmin } from "../middleware/auth";

const router = express.Router();

// Register new HR (after Google login)
router.post("/register", ensureAuthenticatedGoogle, registerHR);

// Get current HR (if exists for logged-in Google account)
router.get("/me", ensureAuthenticatedGoogle, attachHR, getMyHRProfile);

// Admin-only endpoints
router.get("/companies-list/", ensureAuthenticatedGoogle, attachHR, ensureAdmin, listPendingHRs);//list based on query
router.post("/approve/:hrId", ensureAuthenticatedGoogle, attachHR, ensureAdmin, approveHR);
router.post("/reject/:hrId", ensureAuthenticatedGoogle, attachHR, ensureAdmin, rejectHR);

export default router;

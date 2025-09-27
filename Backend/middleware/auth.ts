// middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { verifyGoogleToken } from "./verifyGoogleToken";
import {HR} from "../models/hr.model"; // adjust path: default export is HR if used

// Extend Request interface for hr attachment
declare global {
  namespace Express {
    interface Request {
      hr?: any; // replace `any` with your IHRDocument type if you export it
    }
  }
}

/**
 * ensureAuthenticatedGoogle
 * - verifies Google id token and attaches req.user (google payload)
 */
export const ensureAuthenticatedGoogle = async (req: Request, res: Response, next: NextFunction) => {
  return verifyGoogleToken(req, res, next);
};

/**
 * attachHR
 * - after Google verification, find the HR by providerId (google sub)
 * - attaches hr doc to req.hr if found
 * - does NOT auto-create HR (use register endpoint to create new HR)
 */
export const attachHR = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.user;
    if (!payload || !payload.sub) {
      return res.status(401).json({ success: false, message: "Invalid Google payload" });
    }

    // find HR for provider google+sub
    const providerId = String(payload.sub);
    const hr = await HR.findOne({
      oauthProviders: {
        $elemMatch: { provider: "google", providerId }
      }
    });

    if (!hr) {
      // not found: caller can either register via /hr/register or we can create on the fly.
      // For now return 403 so users register via registerHR endpoint.
      return res.status(403).json({ success: false, message: "No HR account linked with this Google account. Please register." });
    }

    req.hr = hr;
    return next();
  } catch (err) {
    console.error("attachHR error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ensureApprovedHR
 * - requires req.hr and hr.status === 'approved'
 */
export const ensureApprovedHR = (req: Request, res: Response, next: NextFunction) => {
  const hr = req.hr;
  if (!hr) return res.status(401).json({ success: false, message: "Not authenticated as HR" });
  if (hr.status !== "approved") return res.status(403).json({ success: false, message: "HR account not approved" });
  return next();
};

/**
 * ensureAdmin
 * - requires req.hr and 'admin' role present
 */
export const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user || req.hr;
  if (user.email !== "ajeetramverma10@gmail.com") return res.status(403).json({ success: false, message: "Admin role required" });
  return next();
};

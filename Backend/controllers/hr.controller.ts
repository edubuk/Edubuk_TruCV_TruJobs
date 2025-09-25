// controllers/hrController.ts
import { Request, Response } from "express";
import {HR} from "../models/hr.model";




/**
 * Get current HR profile for logged-in user (Google OAuth required)
 * Requires: ensureAuthenticatedGoogle + attachHR middleware
 */
export const getMyHRProfile = async (req: Request, res: Response) => {
    try {
      if (!req.hr) {
        return res.status(404).json({ error: "HR account not found for this user" });
      }
      return res.status(200).json({ hr: req.hr });
    } catch (err) {
      console.error("getMyHRProfile error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  };

/**
 * registerHR
 * - If called after Google token verification, you can omit oauthProvider in body;
 *   the function will use req.user (google payload) to populate provider details.
 */
export const registerHR = async (req: Request, res: Response) => {
  try {
    const {
      name,
      companyName,
      mobileNumber,
      address,
      documents,
      oauthProvider // optional if req.user exists
    } = req.body;

    // if oauthProvider not provided, try to use Google payload
    let provider = oauthProvider;
    if (!provider && req.user) {
      provider = {
        provider: "google",
        providerId: req.user.sub,
        email: req.user.email,
        emailVerified: req.user.email_verified,
        profile: {
          name: req.user.name,
          picture: req.user.picture
        }
      };
    }

    if (!name || !companyName || !provider || !provider.provider || !provider.providerId) {
      return res.status(400).json({ error: "Missing required fields: name, companyName, oauthProvider(provider+providerId) or ensureGoogleAuth" });
    }

    // check existing by provider
    const existing = await HR.findOne({
      oauthProviders: {
        $elemMatch: { provider: provider.provider, providerId: provider.providerId }
      }
    });

    if (existing) return res.status(200).json({ message: "HR already registered", hr: existing });

    // try to link by email if verified
    let hr = null;
    if (provider.email && provider.emailVerified) {
      hr = await HR.findOne({ email: provider.email });
    }

    if (hr) {
      const alreadyLinked = hr.oauthProviders?.some((p: any) => p.provider === provider.provider && p.providerId === provider.providerId);
      if (!alreadyLinked) {
        hr.oauthProviders.push({
          provider: provider.provider,
          providerId: provider.providerId,
          email: provider.email,
          profile: provider.profile || {},
          emailVerified: !!provider.emailVerified,
          linkedAt: new Date()
        });
        await hr.save();
      }
      return res.status(200).json({ message: "Linked provider to existing HR", hr });
    }

    // create new HR (status pending)
    const newHR = new HR({
      name,
      companyName,
      mobileNumber,
      address,
      documents: documents || [],
      email: provider.email || undefined,
      roles: ["recruiter"],
      oauthProviders: [{
        provider: provider.provider,
        providerId: provider.providerId,
        email: provider.email,
        profile: provider.profile || {},
        emailVerified: !!provider.emailVerified,
        linkedAt: new Date()
      }],
      status: "pending"
    });

    await newHR.save();
    return res.status(201).json({ message: "HR registered (pending approval)", hr: newHR });
  } catch (err) {
    console.error("registerHR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const listPendingHRs = async (_req: Request, res: Response) => {
  try {
    const {status} = _req.query;
    console.log("listPendingHRs");
    const pending = await HR.find({ status: status || "pending" }).sort({ createdAt: -1 });
    console.log("pending", pending);
    return res.status(200).json({ count: pending.length, pending });
  } catch (err) {
    console.error("listPendingHRs:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const approveHR = async (req: Request, res: Response) => {
  try {
    const { hrId } = req.params;
    if (!hrId || !hrId.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ error: "Invalid hrId" });
    const hr = await HR.findById(hrId);
    if (!hr) return res.status(404).json({ error: "HR not found" });
    hr.status = "approved";
    await hr.save();
    return res.status(200).json({ message: "HR approved", hr });
  } catch (err) {
    console.error("approveHR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const rejectHR = async (req: Request, res: Response) => {
  try {
    const { hrId } = req.params;
    if (!hrId || !hrId.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ error: "Invalid hrId" });
    const hr = await HR.findById(hrId);
    if (!hr) return res.status(404).json({ error: "HR not found" });
    hr.status = "rejected";
    await hr.save();
    return res.status(200).json({ message: "HR rejected", hr });
  } catch (err) {
    console.error("rejectHR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

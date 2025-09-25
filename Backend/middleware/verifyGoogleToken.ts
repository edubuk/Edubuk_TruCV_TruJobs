// middleware/googleAuth.ts
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload; // google token payload shape (sub, email, name, email_verified, ...)
    }
  }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized: missing Bearer token" });
  }

  const token = header.split(" ")[1];

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(403).json({ success: false, message: "Invalid token payload" });
    }

    // Attach Google payload to req.user
    req.user = payload;
    // payload contains: sub (id), email, email_verified, name, picture, given_name, family_name, etc.
    return next();
  } catch (err) {
    console.error("Token verification failed", err);
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
};

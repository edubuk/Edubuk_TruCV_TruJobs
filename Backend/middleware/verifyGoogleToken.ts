import { OAuth2Client } from 'google-auth-library';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();
// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any; // You can replace 'any' with a more specific type if needed
    }
  }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (req:Request, res:Response, next:any) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({success:false, message: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    req.user = payload; // attach user info
    //console.log("payload",req.user);
    console.log("authorised request");
    next();
  } catch (err) {
    console.error("Token verification failed", err);
    return res.status(403).json({success:false, message: "Invalid token" });
  }
};

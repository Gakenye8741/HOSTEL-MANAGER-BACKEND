import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Syncing with your pgEnum: 'admin' | 'landlord' | 'caretaker' | 'tenant'
export type UserRole = 'admin' | 'landlord' | 'caretaker' | 'tenant';

type DecodedToken = {
  id: string;
  role: UserRole;
  exp: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

export const verifyToken = (token: string, secret: string): DecodedToken | null => {
  try {
    return jwt.verify(token, secret) as DecodedToken;
  } catch (error) {
    return null;
  }
};

export const authMiddleware = (allowedRoles: UserRole[] | "any" = "any") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.header("Authorization");
    
    // Improved token extraction
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.split(" ")[1].replace(/["\\]/g, '').trim() 
      : null;

    if (!token) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const decodedToken = verifyToken(token, process.env.JWT_SECRET!);
    
    if (!decodedToken) {
      return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }

    // Attach to request
    req.user = decodedToken;

    // Role check logic
    if (allowedRoles === "any" || allowedRoles.includes(decodedToken.role)) {
      return next();
    }

    return res.status(403).json({ success: false, error: "Access denied: Insufficient permissions" });
  };
};

// Updated exports for your new Role Enum
export const adminAuth = authMiddleware(["admin"]);
export const landlordAuth = authMiddleware(["admin", "landlord"]);
export const caretakerAuth = authMiddleware(["admin", "landlord", "caretaker"]);
export const tenantAuth = authMiddleware(["admin", "landlord", "caretaker", "tenant"]);
export const anyAuthenticatedUser = authMiddleware("any");
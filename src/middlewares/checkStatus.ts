import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import db from '../drizzle/db';
import { users } from '../drizzle/schema';

export const checkAccountStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Identify user from request (Assuming you use JWT or session middleware)
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    // 2. Query only necessary fields for performance
    const results = await db.select({ 
      isActive: users.isActive,
      isVerified: users.isVerified 
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1); // Explicitly limit to 1 row

    const user = results[0];

    // 3. Validation Logic
    if (!user) {
      return res.status(404).json({ error: "User account no longer exists" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated. Please contact support." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: "Account not verified. Please check your email for the verification code." });
    }

    // 4. If all checks pass, proceed to the next handler
    next();
  } catch (error) {
    console.error("Account status check error:", error);
    res.status(500).json({ error: "Internal server error during status check" });
  }
};
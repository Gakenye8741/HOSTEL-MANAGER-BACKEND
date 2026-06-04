import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";

// 1. Global Limiter: 50 requests per 15 minutes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, 
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request): string => {
    const userId = (req as any).user?.id;
    return userId ? String(userId) : ipKeyGenerator(req.ip ?? "");
  },

  handler: (req, res, next, options) => {
    const windowMinutes = Math.ceil(options.windowMs / 60000);
    res.status(429).json({
      success: false,
      error: "Too many requests",
      message: `You have exceeded your request limit. Please try again in ${windowMinutes} minutes.`,
    });
  },
});

// 2. Auth Limiter: Keep tight (e.g., 5 attempts) to prevent brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request): string => ipKeyGenerator(req.ip ?? ""),

  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many login attempts",
      message: "For your security, access is temporarily limited. Please try again in 15 minutes.",
    });
  },
});

// 3. Sensitive Action Limiter: Keep tight (e.g., 3 attempts) for critical security
export const sensitiveActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request): string => ipKeyGenerator(req.ip ?? ""),

  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many attempts",
      message: "You have performed this action too many times. Please wait 5 minutes before trying again.",
    });
  },
});
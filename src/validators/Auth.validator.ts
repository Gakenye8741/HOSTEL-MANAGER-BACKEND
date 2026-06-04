import { z } from "zod";
import { userRoleEnum } from "../drizzle/schema";

/* Helper for Password Validation Policy */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

/* ================================
   1. REGISTRATION VALIDATOR
================================ */
export const registerUserValidator = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50).trim(),
  email: z.string().email("A valid email is required"),
  password: passwordSchema,
  fullName: z.string().min(3, "Full name must be at least 3 characters").trim(),
  phoneNumber: z.string().min(10, "Phone number is too short").max(15, "Phone number is too long"),
  role: z.enum(userRoleEnum.enumValues).default("tenant"),
  hostelId: z.string().uuid("Invalid hostel ID").optional(),
});

/* ================================
   2. LOGIN VALIDATOR
================================ */
export const loginUserValidator = z.object({
  // Supports username, email, or phone number
  identifier: z.string().min(1, "Identifier is required"),
  password: z.string().min(1, "Password is required"),
});

/* ================================
   3. PROFILE COMPLETION VALIDATOR
================================ */
export const completeProfileValidator = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters").trim(),
  phoneNumber: z
    .string()
    .min(10, "Invalid phone number")
    .regex(/^\+?[0-9]+$/, "Use E.164 format (e.g., +254...)"),
  email: z.string().email("Invalid email address"),
});

/* ================================
   4. FORGOT PASSWORD / OTP GENERATION
================================ */
export const forgotPasswordValidator = z.object({
  identifier: z.string().min(1, "Username, email, or phone number is required"),
});

/* ================================
   5. RESET PASSWORD VALIDATOR
================================ */
export const resetPasswordValidator = z.object({
  userId: z.string(),
  otp: z.string(),
  newPassword: z.string().min(6),
  email: z.string().email(), // Add this line
});

/* ================================
   6. PASSWORD UPDATE (AUTHENTICATED)
================================ */
export const updatePasswordValidator = z.object({
  userId: z.string().uuid("Invalid user ID"),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});


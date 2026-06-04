import { and, eq, or } from "drizzle-orm";
import db from "../drizzle/db";
import { TSelectUser, users, properties } from "../drizzle/schema";
import bcrypt from "bcrypt";
import { sendNotificationEmail } from "../middlewares/GoogleMAiler";

const SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

// ================================
// 1. Registration
// ================================
export const registerUserService = async (
  username: string,
  email: string,
  password: string,
  fullName: string,
  phoneNumber: string,
  role: 'admin' | 'landlord' | 'caretaker' | 'tenant' = 'tenant',
  hostelId?: string
): Promise<{ user: TSelectUser; otp: string }> => {
  
  if (role === 'tenant') {
    if (!hostelId) throw new Error("Tenants must be assigned to a hostel.");
    const hostel = await db.query.properties.findFirst({ where: eq(properties.id, hostelId) });
    if (!hostel) throw new Error("Invalid hostel selected.");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(rawOtp, SALT_ROUNDS);

  const result = await db.insert(users)
    .values({
      username,
      email,
      fullName,
      phoneNumber,
      passwordHash: hashedPassword,
      role,
      hostelId: hostelId || null,
      isActive: true,
      isVerified: false,
      otpHash: hashedOtp,
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000),
    })
    .returning();

  const newUser = (result as any[])[0]; 
  if (!newUser) throw new Error("Failed to create user.");
  return { user: newUser as TSelectUser, otp: rawOtp };
};

// ================================
// 2. Email Verification
// ================================
export const verifyRegistrationService = async (userId: string, providedOtp: string): Promise<string> => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || !user.otpHash || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
    throw new Error("Invalid or expired session.");
  }

  const isValid = await bcrypt.compare(providedOtp, user.otpHash);
  if (!isValid) throw new Error("Invalid verification code.");

  await db.update(users)
    .set({ isVerified: true, otpHash: null, otpExpiresAt: null, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return "Account verified successfully.";
};

// ================================
// 3. Login
// ================================
export const loginUserService = async (identifier: string, password: string): Promise<TSelectUser> => {
  const user = await db.query.users.findFirst({
    where: or(
      eq(users.username, identifier),
      eq(users.email, identifier),
      eq(users.phoneNumber, identifier)
    ),
  });

  if (!user || !user.isActive) throw new Error("Invalid credentials or account inactive.");

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error("Account locked. Try again later.");
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash ?? "");
  if (!validPassword) throw new Error("Invalid credentials.");

  await db.update(users)
    .set({ lastLogin: new Date(), otpAttempts: 0, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return user;
};

// ================================
// 4. Password Management
// ================================
export const forgotPasswordService = async (identifier: string): Promise<{ userId: string, otp: string }> => {
  const user = await db.query.users.findFirst({
    where: or(
      eq(users.username, identifier),
      eq(users.email, identifier),
      eq(users.phoneNumber, identifier)
    ),
  });
  if (!user) throw new Error("User not found.");

  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  await db.update(users).set({ 
    otpHash: await bcrypt.hash(rawOtp, SALT_ROUNDS), 
    otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000),
    updatedAt: new Date() 
  }).where(eq(users.id, user.id));

  return { userId: user.id, otp: rawOtp };
};

export const resetPasswordService = async (userId: string, providedOtp: string, newPassword: string): Promise<string> => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || !user.otpHash || new Date() > (user.otpExpiresAt || new Date(0))) throw new Error("Invalid session.");

  const isValid = await bcrypt.compare(providedOtp, user.otpHash);
  if (!isValid) {
    const newAttempts = (user.otpAttempts || 0) + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      await db.update(users).set({ lockedUntil: new Date(Date.now() + 15 * 60000) }).where(eq(users.id, userId));
      throw new Error("Too many failed attempts. Account locked.");
    }
    await db.update(users).set({ otpAttempts: newAttempts }).where(eq(users.id, userId));
    throw new Error("Invalid OTP.");
  }

  await db.update(users).set({ 
    passwordHash: await bcrypt.hash(newPassword, SALT_ROUNDS), 
    otpHash: null, otpExpiresAt: null, otpAttempts: 0, updatedAt: new Date() 
  }).where(eq(users.id, userId));

  return "Password reset successfully.";
};

export const updatePasswordService = async (userId: string, currentPassword: string, newPassword: string): Promise<string> => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || !user.passwordHash) throw new Error("User not found.");

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new Error("Incorrect current password.");

  await db.update(users).set({ 
    passwordHash: await bcrypt.hash(newPassword, SALT_ROUNDS), 
    updatedAt: new Date() 
  }).where(eq(users.id, userId));

  return "Password updated successfully.";
};

// ================================
// 5. Admin Account Management
// ================================
export const deactivateUser = async (adminId: string, targetUserId: string): Promise<string> => {
  const admin = await db.query.users.findFirst({ where: eq(users.id, adminId) });
  if (admin?.role !== 'admin') throw new Error("Unauthorized.");
  await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, targetUserId));
  await sendNotificationEmail((await db.query.users.findFirst({where: eq(users.id, targetUserId)}))?.email || "", "Account Deactivated", "Your account has been deactivated by an administrator.", "alert");
  return "User account deactivated.";
};

export const activateUser = async (adminId: string, targetUserId: string): Promise<string> => {
  const admin = await db.query.users.findFirst({ where: eq(users.id, adminId) });
  if (admin?.role !== 'admin') throw new Error("Unauthorized.");
  await db.update(users).set({ isActive: true, updatedAt: new Date() }).where(eq(users.id, targetUserId));
  return "User account activated.";
};

export const deleteUser = async (adminId: string, targetUserId: string): Promise<string> => {
  const admin = await db.query.users.findFirst({ where: eq(users.id, adminId) });
  if (admin?.role !== 'admin') throw new Error("Unauthorized.");
  const result = await db.delete(users).where(eq(users.id, targetUserId));
  if (result.rowCount === 0) throw new Error("User not found.");
  return "User account permanently deleted.";
};

export const adminUnlockUserService = async (adminId: string, targetUserId: string): Promise<string> => {
  const admin = await db.query.users.findFirst({ where: eq(users.id, adminId) });
  if (admin?.role !== 'admin') throw new Error("Unauthorized.");
  await db.update(users).set({ lockedUntil: null, otpAttempts: 0, updatedAt: new Date() }).where(eq(users.id, targetUserId));
  return "Account unlocked successfully.";
};
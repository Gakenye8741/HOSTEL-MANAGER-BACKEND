import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { sendNotificationEmail } from "../middlewares/GoogleMAiler"; 
import {
  registerUserService,
  verifyRegistrationService,
  loginUserService,
  forgotPasswordService,
  resetPasswordService,
  updatePasswordService,
  adminUnlockUserService,
  deactivateUser,
  activateUser,
  deleteUser
} from "./Auth.service";
import {
  registerUserValidator,
  loginUserValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updatePasswordValidator,
} from "../validators/Auth.validator";

// 1. Register User
export const registerUser: RequestHandler = async (req, res) => {
  try {
    const parse = registerUserValidator.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { username, email, password, fullName, phoneNumber, role, hostelId } = parse.data;
    const { user, otp } = await registerUserService(username, email, password, fullName, phoneNumber, role, hostelId);
    
    await sendNotificationEmail(email, "Verify Your Account", `Your verification OTP is: ${otp}`, "registration-verification");

    res.status(201).json({ message: "Account created. Please check your email.", userId: user.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Verify Registration
export const verifyRegistration: RequestHandler = async (req, res) => {
  try {
    const { userId, otp, email } = req.body;
    const message = await verifyRegistrationService(userId, otp);
    
    await sendNotificationEmail(email, "Account Verified", "Your account has been successfully verified.", "profile-success");
    
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// 3. Login User
export const loginUser: RequestHandler = async (req, res) => {
  try {
    const parse = loginUserValidator.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const user = await loginUserService(parse.data.identifier, parse.data.password);
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    
    res.status(200).json({ 
      message: "Login successful", 
      token, 
      user: { id: user.id, username: user.username, email: user.email, role: user.role } 
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

// 4. Forgot Password
export const forgotPassword: RequestHandler = async (req, res) => {
  try {
    const parse = forgotPasswordValidator.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { userId, otp } = await forgotPasswordService(parse.data.identifier);
    await sendNotificationEmail(parse.data.identifier, "Password Reset OTP", `Your OTP is: ${otp}`, "password-reset");

    res.status(200).json({ message: "OTP sent successfully.", userId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// 5. Reset Password
export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const parse = resetPasswordValidator.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { userId, otp, newPassword, email } = parse.data;
    const message = await resetPasswordService(userId, otp, newPassword);
    
    await sendNotificationEmail(email, "Password Reset Successful", "Your password has been changed successfully.", "password-update");
    
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

// 6. Update Password
export const updatePassword: RequestHandler = async (req, res) => {
  try {
    const parse = updatePasswordValidator.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const userId = (req as any).user?.id;
    const email = (req as any).user?.email;
    const { currentPassword, newPassword } = parse.data;

    const message = await updatePasswordService(userId, currentPassword, newPassword);
    
    await sendNotificationEmail(email, "Password Updated", "Your account password was updated successfully.", "password-update");
    
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Admin Management
export const adminUnlockUser: RequestHandler = async (req, res) => {
  try {
    const adminId = (req as any).user?.id;
    const { targetUserId, email } = req.body;
    const message = await adminUnlockUserService(adminId, targetUserId);
    
    await sendNotificationEmail(email, "Account Unlocked", "Your account has been unlocked by an administrator.", "unlock-code");
    
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const adminDeactivateUser: RequestHandler = async (req, res) => {
  try {
    const adminId = (req as any).user?.id;
    const { targetUserId, email } = req.body;
    const message = await deactivateUser(adminId, targetUserId);
    
    await sendNotificationEmail(email, "Account Deactivated", "Your account has been deactivated. Please contact support.", "account-closure");
    
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const adminActivateUser: RequestHandler = async (req, res) => {
  try {
    const adminId = (req as any).user?.id;
    const { targetUserId, email } = req.body;
    const message = await activateUser(adminId, targetUserId);
    
    await sendNotificationEmail(email, "Account Activated", "Your account is now active.", "profile-success");
    
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const adminDeleteUser: RequestHandler = async (req, res) => {
  try {
    const adminId = (req as any).user?.id;
    const { targetUserId, email } = req.body;
    const message = await deleteUser(adminId, targetUserId);
    
    await sendNotificationEmail(email, "Account Deleted", "Your account has been permanently removed.", "account-closure");
    
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};
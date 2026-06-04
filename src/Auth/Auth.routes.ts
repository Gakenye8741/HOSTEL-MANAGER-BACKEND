import { Router } from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  adminUnlockUser,
  adminDeactivateUser,
  adminActivateUser,
  adminDeleteUser,
  verifyRegistration,
} from "./Auth.controller";
import { 
  anyAuthenticatedUser, 
  adminAuth 
} from "../middlewares/bearAuth"; 
import { checkAccountStatus } from "../middlewares/checkStatus"; // Adjust path as needed

const AuthRouter = Router();

// -------------------------------
// Public Routes
// -------------------------------

AuthRouter.post("/register", registerUser);
AuthRouter.post("/login", loginUser);
AuthRouter.post("/verify-registration", verifyRegistration);
AuthRouter.post("/forgot-password", forgotPassword);
AuthRouter.post("/reset-password", resetPassword);

// -------------------------------
// Protected Routes (User)
// -------------------------------

// checkAccountStatus ensures the user is active/verified before they can update their password
AuthRouter.put(
  "/update-password", 
  anyAuthenticatedUser, 
  checkAccountStatus, 
  updatePassword
);

// -------------------------------
// Protected Routes (Admin)
// -------------------------------

// Admin routes remain protected by adminAuth. 
// Note: You can optionally add checkAccountStatus here if you want admins 
// to also be subject to active/verified checks.
AuthRouter.put("/admin/unlock-user", adminAuth, adminUnlockUser);
AuthRouter.put("/admin/deactivate-user", adminAuth, adminDeactivateUser);
AuthRouter.put("/admin/activate-user", adminAuth, adminActivateUser);
AuthRouter.delete("/admin/delete-user", adminAuth, adminDeleteUser);

export default AuthRouter;
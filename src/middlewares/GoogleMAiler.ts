import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Configuration validation
if (!process.env.EMAIL_SENDER || !process.env.EMAIL_PASSWORD) {
  throw new Error("❌ Missing EMAIL_SENDER or EMAIL_PASSWORD in environment variables.");
}

const transporter: Transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const PLATFORM_NAME = "Hostel Manager 2026";

export type EmailType = 
  | "welcome" | "credentials" | "password-reset" | "password-update" 
  | "alert" | "generic" | "unlock-code" | "profile-success" 
  | "account-closure" | "registration-verification";

interface Theme { color: string; icon: string; label: string; }

const themes: Record<EmailType, Theme> = {
  welcome:           { color: "#1e3a8a", icon: "🎓", label: "Welcome" },
  credentials:       { color: "#1e3a8a", icon: "🔐", label: "Security Access" },
  "password-reset":  { color: "#d97706", icon: "🔄", label: "Recovery Request" },
  "password-update": { color: "#059669", icon: "🛡️", label: "Security Update" },
  alert:             { color: "#dc2626", icon: "⚠️", label: "Security Alert" },
  generic:           { color: "#475569", icon: "📢", label: "Notification" },
  "unlock-code":     { color: "#7c3aed", icon: "🔑", label: "Account Unlock" },
  "profile-success": { color: "#10b981", icon: "✅", label: "Success" },
  "account-closure": { color: "#4b5563", icon: "🚫", label: "Status Update" },
  "registration-verification": { color: "#2563eb", icon: "✉️", label: "Email Verification" },
};

/**
 * Generates a clean, modern HTML template.
 */
const generateTemplate = (message: string, theme: Theme) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
      .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
      .header { background: ${theme.color}; padding: 30px; text-align: center; color: white; }
      .content { padding: 40px 30px; text-align: center; }
      .icon { font-size: 48px; margin-bottom: 20px; }
      .label { font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
      .body-text { margin: 25px 0; font-size: 16px; color: #334155; line-height: 1.6; }
      .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header"><h1>${PLATFORM_NAME}</h1></div>
      <div class="content">
        <div class="icon">${theme.icon}</div>
        <div class="label">${theme.label}</div>
        <div class="body-text">${message}</div>
      </div>
      <div class="footer">© ${new Date().getFullYear()} ${PLATFORM_NAME}. All rights reserved.</div>
    </div>
  </body>
</html>
`;

export const sendNotificationEmail = async (
  to: string,
  subject: string,
  message: string,
  type: EmailType = "generic"
): Promise<{ success: boolean; message: string }> => {
  try {
    const theme = themes[type] || themes.generic;

    await transporter.sendMail({
      from: `"${PLATFORM_NAME}" <${process.env.EMAIL_SENDER}>`,
      to,
      subject: `${subject} | ${PLATFORM_NAME}`,
      html: generateTemplate(message, theme),
    });

    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    console.error("❌ Email Service Error:", error);
    return { success: false, message: error.message };
  }
};
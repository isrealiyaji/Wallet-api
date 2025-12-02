import prisma from "../config/database.js";
import { generateOTP } from "../utils/helpers.js";
import { sendOTPEmail } from "./emailService.js";

/**
 * Generate and save OTP
 */
export const createOTP = async (userId, type) => {
  try {
    // Generate OTP
    const code = generateOTP(6);

    // Calculate expiry time
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save OTP to database
    const otp = await prisma.oTP.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      },
    });

    return { success: true, code, expiresAt };
  } catch (error) {
    console.error("OTP creation error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP via email
 */
export const sendOTP = async (userId, email, type) => {
  try {
    // Create OTP
    const otpResult = await createOTP(userId, type);
    if (!otpResult.success) {
      return { success: false, error: "Failed to generate OTP" };
    }

    // Send OTP email
    await sendOTPEmail(email, otpResult.code, type);

    return {
      success: true,
      message: "OTP sent successfully",
      expiresAt: otpResult.expiresAt,
    };
  } catch (error) {
    console.error("OTP sending error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (userId, code, type) => {
  try {
    // Find the most recent OTP
    const otp = await prisma.oTP.findFirst({
      where: {
        userId,
        code,
        type,
        verified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otp) {
      return { success: false, error: "Invalid OTP code" };
    }

    // Check if OTP has expired
    if (new Date() > otp.expiresAt) {
      return { success: false, error: "OTP has expired" };
    }

    // Check attempt limit
    if (otp.attempts >= 5) {
      return {
        success: false,
        error: "Maximum verification attempts exceeded",
      };
    }

    // Increment attempts
    await prisma.oTP.update({
      where: { id: otp.id },
      data: {
        attempts: otp.attempts + 1,
        verified: true,
      },
    });

    return { success: true, message: "OTP verified successfully" };
  } catch (error) {
    console.error("OTP verification error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete expired OTPs (cleanup function)
 */
export const cleanupExpiredOTPs = async () => {
  try {
    const result = await prisma.oTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${result.count} expired OTPs`);
    return result.count;
  } catch (error) {
    console.error("OTP cleanup error:", error);
    return 0;
  }
};

export default {
  createOTP,
  sendOTP,
  verifyOTP,
  cleanupExpiredOTPs,
};

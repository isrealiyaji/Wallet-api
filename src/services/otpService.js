import prisma from "../config/database.js";
import { generateOTP } from "../utils/helpers.js";
import { sendOTPEmail } from "./emailService.js";


export const createOTP = async (userId, type) => {
  try {
    const code = generateOTP(6);

  
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


export const sendOTP = async (userId, email, type) => {
  try {
   
    const otpResult = await createOTP(userId, type);
    if (!otpResult.success) {
      return { success: false, error: "Failed to generate OTP" };
    }

    
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

    if (new Date() > otp.expiresAt) {
      return { success: false, error: "OTP has expired" };
    }

    
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

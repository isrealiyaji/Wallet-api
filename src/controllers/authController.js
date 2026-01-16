import bcrypt from "bcryptjs";
import prisma from "../config/database.js";
import { generateToken, generateAccountNumber } from "../utils/helpers.js";
import { sendOTP, sendOTPPhone, verifyOTP } from "../services/otpService.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import { VerificationTypes } from "../enums/verificationTypes.js";


export const register = async (req, res) => {
  try {
    const { email, phone, password, firstName, lastName } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or phone already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and wallet in a transactio
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          phone,
          password: hashedPassword,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
          kycLevel: true,
          createdAt: true,
        },
      });

      // Create wallet for user
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          accountNumber: generateAccountNumber(),
        },
      });

      return newUser;
    });

 
    await sendOTP(user.id, user.email, VerificationTypes.EMAIL_VERIFICATION);

   
    sendWelcomeEmail(user.email, user.firstName).catch(console.error);

    
    const token = generateToken({ userId: user.id });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your email with the OTP sent.",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};


export const login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      },
      include: {
        wallet: {
          select: {
            accountNumber: true,
            balance: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

 
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Account is suspended or inactive",
      });
    }

    // Generate token
    const token = generateToken({ userId: user.id });

   
    delete user.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};


export const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

  
    const result = await verifyOTP(userId, otp, "EMAIL_VERIFICATION");

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    // Update user email verification status
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: error.message,
    });
  }
};

export const requestPhoneVerification = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user.id;

    //Verify user number
    if(phone !== req.user.phone){
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    //Send OTP to user
    const result = await sendOTPPhone(userId, phone, VerificationTypes.PHONE_VERIFICATION);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }
    res.status(200).json({
      success: true,
      message: "Phone verification sent successfully",
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    res.status(500).json({
      success: false,
      message: "Phone verification failed",
      error: error.message,
    });
  }
};

export const verifyPhone = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    
    const result = await verifyOTP(userId, otp, VerificationTypes.PHONE_VERIFICATION);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    // Update user phone verification status
    await prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true },
    });

    res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    res.status(500).json({
      success: false,
      message: "Phone verification failed",
      error: error.message,
    });
  }
};


export const resendOTP = async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    
    const result = await sendOTP(userId, email, type || "EMAIL_VERIFICATION");

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a password reset OTP has been sent",
      });
    }


    await sendOTP(user.id, user.email, "PASSWORD_RESET");

    res.status(200).json({
      success: true,
      message: "Password reset OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: error.message,
    });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP
    const result = await verifyOTP(user.id, otp, "PASSWORD_RESET");

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

   
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      error: error.message,
    });
  }
};


export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        phoneVerified: true,
        status: true,
        kycLevel: true,
        createdAt: true,
        wallet: {
          select: {
            accountNumber: true,
            balance: true,
            currency: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user data",
      error: error.message,
    });
  }
};

/**
 * 1. Request Phone OTP
 * 2. Verify Phone OTP
 * 
 */

export default {
  register,
  login,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  requestPhoneVerification,
  verifyPhone,
};

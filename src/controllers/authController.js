import bcrypt from "bcryptjs";
import prisma from "../config/database.js";
import { generateToken, generateAccountNumber } from "../utils/helpers.js";
import { sendOTP, verifyOTP } from "../services/otpService.js";
import { sendWelcomeEmail } from "../services/emailService.js";

/**
 * Register new user
 */
export const register = async (req, res) => {
  try {
    const { email, phone, password, firstName, lastName } = req.body;

    // Check if user already exists
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and wallet in a transaction
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

    // Send OTP for email verification
    await sendOTP(user.id, user.email, "EMAIL_VERIFICATION");

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user.email, user.firstName).catch(console.error);

    // Generate token
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

/**
 * Login user
 */
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

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check account status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Account is suspended or inactive",
      });
    }

    // Generate token
    const token = generateToken({ userId: user.id });

    // Remove password from response
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

/**
 * Verify email with OTP
 */
export const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    // Verify OTP
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

/**
 * Resend OTP
 */
export const resendOTP = async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    // Send new OTP
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

/**
 * Request password reset
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        success: true,
        message: "If the email exists, a password reset OTP has been sent",
      });
    }

    // Send OTP
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

/**
 * Reset password with OTP
 */
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

    // Hash new password
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

/**
 * Get current user
 */
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

export default {
  register,
  login,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};

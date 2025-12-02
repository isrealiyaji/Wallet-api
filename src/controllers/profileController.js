import bcrypt from "bcryptjs";
import prisma from "../config/database.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Setup transaction PIN
 */
export const setupPin = async (req, res) => {
  try {
    const { pin, password } = req.body;
    const userId = req.user.id;

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Hash PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Update user PIN
    await prisma.user.update({
      where: { id: userId },
      data: {
        pin: hashedPin,
        pinAttempts: 0,
        pinLockedAt: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Transaction PIN setup successful",
    });
  } catch (error) {
    console.error("Setup PIN error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to setup PIN",
      error: error.message,
    });
  }
};

/**
 * Change transaction PIN
 */
export const changePin = async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user.pin) {
      return res.status(400).json({
        success: false,
        message: "No PIN found. Please setup PIN first",
      });
    }

    // Check if PIN is locked
    if (
      user.pinLockedAt &&
      new Date() < new Date(user.pinLockedAt.getTime() + 30 * 60000)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "PIN is locked due to multiple failed attempts. Try again later",
      });
    }

    // Verify old PIN
    const isPinValid = await bcrypt.compare(oldPin, user.pin);
    if (!isPinValid) {
      // Increment failed attempts
      const newAttempts = user.pinAttempts + 1;
      const updateData = { pinAttempts: newAttempts };

      // Lock PIN after 5 failed attempts
      if (newAttempts >= 5) {
        updateData.pinLockedAt = new Date();
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid PIN",
        attemptsLeft: Math.max(0, 5 - newAttempts),
      });
    }

    // Hash new PIN
    const hashedPin = await bcrypt.hash(newPin, 10);

    // Update PIN
    await prisma.user.update({
      where: { id: userId },
      data: {
        pin: hashedPin,
        pinAttempts: 0,
        pinLockedAt: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "PIN changed successfully",
    });
  } catch (error) {
    console.error("Change PIN error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change PIN",
      error: error.message,
    });
  }
};

/**
 * Verify transaction PIN
 */
export const verifyPin = async (pin, userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user.pin) {
      return { success: false, message: "No PIN setup" };
    }

    // Check if PIN is locked
    if (
      user.pinLockedAt &&
      new Date() < new Date(user.pinLockedAt.getTime() + 30 * 60000)
    ) {
      return { success: false, message: "PIN is locked. Try again later" };
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, user.pin);

    if (!isPinValid) {
      // Increment failed attempts
      const newAttempts = user.pinAttempts + 1;
      const updateData = { pinAttempts: newAttempts };

      if (newAttempts >= 5) {
        updateData.pinLockedAt = new Date();
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return {
        success: false,
        message: "Invalid PIN",
        attemptsLeft: Math.max(0, 5 - newAttempts),
      };
    }

    // Reset attempts on successful verification
    await prisma.user.update({
      where: { id: userId },
      data: { pinAttempts: 0 },
    });

    return { success: true };
  } catch (error) {
    console.error("Verify PIN error:", error);
    return { success: false, message: "PIN verification failed" };
  }
};

/**
 * Register device
 */
export const registerDevice = async (req, res) => {
  try {
    const { deviceName, deviceType } = req.body;
    const userId = req.user.id;

    // Get device info from request
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const deviceId = req.headers["x-device-id"] || uuidv4();

    // Check if device already exists
    const existingDevice = await prisma.device.findFirst({
      where: {
        userId,
        deviceId,
      },
    });

    if (existingDevice) {
      return res.status(200).json({
        success: true,
        message: "Device already registered",
        data: existingDevice,
      });
    }

    // Register device
    const device = await prisma.device.create({
      data: {
        userId,
        deviceId,
        deviceName,
        deviceType,
        ipAddress,
        userAgent,
        isTrusted: false, // Require manual trust
      },
    });

    res.status(201).json({
      success: true,
      message: "Device registered successfully",
      data: device,
    });
  } catch (error) {
    console.error("Register device error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register device",
      error: error.message,
    });
  }
};

/**
 * Get user devices
 */
export const getDevices = async (req, res) => {
  try {
    const userId = req.user.id;

    const devices = await prisma.device.findMany({
      where: { userId },
      orderBy: { lastUsedAt: "desc" },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        deviceType: true,
        isTrusted: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error("Get devices error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get devices",
      error: error.message,
    });
  }
};

/**
 * Trust/Untrust device
 */
export const toggleDeviceTrust = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { isTrusted } = req.body;
    const userId = req.user.id;

    const device = await prisma.device.updateMany({
      where: {
        deviceId,
        userId,
      },
      data: { isTrusted },
    });

    if (device.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Device ${isTrusted ? "trusted" : "untrusted"} successfully`,
    });
  } catch (error) {
    console.error("Toggle device trust error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update device trust",
      error: error.message,
    });
  }
};

/**
 * Remove device
 */
export const removeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.id;

    const device = await prisma.device.deleteMany({
      where: {
        deviceId,
        userId,
      },
    });

    if (device.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Device removed successfully",
    });
  } catch (error) {
    console.error("Remove device error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove device",
      error: error.message,
    });
  }
};

/**
 * Update profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone, phoneVerified: false }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        phoneVerified: true,
        kycLevel: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

export default {
  setupPin,
  changePin,
  verifyPin,
  registerDevice,
  getDevices,
  toggleDeviceTrust,
  removeDevice,
  updateProfile,
};

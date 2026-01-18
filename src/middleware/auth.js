import { verifyToken } from "../utils/helpers.js";
import prisma from "../config/database.js";

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is active
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Account is suspended or inactive",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};


export const requireEmailVerified = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: "Email verification required",
    });
  }
  next();
};

export const requirePhoneVerified = (req, res, next) => {
  if(process.env.NODE_ENV === "development") {
    //TODO: Remove any phone verification check in production
    return next();
  }
  if (!req.user.phoneVerified) {
    return res.status(403).json({
      success: false,
      message: "Phone verification required",
    });
  }
  next();
};


export const requireKYCLevel = (minLevel) => {
  const kycHierarchy = {
    UNVERIFIED: 0,
    TIER1: 1,
    TIER2: 2,
    TIER3: 3,
  };

  return (req, res, next) => {
    const userLevel = kycHierarchy[req.user.kycLevel] || 0;
    const requiredLevel = kycHierarchy[minLevel] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `KYC level ${minLevel} or higher required`,
        currentLevel: req.user.kycLevel,
      });
    }
    next();
  };
};


export const checkDevice = async (req, res, next) => {
  try {
    const deviceId = req.headers["x-device-id"];

    if (!deviceId) {
      return next(); 
    }

    // Check if device is registered and trusted
    const device = await prisma.device.findFirst({
      where: {
        userId: req.user.id,
        deviceId,
      },
    });

    if (device) {
      // Update last used time
      await prisma.device.update({
        where: { id: device.id },
        data: { lastUsedAt: new Date() },
      });

      req.device = device;
    }

    next();
  } catch (error) {
    console.error("Device check error:", error);
    next(); 
  }
};

export default {
  authenticate,
  requireEmailVerified,
  requireKYCLevel,
  checkDevice,
  requirePhoneVerified
};

import jwt from "jsonwebtoken";

/**
 * Generate JWT token
 */
export const generateToken = (
  payload,
  expiresIn = process.env.JWT_EXPIRE || "7d"
) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Generate OTP code
 */
export const generateOTP = (length = 6) => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
};

/**
 * Generate unique transaction reference
 */
export const generateTransactionReference = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `TXN${timestamp}${random}`;
};

/**
 * Generate unique account number
 */
export const generateAccountNumber = () => {
  return (
    "20" +
    Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, "0")
  );
};

/**
 * Calculate transaction fee
 */
export const calculateTransactionFee = (amount, category) => {
  // Define fee structure
  const feeStructure = {
    WALLET_TRANSFER: 0, // Free
    BANK_WITHDRAWAL: 50, // Flat fee
    BANK_FUNDING: 0, // Free
    CARD_FUNDING: amount * 0.015, // 1.5% fee
    REFUND: 0,
  };

  return feeStructure[category] || 0;
};

/**
 * Get KYC transaction limits
 */
export const getKYCTransactionLimits = (kycLevel) => {
  const limits = {
    UNVERIFIED: {
      dailyLimit: 10000,
      transactionLimit: 5000,
    },
    TIER1: {
      dailyLimit: parseInt(process.env.TIER1_DAILY_LIMIT) || 50000,
      transactionLimit: 50000,
    },
    TIER2: {
      dailyLimit: parseInt(process.env.TIER2_DAILY_LIMIT) || 200000,
      transactionLimit: 200000,
    },
    TIER3: {
      dailyLimit: parseInt(process.env.TIER3_DAILY_LIMIT) || 1000000,
      transactionLimit: 1000000,
    },
  };

  return limits[kycLevel] || limits.UNVERIFIED;
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

/**
 * Mask sensitive data
 */
export const maskEmail = (email) => {
  const [name, domain] = email.split("@");
  return `${name.substring(0, 2)}***@${domain}`;
};

export const maskPhone = (phone) => {
  return phone.substring(0, 4) + "****" + phone.substring(phone.length - 2);
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (Nigerian)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+234|0)[789]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Sleep utility for delays
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

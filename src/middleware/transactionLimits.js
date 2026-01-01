/**
 * Transaction Limit Validation Middleware
 * Validates transaction amounts against tier-based limits
 */

import prisma from "../config/database.js";

/**
 * Transaction limits by KYC tier
 */
const TIER_LIMITS = {
  UNVERIFIED: {
    dailyLimit: 0,
    singleTransaction: 0,
  },
  TIER1: {
    dailyLimit: parseFloat(process.env.TIER1_DAILY_LIMIT || 50000),
    singleTransaction: parseFloat(process.env.TIER1_DAILY_LIMIT || 50000) / 2,
  },
  TIER2: {
    dailyLimit: parseFloat(process.env.TIER2_DAILY_LIMIT || 200000),
    singleTransaction: parseFloat(process.env.TIER2_DAILY_LIMIT || 200000) / 2,
  },
  TIER3: {
    dailyLimit: parseFloat(process.env.TIER3_DAILY_LIMIT || 1000000),
    singleTransaction: parseFloat(process.env.TIER3_DAILY_LIMIT || 1000000) / 2,
  },
};

/**
 * Validate single transaction amount
 */
export const validateTransactionAmount = (req, res, next) => {
  const amount = parseFloat(req.body.amount);
  const userTier = req.user.kycLevel;
  const limits = TIER_LIMITS[userTier];

  if (!limits) {
    return res.status(400).json({
      success: false,
      message: "Invalid KYC tier",
    });
  }

  if (amount > limits.singleTransaction) {
    return res.status(400).json({
      success: false,
      message: `Transaction limit of ₦${limits.singleTransaction.toLocaleString()} exceeded for ${userTier}`,
      limit: limits.singleTransaction,
      attemptedAmount: amount,
    });
  }

  req.tierLimits = limits;
  next();
};

/**
 * Check daily transaction limit
 */
export const checkDailyLimit = async (req, res, next) => {
  try {
    const amount = parseFloat(req.body.amount);
    const userTier = req.user.kycLevel;
    const limits = TIER_LIMITS[userTier];

    if (!limits) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC tier",
      });
    }

    // Get today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = await prisma.transaction.findMany({
      where: {
        senderId: req.user.id,
        status: "SUCCESSFUL",
        createdAt: {
          gte: today,
        },
      },
      select: {
        amount: true,
      },
    });

    const todayTotal = todayTransactions.reduce(
      (sum, tx) => sum + parseFloat(tx.amount),
      0
    );

    const newTotal = todayTotal + amount;

    if (newTotal > limits.dailyLimit) {
      return res.status(400).json({
        success: false,
        message: `Daily limit of ₦${limits.dailyLimit.toLocaleString()} exceeded`,
        dailyLimit: limits.dailyLimit,
        usedToday: todayTotal,
        remaining: Math.max(0, limits.dailyLimit - todayTotal),
        attemptedAmount: amount,
      });
    }

    req.dailyUsage = todayTotal;
    next();
  } catch (error) {
    console.error("Daily limit check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify transaction limits",
    });
  }
};

/**
 * Get tier limits
 */
export const getTierLimits = (tier) => {
  return TIER_LIMITS[tier] || TIER_LIMITS.UNVERIFIED;
};

export default {
  validateTransactionAmount,
  checkDailyLimit,
  getTierLimits,
};

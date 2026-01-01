import prisma from "../config/database.js";

/**
 * Transaction limits by KYC tier
 */
const TIER_LIMITS = {
  UNVERIFIED: {
    accountBalance: 0,
    dailyLimit: 0,
    singleTransaction: 0,
  },
  TIER1: {
    accountBalance: 300000,
    dailyLimit: 50000,
    singleTransaction: 25000,
  },
  TIER2: {
    accountBalance: 500000,
    dailyLimit: 300000,
    singleTransaction: 100000,
  },
  TIER3: {
    accountBalance: null, // unlimited
    dailyLimit: 5000000,
    singleTransaction: 3000000,
  },
};

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
 * Check account balance limit
 */
export const checkAccountBalanceLimit = async (req, res, next) => {
  try {
    const userTier = req.user.kycLevel;
    const limits = TIER_LIMITS[userTier];

    if (!limits) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC tier",
      });
    }

    // TIER3 has unlimited balance
    if (limits.accountBalance === null) {
      return next();
    }

    // Get user's wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
      select: { balance: true },
    });

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const currentBalance = parseFloat(wallet.balance);

    if (currentBalance >= limits.accountBalance) {
      return res.status(400).json({
        success: false,
        message: `Account balance limit of ₦${limits.accountBalance.toLocaleString()} reached for ${userTier}`,
        accountBalanceLimit: limits.accountBalance,
        currentBalance: currentBalance,
      });
    }

    req.accountBalance = currentBalance;
    req.accountBalanceLimit = limits.accountBalance;
    next();
  } catch (error) {
    console.error("Account balance check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify account balance limit",
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

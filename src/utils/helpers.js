import jwt from "jsonwebtoken";

export const generateToken = (
  payload,
  expiresIn = process.env.JWT_EXPIRE || "7d",
) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const generateOTP = (length = 6) => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
};

export const generateTransactionReference = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `TXN${timestamp}${random}`;
};

export const generateAccountNumber = () => {
  return (
    "20" +
    Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, "0")
  );
};

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

export const formatCurrency = (amount, currency = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export const maskEmail = (email) => {
  const [name, domain] = email.split("@");
  return `${name.substring(0, 2)}***@${domain}`;
};

export const maskPhone = (phone) => {
  return phone.substring(0, 4) + "****" + phone.substring(phone.length - 2);
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+234|0)[789]\d{9}$/;
  return phoneRegex.test(phone);
};

export const convertDecimalToNumber = (obj) => {
  // Use JSON serialize/deserialize with a custom replacer to handle Decimal objects
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      // Check if it's a Decimal by looking at the string representation
      if (
        value !== null &&
        typeof value === "object" &&
        value.constructor &&
        (value.constructor.name === "Decimal" ||
          typeof value.toFixed === "function")
      ) {
        // Convert Decimal to number
        return Number(value);
      }
      // Check if it's a Date
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }),
  );
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const formatWallet = (wallet) => {
  if (!wallet) return null;
  return {
    ...wallet,
    balance:
      wallet.balance?.toNumber?.() ?? Number(wallet.balance?.toString() || 0),
    previousBalance:
      wallet.previousBalance?.toNumber?.() ??
      Number(wallet.previousBalance?.toString() || 0),
  };
};

export const formatTransaction = (transaction) => {
  if (!transaction) return null;
  return {
    ...transaction,
    amount: Number(transaction.amount) || 0,
    fee: Number(transaction.fee) || 0,
    totalAmount: Number(transaction.totalAmount) || 0,
    senderBalanceBefore: transaction.senderBalanceBefore
      ? Number(transaction.senderBalanceBefore)
      : null,
    senderBalanceAfter: transaction.senderBalanceAfter
      ? Number(transaction.senderBalanceAfter)
      : null,
    receiverBalanceBefore: transaction.receiverBalanceBefore
      ? Number(transaction.receiverBalanceBefore)
      : null,
    receiverBalanceAfter: transaction.receiverBalanceAfter
      ? Number(transaction.receiverBalanceAfter)
      : null,
  };
};

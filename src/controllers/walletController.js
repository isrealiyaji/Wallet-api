import prisma from "../config/database.js";
import {
  generateTransactionReference,
  calculateTransactionFee,
  getKYCTransactionLimits,
} from "../utils/helpers.js";
import { verifyPin } from "./profileController.js";
import { sendTransactionEmail } from "../services/emailService.js";


export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get wallet details",
      error: error.message,
    });
  }
};


export const fundViaBankTransfer = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    const reference = generateTransactionReference();

    // In production, you would integrate with payment gateway
    // For now, we'll simulate instant funding
    const result = await prisma.$transaction(async (tx) => {
      // Lock the wallet for update
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // transaction scoped advisory lock by wallet id
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(1, ${wallet.id})
      `;

      // Calculate new balance
      const newBalance = parseFloat(wallet.balance) + parseFloat(amount);

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          previousBalance: wallet.balance,
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          reference,
          amount: parseFloat(amount),
          fee: 0,
          totalAmount: parseFloat(amount),
          type: "CREDIT",
          category: "BANK_FUNDING",
          status: "SUCCESSFUL",
          description: "Wallet funding via bank transfer",
          receiverId: userId,
          receiverWalletId: wallet.id,
          receiverBalanceBefore: wallet.balance,
          receiverBalanceAfter: newBalance,
        },
      });

      return {
        wallet: await tx.wallet.findUnique({ where: { userId } }),
        transaction,
      };
    });

    // Send notification email (async)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    sendTransactionEmail(user.email, result.transaction).catch(console.error);

    res.status(200).json({
      success: true,
      message: "Wallet funded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Fund wallet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fund wallet",
      error: error.message,
    });
  }
};

/**
 * Fund wallet via card (Paystack integration)
 */
export const fundViaCard = async (req, res) => {
  try {
    const { amount, reference } = req.body;
    const userId = req.user.id;

    // In production, verify payment with Paystack
    // For now, we'll simulate successful payment

    const fee = calculateTransactionFee(amount, "CARD_FUNDING");
    const totalAmount = parseFloat(amount) + fee;

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // transaction scoped advisory lock by wallet id
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(1, ${wallet.id})
      `;

      const newBalance = parseFloat(wallet.balance) + parseFloat(amount);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          previousBalance: wallet.balance,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          reference: reference || generateTransactionReference(),
          amount: parseFloat(amount),
          fee,
          totalAmount,
          type: "CREDIT",
          category: "CARD_FUNDING",
          status: "SUCCESSFUL",
          description: "Wallet funding via card",
          receiverId: userId,
          receiverWalletId: wallet.id,
          receiverBalanceBefore: wallet.balance,
          receiverBalanceAfter: newBalance,
        },
      });

      return {
        wallet: await tx.wallet.findUnique({ where: { userId } }),
        transaction,
      };
    });

    res.status(200).json({
      success: true,
      message: "Wallet funded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Card funding error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fund wallet",
      error: error.message,
    });
  }
};

/**
 * Wallet-to-wallet transfer with DB locking
 */
export const walletTransfer = async (req, res) => {
  try {
    const { recipientAccountNumber, amount, pin, description } = req.body;
    const senderId = req.user.id;

    // Verify PIN
    const pinVerification = await verifyPin(pin, senderId);
    if (!pinVerification.success) {
      return res.status(401).json({
        success: false,
        message: pinVerification.message,
        attemptsLeft: pinVerification.attemptsLeft,
      });
    }

    // Check KYC limits
    const user = await prisma.user.findUnique({
      where: { id: senderId },
    });
    const limits = getKYCTransactionLimits(user.kycLevel);

    if (parseFloat(amount) > limits.transactionLimit) {
      return res.status(403).json({
        success: false,
        message: `Transaction amount exceeds your limit of ₦${limits.transactionLimit}`,
      });
    }

    // Find recipient wallet
    const recipientWallet = await prisma.wallet.findUnique({
      where: { accountNumber: recipientAccountNumber },
      include: { user: true },
    });

    if (!recipientWallet) {
      return res.status(404).json({
        success: false,
        message: "Recipient account not found",
      });
    }

    if (recipientWallet.userId === senderId) {
      return res.status(400).json({
        success: false,
        message: "Cannot transfer to your own account",
      });
    }

    const reference = generateTransactionReference();
    const fee = calculateTransactionFee(amount, "WALLET_TRANSFER");
    const totalAmount = parseFloat(amount) + fee;

    // Execute transfer with transaction and locking
    const result = await prisma.$transaction(
      async (tx) => {
        // Lock both wallets for update (using findUnique in transaction provides locking)
        const senderWallet = await tx.wallet.findUnique({
          where: { userId: senderId },
        });

        const receiverWallet = await tx.wallet.findUnique({
          where: { id: recipientWallet.id },
        });
        
        // Lock wallets in order of ID to prevent deadlocks
        const [smallerWalletId, largerWalletId] = [senderWallet.id, receiverWallet.id].sort();
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(1, ${smallerWalletId})`;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(1, ${largerWalletId})`;

        // Check sender balance
        if (parseFloat(senderWallet.balance) < totalAmount) {
          throw new Error("Insufficient balance");
        }

        // Calculate new balances
        const senderNewBalance = parseFloat(senderWallet.balance) - totalAmount;
        const receiverNewBalance =
          parseFloat(receiverWallet.balance) + parseFloat(amount);

        // Update sender wallet
        await tx.wallet.update({
          where: { id: senderWallet.id },
          data: {
            balance: senderNewBalance,
            previousBalance: senderWallet.balance,
          },
        });

        // Update receiver wallet
        await tx.wallet.update({
          where: { id: receiverWallet.id },
          data: {
            balance: receiverNewBalance,
            previousBalance: receiverWallet.balance,
          },
        });

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            reference,
            amount: parseFloat(amount),
            fee,
            totalAmount,
            type: "DEBIT",
            category: "WALLET_TRANSFER",
            status: "SUCCESSFUL",
            description: description || "Wallet transfer",
            senderId,
            senderWalletId: senderWallet.id,
            senderBalanceBefore: senderWallet.balance,
            senderBalanceAfter: senderNewBalance,
            receiverId: receiverWallet.userId,
            receiverWalletId: receiverWallet.id,
            receiverBalanceBefore: receiverWallet.balance,
            receiverBalanceAfter: receiverNewBalance,
          },
        });

        return {
          transaction,
          senderWallet: await tx.wallet.findUnique({
            where: { userId: senderId },
          }),
        };
      },
      {
        isolationLevel: "Serializable", // Highest isolation level for consistency
        timeout: 10000, // 10 seconds timeout
      }
    );

    // Send notification emails (async)
    sendTransactionEmail(user.email, result.transaction).catch(console.error);
    sendTransactionEmail(recipientWallet.user.email, result.transaction).catch(
      console.error
    );

    res.status(200).json({
      success: true,
      message: "Transfer successful",
      data: result,
    });
  } catch (error) {
    console.error("Wallet transfer error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Transfer failed",
    });
  }
};

/**
 * Withdraw to bank account
 */
export const withdrawToBank = async (req, res) => {
  try {
    const { amount, pin, bankCode, accountNumber, accountName } = req.body;
    const userId = req.user.id;

    // Verify PIN
    const pinVerification = await verifyPin(pin, userId);
    if (!pinVerification.success) {
      return res.status(401).json({
        success: false,
        message: pinVerification.message,
        attemptsLeft: pinVerification.attemptsLeft,
      });
    }

    // Check KYC limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    const limits = getKYCTransactionLimits(user.kycLevel);

    if (parseFloat(amount) > limits.transactionLimit) {
      return res.status(403).json({
        success: false,
        message: `Withdrawal amount exceeds your limit of ₦${limits.transactionLimit}`,
      });
    }

    const reference = generateTransactionReference();
    const fee = calculateTransactionFee(amount, "BANK_WITHDRAWAL");
    const totalAmount = parseFloat(amount) + fee;

    // Execute withdrawal with transaction
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // transaction scoped advisory lock by wallet id
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(1, ${wallet.id})
      `;

      if (parseFloat(wallet.balance) < totalAmount) {
        throw new Error("Insufficient balance");
      }

      const newBalance = parseFloat(wallet.balance) - totalAmount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          previousBalance: wallet.balance,
        },
      });

      // In production, initiate bank transfer via payment gateway
      const transaction = await tx.transaction.create({
        data: {
          reference,
          amount: parseFloat(amount),
          fee,
          totalAmount,
          type: "DEBIT",
          category: "BANK_WITHDRAWAL",
          status: "SUCCESSFUL", // In production, this would be PENDING
          description: `Withdrawal to ${accountName}`,
          senderId: userId,
          senderWalletId: wallet.id,
          senderBalanceBefore: wallet.balance,
          senderBalanceAfter: newBalance,
          bankCode,
          accountNumber,
          accountName,
        },
      });

      return {
        transaction,
        wallet: await tx.wallet.findUnique({ where: { userId } }),
      };
    });

    // Send notification email (async)
    sendTransactionEmail(user.email, result.transaction).catch(console.error);

    res.status(200).json({
      success: true,
      message: "Withdrawal initiated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Withdrawal failed",
    });
  }
};

/**
 * Get transaction history
 */
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, category, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      OR: [{ senderId: userId }, { receiverId: userId }],
      ...(type && { type }),
      ...(category && { category }),
      ...(status && { status }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          receiver: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transactions",
      error: error.message,
    });
  }
};

/**
 * Get transaction by reference
 */
export const getTransactionByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user.id;

    const transaction = await prisma.transaction.findFirst({
      where: {
        reference,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        receiver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction",
      error: error.message,
    });
  }
};

export default {
  getWallet,
  fundViaBankTransfer,
  fundViaCard,
  walletTransfer,
  withdrawToBank,
  getTransactions,
  getTransactionByReference,
};

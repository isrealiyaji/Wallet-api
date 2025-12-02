import express from "express";
import walletController from "../controllers/walletController.js";
import { authenticate, requireEmailVerified } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  fundWalletValidation,
  walletTransferValidation,
  withdrawValidation,
} from "../validators/index.js";

const router = express.Router();

// All routes require authentication and email verification
router.use(authenticate);
router.use(requireEmailVerified);

// Wallet routes
router.get("/", walletController.getWallet);

// Funding routes
router.post(
  "/fund/bank-transfer",
  fundWalletValidation,
  validate,
  walletController.fundViaBankTransfer
);
router.post(
  "/fund/card",
  fundWalletValidation,
  validate,
  walletController.fundViaCard
);

// Transaction routes
router.post(
  "/transfer",
  walletTransferValidation,
  validate,
  walletController.walletTransfer
);
router.post(
  "/withdraw",
  withdrawValidation,
  validate,
  walletController.withdrawToBank
);

// Transaction history
router.get("/transactions", walletController.getTransactions);
router.get(
  "/transactions/:reference",
  walletController.getTransactionByReference
);

export default router;

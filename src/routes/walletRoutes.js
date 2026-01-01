import express from "express";
import walletController from "../controllers/walletController.js";
import {
  authenticate,
  requireEmailVerified,
  requireKYCLevel,
} from "../middleware/auth.js";
import {
  validateTransactionAmount,
  checkDailyLimit,
  checkAccountBalanceLimit,
} from "../middleware/transactionLimits.js";
import validate from "../middleware/validate.js";
import {
  fundWalletValidation,
  walletTransferValidation,
  withdrawValidation,
} from "../validators/index.js";

const router = express.Router();

router.use(authenticate);
router.use(requireEmailVerified);

router.get("/", walletController.getWallet);

router.post(
  "/fund/banktransfer",
  requireKYCLevel("TIER1"),
  fundWalletValidation,
  validate,
  checkAccountBalanceLimit,
  walletController.fundViaBankTransfer
);
router.post(
  "/fund/card",
  requireKYCLevel("TIER1"),
  fundWalletValidation,
  validate,
  checkAccountBalanceLimit,
  walletController.fundViaCard
);

router.post(
  "/transfer",
  requireKYCLevel("TIER1"),
  walletTransferValidation,
  validate,
  validateTransactionAmount,
  checkDailyLimit,
  walletController.walletTransfer
);
router.post(
  "/withdraw",
  requireKYCLevel("TIER2"),
  withdrawValidation,
  validate,
  validateTransactionAmount,
  checkDailyLimit,
  walletController.withdrawToBank
);

router.get("/transactions", walletController.getTransactions);
router.get(
  "/transactions/:reference",
  walletController.getTransactionByReference
);

export default router;

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


router.use(authenticate);
router.use(requireEmailVerified);


router.get("/", walletController.getWallet);


router.post(
  "/fund/banktransfer",
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


router.get("/transactions", walletController.getTransactions);
router.get(
  "/transactions/:reference",
  walletController.getTransactionByReference
);

export default router;

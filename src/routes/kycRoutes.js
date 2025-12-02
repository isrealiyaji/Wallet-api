import express from "express";
import kycController from "../controllers/kycController.js";
import { authenticate, requireEmailVerified } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  tier1KYCValidation,
  tier2KYCValidation,
  tier3KYCValidation,
} from "../validators/index.js";

const router = express.Router();

// All routes require authentication and email verification
router.use(authenticate);
router.use(requireEmailVerified);

// KYC routes
router.get("/status", kycController.getKYCStatus);
router.post(
  "/tier1",
  tier1KYCValidation,
  validate,
  kycController.submitTier1KYC
);
router.post(
  "/tier2",
  tier2KYCValidation,
  validate,
  kycController.submitTier2KYC
);
router.post(
  "/tier3",
  tier3KYCValidation,
  validate,
  kycController.submitTier3KYC
);

// Admin routes (simplified - in production, add admin authentication)
router.post("/approve", kycController.approveKYC);
router.post("/reject", kycController.rejectKYC);

export default router;

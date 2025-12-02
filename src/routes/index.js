import express from "express";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import kycRoutes from "./kycRoutes.js";
import walletRoutes from "./walletRoutes.js";

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/kyc", kycRoutes);
router.use("/wallet", walletRoutes);

export default router;

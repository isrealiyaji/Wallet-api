import express from "express";
import authController from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  registerValidation,
  loginValidation,
  verifyOTPValidation,
  resetPasswordValidation,
} from "../validators/index.js";

const router = express.Router();

// Public routes
router.post("/register", registerValidation, validate, authController.register);
router.post("/login", loginValidation, validate, authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  authController.resetPassword
);

// Protected route
router.use(authenticate);
router.get("/me", authController.getCurrentUser);
router.post(
  "/verifyemail",
  verifyOTPValidation,
  validate,
  authController.verifyEmail
);
router.post("/resendotp", authController.resendOTP);

export default router;

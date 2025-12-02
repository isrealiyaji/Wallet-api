import { body } from "express-validator";

/**
 * Registration validation rules
 */
export const registerValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("phone")
    .optional()
    .matches(/^(\+234|0)[789]\d{9}$/)
    .withMessage("Valid Nigerian phone number is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters"),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters"),
];

/**
 * Login validation rules
 */
export const loginValidation = [
  body("emailOrPhone").notEmpty().withMessage("Email or phone is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * OTP verification validation
 */
export const verifyOTPValidation = [
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),
];

/**
 * Reset password validation
 */
export const resetPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
];

/**
 * PIN validation
 */
export const pinValidation = [
  body("pin")
    .isLength({ min: 4, max: 4 })
    .withMessage("PIN must be 4 digits")
    .isNumeric()
    .withMessage("PIN must contain only numbers"),
];

/**
 * Setup PIN validation
 */
export const setupPinValidation = [
  ...pinValidation,
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Change PIN validation
 */
export const changePinValidation = [
  body("oldPin")
    .isLength({ min: 4, max: 4 })
    .withMessage("Old PIN must be 4 digits"),
  body("newPin")
    .isLength({ min: 4, max: 4 })
    .withMessage("New PIN must be 4 digits")
    .isNumeric()
    .withMessage("New PIN must contain only numbers"),
];

/**
 * KYC Tier 1 validation
 */
export const tier1KYCValidation = [
  body("bvn")
    .isLength({ min: 11, max: 11 })
    .withMessage("BVN must be 11 digits")
    .isNumeric()
    .withMessage("BVN must contain only numbers"),
  body("dateOfBirth")
    .isISO8601()
    .withMessage("Valid date of birth is required"),
  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 10 })
    .withMessage("Address must be at least 10 characters"),
];

/**
 * KYC Tier 2 validation
 */
export const tier2KYCValidation = [
  body("idType")
    .isIn(["NIN", "DRIVERS_LICENSE", "VOTERS_CARD", "INTERNATIONAL_PASSPORT"])
    .withMessage("Valid ID type is required"),
  body("idNumber").notEmpty().withMessage("ID number is required"),
  body("idImageUrl").isURL().withMessage("Valid ID image URL is required"),
];

/**
 * KYC Tier 3 validation
 */
export const tier3KYCValidation = [
  body("utilityBillUrl")
    .isURL()
    .withMessage("Valid utility bill URL is required"),
  body("selfieUrl").isURL().withMessage("Valid selfie URL is required"),
];

/**
 * Fund wallet validation
 */
export const fundWalletValidation = [
  body("amount")
    .isFloat({ min: 100 })
    .withMessage("Amount must be at least ₦100"),
];

/**
 * Wallet transfer validation
 */
export const walletTransferValidation = [
  body("recipientAccountNumber")
    .isLength({ min: 10, max: 10 })
    .withMessage("Account number must be 10 digits")
    .isNumeric()
    .withMessage("Account number must contain only numbers"),
  body("amount")
    .isFloat({ min: 100 })
    .withMessage("Amount must be at least ₦100"),
  body("pin").isLength({ min: 4, max: 4 }).withMessage("PIN must be 4 digits"),
  body("description")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Description must not exceed 200 characters"),
];

/**
 * Withdraw to bank validation
 */
export const withdrawValidation = [
  body("amount")
    .isFloat({ min: 100 })
    .withMessage("Amount must be at least ₦100"),
  body("pin").isLength({ min: 4, max: 4 }).withMessage("PIN must be 4 digits"),
  body("bankCode").notEmpty().withMessage("Bank code is required"),
  body("accountNumber")
    .isLength({ min: 10, max: 10 })
    .withMessage("Account number must be 10 digits")
    .isNumeric()
    .withMessage("Account number must contain only numbers"),
  body("accountName").notEmpty().withMessage("Account name is required"),
];

export default {
  registerValidation,
  loginValidation,
  verifyOTPValidation,
  resetPasswordValidation,
  pinValidation,
  setupPinValidation,
  changePinValidation,
  tier1KYCValidation,
  tier2KYCValidation,
  tier3KYCValidation,
  fundWalletValidation,
  walletTransferValidation,
  withdrawValidation,
};

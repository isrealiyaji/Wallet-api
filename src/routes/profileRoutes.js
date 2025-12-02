import express from "express";
import profileController from "../controllers/profileController.js";
import { authenticate } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  setupPinValidation,
  changePinValidation,
} from "../validators/index.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.put("/update", profileController.updateProfile);

// PIN routes
router.post(
  "/pin/setup",
  setupPinValidation,
  validate,
  profileController.setupPin
);
router.post(
  "/pin/change",
  changePinValidation,
  validate,
  profileController.changePin
);

// Device routes
router.post("/devices/register", profileController.registerDevice);
router.get("/devices", profileController.getDevices);
router.patch("/devices/:deviceId/trust", profileController.toggleDeviceTrust);
router.delete("/devices/:deviceId", profileController.removeDevice);

export default router;

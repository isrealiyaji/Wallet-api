import express from "express";
import profileController from "../controllers/profileController.js";
import { authenticate } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  setupPinValidation,
  changePinValidation,
} from "../validators/index.js";

const router = express.Router();


router.use(authenticate);


router.put("/update", profileController.updateProfile);


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


router.post("/devices/register", profileController.registerDevice);
router.get("/devices", profileController.getDevices);
router.patch("/devices/:deviceId/trust", profileController.toggleDeviceTrust);
router.delete("/devices/:deviceId", profileController.removeDevice);

export default router;

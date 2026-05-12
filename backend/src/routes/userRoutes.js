import express from "express";
import {
  getProfile, updateProfile, updatePassword,
  getPreferences, updatePreferences,
  getNotifications, updateNotifications,
  getAISettings, updateAISettings,
  deleteAccount,
} from "../controllers/userController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.get ("/profile",       getProfile);
router.put ("/profile",       updateProfile);
router.put ("/password",      updatePassword);
router.get ("/preferences",   getPreferences);
router.put ("/preferences",   updatePreferences);
router.get ("/notifications", getNotifications);
router.put ("/notifications", updateNotifications);
router.get ("/ai-settings",   getAISettings);
router.put ("/ai-settings",   updateAISettings);
router.delete("/account",     deleteAccount);

export default router;
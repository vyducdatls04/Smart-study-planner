import express from "express";
import {
  getDashboard,
  getProgress,
  exportProgress,
} from "../controllers/dashboardController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getDashboard);
router.get("/progress", verifyToken, getProgress);
router.get("/progress/export", verifyToken, exportProgress);

export default router;

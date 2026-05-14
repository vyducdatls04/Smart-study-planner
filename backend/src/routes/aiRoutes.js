import express from "express";
import {
  getAIPlan,
  chatWithAI,
  getAIHistory,
  clearAIHistory,
} from "../controllers/aiController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/chat", chatWithAI);
router.get("/plan", getAIPlan);
router.get("/history", getAIHistory);
router.delete("/history", clearAIHistory);

export default router;

import express from "express";
import { getSmartRecommendations } from "../controllers/smartController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/recommendations", getSmartRecommendations);

export default router;

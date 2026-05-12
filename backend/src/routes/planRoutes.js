import express from "express";
import {
  getPlans,
  createPlan,
  deletePlan,
} from "../controllers/planController.js";

import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getPlans);
router.post("/", verifyToken, createPlan);
router.delete("/:id", verifyToken, deletePlan);

export default router;
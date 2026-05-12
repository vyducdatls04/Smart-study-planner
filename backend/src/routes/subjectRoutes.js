import express from "express";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";

import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🔒 tất cả route đều cần auth
router.use(verifyToken);

// 📌 GET ALL
router.get("/", getSubjects);

// 📌 CREATE
router.post("/", createSubject);

// 📌 UPDATE
router.put("/:id", updateSubject);

// 📌 DELETE
router.delete("/:id", deleteSubject);

export default router;
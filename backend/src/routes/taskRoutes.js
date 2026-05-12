import express from "express";
import {
  getTasks, getTasksByDate,
  createTask, updateTask,
  updateTaskStatus, deleteTask,
} from "../controllers/taskController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.get   ("/",          getTasks);
router.get   ("/by-date",   getTasksByDate);
router.post  ("/",          createTask);
router.put   ("/:id",       updateTask);
router.patch ("/:id/status",updateTaskStatus);
router.delete("/:id",       deleteTask);

export default router;
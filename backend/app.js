import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";
import subjectRoutes from "./src/routes/subjectRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import planRoutes from "./src/routes/planRoutes.js";

const app = express();

/* CORS */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

/* BODY PARSER */
app.use(express.json());

/* ENV CHECK */
console.log(
  "JWT SECRET:",
  process.env.JWT_SECRET ? "OK" : "MISSING"
);

console.log(
  "OPENAI KEY:",
  process.env.OPENAI_API_KEY ? "OK" : "MISSING"
);

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/plans", planRoutes);

/* STATIC */
app.use("/uploads", express.static("uploads"));

/* ROOT */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* 404 */
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

/* GLOBAL ERROR */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    message: "Internal Server Error",
  });
});

/* START */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT} 🚀`
  );
});
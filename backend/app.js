import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";
import subjectRoutes from "./src/routes/subjectRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import planRoutes from "./src/routes/planRoutes.js";
import smartRoutes from "./src/routes/smartRoutes.js";
import { startEmailReminderScheduler } from "./src/services/emailReminderService.js";

const app = express();

const configuredOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://smart-study-planner-4ipg.vercel.app",
  ...configuredOrigins,
].filter(Boolean);

const allowedOriginPatterns = [
  /^https:\/\/smart-study-planner-[a-z0-9-]+\.vercel\.app$/,
];

const isAllowedOrigin = (origin) => {
  return (
    allowedOrigins.includes(origin) ||
    allowedOriginPatterns.some((pattern) => pattern.test(origin))
  );
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked by CORS:", origin);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(express.json({ limit: "1mb" }));

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is missing");
}

if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
  console.warn("No AI API key configured. AI will use demo fallback.");
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/smart", smartRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, _next) => {
  console.error("SERVER ERROR:", err.message || err);

  if (err.message?.includes("CORS")) {
    return res.status(403).json({ message: err.message });
  }

  return res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  startEmailReminderScheduler();
});

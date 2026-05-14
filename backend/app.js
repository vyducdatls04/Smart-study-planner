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

const app = express();

/* =========================
   CORS CONFIG
========================= */

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

  // FRONTEND VERCEL
  "https://smart-study-planner-4ipg.vercel.app",

  // BACKEND RENDER
  "https://smart-study-planner-do7p.onrender.com",

  ...configuredOrigins,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Cho phép Postman / mobile apps
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* =========================
   BODY PARSER
========================= */

app.use(express.json({ limit: "1mb" }));

/* =========================
   ENV CHECK
========================= */

if (!process.env.JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET is missing");
}

if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
  console.warn(
    "⚠️ No AI API key configured. AI will use demo fallback."
  );
}

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   API ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/plans", planRoutes);

/* =========================
   STATIC FILES
========================= */

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

/* =========================
   ROOT
========================= */

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((err, req, res, _next) => {
  console.error("SERVER ERROR:", err.message || err);

  // Lỗi CORS
  if (err.message?.includes("CORS")) {
    return res.status(403).json({
      message: err.message,
    });
  }

  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

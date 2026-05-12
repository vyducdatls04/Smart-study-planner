import mysql from "mysql2/promise";

const db = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "smart_study_planner",
  waitForConnections: true,
  connectionLimit:    10,
  // SSL cho Aiven (bắt buộc)
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export default db;
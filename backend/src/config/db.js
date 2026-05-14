import mysql from "mysql2/promise";

const db = mysql.createPool({
  uri: process.env.DATABASE_URL,

  waitForConnections: true,

  connectionLimit: Number(
    process.env.DB_CONNECTION_LIMIT || 10
  ),

  ssl: false,
});

export default db;
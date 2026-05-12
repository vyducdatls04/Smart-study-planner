import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const [exist] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email.trim()]
    );

    if (exist.length) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hash = await bcrypt.hash(password.trim(), 10);

    await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name.trim(), email.trim(), hash]
    );

    return res.json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error("REGISTER SERVER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mật khẩu",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Thiếu JWT_SECRET trong file .env",
      });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email.trim()]
    );

    if (!users.length) {
      return res.status(400).json({ message: "Sai email" });
    }

    const user = users[0];
    const match = await bcrypt.compare(password.trim(), user.password);

    if (!match) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("LOGIN SERVER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

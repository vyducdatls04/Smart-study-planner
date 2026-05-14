import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* =========================
   REGISTER
========================= */

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password?.trim()
    ) {
      return res.status(400).json({
        message: "Thiếu dữ liệu",
      });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({
        message: "Mật khẩu phải ít nhất 6 ký tự",
      });
    }

    const [exist] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email.trim()]
    );

    if (exist.length) {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(
      password.trim(),
      10
    );

    await db.query(
      `
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
      `,
      [
        name.trim(),
        email.trim(),
        hashedPassword,
      ]
    );

    return res.status(201).json({
      message: "Đăng ký thành công",
    });
  } catch (err) {
    console.error(
      "REGISTER SERVER ERROR:",
      err
    );

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

/* =========================
   LOGIN
========================= */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      !email?.trim() ||
      !password?.trim()
    ) {
      return res.status(400).json({
        message:
          "Vui lòng nhập email và mật khẩu",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message:
          "Thiếu JWT_SECRET trong server",
      });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email.trim()]
    );

    if (!users.length) {
      return res.status(400).json({
        message: "Sai email hoặc mật khẩu",
      });
    }

    const user = users[0];

    // CHECK PASSWORD
    const isMatch = await bcrypt.compare(
      password.trim(),
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Sai email hoặc mật khẩu",
      });
    }

    // CREATE JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(
      "LOGIN SERVER ERROR:",
      err
    );

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};
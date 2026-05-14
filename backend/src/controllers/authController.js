import crypto from "crypto";
import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/sendMail.js";

const hashResetToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || "http://localhost:5173";
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải ít nhất 6 ký tự" });
    }

    const [exist] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email.trim()]
    );

    if (exist.length) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    await db.query(
      `
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
      `,
      [name.trim(), email.trim(), hashedPassword]
    );

    return res.status(201).json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error("REGISTER SERVER ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Thiếu JWT_SECRET trong server" });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email.trim()]
    );

    if (!users.length) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password.trim(), user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
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
    console.error("LOGIN SERVER ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập email" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [users] = await db.query(
      "SELECT id, name, email FROM users WHERE email = ?",
      [normalizedEmail]
    );

    const genericMessage = "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.";

    if (!users.length) {
      return res.json({ message: genericMessage });
    }

    const user = users[0];
    const rawToken = crypto.randomBytes(32).toString("hex");
    const resetToken = hashResetToken(rawToken);
    const resetTokenExpire = Date.now() + 15 * 60 * 1000;

    await db.query(
      `
      UPDATE users
      SET reset_token = ?, reset_token_expire = ?
      WHERE id = ?
      `,
      [resetToken, resetTokenExpire, user.id]
    );

    const resetLink = `${getFrontendUrl()}/reset-password/${rawToken}`;

    try {
      await sendMail({
        to: user.email,
        subject: "Đặt lại mật khẩu Smart Study",
        text: `Mở liên kết sau để đặt lại mật khẩu: ${resetLink}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <h2>Đặt lại mật khẩu</h2>
            <p>Xin chào ${user.name || "bạn"},</p>
            <p>Bấm vào nút bên dưới để đặt lại mật khẩu. Liên kết có hiệu lực trong 15 phút.</p>
            <p>
              <a href="${resetLink}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;">
                Đặt lại mật khẩu
              </a>
            </p>
            <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("SEND RESET EMAIL ERROR:", mailErr);

      if (process.env.NODE_ENV !== "production") {
        return res.json({
          message: "Email chưa được cấu hình. Dùng resetLink dev để test.",
          resetLink,
        });
      }

      return res.status(500).json({ message: "Không thể gửi email reset mật khẩu" });
    }

    return res.json({ message: genericMessage });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password?.trim()) {
      return res.status(400).json({ message: "Thiếu token hoặc mật khẩu" });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải ít nhất 6 ký tự" });
    }

    const resetToken = hashResetToken(token);

    const [users] = await db.query(
      `
      SELECT id
      FROM users
      WHERE reset_token = ?
      AND reset_token_expire > ?
      `,
      [resetToken, Date.now()]
    );

    if (!users.length) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    await db.query(
      `
      UPDATE users
      SET password = ?, reset_token = NULL, reset_token_expire = NULL
      WHERE id = ?
      `,
      [hashedPassword, users[0].id]
    );

    return res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

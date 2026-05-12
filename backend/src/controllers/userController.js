import db from "../config/db.js";
import bcrypt from "bcryptjs";

export const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const [exist] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email.trim(), req.user.id]
    );

    if (exist.length) {
      return res.status(400).json({ message: "Email đã được dùng" });
    }

    await db.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [name.trim(), email.trim(), req.user.id]
    );

    return res.json({ message: "Đã cập nhật" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu tối thiểu 6 ký tự",
      });
    }

    const [rows] = await db.query(
      "SELECT password FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    const match = await bcrypt.compare(currentPassword, rows[0].password);

    if (!match) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hash, req.user.id]
    );

    return res.json({ message: "Đã đổi mật khẩu" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getPreferences = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT dark_mode, compact_ui, language FROM users WHERE id = ?",
      [req.user.id]
    );

    return res.json(rows[0] || {});
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { darkMode, compactUI, language } = req.body;

    await db.query(
      "UPDATE users SET dark_mode = ?, compact_ui = ?, language = ? WHERE id = ?",
      [darkMode ? 1 : 0, compactUI ? 1 : 0, language || "vi", req.user.id]
    );

    return res.json({ message: "Đã lưu" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT notif_enabled, notif_before FROM users WHERE id = ?",
      [req.user.id]
    );

    const settings = rows[0] || {};

    return res.json({
      enabled: !!settings.notif_enabled,
      reminderBefore: String(settings.notif_before || 30),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateNotifications = async (req, res) => {
  try {
    const { enabled, reminderBefore } = req.body;

    await db.query(
      "UPDATE users SET notif_enabled = ?, notif_before = ? WHERE id = ?",
      [enabled ? 1 : 0, parseInt(reminderBefore, 10) || 30, req.user.id]
    );

    return res.json({ message: "Đã lưu" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAISettings = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT ai_hours, ai_goal, ai_level FROM users WHERE id = ?",
      [req.user.id]
    );

    const settings = rows[0] || {};

    return res.json({
      dailyHours: settings.ai_hours || 2,
      goal: settings.ai_goal || "",
      level: settings.ai_level || "beginner",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateAISettings = async (req, res) => {
  try {
    const { dailyHours, goal, level } = req.body;

    await db.query(
      "UPDATE users SET ai_hours = ?, ai_goal = ?, ai_level = ? WHERE id = ?",
      [parseInt(dailyHours, 10) || 2, goal || null, level || "beginner", req.user.id]
    );

    return res.json({ message: "Đã lưu" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ?", [req.user.id]);
    return res.json({ message: "Đã xóa tài khoản" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

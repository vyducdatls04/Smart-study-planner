import db from "../config/db.js";

// Lấy toàn bộ kế hoạch
export const getPlans = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const [plans] = await db.query(
      "SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    return res.status(200).json(plans);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Tạo kế hoạch
export const createPlan = async (req, res) => {
  try {
    const { title, due } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập tiêu đề" });
    }

    await db.query(
      "INSERT INTO plans (title, due, user_id) VALUES (?, ?, ?)",
      [title.trim(), due || null, userId]
    );

    return res.status(201).json({ message: "Đã tạo kế hoạch" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Xóa kế hoạch
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const [result] = await db.query(
      "DELETE FROM plans WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy kế hoạch" });
    }

    return res.status(200).json({ message: "Đã xóa kế hoạch" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

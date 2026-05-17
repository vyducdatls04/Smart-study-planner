import db from "../config/db.js";

export const getTasks = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM tasks WHERE user_id = ? ORDER BY deadline ASC",
      [req.user.id]
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getTasksByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Thiếu ngày" });
    }

    const [rows] = await db.query(
      "SELECT * FROM tasks WHERE user_id = ? AND DATE(deadline) = ?",
      [req.user.id, date]
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, deadline, priority, subject_id } = req.body;

    if (!title?.trim() || !deadline) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    await db.query(
      "INSERT INTO tasks (user_id, title, deadline, priority, subject_id, status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        req.user.id,
        title.trim(),
        deadline,
        priority || "medium",
        subject_id || null,
        "pending",
      ]
    );

    return res.json({ message: "Đã tạo công việc" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, deadline, priority, subject_id, status } = req.body;

    const [result] = await db.query(
      `
      UPDATE tasks
      SET title = ?, deadline = ?, priority = ?, subject_id = ?, status = ?
      WHERE id = ? AND user_id = ?
      `,
      [
        title,
        deadline,
        priority || "medium",
        subject_id || null,
        status || "pending",
        req.params.id,
        req.user.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Công việc không tồn tại" });
    }

    return res.json({ message: "Đã cập nhật công việc" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "done"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const [result] = await db.query(
      "UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?",
      [status, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Công việc không tồn tại" });
    }

    return res.json({ message: "Đã cập nhật trạng thái" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM tasks WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Công việc không tồn tại" });
    }

    return res.json({ message: "Đã xóa công việc" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

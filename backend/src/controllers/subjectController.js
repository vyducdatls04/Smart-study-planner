import db from "../config/db.js";

// ======================
// GET ALL SUBJECTS
// ======================

export const getSubjects = async (
  req,
  res
) => {
  try {
    const [rows] = await db.query(
      `
      SELECT *
      FROM subjects
      WHERE user_id = ?
      ORDER BY id DESC
      `,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Lỗi lấy danh sách môn học",
    });
  }
};

// ======================
// GET SUBJECT BY ID
// ======================

export const getSubjectById = async (
  req,
  res
) => {
  try {
    const [rows] = await db.query(
      `
      SELECT *
      FROM subjects
      WHERE id = ?
      AND user_id = ?
      `,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          "Không tìm thấy môn học",
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================
// CREATE SUBJECT
// ======================

export const createSubject = async (
  req,
  res
) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({
        message:
          "Tên môn học là bắt buộc",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO subjects
      (user_id, name, color)
      VALUES (?, ?, ?)
      `,
      [
        req.user.id,
        name,
        color || "#378ADD",
      ]
    );

    res.json({
      id: result.insertId,
      message:
        "Đã tạo môn học",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Không thể tạo môn học",
    });
  }
};

// ======================
// UPDATE SUBJECT
// ======================

export const updateSubject = async (
  req,
  res
) => {
  try {
    const { name, color } = req.body;

    const [result] = await db.query(
      `
      UPDATE subjects
      SET name = ?, color = ?
      WHERE id = ?
      AND user_id = ?
      `,
      [
        name,
        color,
        req.params.id,
        req.user.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message:
          "Không tìm thấy môn học",
      });
    }

    res.json({
      message:
        "Cập nhật thành công",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Không thể cập nhật",
    });
  }
};

// ======================
// DELETE SUBJECT
// ======================

export const deleteSubject = async (
  req,
  res
) => {
  try {
    const [result] = await db.query(
      `
      DELETE FROM subjects
      WHERE id = ?
      AND user_id = ?
      `,
      [req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message:
          "Không tìm thấy môn học",
      });
    }

    res.json({
      message: "Đã xóa môn học",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Không thể xóa môn học",
    });
  }
};
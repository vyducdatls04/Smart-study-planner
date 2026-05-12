import db from "../config/db.js";

export const getSubjects = async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM subjects WHERE user_id=?",
    [req.user.id]
  );
  res.json(rows);
};

export const createSubject = async (req, res) => {
  const { name, color } = req.body;

  if (!name) return res.status(400).json("Name required");

  const [result] = await db.query(
    "INSERT INTO subjects (user_id,name,color) VALUES (?,?,?)",
    [req.user.id, name, color || "#ccc"]
  );

  res.json({ id: result.insertId });
};

export const updateSubject = async (req, res) => {
  const { name, color } = req.body;

  const [result] = await db.query(
    "UPDATE subjects SET name=?,color=? WHERE id=? AND user_id=?",
    [name, color, req.params.id, req.user.id]
  );

  if (!result.affectedRows) return res.status(404).json("Not found");

  res.json("Updated");
};

export const deleteSubject = async (req, res) => {
  const [result] = await db.query(
    "DELETE FROM subjects WHERE id=? AND user_id=?",
    [req.params.id, req.user.id]
  );

  if (!result.affectedRows) return res.status(404).json("Not found");

  res.json("Deleted");
};
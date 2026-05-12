import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ Không có header
    if (!authHeader) {
      return res.status(401).json({ message: "Không có token" });
    }

    // ❌ Sai format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Sai định dạng token" });
    }

    const token = authHeader.split(" ")[1];

    // ❌ Token rỗng
    if (!token) {
      return res.status(401).json({ message: "Token rỗng" });
    }

    // 🔥 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 Gắn user vào request
    req.user = decoded;

    next();
  } catch (err) {
    console.error("Auth error:", err.message);

    return res.status(403).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};
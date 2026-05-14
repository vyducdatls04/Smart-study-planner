// src/controllers/aiController.js
import db from "../config/db.js";
import Groq from "groq-sdk";

const DEMO_PLAN = `Kế hoạch học tập gợi ý:\n- 08:00: Ôn tập lý thuyết\n- 10:00: Thực hành bài tập\n- 14:00: Xem lại các task còn lại\n- 20:00: Tổng kết và ghi chú`;

const SYSTEM_CHAT =
  "Bạn là trợ lý học tập AI thông minh, hỗ trợ mọi người học mọi lĩnh vực. " +
  "Giải thích rõ ràng, dễ hiểu bằng tiếng Việt. " +
  "Nếu có code, hãy dùng markdown code block kèm tên ngôn ngữ. " +
  "Trả lời ngắn gọn, đúng trọng tâm.";

const SYSTEM_PLAN =
  "Bạn là trợ lý lập kế hoạch học tập. Trả lời bằng tiếng Việt, ngắn gọn theo giờ.";

// ── Khởi tạo Groq client ─────────────────────────────────────────
const getClient = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new Groq({ apiKey: key });
};

// ── Lưu tin nhắn vào DB ──────────────────────────────────────────
const saveMessage = async (userId, role, content) => {
  try {
    await db.query(
      "INSERT INTO ai_messages (user_id, role, content) VALUES (?, ?, ?)",
      [userId, role, content]
    );
  } catch (err) {
    console.error("SAVE MSG ERROR:", err.message);
  }
};

// ── Build messages array (tránh 2 role liên tiếp) ────────────────
const buildMessages = (history, fallbackMsg) => {
  const messages = [];
  for (const item of history) {
    const role = item.role === "assistant" ? "assistant" : "user";
    if (messages.length > 0 && messages[messages.length - 1].role === role) {
      messages[messages.length - 1].content += "\n" + item.content;
    } else {
      messages.push({ role, content: item.content });
    }
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    messages.push({ role: "user", content: fallbackMsg });
  }
  return messages;
};

// ── POST /ai/chat (streaming) ────────────────────────────────────
export const chatWithAI = async (req, res) => {
  try {
    const uid = req.user.id;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Nội dung không được để trống" });
    }

    const client = getClient();
    if (!client) {
      return res.json({ reply: "⚠️ Chế độ Demo: Chưa cấu hình API Key.", demo: true });
    }

    // 1. Lưu tin nhắn user
    await saveMessage(uid, "user", message.trim());

    // 2. Lấy lịch sử từ DB
    const [history] = await db.query(
      `SELECT role, content FROM ai_messages
       WHERE user_id = ? ORDER BY created_at ASC LIMIT 20`,
      [uid]
    );

    // 3. Build messages
    const messages = buildMessages(history, message.trim());

    // 4. Setup SSE streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // 5. Gọi Groq streaming
    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile", // nhanh, thông minh, miễn phí
      messages: [{ role: "system", content: SYSTEM_CHAT }, ...messages],
      max_tokens: 1500,
      temperature: 0.7,
      stream: true,
    });

    // 6. Stream từng chunk về frontend
    let fullReply = "";
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        fullReply += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // 7. Lưu reply vào DB
    if (fullReply) await saveMessage(uid, "assistant", fullReply);

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("AI CHAT ERROR:", err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};

// ── GET /ai/plan ─────────────────────────────────────────────────
export const getAIPlan = async (req, res) => {
  try {
    const uid = req.user.id;
    const client = getClient();

    if (!client) return res.json({ plan: DEMO_PLAN, demo: true });

    const [tasks] = await db.query(
      "SELECT title, priority FROM tasks WHERE user_id = ? AND status = 'pending' LIMIT 5",
      [uid]
    );
    const [[user]] = await db.query(
      "SELECT name, ai_goal FROM users WHERE id = ?",
      [uid]
    );

    const taskText =
      tasks.map((t) => `- ${t.title} (Ưu tiên: ${t.priority})`).join("\n") ||
      "Không có task nào.";

    const prompt =
      `Lập kế hoạch học tập hôm nay cho ${user?.name || "người học"}.\n` +
      `Mục tiêu: ${user?.ai_goal || "Học tập hiệu quả"}.\n` +
      `Các task hiện có:\n${taskText}\n\n` +
      `Yêu cầu: Trả lời ngắn gọn theo khung giờ, tối đa 10 dòng.`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PLAN },
        { role: "user",   content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    return res.json({ plan: completion.choices[0].message.content });
  } catch (err) {
    console.error("AI PLAN ERROR:", err.message);
    return res.json({ plan: DEMO_PLAN, demo: true });
  }
};

// ── GET /ai/history ──────────────────────────────────────────────
export const getAIHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT role, content, created_at
       FROM ai_messages
       WHERE user_id = ?
       ORDER BY created_at ASC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /ai/history ───────────────────────────────────────────
export const clearAIHistory = async (req, res) => {
  try {
    await db.query("DELETE FROM ai_messages WHERE user_id = ?", [req.user.id]);
    return res.json({ message: "Đã xóa lịch sử" });
  } catch (err) {
    console.error("CLEAR AI HISTORY ERROR:", err.message);
    return res.status(500).json({ message: "Lỗi xóa lịch sử" });
  }
};
import db from "../config/db.js";
import { sendMail } from "../utils/sendMail.js";

const DEFAULT_REMINDER_HOUR = 7;
const DEFAULT_TIMEZONE_OFFSET = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const priorityLabel = {
  high: "Cao",
  medium: "Vừa",
  low: "Thấp",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getTimezoneOffset = () =>
  Number.parseInt(process.env.REMINDER_TIMEZONE_OFFSET, 10) ||
  DEFAULT_TIMEZONE_OFFSET;

const getLocalDate = (date = new Date()) => {
  const local = new Date(date.getTime() + getTimezoneOffset() * 60 * 60 * 1000);
  local.setUTCHours(0, 0, 0, 0);
  return local;
};

const getLocalDateKey = (date = new Date()) =>
  getLocalDate(date).toISOString().slice(0, 10);

const getLocalHour = (date = new Date()) => {
  const local = new Date(date.getTime() + getTimezoneOffset() * 60 * 60 * 1000);
  return local.getUTCHours();
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const daysUntil = (value) => {
  const due = normalizeDate(value);
  if (!due) return null;

  const today = getLocalDate();
  return Math.round((due.getTime() - today.getTime()) / DAY_MS);
};

const getDateLabel = (daysLeft) => {
  if (daysLeft < 0) return `Quá hạn ${Math.abs(daysLeft)} ngày`;
  if (daysLeft === 0) return "Đến hạn hôm nay";
  if (daysLeft === 1) return "Đến hạn ngày mai";
  return `Còn ${daysLeft} ngày`;
};

const getFormattedDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
};

const getReminderHour = (value) => {
  const hour = Number.parseInt(value, 10);
  if (Number.isNaN(hour)) return DEFAULT_REMINDER_HOUR;
  return Math.min(23, Math.max(0, hour));
};

export const ensureEmailReminderColumns = async () => {
  const [columns] = await db.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN (
        'email_notif_enabled',
        'email_notif_hour',
        'email_notif_last_sent'
      )
    `
  );

  const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!existingColumns.has("email_notif_enabled")) {
    await db.query(
      "ALTER TABLE users ADD COLUMN email_notif_enabled TINYINT(1) DEFAULT 0"
    );
  }

  if (!existingColumns.has("email_notif_hour")) {
    await db.query(
      "ALTER TABLE users ADD COLUMN email_notif_hour INT DEFAULT 7"
    );
  }

  if (!existingColumns.has("email_notif_last_sent")) {
    await db.query(
      "ALTER TABLE users ADD COLUMN email_notif_last_sent DATE DEFAULT NULL"
    );
  }
};

export const getEmailReminderItems = async (userId, reminderBefore = 30) => {
  const [tasks] = await db.query(
    `
    SELECT id, title, deadline, priority
    FROM tasks
    WHERE user_id = ?
      AND status != 'done'
      AND deadline IS NOT NULL
    `,
    [userId]
  );

  const [plans] = await db.query(
    `
    SELECT id, title, due
    FROM plans
    WHERE user_id = ?
      AND due IS NOT NULL
    `,
    [userId]
  );

  const taskItems = tasks
    .map((task) => {
      const diff = daysUntil(task.deadline);
      if (diff === null || diff > reminderBefore) return null;

      return {
        type: "Công việc",
        title: task.title,
        due: task.deadline,
        daysLeft: diff,
        priority: task.priority || "medium",
        score:
          (reminderBefore - diff) +
          (task.priority === "high" ? 12 : task.priority === "medium" ? 6 : 2) +
          (diff < 0 ? 30 : 0),
      };
    })
    .filter(Boolean);

  const planItems = plans
    .map((plan) => {
      const diff = daysUntil(plan.due);
      if (diff === null || diff > reminderBefore) return null;

      return {
        type: "Kế hoạch",
        title: plan.title,
        due: plan.due,
        daysLeft: diff,
        priority: "medium",
        score: reminderBefore - diff + (diff < 0 ? 24 : 0),
      };
    })
    .filter(Boolean);

  return [...taskItems, ...planItems].sort((a, b) => b.score - a.score);
};

const buildReminderEmail = ({ user, items, reminderBefore }) => {
  const subject =
    items.length > 0
      ? `Smart Study: ${items.length} mục cần chú ý hôm nay`
      : "Smart Study: Hôm nay chưa có việc gấp";

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:700;color:#111827;">${escapeHtml(item.title)}</div>
            <div style="margin-top:4px;color:#6b7280;font-size:13px;">
              ${item.type} · ${getFormattedDate(item.due)} · ${getDateLabel(item.daysLeft)}
            </div>
          </td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#2563eb;font-weight:700;">
            ${escapeHtml(priorityLabel[item.priority] || "Vừa")}
          </td>
        </tr>
      `
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:680px;margin:0 auto;">
      <h2 style="margin:0 0 8px;">Nhắc học hôm nay</h2>
      <p>Xin chào ${escapeHtml(user.name || "bạn")},</p>
      <p>
        Smart Study đã kiểm tra các công việc và kế hoạch trong ${reminderBefore} ngày tới.
      </p>
      ${
        items.length
          ? `
            <table style="width:100%;border-collapse:collapse;margin-top:16px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <tbody>${itemRows}</tbody>
            </table>
          `
          : `
            <div style="margin-top:16px;padding:16px;border-radius:12px;background:#ecfdf5;color:#047857;">
              Hôm nay chưa có công việc hoặc kế hoạch nào cần nhắc trong khoảng đã chọn.
            </div>
          `
      }
      <p style="margin-top:20px;color:#6b7280;font-size:13px;">
        Bạn có thể đổi giờ nhận email hoặc tắt nhắc Gmail trong phần Cài đặt > Thông báo.
      </p>
    </div>
  `;

  const text =
    items.length > 0
      ? items
          .map(
            (item) =>
              `- ${item.title} (${item.type}, ${getFormattedDate(item.due)}, ${getDateLabel(item.daysLeft)})`
          )
          .join("\n")
      : "Hôm nay chưa có việc cần nhắc.";

  return { subject, html, text };
};

export const sendReminderEmailForUser = async (user, { markSent = true } = {}) => {
  await ensureEmailReminderColumns();

  const reminderBefore = Number.parseInt(user.notif_before, 10) || 30;
  const items = await getEmailReminderItems(user.id, reminderBefore);
  const email = buildReminderEmail({ user, items, reminderBefore });

  await sendMail({
    to: user.email,
    ...email,
  });

  if (markSent) {
    await db.query(
      "UPDATE users SET email_notif_last_sent = ? WHERE id = ?",
      [getLocalDateKey(), user.id]
    );
  }

  return { sent: true, count: items.length };
};

export const runDueReminderEmails = async () => {
  await ensureEmailReminderColumns();

  const today = getLocalDateKey();
  const hour = getLocalHour();
  const [users] = await db.query(
    `
    SELECT id, name, email, notif_before, email_notif_hour
    FROM users
    WHERE email_notif_enabled = 1
      AND email_notif_hour = ?
      AND (email_notif_last_sent IS NULL OR email_notif_last_sent < ?)
    `,
    [hour, today]
  );

  for (const user of users) {
    try {
      await sendReminderEmailForUser({
        ...user,
        email_notif_hour: getReminderHour(user.email_notif_hour),
      });
    } catch (err) {
      console.error(`EMAIL REMINDER ERROR user=${user.id}:`, err.message);
    }
  }
};

export const startEmailReminderScheduler = () => {
  const run = () => {
    runDueReminderEmails().catch((err) => {
      console.error("EMAIL REMINDER SCHEDULER ERROR:", err.message);
    });
  };

  setTimeout(run, 5000);
  setInterval(run, 60 * 1000);
};

import db from "../config/db.js";

const RANGE_CONFIG = {
  week: {
    label: "Tuần này",
    groupFormat: "%a",
  },
  month: {
    label: "Tháng này",
    groupFormat: "%d/%m",
  },
  year: {
    label: "Năm nay",
    groupFormat: "%b",
  },
};

const getRangeConfig = (range) =>
  RANGE_CONFIG[range] || RANGE_CONFIG.month;

const formatExportDateTime = () =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

const toCsvValue = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const toStatusLabel = (status) => {
  if (status === "done") return "Hoàn thành";
  return "Chưa hoàn thành";
};

export const getDashboard = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;

    const [[totalTasks]] = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM tasks
      WHERE user_id = ?
      `,
      [userId]
    );

    const [[doneTasks]] = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM tasks
      WHERE user_id = ?
      AND status = 'done'
      `,
      [userId]
    );

    const [[todayTasks]] = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM tasks
      WHERE user_id = ?
      AND deadline = CURDATE()
      `,
      [userId]
    );

    return res.json({
      totalTasks: Number(totalTasks.count || 0),
      doneTasks: Number(doneTasks.count || 0),
      todayTasks: Number(todayTasks.count || 0),
    });
  } catch (err) {
    console.error("GET DASHBOARD ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

export const getProgress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;

    const range = req.query.range || "month";

    const rangeConfig = getRangeConfig(range);

    const [[taskStats]] = await db.query(
      `
      SELECT
        COUNT(*) AS total,

        SUM(
          CASE
            WHEN status = 'done'
            THEN 1
            ELSE 0
          END
        ) AS completed,

        SUM(
          CASE
            WHEN status = 'pending'
            THEN 1
            ELSE 0
          END
        ) AS pending

      FROM tasks

      WHERE user_id = ?
      `,
      [userId]
    );

    const [[subjectStats]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM subjects
      WHERE user_id = ?
      `,
      [userId]
    );

    const [subjects] = await db.query(
      `
      SELECT
        s.name,

        COUNT(t.id) AS total,

        SUM(
          CASE
            WHEN t.status = 'done'
            THEN 1
            ELSE 0
          END
        ) AS completed

      FROM subjects s

      LEFT JOIN tasks t
        ON t.subject_id = s.id
        AND t.user_id = ?

      WHERE s.user_id = ?

      GROUP BY s.id

      ORDER BY s.name ASC
      `,
      [userId, userId]
    );

    const [studyHours] = await db.query(
      `
      SELECT
        DATE_FORMAT(
          COALESCE(deadline, CURDATE()),
          '${rangeConfig.groupFormat}'
        ) AS day,

        COUNT(*) AS tasks

      FROM tasks

      WHERE user_id = ?

      GROUP BY day

      ORDER BY MIN(
        COALESCE(deadline, CURDATE())
      ) ASC
      `,
      [userId]
    );

    const total = Number(taskStats.total || 0);

    const completed = Number(taskStats.completed || 0);

    const pending = Number(taskStats.pending || 0);

    const overallProgress =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    const pendingPercent =
      total > 0
        ? Math.round((pending / total) * 100)
        : 0;

    const subjectsData = subjects.map((subject) => {
      const totalSubject = Number(subject.total || 0);

      const completedSubject = Number(
        subject.completed || 0
      );

      return {
        name: subject.name,
        percent:
          totalSubject > 0
            ? Math.round(
                (completedSubject / totalSubject) * 100
              )
            : 0,
      };
    });

    const subjectsMastered = subjectsData.filter(
      (subject) => subject.percent >= 80
    ).length;

    return res.json({
      overallProgress,

      totalStudyTime: `${completed} công việc`,

      studyTimeChange: "+0 giờ",

      tasksCompleted: completed,

      tasksTotal: total,

      subjectsMastered,

      subjectsTotal: Number(subjectStats.total || 0),

      subjects: subjectsData,

      studyHours: studyHours.map((item) => ({
        day: item.day,
        hours: Number(item.tasks || 0),
      })),

      achievements: [
        {
          icon: "✓",
          label: "Hoàn thành 5 công việc",
          done: completed >= 5,
          value: `${completed}/5`,
        },
        {
          icon: "◎",
          label: "Đạt tiến độ 80%",
          done: overallProgress >= 80,
          value: `${overallProgress}%`,
        },
      ],

      performance: {
        completed: {
          count: completed,
          percent: overallProgress,
        },

        pending: {
          count: pending,
          percent: pendingPercent,
        },

        inProgress: {
          count: 0,
          percent: 0,
        },

        averageScore: overallProgress,
      },
    });
  } catch (err) {
    console.error("GET PROGRESS ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

export const exportProgress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;

    const range = req.query.range || "month";

    const rangeConfig = getRangeConfig(range);

    const [[user]] = await db.query(
      `
      SELECT
        name,
        email
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    const [tasks] = await db.query(
      `
      SELECT
        id,
        title,

        COALESCE(status, 'pending') AS status,

        CASE
          WHEN deadline IS NOT NULL
          THEN DATE_FORMAT(deadline, '%d/%m/%Y')
          ELSE ''
        END AS deadline

      FROM tasks

      WHERE user_id = ?

      ORDER BY id DESC
      `,
      [userId]
    );

    const rows = [
      ["SMART STUDY PLANNER"],

      ["Ngày xuất", formatExportDateTime()],

      ["Khoảng thời gian", rangeConfig.label],

      ["Người dùng", user?.name || "Không rõ"],

      ["Email", user?.email || "Không rõ"],

      [],

      [
        "ID",
        "Công việc",
        "Trạng thái",
        "Hạn",
      ],

      ...tasks.map((task) => [
        task.id,
        task.title,
        toStatusLabel(task.status),
        task.deadline,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map(toCsvValue).join(",")
      )
      .join("\n");

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bao-cao-tien-do-${range}.csv"`
    );

    return res.send("\uFEFF" + csv);
  } catch (err) {
    console.error(
      "EXPORT PROGRESS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  }
};
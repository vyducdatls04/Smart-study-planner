import db from "../config/db.js";

const RANGE_CONFIG = {
  week: {
    label: "Tuần này",
    intervalSql: "INTERVAL 7 DAY",
    groupFormat: "%a",
  },
  month: {
    label: "Tháng này",
    intervalSql: "INTERVAL 30 DAY",
    groupFormat: "%d/%m",
  },
  year: {
    label: "Năm nay",
    intervalSql: "INTERVAL 12 MONTH",
    groupFormat: "%b",
  },
};

const getRangeConfig = (range) => RANGE_CONFIG[range] || RANGE_CONFIG.month;

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

const toPriorityLabel = (priority) => {
  if (priority === "high") return "Cao";
  if (priority === "medium") return "Trung bình";
  if (priority === "low") return "Thấp";
  return "Chưa đặt";
};

const toStatusLabel = (status) => {
  if (status === "done") return "Hoàn thành";
  if (status === "pending") return "Chưa hoàn thành";
  return "Không xác định";
};

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[totalTasks]] = await db.query(
      "SELECT COUNT(*) AS count FROM tasks WHERE user_id = ?",
      [userId]
    );

    const [[doneTasks]] = await db.query(
      "SELECT COUNT(*) AS count FROM tasks WHERE user_id = ? AND status = 'done'",
      [userId]
    );

    const [[todayTasks]] = await db.query(
      "SELECT COUNT(*) AS count FROM tasks WHERE user_id = ? AND deadline = CURDATE()",
      [userId]
    );

    return res.json({
      totalTasks: totalTasks.count,
      doneTasks: doneTasks.count,
      todayTasks: todayTasks.count,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

export const getProgress = async (req, res) => {
  try {
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
        s.id,
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

      GROUP BY s.id, s.name

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

      ORDER BY MIN(COALESCE(deadline, CURDATE())) ASC
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

    const subjectTotal = Number(subjectStats.total || 0);

    const subjectProgress = subjects.map((subject) => {
      const subjectTaskTotal = Number(subject.total || 0);

      const subjectCompleted = Number(subject.completed || 0);

      return {
        name: subject.name,
        percent:
          subjectTaskTotal > 0
            ? Math.round(
                (subjectCompleted / subjectTaskTotal) * 100
              )
            : 0,
      };
    });

    const subjectsMastered = subjectProgress.filter(
      (subject) => subject.percent >= 80
    ).length;

    return res.json({
      overallProgress,

      totalStudyTime: `${completed} công việc`,

      studyTimeChange: "+0 giờ",

      tasksCompleted: completed,

      tasksTotal: total,

      subjectsMastered,

      subjectsTotal: subjectTotal,

      subjects: subjectProgress,

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
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

export const exportProgress = async (req, res) => {
  try {
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
        ) AS pending,

        SUM(
          CASE
            WHEN status = 'pending'
            AND deadline IS NOT NULL
            AND deadline < CURDATE()
            THEN 1
            ELSE 0
          END
        ) AS overdue,

        SUM(
          CASE
            WHEN priority = 'high'
            THEN 1
            ELSE 0
          END
        ) AS highPriority,

        SUM(
          CASE
            WHEN priority = 'medium'
            THEN 1
            ELSE 0
          END
        ) AS mediumPriority,

        SUM(
          CASE
            WHEN priority = 'low'
            THEN 1
            ELSE 0
          END
        ) AS lowPriority

      FROM tasks

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
        ) AS completed,

        SUM(
          CASE
            WHEN t.status = 'pending'
            THEN 1
            ELSE 0
          END
        ) AS pending

      FROM subjects s

      LEFT JOIN tasks t
        ON t.subject_id = s.id
        AND t.user_id = ?

      WHERE s.user_id = ?

      GROUP BY s.id, s.name

      ORDER BY s.name ASC
      `,
      [userId, userId]
    );

    const [dailyStats] = await db.query(
      `
      SELECT
        DATE_FORMAT(
          COALESCE(deadline, CURDATE()),
          '%d/%m/%Y'
        ) AS day,

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

      GROUP BY DATE(COALESCE(deadline, CURDATE()))

      ORDER BY DATE(COALESCE(deadline, CURDATE())) ASC
      `,
      [userId]
    );

    const [tasks] = await db.query(
      `
      SELECT
        t.title,

        CASE
          WHEN t.deadline IS NOT NULL
          THEN DATE_FORMAT(t.deadline, '%d/%m/%Y')
          ELSE ''
        END AS deadline,

        COALESCE(t.priority, 'medium') AS priority,

        COALESCE(t.status, 'pending') AS status,

        CASE
          WHEN t.status = 'pending'
          AND t.deadline IS NOT NULL
          AND t.deadline < CURDATE()
          THEN 'Quá hạn'

          WHEN t.status = 'pending'
          AND t.deadline = CURDATE()
          THEN 'Cần làm hôm nay'

          WHEN t.status = 'done'
          THEN 'Đã hoàn tất'

          ELSE 'Đang theo dõi'
        END AS note,

        COALESCE(
          s.name,
          'Chưa gắn môn học'
        ) AS subjectName

      FROM tasks t

      LEFT JOIN subjects s
        ON s.id = t.subject_id

      WHERE t.user_id = ?

      ORDER BY
        t.deadline IS NULL,
        t.deadline ASC
      `,
      [userId]
    );

    const total = Number(taskStats.total || 0);

    const completed = Number(taskStats.completed || 0);

    const pending = Number(taskStats.pending || 0);

    const progress =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    const rows = [
      ["SMART STUDY PLANNER - BÁO CÁO TIẾN ĐỘ HỌC TẬP"],

      ["Ngày xuất", formatExportDateTime()],

      ["Khoảng thời gian", rangeConfig.label],

      ["Người dùng", user?.name || "Không rõ"],

      ["Email", user?.email || "Không rõ"],

      [],

      ["TỔNG QUAN"],

      ["Chỉ số", "Giá trị"],

      ["Tổng công việc", total],

      ["Đã hoàn thành", completed],

      ["Chưa hoàn thành", pending],

      ["Quá hạn", Number(taskStats.overdue || 0)],

      ["Tiến độ hoàn thành", `${progress}%`],

      ["Ưu tiên cao", Number(taskStats.highPriority || 0)],

      ["Ưu tiên trung bình", Number(taskStats.mediumPriority || 0)],

      ["Ưu tiên thấp", Number(taskStats.lowPriority || 0)],

      [],

      ["TIẾN ĐỘ THEO MÔN"],

      [
        "Môn học",
        "Tổng công việc",
        "Hoàn thành",
        "Chưa hoàn thành",
        "Tiến độ",
      ],

      ...subjects.map((subject) => {
        const subjectTotal = Number(subject.total || 0);

        const subjectCompleted = Number(subject.completed || 0);

        const subjectProgress =
          subjectTotal > 0
            ? Math.round(
                (subjectCompleted / subjectTotal) * 100
              )
            : 0;

        return [
          subject.name,
          subjectTotal,
          subjectCompleted,
          Number(subject.pending || 0),
          `${subjectProgress}%`,
        ];
      }),

      [],

      ["THỐNG KÊ THEO NGÀY"],

      [
        "Ngày",
        "Tổng công việc",
        "Hoàn thành",
        "Chưa hoàn thành",
      ],

      ...dailyStats.map((day) => [
        day.day,
        Number(day.total || 0),
        Number(day.completed || 0),
        Number(day.pending || 0),
      ]),

      [],

      ["DANH SÁCH CÔNG VIỆC"],

      [
        "STT",
        "Công việc",
        "Môn học",
        "Hạn",
        "Độ ưu tiên",
        "Trạng thái",
        "Ghi chú",
      ],

      ...tasks.map((task, index) => [
        index + 1,
        task.title,
        task.subjectName,
        task.deadline,
        toPriorityLabel(task.priority),
        toStatusLabel(task.status),
        task.note,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map(toCsvValue).join(",")
      )
      .join("\r\n");

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="smart-study-progress-${range}.csv"`
    );

    return res.send(`\uFEFF${csv}`);
  } catch (err) {
    console.error("EXPORT ERROR FULL:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  }
};
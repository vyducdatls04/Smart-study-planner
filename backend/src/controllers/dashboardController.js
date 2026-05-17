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

const toCsvValue = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
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
    return res.status(500).json({ message: err.message });
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
        SUM(status = 'done') AS completed,
        SUM(status = 'pending') AS pending
      FROM tasks
      WHERE user_id = ?
      AND deadline >= DATE_SUB(CURDATE(), ${rangeConfig.intervalSql})
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
        SUM(t.status = 'done') AS completed
      FROM subjects s
      LEFT JOIN tasks t
        ON t.subject_id = s.id
        AND t.user_id = ?
        AND t.deadline >= DATE_SUB(CURDATE(), ${rangeConfig.intervalSql})
      WHERE s.user_id = ?
      GROUP BY s.id, s.name
      ORDER BY s.name ASC
      `,
      [userId, userId]
    );

    const [studyHours] = await db.query(
      `
      SELECT
        DATE_FORMAT(deadline, '${rangeConfig.groupFormat}') AS day,
        COUNT(*) AS tasks
      FROM tasks
      WHERE user_id = ?
      AND deadline >= DATE_SUB(CURDATE(), ${rangeConfig.intervalSql})
      GROUP BY day
      ORDER BY MIN(deadline) ASC
      `,
      [userId]
    );

    const total = Number(taskStats.total || 0);
    const completed = Number(taskStats.completed || 0);
    const pending = Number(taskStats.pending || 0);
    const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pendingPercent = total > 0 ? Math.round((pending / total) * 100) : 0;
    const subjectTotal = Number(subjectStats.total || 0);

    const subjectProgress = subjects.map((subject) => {
      const subjectTaskTotal = Number(subject.total || 0);
      const subjectCompleted = Number(subject.completed || 0);

      return {
        name: subject.name,
        percent:
          subjectTaskTotal > 0
            ? Math.round((subjectCompleted / subjectTaskTotal) * 100)
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
    return res.status(500).json({ message: err.message });
  }
};

export const exportProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const range = req.query.range || "month";
    const rangeConfig = getRangeConfig(range);

    const [tasks] = await db.query(
      `
      SELECT title, deadline, priority, status
      FROM tasks
      WHERE user_id = ?
      AND deadline >= DATE_SUB(CURDATE(), ${rangeConfig.intervalSql})
      ORDER BY deadline ASC
      `,
      [userId]
    );

    const rows = [
      ["Khoảng thời gian", rangeConfig.label],
      [],
      ["Tiêu đề", "Hạn", "Độ ưu tiên", "Trạng thái"],
      ...tasks.map((task) => [
        task.title,
        task.deadline,
        task.priority === "high"
          ? "Cao"
          : task.priority === "medium"
            ? "Trung bình"
            : "Thấp",
        task.status === "done" ? "Hoàn thành" : "Chưa hoàn thành",
      ]),
    ];

    const csv = rows.map((row) => row.map(toCsvValue).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="progress-${range}.csv"`
    );

    return res.send(`\uFEFF${csv}`);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

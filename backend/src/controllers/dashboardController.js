import db from "../config/db.js";
import ExcelJS from "exceljs";

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

        COALESCE(priority, 'medium') AS priority,

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

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Smart Study Planner";

    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(
      "Tiến độ học tập"
    );

    worksheet.mergeCells("A1:E1");

    const titleCell = worksheet.getCell("A1");

    titleCell.value =
      "SMART STUDY PLANNER - BÁO CÁO TIẾN ĐỘ";

    titleCell.font = {
      bold: true,
      size: 18,
      color: {
        argb: "FFFFFF",
      },
    };

    titleCell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "2563EB",
      },
    };

    worksheet.addRow([]);

    worksheet.addRow([
      "Người dùng",
      user?.name || "Không rõ",
    ]);

    worksheet.addRow([
      "Email",
      user?.email || "Không rõ",
    ]);

    worksheet.addRow([
      "Khoảng thời gian",
      rangeConfig.label,
    ]);

    worksheet.addRow([
      "Ngày xuất",
      formatExportDateTime(),
    ]);

    worksheet.addRow([]);

    worksheet.columns = [
      {
        header: "ID",
        key: "id",
        width: 10,
      },
      {
        header: "Công việc",
        key: "title",
        width: 35,
      },
      {
        header: "Trạng thái",
        key: "status",
        width: 22,
      },
      {
        header: "Ưu tiên",
        key: "priority",
        width: 20,
      },
      {
        header: "Hạn",
        key: "deadline",
        width: 20,
      },
    ];

    tasks.forEach((task) => {
      worksheet.addRow({
        id: task.id,

        title: task.title,

        status:
          task.status === "done"
            ? "Hoàn thành"
            : "Chưa hoàn thành",

        priority:
          task.priority === "high"
            ? "Cao"
            : task.priority === "medium"
            ? "Trung bình"
            : "Thấp",

        deadline: task.deadline,
      });
    });

    const headerRow = worksheet.getRow(8);

    headerRow.font = {
      bold: true,
      color: {
        argb: "FFFFFF",
      },
    };

    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "1D4ED8",
      },
    };

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: {
            style: "thin",
          },
          left: {
            style: "thin",
          },
          bottom: {
            style: "thin",
          },
          right: {
            style: "thin",
          },
        };

        if (rowNumber > 8) {
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
          };
        }
      });
    });

    worksheet.views = [
      {
        state: "frozen",
        ySplit: 8,
      },
    ];

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bao-cao-tien-do-${range}.xlsx`
    );

    await workbook.xlsx.write(res);

    res.end();
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
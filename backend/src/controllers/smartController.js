import db from "../config/db.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAILY_TASKS = 4;

const priorityScore = {
  high: 30,
  medium: 18,
  low: 8,
};

const normalizeDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
};

const todayDate = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const daysUntil = (value) => {
  const date = normalizeDate(value);
  if (!date) return null;

  return Math.round((date.getTime() - todayDate().getTime()) / DAY_MS);
};

const dateKey = (value) => {
  const date = normalizeDate(value);
  if (!date) return null;

  return date.toISOString().slice(0, 10);
};

const deadlineScore = (daysLeft) => {
  if (daysLeft === null) return 0;
  if (daysLeft < 0) return 45 + Math.min(Math.abs(daysLeft) * 4, 30);
  if (daysLeft === 0) return 40;
  if (daysLeft === 1) return 34;
  if (daysLeft <= 3) return 26;
  if (daysLeft <= 7) return 16;
  return 4;
};

const getDeadlineLabel = (daysLeft) => {
  if (daysLeft === null) return "Chưa có hạn";
  if (daysLeft < 0) return `Quá hạn ${Math.abs(daysLeft)} ngày`;
  if (daysLeft === 0) return "Đến hạn hôm nay";
  if (daysLeft === 1) return "Đến hạn ngày mai";
  return `Còn ${daysLeft} ngày`;
};

const buildTaskRecommendation = (task) => {
  const daysLeft = daysUntil(task.deadline);
  const score =
    deadlineScore(daysLeft) +
    (priorityScore[task.priority] || priorityScore.medium);

  const reasons = [];

  if (daysLeft !== null && daysLeft < 0) reasons.push("công việc đã quá hạn");
  if (daysLeft === 0) reasons.push("đến hạn hôm nay");
  if (daysLeft === 1) reasons.push("đến hạn ngày mai");
  if (task.priority === "high") reasons.push("mức ưu tiên cao");

  if (!reasons.length) {
    reasons.push("cần duy trì tiến độ học tập");
  }

  return {
    id: task.id,
    type: "task",
    title: task.title,
    subject: task.subject_name || null,
    deadline: task.deadline,
    daysLeft,
    deadlineLabel: getDeadlineLabel(daysLeft),
    priority: task.priority || "medium",
    score,
    reasons,
  };
};

const buildSubjectInsights = (subjects) => {
  return subjects
    .map((subject) => {
      const total = Number(subject.total_tasks || 0);
      const done = Number(subject.done_tasks || 0);
      const pending = Math.max(total - done, 0);
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        id: subject.id,
        name: subject.name,
        color: subject.color || "#378ADD",
        total,
        done,
        pending,
        progress,
        needsAttention: total > 0 && progress < 50,
      };
    })
    .filter((subject) => subject.total > 0)
    .sort((a, b) => a.progress - b.progress || b.pending - a.pending);
};

export const getSmartRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [tasks] = await db.query(
      `
      SELECT
        t.id,
        t.title,
        t.deadline,
        t.priority,
        t.status,
        s.name AS subject_name
      FROM tasks t
      LEFT JOIN subjects s
        ON s.id = t.subject_id
        AND s.user_id = t.user_id
      WHERE t.user_id = ?
      ORDER BY t.deadline ASC
      `,
      [userId]
    );

    const [plans] = await db.query(
      `
      SELECT id, title, due
      FROM plans
      WHERE user_id = ?
      ORDER BY due ASC
      `,
      [userId]
    );

    const [subjects] = await db.query(
      `
      SELECT
        s.id,
        s.name,
        s.color,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS done_tasks
      FROM subjects s
      LEFT JOIN tasks t
        ON t.subject_id = s.id
        AND t.user_id = s.user_id
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.name ASC
      `,
      [userId]
    );

    const pendingTasks = tasks.filter((task) => task.status !== "done");
    const rankedTasks = pendingTasks
      .map(buildTaskRecommendation)
      .sort((a, b) => b.score - a.score);

    const overdueTasks = rankedTasks.filter((task) => task.daysLeft !== null && task.daysLeft < 0);
    const todayTasks = rankedTasks.filter((task) => task.daysLeft === 0);
    const upcomingTasks = rankedTasks.filter(
      (task) => task.daysLeft !== null && task.daysLeft > 0 && task.daysLeft <= 7
    );

    const today = todayDate();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * DAY_MS);

    const upcomingPlans = plans
      .map((plan) => ({
        id: plan.id,
        title: plan.title,
        due: plan.due,
        daysLeft: daysUntil(plan.due),
      }))
      .filter(
        (plan) =>
          plan.daysLeft !== null &&
          normalizeDate(plan.due) <= sevenDaysFromNow
      )
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const dailyLoad = pendingTasks.reduce((acc, task) => {
      const key = dateKey(task.deadline);
      if (!key) return acc;

      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const overloadedDays = Object.entries(dailyLoad)
      .filter(([, count]) => count > MAX_DAILY_TASKS)
      .map(([date, count]) => ({
        date,
        count,
        limit: MAX_DAILY_TASKS,
        message: `Ngày ${date} có ${count} công việc, vượt ngưỡng ${MAX_DAILY_TASKS} công việc/ngày`,
      }));

    const subjectInsights = buildSubjectInsights(subjects);
    const weakSubjects = subjectInsights.filter((subject) => subject.needsAttention).slice(0, 3);

    const actions = [];

    if (overdueTasks.length > 0) {
      actions.push({
        level: "danger",
        title: "Xử lý công việc quá hạn",
        description: `Bạn có ${overdueTasks.length} công việc quá hạn. Nên hoàn thành trước khi thêm kế hoạch mới.`,
      });
    }

    if (todayTasks.length > 0) {
      actions.push({
        level: "warning",
        title: "Tập trung cho hôm nay",
        description: `Hôm nay có ${todayTasks.length} công việc đến hạn. Nên ưu tiên các mục có điểm cao trước.`,
      });
    }

    if (weakSubjects.length > 0) {
      actions.push({
        level: "info",
        title: "Cải thiện môn học có tiến độ thấp",
        description: `${weakSubjects[0].name} đang có tiến độ ${weakSubjects[0].progress}%. Nên dành ít nhất 30-60 phút để bù lại.`,
      });
    }

    if (overloadedDays.length > 0) {
      actions.push({
        level: "warning",
        title: "Lịch học bị quá tải",
        description: overloadedDays[0].message,
      });
    }

    if (!actions.length) {
      actions.push({
        level: "success",
        title: "Lịch học đang ổn định",
        description: "Chưa phát hiện công việc quá hạn, quá tải hoặc môn học có tiến độ thấp.",
      });
    }

    return res.json({
      generatedAt: new Date().toISOString(),
      summary: {
        pendingTasks: pendingTasks.length,
        overdueTasks: overdueTasks.length,
        todayTasks: todayTasks.length,
        upcomingTasks: upcomingTasks.length,
        upcomingPlans: upcomingPlans.length,
        weakSubjects: weakSubjects.length,
        overloadedDays: overloadedDays.length,
      },
      priorityTasks: rankedTasks.slice(0, 5),
      weakSubjects,
      upcomingPlans: upcomingPlans.slice(0, 5),
      overloadedDays,
      actions,
    });
  } catch (err) {
    console.error("GET SMART RECOMMENDATIONS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

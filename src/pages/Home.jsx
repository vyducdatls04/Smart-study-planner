import { useEffect, useState, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ListTodo,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Brain,
  AlertTriangle,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";

function today() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function deadlineLabel(deadline) {
  if (!deadline) return null;

  const diff = Math.round(
    (new Date(deadline) - new Date(today())) / 86400000
  );

  if (diff < 0) {
    return {
      text: `Quá hạn ${Math.abs(diff)} ngày`,
      overdue: true,
    };
  }

  if (diff === 0) {
    return {
      text: "Hôm nay",
      overdue: false,
    };
  }

  return {
    text: `Còn ${diff} ngày`,
    overdue: false,
  };
}

export default function Home() {
  const { user } = useAuth();

  const [date, setDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);

  const [dashboard, setDashboard] = useState({
    totalTasks: 0,
    doneTasks: 0,
    todayTasks: 0,
  });

  const [ai, setAi] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [smart, setSmart] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [tasksRes, dashRes, smartRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/dashboard"),
        api.get("/smart/recommendations"),
      ]);

      const tasksData = Array.isArray(tasksRes.data)
        ? tasksRes.data
        : [];

      setTasks(tasksData);

      setDashboard(
        dashRes.data || {
          totalTasks: 0,
          doneTasks: 0,
          todayTasks: 0,
        }
      );

      setSmart(smartRes.data || null);
    } catch (err) {
      console.error(err);

      setTasks([]);
      setSmart(null);
    }
  }, []);

  const fetchTasksByDate = useCallback(async (selectedDate) => {
    try {
      const res = await api.get(
        `/tasks/by-date?date=${formatDate(selectedDate)}`
      );

      const data = Array.isArray(res.data)
        ? res.data
        : [];

      setSelectedTasks(data);
    } catch (err) {
      console.error(err);

      setSelectedTasks([]);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAll();
      fetchTasksByDate(new Date());
    }
  }, [user, fetchAll, fetchTasksByDate]);

  const handleDateChange = (value) => {
    setDate(value);
    fetchTasksByDate(value);
  };

  const toggleTask = async (task) => {
    try {
      await api.put(`/tasks/${task.id}`, {
        ...task,
        status: task.status === "done"
          ? "pending"
          : "done",
      });

      await fetchAll();
      await fetchTasksByDate(date);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAI = async () => {
    try {
      setLoadingAI(true);

      const res = await api.get("/ai/plan");

      setAi(res.data?.plan || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const progress =
    dashboard.totalTasks > 0
      ? Math.round(
          (dashboard.doneTasks /
            dashboard.totalTasks) *
            100
        )
      : 0;

  const latestTasks = Array.isArray(tasks)
    ? tasks.slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-5 py-6 lg:px-8">
      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              Tổng quan học tập
            </p>

            <h1 className="text-2xl font-semibold text-gray-900">
              Bảng điều khiển
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Theo dõi công việc, lịch học và tiến độ trong ngày
            </p>
          </div>

          <Link
            to="/tasks"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            Quản lý công việc
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Công việc"
          value={dashboard.totalTasks}
          icon={<ListTodo size={20} />}
          color="bg-blue-50"
          textColor="text-blue-700"
          iconBg="bg-blue-100"
        />

        <StatCard
          label="Hoàn thành"
          value={dashboard.doneTasks}
          icon={<CheckCircle2 size={20} />}
          color="bg-emerald-50"
          textColor="text-emerald-700"
          iconBg="bg-emerald-100"
        />

        <StatCard
          label="Hôm nay"
          value={dashboard.todayTasks}
          icon={<CalendarDays size={20} />}
          color="bg-amber-50"
          textColor="text-amber-700"
          iconBg="bg-amber-100"
        />

        <StatCard
          label="Tiến độ"
          value={`${progress}%`}
          progress={progress}
          icon={<TrendingUp size={20} />}
          color="bg-violet-50"
          textColor="text-violet-700"
          iconBg="bg-violet-100"
        />
      </div>

      <SmartRecommendationPanel smart={smart} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">

          <SectionCard
            title="Công việc gần đây"
            action={
              <Link
                to="/tasks"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Xem tất cả
              </Link>
            }
          >
            {!Array.isArray(latestTasks) ||
            latestTasks.length === 0 ? (
              <EmptyText text="Không có công việc nào" />
            ) : (
              <div className="divide-y divide-gray-100">
                {latestTasks.map((task) => {
                  const dl = deadlineLabel(task.deadline);

                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <button
                        onClick={() =>
                          toggleTask(task)
                        }
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                          task.status === "done"
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300 hover:border-blue-500"
                        }`}
                      >
                        {task.status === "done" && (
                          <CheckCircle2
                            size={15}
                            className="text-white"
                          />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            task.status === "done"
                              ? "text-gray-400 line-through"
                              : "text-gray-800"
                          }`}
                        >
                          {task.title}
                        </p>

                        {dl && (
                          <p
                            className={`mt-1 text-xs ${
                              dl.overdue
                                ? "text-red-500"
                                : "text-gray-500"
                            }`}
                          >
                            {dl.text}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={`Công việc ngày ${formatDate(date)}`}
          >
            {!Array.isArray(selectedTasks) ||
            selectedTasks.length === 0 ? (
              <EmptyText text="Không có công việc trong ngày này" />
            ) : (
              <div className="space-y-2">
                {selectedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        task.status === "done"
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                      }`}
                    />

                    <span
                      className={`truncate text-sm ${
                        task.status === "done"
                          ? "text-gray-400 line-through"
                          : "text-gray-700"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Lịch">
            <Calendar
              value={date}
              onChange={handleDateChange}
              className="w-full rounded-xl border-0 text-sm"
              tileContent={({ date: d }) => {
                const hasTask =
                  Array.isArray(tasks) &&
                  tasks.some(
                    (task) =>
                      task.deadline &&
                      new Date(
                        task.deadline
                      ).toDateString() ===
                        d.toDateString()
                  );

                return hasTask ? (
                  <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-red-400" />
                ) : null;
              }}
            />
          </SectionCard>

          <SectionCard title="Kế hoạch học AI">
            <button
              onClick={fetchAI}
              disabled={loadingAI}
              className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={17} />

              {loadingAI
                ? "Đang tạo..."
                : "Tạo kế hoạch"}
            </button>

            {ai ? (
              <div className="rounded-xl bg-violet-50 p-3 text-sm leading-relaxed text-gray-700">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                >
                  {ai}
                </ReactMarkdown>
              </div>
            ) : (
              <EmptyText text="Chưa có kế hoạch AI" />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function SmartRecommendationPanel({ smart }) {
  const actions = Array.isArray(smart?.actions) ? smart.actions : [];
  const priorityTasks = Array.isArray(smart?.priorityTasks)
    ? smart.priorityTasks
    : [];
  const weakSubjects = Array.isArray(smart?.weakSubjects)
    ? smart.weakSubjects
    : [];
  const overloadedDays = Array.isArray(smart?.overloadedDays)
    ? smart.overloadedDays
    : [];

  const levelClass = {
    danger: "border-red-100 bg-red-50 text-red-700",
    warning: "border-amber-100 bg-amber-50 text-amber-700",
    info: "border-blue-100 bg-blue-50 text-blue-700",
    success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };

  return (
    <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <Brain size={21} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Gợi ý thông minh hôm nay
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Hệ thống tự phân tích hạn, độ ưu tiên, tiến độ môn học và tải lịch.
            </p>
          </div>
        </div>

        {smart?.summary && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
              {smart.summary.pendingTasks || 0} việc chưa xong
            </span>
            <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-600">
              {smart.summary.overdueTasks || 0} quá hạn
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-600">
              {smart.summary.todayTasks || 0} hôm nay
            </span>
          </div>
        )}
      </div>

      {!smart ? (
        <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-400">
          Chưa có dữ liệu phân tích thông minh.
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
          <div className="space-y-3">
            {actions.slice(0, 3).map((action, index) => (
              <div
                key={`${action.title}-${index}`}
                className={`rounded-xl border px-4 py-3 ${
                  levelClass[action.level] || levelClass.info
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{action.title}</p>
                    <p className="mt-1 text-xs leading-relaxed opacity-85">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {weakSubjects.length > 0 && (
              <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-700">
                  <Target size={16} />
                  Môn cần ưu tiên cải thiện
                </p>
                <div className="space-y-2">
                  {weakSubjects.map((subject) => (
                    <div key={subject.id}>
                      <div className="mb-1 flex justify-between text-xs text-violet-700">
                        <span>{subject.name}</span>
                        <span>{subject.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${subject.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                Việc nên làm trước
              </p>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-500">
                Theo điểm ưu tiên
              </span>
            </div>

            {priorityTasks.length === 0 ? (
              <p className="text-sm text-gray-400">
                Chưa có công việc cần ưu tiên.
              </p>
            ) : (
              <div className="space-y-2">
                {priorityTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl bg-white px-3 py-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {task.deadlineLabel}
                          {task.subject ? ` · ${task.subject}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                        {task.score}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Lý do: {task.reasons?.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {overloadedDays.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {overloadedDays[0].message}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  progress,
  icon,
  color,
  textColor,
  iconBg,
}) {
  return (
    <div
      className={`${color} rounded-2xl border border-white/70 p-4 shadow-sm`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl ${iconBg} ${textColor}`}
        >
          {icon}
        </div>
      </div>

      <p
        className={`text-2xl font-semibold ${textColor}`}
      >
        {value ?? 0}
      </p>

      <p className="mt-1 text-xs font-medium text-gray-500">
        {label}
      </p>

      {progress !== undefined && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

function SectionCard({
  title,
  action,
  children,
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-800">
          {title}
        </h2>

        {action}
      </div>

      {children}
    </section>
  );
}

function EmptyText({ text }) {
  return (
    <p className="text-sm text-gray-400">
      {text}
    </p>
  );
}

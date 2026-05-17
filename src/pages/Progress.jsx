import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Loader2,
  Target,
  TrendingUp,
} from "lucide-react";
import api from "../api/axios";

const SUBJECT_COLORS = [
  { bar: "#378ADD", light: "#E6F1FB" },
  { bar: "#1D9E75", light: "#E1F5EE" },
  { bar: "#EF9F27", light: "#FAEEDA" },
  { bar: "#7F77DD", light: "#EEEDFE" },
  { bar: "#E24B4A", light: "#FCEBEB" },
  { bar: "#D85A30", light: "#FAECE7" },
];

const RANGE_OPTIONS = [
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
  { key: "year", label: "Năm nay" },
];

const EXPORT_FILE_NAMES = {
  week: "bao-cao-tien-do-tuan-nay.csv",
  month: "bao-cao-tien-do-thang-nay.csv",
  year: "bao-cao-tien-do-nam-nay.csv",
};

export default function Progress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");
  const [openRange, setOpenRange] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/progress?range=${range}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const handleExport = async () => {
    try {
      setExporting(true);

      const res = await api.get(`/dashboard/progress/export?range=${range}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");

      link.href = url;
      link.download = EXPORT_FILE_NAMES[range] || "bao-cao-tien-do.csv";

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Xuất dữ liệu thất bại");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB]">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          Đang tải...
        </div>
      </div>
    );
  }

  const {
    overallProgress = 0,
    totalStudyTime = "0 giờ 0 phút",
    studyTimeChange = "+0h",
    tasksCompleted = 0,
    tasksTotal = 0,
    subjectsMastered = 0,
    subjectsTotal = 0,
    subjects = [],
    studyHours = [],
    achievements = [],
    performance = {},
  } = data || {};

  const maxHour = Math.max(...studyHours.map((item) => item.hours), 1);
  const taskPercent =
    tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-5 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tiến độ</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi tiến độ học tập, thời gian học và hiệu suất
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenRange((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300"
            >
              <Calendar size={16} />
              {RANGE_OPTIONS.find((item) => item.key === range)?.label}
              <ChevronDown size={15} />
            </button>

            {openRange && (
              <div className="absolute right-0 top-12 z-50 w-40 overflow-hidden rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
                {RANGE_OPTIONS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setRange(item.key);
                      setOpenRange(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      range === item.key
                        ? "bg-blue-50 font-medium text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exporting ? "Đang xuất..." : "Xuất dữ liệu"}
          </button>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Tiến độ tổng quan"
          value={`${overallProgress}%`}
          sub="+12% so với tháng trước"
          subColor="text-emerald-600"
          icon={<TrendingUp size={20} />}
          color="bg-blue-50"
          textColor="text-blue-700"
          iconBg="bg-blue-100"
          progress={overallProgress}
          progressColor="bg-blue-500"
        />

        <StatCard
          label="Tổng thời gian học"
          value={totalStudyTime}
          sub={`${studyTimeChange} trong tuần này`}
          subColor="text-emerald-600"
          icon={<Clock3 size={20} />}
          color="bg-emerald-50"
          textColor="text-emerald-700"
          iconBg="bg-emerald-100"
        />

        <StatCard
          label="Công việc hoàn thành"
          value={`${tasksCompleted} / ${tasksTotal}`}
          sub={`${taskPercent}% hoàn thành`}
          subColor="text-gray-500"
          icon={<CheckCircle2 size={20} />}
          color="bg-amber-50"
          textColor="text-amber-700"
          iconBg="bg-amber-100"
        />

        <StatCard
          label="Môn đã nắm vững"
          value={`${subjectsMastered} / ${subjectsTotal}`}
          sub={`Còn ${Math.max(subjectsTotal - subjectsMastered, 0)} môn`}
          subColor="text-violet-600"
          icon={<Target size={20} />}
          color="bg-violet-50"
          textColor="text-violet-700"
          iconBg="bg-violet-100"
        />
      </motion.div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Tiến độ theo môn" icon={<BarChart3 size={18} />}>
          {subjects.length === 0 ? (
            <EmptyText text="Chưa có dữ liệu" />
          ) : (
            <div className="space-y-4">
              {subjects.map((subject, index) => {
                const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];

                return (
                  <div key={subject.name}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {subject.name}
                      </span>
                      <span className="font-semibold text-gray-500">
                        {subject.percent}%
                      </span>
                    </div>

                    <div
                      className="h-2.5 overflow-hidden rounded-full"
                      style={{ backgroundColor: color.light }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${subject.percent}%`,
                          backgroundColor: color.bar,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Giờ học trong 7 ngày gần nhất" icon={<Clock3 size={18} />}>
          {studyHours.length === 0 ? (
            <EmptyText text="Chưa có dữ liệu" />
          ) : (
            <div className="flex h-48 items-end gap-3">
              {studyHours.map((day, index) => {
                const isMax = day.hours === maxHour;

                return (
                  <div
                    key={index}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-medium text-gray-400">
                      {day.hours}h
                    </span>

                    <div className="flex h-36 w-full items-end rounded-xl bg-gray-50 px-1.5">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-700 ${
                          isMax ? "bg-blue-500" : "bg-blue-200"
                        }`}
                        style={{
                          height: `${Math.max((day.hours / maxHour) * 100, 6)}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs text-gray-400">{day.day}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Thành tích" icon={<Award size={18} />}>
          {achievements.length === 0 ? (
            <EmptyText text="Chưa có thành tích" />
          ) : (
            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {achievement.icon} {achievement.label}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      achievement.done
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-white text-gray-500"
                    }`}
                  >
                    {achievement.done ? "Hoàn thành" : achievement.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Tổng quan hiệu suất" icon={<TrendingUp size={18} />}>
          <div className="space-y-4">
            <PerfRow
              label="Hoàn thành"
              value={performance.completed}
              color="#1D9E75"
            />
            <PerfRow
              label="Đang làm"
              value={performance.inProgress}
              color="#EF9F27"
            />
            <PerfRow
              label="Chưa làm"
              value={performance.pending}
              color="#E24B4A"
            />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 text-gray-400">
              <TrendingUp size={16} />
              <span className="text-sm">Điểm trung bình</span>
            </div>

            <span className="text-3xl font-semibold text-gray-900">
              {performance.averageScore ?? 0}%
            </span>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  subColor,
  children,
  icon,
  color,
  textColor,
  iconBg,
  progress,
  progressColor,
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`${color} rounded-2xl border border-white/70 p-4 shadow-sm`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl ${iconBg} ${textColor}`}
        >
          {icon}
        </div>
      </div>

      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${textColor}`}>{value}</p>

      {sub && <p className={`mt-1 text-xs ${subColor}`}>{sub}</p>}

      {progress !== undefined && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {children}
    </motion.div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>

      {children}
    </motion.section>
  );
}

function EmptyText({ text }) {
  return <p className="text-sm text-gray-400">{text}</p>;
}

function PerfRow({ label, value, color }) {
  if (!value) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>

        <span className="text-sm font-semibold text-gray-700">
          {value.count} ({value.percent}%)
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value.percent}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

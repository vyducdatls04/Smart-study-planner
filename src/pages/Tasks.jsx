import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api/axios";
import Swal from "sweetalert2";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";

const PRIORITY_CONFIG = {
  high: { label: "Cao", color: "#E24B4A", bg: "#FCEBEB", text: "#791F1F" },
  medium: { label: "Trung bình", color: "#EF9F27", bg: "#FAEEDA", text: "#633806" },
  low: { label: "Thấp", color: "#1D9E75", bg: "#E1F5EE", text: "#085041" },
};

const getTodayStr = () => new Date().toISOString().split("T")[0];

const getDeadlineLabel = (deadline) => {
  if (!deadline) return null;
  const diff = Math.round((new Date(deadline) - new Date(getTodayStr())) / 86400000);
  if (diff < 0) return { text: `Quá hạn ${Math.abs(diff)} ngày`, overdue: true };
  if (diff === 0) return { text: "Hôm nay", overdue: false };
  return { text: `Còn ${diff} ngày`, overdue: false };
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    deadline: getTodayStr(),
    priority: "medium",
    subject_id: "",
  });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/tasks");
      setTasks(res.data || []);
    } catch (err) {
      console.error("Lỗi tải công việc:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get("/subjects");
        setSubjects(res.data || []);
      } catch (err) {
        console.error("Lỗi tải môn học:", err);
      }
    };

    fetchSubjects();
  }, []);

  const toggleStatus = useCallback(async (task) => {
    try {
      await api.put(`/tasks/${task.id}`, {
        ...task,
        status: task.status === "done" ? "pending" : "done",
      });
      fetchTasks();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id) => {
    const result = await Swal.fire({
      title: 'Xóa công việc?',
      text: "Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/tasks/${id}`);
        fetchTasks();
        Swal.fire({ icon: 'success', title: 'Đã xóa!', timer: 800, showConfirmButton: false });
      } catch (err) {
        console.error("Lỗi xóa công việc:", err);
        Swal.fire({ icon: 'error', title: 'Lỗi khi xóa' });
      }
    }
  }, [fetchTasks]);

  const addTask = async () => {
    if (!form.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Thông báo', text: 'Vui lòng nhập tên công việc!' });
      return;
    }

    if (!form.subject_id) {
      Swal.fire({ icon: 'warning', title: 'Thông báo', text: 'Vui lòng chọn môn học!' });
      return;
    }

    try {
      await api.post("/tasks", { ...form, status: "pending" });
      setForm({ title: "", deadline: getTodayStr(), priority: "medium", subject_id: "" });
      setShowForm(false);
      fetchTasks();
      Swal.fire({ icon: 'success', title: 'Thành công', timer: 1000, showConfirmButton: false });
    } catch (err) {
      console.error("Lỗi thêm công việc:", err);
      Swal.fire({ icon: 'error', title: 'Lỗi khi thêm' });
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, progress };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  }, [filter, tasks]);

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-5 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Công việc</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý công việc và tiến độ học tập</p>
        </div>
        <button onClick={() => setShowForm((prev) => !prev)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition">
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Đóng" : "Thêm công việc"}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tổng công việc" value={stats.total} icon={<ClipboardList size={20} />} color="bg-blue-50" textColor="text-blue-700" iconBg="bg-blue-100" />
        <StatCard label="Hoàn thành" value={stats.done} icon={<CheckCircle2 size={20} />} color="bg-emerald-50" textColor="text-emerald-700" iconBg="bg-emerald-100" />
        <StatCard label="Tiến độ" value={`${stats.progress}%`} icon={<Target size={20} />} color="bg-violet-50" textColor="text-violet-700" iconBg="bg-violet-100" progress={stats.progress} />
      </div>

      <AnimatePresence>
        {showForm && (
        <motion.section
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_190px_180px_170px_auto]">
            <input type="text" placeholder="Tên công việc..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addTask()} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-400 transition" />
            <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none">
              <option value="">Chọn môn học</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-400 transition" />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none">
              <option value="high">Cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
            <button onClick={addTask} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700"><Check size={17} /> Lưu</button>
          </div>
        </motion.section>
        )}
      </AnimatePresence>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Danh sách công việc</h2>
          <div className="flex rounded-xl bg-gray-100 p-1">
            {["all", "pending", "done"].map((k) => (
              <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${filter === k ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>
                {k === "all" ? "Tất cả" : k === "pending" ? "Đang làm" : "Xong"}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400"><Loader2 size={18} className="animate-spin" />Đang tải...</div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
               <div className="py-12 text-center text-sm text-gray-400 border border-dashed rounded-2xl">Trống</div>
            ) : (
              <AnimatePresence initial={false}>
                {filteredTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={toggleStatus} onDelete={deleteTask} />
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }) {
  const dl = getDeadlineLabel(task.deadline);
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: task.status === "done" ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:bg-white hover:shadow-sm"
    >
      <button onClick={() => onToggle(task)} className={`grid h-8 w-8 place-items-center rounded-full border-2 transition ${task.status === "done" ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 text-gray-300"}`}>
        {task.status === "done" ? <Check size={16} /> : <Circle size={16} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${task.status === "done" ? "text-gray-400 line-through" : "text-gray-800"}`}>{task.title}</p>
        <div className="mt-1 flex gap-2">
          {dl && <span className={`text-xs inline-flex items-center gap-1 ${dl.overdue ? "text-red-600" : "text-gray-500"}`}><CalendarDays size={13} /> {dl.text}</span>}
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: priority.bg, color: priority.text }}>{priority.label}</span>
        </div>
      </div>
      <button onClick={() => onDelete(task.id)} className="text-gray-300 hover:text-red-500 sm:opacity-0 group-hover:opacity-100 transition"><Trash2 size={16} /></button>
    </motion.div>
  );
}

function StatCard({ label, value, icon, color, textColor, iconBg, progress }) {
  return (
    <div className={`${color} rounded-2xl border border-white/70 p-4 shadow-sm`}>
      <div className={`grid h-10 w-10 place-items-center rounded-xl mb-4 ${iconBg} ${textColor}`}>{icon}</div>
      <p className={`text-2xl font-semibold ${textColor}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
      {progress !== undefined && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
          <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Swal from "sweetalert2";
import {
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

// Đưa các hàm helper ra ngoài để tránh bị khởi tạo lại gây lỗi dependency
const getTodayStr = () => new Date().toISOString().split("T")[0];

const formatDate = (value) => {
  if (!value) return "Chưa có hạn";
  return new Date(value).toLocaleDateString("vi-VN");
};

const getDueInfo = (due) => {
  if (!due) return { text: "Không deadline", color: "bg-gray-100 text-gray-500" };
  const diff = Math.round((new Date(due) - new Date(getTodayStr())) / 86400000);
  if (diff < 0) return { text: `Quá hạn ${Math.abs(diff)} ngày`, color: "bg-red-50 text-red-600" };
  if (diff === 0) return { text: "Hôm nay", color: "bg-amber-50 text-amber-600" };
  return { text: `Còn ${diff} ngày`, color: "bg-emerald-50 text-emerald-600" };
};

export default function StudyPlans() {
  const [plans, setPlans] = useState([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(getTodayStr());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Bọc useCallback để useEffect không bị lặp vô tận
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/plans");
      setPlans(res.data || []);
    } catch (err) {
      console.error("Lỗi tải kế hoạch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Dùng useMemo để tối ưu việc sắp xếp, tránh lỗi lặp
  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due) - new Date(b.due);
    });
  }, [plans]);

  // Tính toán stats một cách an toàn
  const stats = useMemo(() => {
    const todayStr = getTodayStr();
    const overdue = plans.filter((plan) => plan.due && new Date(plan.due) < new Date(todayStr)).length;
    const nextPlan = sortedPlans.find((plan) => plan.due && new Date(plan.due) >= new Date(todayStr));
    return { total: plans.length, overdue, nextPlan };
  }, [plans, sortedPlans]);

  const createPlan = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng nhập tiêu đề!', confirmButtonColor: '#2563eb' });
      return;
    }
    try {
      setSaving(true);
      await api.post("/plans", { title: trimmedTitle, due: due || null });
      setTitle("");
      setDue(getTodayStr());
      setShowForm(false);
      fetchPlans();
      Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã thêm kế hoạch!', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error("Lỗi tạo kế hoạch:", err);
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể thêm kế hoạch!' });
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: "Dữ liệu sẽ bị xóa vĩnh viễn!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/plans/${id}`);
        fetchPlans();
        Swal.fire({ icon: 'success', title: 'Đã xóa!', timer: 1000, showConfirmButton: false });
      } catch (err) {
      console.error("Lỗi xóa kế hoạch:", err);
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể xóa!' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-5 py-6 lg:px-8">
      <div className="mb-6 rounded-3xl bg-[#DCEEFF] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-blue-700">Lịch học</p>
            <h1 className="text-2xl font-semibold text-gray-900">Kế hoạch học</h1>
            <p className="mt-1 text-sm text-gray-600">Theo dõi kế hoạch học tập theo dòng thời gian</p>
          </div>
          <button onClick={() => setShowForm((prev) => !prev)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? "Đóng" : "Thêm kế hoạch"}
          </button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/75 p-4">
            <p className="text-xs font-medium text-gray-500">Tổng kế hoạch</p>
            <p className="mt-1 truncate text-lg font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-white/75 p-4">
            <p className="text-xs font-medium text-gray-500">Quá hạn</p>
            <p className="mt-1 truncate text-lg font-semibold text-gray-900">{stats.overdue}</p>
          </div>
          <div className="rounded-2xl bg-white/75 p-4">
            <p className="text-xs font-medium text-gray-500">Gần nhất</p>
            <p className="mt-1 truncate text-lg font-semibold text-gray-900">{stats.nextPlan ? formatDate(stats.nextPlan.due) : "---"}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_190px_auto]">
            <input type="text" value={title} placeholder="Nhập kế hoạch..." onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createPlan()} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-400 focus:bg-white transition" />
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-400 transition" />
            <button onClick={createPlan} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
              {saving ? "Lưu..." : "Lưu"}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays size={18} /></div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Dòng thời gian kế hoạch</h2>
            <p className="text-xs text-gray-400">Sắp xếp theo thứ tự thời gian</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400"><Loader2 size={18} className="animate-spin" />Đang tải...</div>
        ) : sortedPlans.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 border border-dashed rounded-2xl">Chưa có dữ liệu kế hoạch</div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-blue-100" />
            <div className="space-y-4">
              {sortedPlans.map((plan) => (
                <TimelineItem key={plan.id} plan={plan} onDelete={deletePlan} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function TimelineItem({ plan, onDelete }) {
  const info = getDueInfo(plan.due);
  return (
    <div className="relative flex gap-4 pl-10">
      <div className="absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white ring-4 ring-white"><Clock3 size={15} /></div>
      <div className="group flex flex-1 items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:bg-white hover:shadow-sm">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-800">{plan.title}</h3>
          <p className="mt-1 text-xs text-gray-400">Hạn: {formatDate(plan.due)}</p>
          <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${info.color}`}>{info.text}</span>
        </div>
        <button onClick={() => onDelete(plan.id)} className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-500"><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";

import Swal from "sweetalert2";

import {
  BookOpen,
  Check,
  Edit3,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const COLORS = [
  "#E24B4A",
  "#EF9F27",
  "#639922",
  "#1D9E75",
  "#378ADD",
  "#7F77DD",
  "#D4537E",
  "#888780",
];

const DEFAULT_COLOR = "#378ADD";

export default function Subjects() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);

  const [name, setName] = useState("");

  const [color, setColor] = useState(DEFAULT_COLOR);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get("/subjects");

      setSubjects(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách môn học:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const cancelEdit = useCallback(() => {
    setName("");
    setColor(DEFAULT_COLOR);
    setEditingId(null);
  }, []);

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    try {
      if (editingId) {
        await api.put(`/subjects/${editingId}`, {
          name: trimmedName,
          color,
        });

        Swal.fire({
          icon: "success",
          title: "Đã cập nhật",
          timer: 1000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      } else {
        await api.post("/subjects", {
          name: trimmedName,
          color,
        });

        Swal.fire({
          icon: "success",
          title: "Đã thêm môn học",
          timer: 1000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }

      cancelEdit();

      fetchSubjects();
    } catch (err) {
      console.error(err);

      Swal.fire(
        "Lỗi",
        "Không thể lưu thay đổi",
        "error"
      );
    }
  };

  const handleEdit = (subject) => {
    setName(subject.name);

    setColor(subject.color || DEFAULT_COLOR);

    setEditingId(subject.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Xóa môn học này?",
      text: "Dữ liệu liên quan sẽ bị xóa vĩnh viễn!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Đồng ý xóa",
      cancelButtonText: "Hủy",
      borderRadius: "16px",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await api.delete(`/subjects/${id}`);

        fetchSubjects();

        Swal.fire({
          icon: "success",
          title: "Đã xóa!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error(err);

        Swal.fire(
          "Lỗi",
          "Không thể xóa môn học",
          "error"
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-5 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Môn học
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Quản lý môn học và màu nhận diện
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-100 bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
          <BookOpen size={14} />
          {subjects.length} môn
        </span>
      </div>

      <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all focus-within:shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              {editingId
                ? "Chỉnh sửa môn học"
                : "Thêm môn học mới"}
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Chọn tên môn và màu để dễ nhận biết trong task và kế hoạch học.
            </p>
          </div>

          {editingId && (
            <button
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
            >
              <X size={14} />
              Hủy chỉnh sửa
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <input
            type="text"
            placeholder="Tên môn học..."
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              handleSubmit()
            }
            className="h-12 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />

          <div className="flex flex-wrap items-center gap-2 px-2">
            {COLORS.map((itemColor) => (
              <button
                key={itemColor}
                type="button"
                onClick={() =>
                  setColor(itemColor)
                }
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  color === itemColor
                    ? "scale-110 ring-2 ring-blue-400 ring-offset-2"
                    : "hover:scale-105"
                }`}
                style={{
                  backgroundColor: itemColor,
                }}
              >
                {color === itemColor && (
                  <Check
                    size={14}
                    className="text-white"
                  />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${
              editingId
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {editingId ? (
              <Check size={18} />
            ) : (
              <Plus size={18} />
            )}

            {editingId
              ? "Cập nhật"
              : "Thêm môn"}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2
            size={32}
            className="mb-3 animate-spin text-blue-500"
          />

          <p className="text-sm">
            Đang tải dữ liệu...
          </p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gray-50 text-gray-300">
            <BookOpen size={28} />
          </div>

          <p className="text-sm italic text-gray-500">
            Chưa có môn học nào được tạo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={(id) =>
                navigate(`/subjects/${id}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectCard({
  subject,
  onEdit,
  onDelete,
  onView,
}) {
  const subjectColor =
    subject.color || DEFAULT_COLOR;

  return (
    <div
      onClick={() => onView(subject.id)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg"
    >
      <div
        className="absolute left-0 top-0 h-full w-1.5 transition-all duration-200 group-hover:w-2"
        style={{
          backgroundColor: subjectColor,
        }}
      />

      <div className="flex items-center justify-between gap-3 pl-1">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl text-lg font-bold text-white shadow-inner transition-transform duration-200 group-hover:scale-105"
            style={{
              backgroundColor: subjectColor,
            }}
          >
            {subject.name
              ?.charAt(0)
              ?.toUpperCase() || "?"}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-800">
              {subject.name}
            </p>

            <p className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-gray-400">
              {subjectColor}
            </p>

            <p className="mt-1 max-h-0 overflow-hidden text-xs text-gray-400 opacity-0 transition-all duration-200 group-hover:max-h-5 group-hover:opacity-100">
              Bấm để xem chi tiết môn học
            </p>
          </div>
        </div>

        <div className="flex translate-x-1 items-center gap-1 opacity-100 transition-all duration-200 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();

              onEdit(subject);
            }}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit3 size={16} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();

              onDelete(subject.id);
            }}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
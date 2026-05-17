import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/axios";

export default function SubjectDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [subject, setSubject] =
    useState(null);

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // lấy subject
      const subjectRes =
        await api.get(`/subjects/${id}`);

      // lấy tasks
      const taskRes =
        await api.get("/tasks");

      // lọc task theo subject
      const filteredTasks =
        (taskRes.data || []).filter(
          (task) =>
            String(task.subject_id) ===
            String(id)
        );

      setSubject(subjectRes.data);

      setTasks(filteredTasks);
    } catch (err) {
      console.error(
        "Lỗi lấy dữ liệu:",
        err
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB]">
        <p className="text-gray-500">
          Đang tải dữ liệu...
        </p>
      </div>
    );
  }

  // không tìm thấy
  if (!subject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB]">
        <p className="text-red-500">
          Không tìm thấy môn học.
        </p>
      </div>
    );
  }

  // task completed
  const completedTasks =
    tasks.filter(
      (task) => task.completed
    ).length;

  // deadline gần nhất
  const nearestDeadline =
    tasks
      .filter((task) => task.deadline)
      .sort(
        (a, b) =>
          new Date(a.deadline) -
          new Date(b.deadline)
      )[0]?.deadline || "Không có";

  return (
    <div className="min-h-screen bg-[#F5F7FB] p-6">
      {/* back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-5 rounded-xl bg-white px-4 py-2 shadow transition hover:bg-gray-100"
      >
        ← Quay lại
      </button>

      {/* subject info */}
      <div
        className="mb-6 rounded-3xl p-6 text-white shadow-lg"
        style={{
          background:
            subject.color ||
            "#378ADD",
        }}
      >
        <h1 className="mb-2 text-3xl font-bold">
          {subject.name}
        </h1>

        <div className="space-y-1 text-sm">
          <p>
            Tổng task: {tasks.length}
          </p>

          <p>
            Đã hoàn thành:{" "}
            {completedTasks}
          </p>

          <p>
            Hạn gần nhất:{" "}
            {nearestDeadline}
          </p>
        </div>
      </div>

      {/* tasks */}
      <div className="rounded-3xl bg-white p-6 shadow">
        <h2 className="mb-5 text-2xl font-bold text-gray-800">
          Công việc của môn học
        </h2>

        {tasks.length === 0 ? (
          <p className="text-gray-500">
            Chưa có task nào.
          </p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-gray-100 p-4 transition hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {task.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {task.description ||
                        "Không có mô tả"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {task.deadline ||
                        "Không có deadline"}
                    </p>

                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium text-white ${
                        task.completed
                          ? "bg-green-500"
                          : "bg-orange-500"
                      }`}
                    >
                      {task.completed
                        ? "Hoàn thành"
                        : "Chưa hoàn thành"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

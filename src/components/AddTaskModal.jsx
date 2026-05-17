import { useEffect, useState } from "react";
import api from "../api/axios";

export default function AddTaskModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subjectId, setSubjectId] = useState("");
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/subjects");
      setSubjects(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async () => {
    if (!title || !deadline || !subjectId) {
      alert("Vui lòng nhập đầy đủ!");
      return;
    }

    try {
      await api.post("/tasks", {
        title,
        deadline,
        priority,
        subject_id: subjectId,
      });

      // reset form
      setTitle("");
      setDeadline("");
      setPriority("medium");
      setSubjectId("");

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-[400px] p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          ➕ Thêm công việc mới
        </h2>

        <input
          placeholder="Tên công việc"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-xl"
        />

        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-xl"
        >
          <option value="">-- Chọn môn học --</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-xl"
        >
          <option value="low">Thấp</option>
          <option value="medium">Trung bình</option>
          <option value="high">Cao</option>
        </select>

        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-xl"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-xl">
            Hủy
          </button>

          <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 text-white rounded-xl">
            Thêm công việc
          </button>
        </div>
      </div>
    </div>
  );
}

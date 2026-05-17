import { useState } from "react";
import api from "../api/axios";

export default function AddPlanModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title || !due) {
      alert("Nhập đầy đủ thông tin");
      return;
    }

    try {
      setLoading(true);

      await api.post("/plans", {
        title,
        due,
      });

      onSuccess(); // reload list
      onClose();   // đóng modal

    } catch (err) {
      console.error(err);
      alert("Tạo kế hoạch thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[350px] shadow">

        <h2 className="text-lg font-semibold mb-4">Thêm kế hoạch học</h2>

        <input
          placeholder="Tên kế hoạch"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-lg"
        />

        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-lg"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-gray-500"
          >
            Hủy
          </button>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-1 rounded-lg"
          >
            {loading ? "Đang tạo..." : "Tạo"}
          </button>
        </div>
      </div>
    </div>
  );
}

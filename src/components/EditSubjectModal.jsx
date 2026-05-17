import { useState } from "react";
import api from "../api/axios";

export default function EditSubjectModal({ data, onClose, onSuccess }) {
  const [name, setName] = useState(data.name);

  const handleUpdate = async () => {
    if (!name) return alert("Nhập tên");

    try {
      await api.put(`/subjects/${data.id}`, { name });

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-2xl w-[350px]">
        <h2 className="text-lg font-semibold mb-4">Chỉnh sửa môn học</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-xl"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Hủy</button>
          <button
            onClick={handleUpdate}
            className="bg-green-500 text-white px-4 py-2 rounded-xl"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

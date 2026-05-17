import { useState } from "react";
import api from "../api/axios";

export default function AddSubjectModal({ onClose, onSuccess }) {
  const [name, setName] = useState("");

  const handleAdd = async () => {
    if (!name) return alert("Nhập tên môn học");

    try {
      await api.post("/subjects", { name });

      setName("");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-2xl w-[350px]">
        <h2 className="text-lg font-semibold mb-4">Thêm môn học</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên môn học"
          className="w-full mb-4 px-3 py-2 border rounded-xl"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Hủy</button>
          <button
            onClick={handleAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl"
          >
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
}

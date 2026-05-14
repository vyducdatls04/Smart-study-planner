import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { useState } from "react";
import api from "../api/axios";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Vui lòng nhập đầy đủ mật khẩu");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/reset-password", {
        token,
        password,
      });

      setSuccess(res.data?.message || "Đặt lại mật khẩu thành công");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB] px-5">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Đặt lại mật khẩu</h1>
        <p className="mb-6 text-sm text-gray-500">Nhập mật khẩu mới cho tài khoản của bạn.</p>

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Mật khẩu mới"
            onEnter={handleSubmit}
          />
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Xác nhận mật khẩu mới"
            onEnter={handleSubmit}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
        </button>

        <p className="mt-5 text-center text-sm text-gray-500">
          Quay lại{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, onEnter }) {
  return (
    <div className="relative">
      <Lock
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="password"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

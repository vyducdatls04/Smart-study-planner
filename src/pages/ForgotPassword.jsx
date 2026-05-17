import { Link } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devLink, setDevLink] = useState("");

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    setDevLink("");

    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setMessage(res.data?.message || "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.");
      if (res.data?.resetLink) setDevLink(res.data.resetLink);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi yêu cầu reset mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB] px-5">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Quên mật khẩu</h1>

        <p className="mb-6 text-sm text-gray-500">
          Nhập email để nhận liên kết đặt lại mật khẩu.
        </p>

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {devLink && (
          <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Liên kết đặt lại mật khẩu khi phát triển: <a className="font-medium underline" href={devLink}>{devLink}</a>
          </div>
        )}

        <div className="relative">
          <Mail
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? "Đang gửi..." : "Gửi yêu cầu"}
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

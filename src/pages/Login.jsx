import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import { Loader2, Lock, Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email: email.trim(),
        password: password.trim(),
      });

      if (!res.data?.token || !res.data?.user) {
        setError("Dữ liệu backend không đúng format");
        return;
      }

      login({
        token: res.data.token,
        user: res.data.user,
      });

      navigate("/");
    } catch (err) {
      console.error("LOGIN ERROR:", err.response?.data || err.message);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Lỗi server";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F7FB]">
        <Loader2 size={22} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] lg:grid lg:grid-cols-2">
      <div className="hidden bg-[#A8D5D0] px-10 lg:flex lg:flex-col lg:items-center lg:justify-center">
        <img src={logo} alt="logo" className="w-80 max-w-full object-contain xl:w-96" />
      </div>

      <div className="flex min-h-screen items-center justify-center px-5 py-8">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-sm sm:p-8">
          <div className="mb-7 flex justify-center lg:hidden">
            <img src={logo} alt="logo" className="w-48 max-w-full object-contain" />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Đăng nhập</h2>
            <p className="mt-1 text-sm text-gray-500">Chào mừng bạn quay lại</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <InputWithIcon
              icon={<Mail size={18} />}
              type="email"
              placeholder="Email"
              value={email}
              onChange={setEmail}
              onEnter={handleLogin}
            />

            <InputWithIcon
              icon={<Lock size={18} />}
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={setPassword}
              onEnter={handleLogin}
            />
          </div>

          <div className="mt-3 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <p className="mt-5 text-center text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function InputWithIcon({ icon, type, placeholder, value, onChange, onEnter }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}


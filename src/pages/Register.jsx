import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import api from "../api/axios";
import { Loader2, Lock, Mail, User } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password.trim();

    if (!name || !email || !password || !form.confirmPassword.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== form.confirmPassword.trim()) {
      setError("Mật khẩu không khớp");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      setSuccess("Đăng ký thành công! Đang chuyển sang đăng nhập...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err?.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] lg:grid lg:grid-cols-2">
      <div className="hidden bg-[#CFE8B4] px-10 lg:flex lg:flex-col lg:items-center lg:justify-center">
        <img
          src={logo}
          alt="Smart Study"
          className="w-80 max-w-full object-contain xl:w-96"
        />
      </div>

      <div className="flex min-h-screen items-center justify-center px-5 py-8">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-sm sm:p-8">
          <div className="mb-7 flex justify-center lg:hidden">
            <img
              src={logo}
              alt="Smart Study"
              className="w-48 max-w-full object-contain"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Đăng ký</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tạo tài khoản để bắt đầu học tập
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <InputWithIcon
              icon={<User size={18} />}
              name="name"
              type="text"
              placeholder="Tên"
              value={form.name}
              onChange={handleChange}
            />

            <InputWithIcon
              icon={<Mail size={18} />}
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />

            <InputWithIcon
              icon={<Lock size={18} />}
              name="password"
              type="password"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={handleChange}
              onEnter={handleRegister}
            />

            <InputWithIcon
              icon={<Lock size={18} />}
              name="confirmPassword"
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={form.confirmPassword}
              onChange={handleChange}
              onEnter={handleRegister}
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>

          <p className="mt-5 text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function InputWithIcon({
  icon,
  name,
  type,
  placeholder,
  value,
  onChange,
  onEnter,
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

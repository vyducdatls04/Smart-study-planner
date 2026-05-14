import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] =
    useState("");

  const handleSubmit = () => {
    if (!email.trim()) {
      alert("Vui lòng nhập email");
      return;
    }

    alert(
      "Tính năng reset password sẽ sớm được cập nhật"
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB] px-5">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          Quên mật khẩu
        </h1>

        <p className="mb-6 text-sm text-gray-500">
          Nhập email để nhận liên kết đặt lại mật khẩu
        </p>

        <div className="relative">
          <Mail
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="mt-5 h-12 w-full rounded-xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Gửi yêu cầu
        </button>

        <p className="mt-5 text-center text-sm text-gray-500">
          Quay lại{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
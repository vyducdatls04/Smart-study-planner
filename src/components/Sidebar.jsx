import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../context/useAuth";
import {
  X, LayoutDashboard, BookOpen, CalendarDays,
  ListTodo, BarChart3, Bot, Settings, LogOut,
} from "lucide-react";

export default function Sidebar({ onClose }) {
  const { logout } = useAuth();

  const menuItems = [
    { to: "/",            label: "Tổng quan",   icon: <LayoutDashboard size={18} /> },
    { to: "/subjects",    label: "Môn học",     icon: <BookOpen size={18} /> },
    { to: "/study-plans", label: "Kế hoạch học", icon: <CalendarDays size={18} /> },
    { to: "/tasks",       label: "Công việc",   icon: <ListTodo size={18} /> },
    { to: "/progress",    label: "Tiến độ",     icon: <BarChart3 size={18} /> },
    { to: "/ai-support",  label: "Hỗ trợ AI",   icon: <Bot size={18} /> },
    { to: "/settings",    label: "Cài đặt",     icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex h-full w-64 flex-col justify-between bg-[#CFE8B4] dark:bg-[#252d3d] px-5 py-6 transition-colors">
      <div>
        {/* Logo + close */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex justify-center flex-1">
            <img src={logo} alt="logo" className="h-20 w-auto object-contain" />
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/40 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-white dark:bg-[#3b4a63] shadow-md font-semibold text-black dark:text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Đăng xuất */}
      <div className="border-t border-white/40 dark:border-[#2e3a4e] pt-5">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-500 dark:text-red-400 transition-all hover:bg-red-100 dark:hover:bg-red-900/20 text-sm"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}

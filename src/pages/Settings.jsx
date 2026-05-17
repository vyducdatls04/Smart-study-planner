import { useState, useEffect } from "react";
import {
  Bell,
  Bot,
  CheckCircle2,
  Lock,
  LogOut,
  Moon,
  Palette,
  ShieldAlert,
  User,
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/useAuth";

const TABS = [
  { key: "profile", label: "Hồ sơ", icon: User },
  { key: "security", label: "Bảo mật", icon: Lock },
  { key: "preferences", label: "Tùy chỉnh", icon: Palette },
  { key: "notifications", label: "Thông báo", icon: Bell },
  { key: "ai", label: "Cài đặt AI", icon: Bot },
  { key: "danger", label: "Khu vực nhạy cảm", icon: ShieldAlert },
];

export default function Settings() {
  const { user, logout } = useAuth();

  const [tab, setTab] = useState("profile");

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      darkMode
    );

    localStorage.setItem(
      "darkMode",
      darkMode
    );
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-5 py-6 transition-colors dark:bg-[#1e2433] lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Cài đặt
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quản lý tài khoản, bảo mật và tùy chỉnh hệ thống
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm transition-colors dark:border-[#2e3a4e] dark:bg-[#252d3d]">
          {TABS.map((item) => {
            const Icon = item.icon;

            const active = tab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all ${
                  active
                    ? "bg-blue-600 font-medium text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-[#2a3347]"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Content */}
        <main className="min-h-[520px] rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-colors dark:border-[#2e3a4e] dark:bg-[#252d3d]">
          {tab === "profile" && (
            <ProfileTab user={user} />
          )}

          {tab === "security" && (
            <SecurityTab />
          )}

          {tab === "preferences" && (
            <PreferencesTab
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          )}

          {tab === "notifications" && (
            <NotificationsTab />
          )}

          {tab === "ai" && (
            <AISettingsTab />
          )}

          {tab === "danger" && (
            <DangerTab logout={logout} />
          )}
        </main>
      </div>
    </div>
  );
}

/* ======================================================
   PROFILE TAB
====================================================== */

function ProfileTab({ user }) {
  const { updateUser } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [saving, setSaving] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (
      !form.name.trim() ||
      !form.email.trim()
    ) {
      setError(
        "Vui lòng nhập đầy đủ thông tin"
      );

      return;
    }

    try {
      setSaving(true);

      await api.put("/user/profile", {
        name: form.name.trim(),
        email: form.email.trim(),
      });

      updateUser({
        name: form.name.trim(),
        email: form.email.trim(),
      });

      setSuccess(
        "Đã lưu thay đổi thành công!"
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không thể cập nhật hồ sơ"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <TabHeader
        title="Hồ sơ"
        desc="Cập nhật thông tin cá nhân"
      />

      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-[#2a3347]">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 text-2xl font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
          {form.name?.[0]?.toUpperCase() ||
            "N"}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            {form.name}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {form.email}
          </p>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <Field label="Họ và tên">
          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            className="input-field"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            className="input-field"
          />
        </Field>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 text-sm text-emerald-500">
          {success}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary mt-5"
      >
        {saving
          ? "Đang lưu..."
          : "Lưu thay đổi"}
      </button>
    </div>
  );
}

/* ======================================================
   SECURITY TAB
====================================================== */

function SecurityTab() {
  return (
    <div>
      <TabHeader
        title="Bảo mật"
        desc="Đổi mật khẩu tài khoản"
      />

      <p className="text-sm text-gray-500">
        Tính năng đang phát triển.
      </p>
    </div>
  );
}

/* ======================================================
   PREFERENCES TAB
====================================================== */

function PreferencesTab({
  darkMode,
  setDarkMode,
}) {
  return (
    <div>
      <TabHeader
        title="Tùy chỉnh"
        desc="Tùy chỉnh giao diện"
      />

      <SettingRow
        icon={<Moon size={18} />}
        title="Giao diện tối"
        desc="Chuyển sang giao diện tối"
      >
        <Toggle
          checked={darkMode}
          onChange={() =>
            setDarkMode(!darkMode)
          }
        />
      </SettingRow>
    </div>
  );
}

/* ======================================================
   NOTIFICATIONS TAB
====================================================== */

function NotificationsTab() {
  const [enabled, setEnabled] =
    useState(
      Notification.permission ===
        "granted"
    );

  const enableNotifications =
    async () => {
      try {
        if (
          !("Notification" in window)
        ) {
          alert(
            "Trình duyệt không hỗ trợ thông báo"
          );

          return;
        }

        const permission =
          await Notification.requestPermission();

        if (
          permission === "granted"
        ) {
          setEnabled(true);

          new Notification(
            "Trình lập kế hoạch học tập thông minh",
            {
              body: "Thông báo đã được bật 🎉",
            }
          );
        } else {
          alert(
            "Bạn đã từ chối thông báo"
          );
        }
      } catch (err) {
        console.error(
          "Notification error:",
          err
        );
      }
    };

  return (
    <div>
      <TabHeader
        title="Thông báo"
        desc="Quản lý thông báo"
      />

      <SettingRow
        icon={<Bell size={18} />}
        title="Thông báo trình duyệt"
        desc="Nhận thông báo học tập trên trình duyệt"
      >
        <button
          onClick={enableNotifications}
          className={`rounded-xl px-5 py-2 text-sm font-medium text-white transition ${
            enabled
              ? "bg-emerald-500"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {enabled
            ? "Đã bật"
            : "Bật thông báo"}
        </button>
      </SettingRow>
    </div>
  );
}

/* ======================================================
   AI SETTINGS
====================================================== */

function AISettingsTab() {
  return (
    <div>
      <TabHeader
        title="Cài đặt AI"
        desc="Thiết lập AI học tập"
      />

      <SettingRow
        icon={<Bot size={18} />}
        title="AI học tập"
        desc="Tính năng AI sẽ được nâng cấp trong phiên bản sau"
      >
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-500 dark:bg-[#2a3347] dark:text-blue-300">
          Sắp ra mắt
        </span>
      </SettingRow>
    </div>
  );
}

/* ======================================================
   DANGER ZONE
====================================================== */

function DangerTab({ logout }) {
  return (
    <div>
      <TabHeader
        title="Khu vực nhạy cảm"
        desc="Các hành động nhạy cảm"
        danger
      />

      <div className="max-w-md rounded-2xl border border-red-100 bg-red-50/50 p-5 dark:border-red-900/40 dark:bg-red-950/10">
        <p className="text-sm font-semibold text-gray-800 dark:text-white">
          Đăng xuất tài khoản
        </p>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Bạn sẽ cần đăng nhập lại.
        </p>

        <button
          onClick={logout}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 active:scale-95"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

/* ======================================================
   SHARED COMPONENTS
====================================================== */

function TabHeader({
  title,
  desc,
  danger = false,
}) {
  return (
    <div className="mb-6 border-b border-gray-100 pb-4 dark:border-[#2e3a4e]">
      <h2
        className={`text-lg font-semibold ${
          danger
            ? "text-red-500"
            : "text-gray-900 dark:text-white"
        }`}
      >
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-400">
        {desc}
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
        {label}
      </label>

      {children}
    </div>
  );
}

function SettingRow({
  icon,
  title,
  desc,
  children,
}) {
  return (
    <div className="flex max-w-xl items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-[#2a3347]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-[#1e2433] dark:text-blue-300">
          {icon}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            {title}
          </p>

          <p className="mt-0.5 text-xs text-gray-400">
            {desc}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}) {
  return (
    <button
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
        checked
          ? "bg-blue-600"
          : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
          checked
            ? "translate-x-5"
            : "translate-x-0"
        }`}
      />
    </button>
  );
}

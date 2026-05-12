import { useState, useEffect } from "react";
import {
  Bell, Bot, CheckCircle2, Lock, LogOut,
  Moon, Palette, ShieldAlert, User,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";

const TABS = [
  { key: "profile",       label: "Profile",       icon: User },
  { key: "security",      label: "Security",      icon: Lock },
  { key: "preferences",   label: "Preferences",   icon: Palette },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "ai",            label: "AI Settings",   icon: Bot },
  { key: "danger",        label: "Danger Zone",   icon: ShieldAlert },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("profile");
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#1e2433] px-5 py-6 transition-colors lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quản lý tài khoản, bảo mật và tùy chỉnh hệ thống
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* Tab menu */}
        <aside className="rounded-2xl border border-gray-100 dark:border-[#2e3a4e] bg-white dark:bg-[#252d3d] p-2 shadow-sm transition-colors">
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
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a3347]"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Nội dung tab */}
        <main className="min-h-[520px] rounded-2xl border border-gray-100 dark:border-[#2e3a4e] bg-white dark:bg-[#252d3d] p-6 shadow-sm transition-colors">
          {tab === "profile"       && <ProfileTab user={user} />}
          {tab === "security"      && <SecurityTab />}
          {tab === "preferences"   && <PreferencesTab darkMode={darkMode} setDarkMode={setDarkMode} />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "ai"            && <AISettingsTab />}
          {tab === "danger"        && <DangerTab logout={logout} />}
        </main>
      </div>
    </div>
  );
}

// ── Profile ─────────────────────────────────────────────────────
function ProfileTab({ user }) {
  const { updateUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setForm({ name: user.name || "", email: user.email || "" });
  }, [user]);

  const handleSave = async () => {
    const name = form.name.trim();
    setError(""); setSuccess("");

    if (!name || !form.email.trim()) {
      setError("Vui lòng nhập đầy đủ họ tên và email");
      return;
    }

    try {
      setSaving(true);
      await api.put("/user/profile", { name, email: form.email.trim() });
      updateUser({ name, email: form.email.trim() });
      setSuccess("Đã lưu thay đổi!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <TabHeader title="Profile" desc="Cập nhật thông tin cá nhân" />

      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-gray-50 dark:bg-[#2a3347] p-4 transition-colors">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-2xl font-semibold text-blue-600 dark:text-blue-300">
          {form.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            {form.name || "Tên của bạn"}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{form.email}</p>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <Field label="Họ và tên">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nguyễn Văn A"
            className="input-field"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="example@email.com"
            className="input-field"
          />
        </Field>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        {success && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-500">
            <CheckCircle2 size={16} /> {success}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Security ─────────────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdate = async () => {
    setError(""); setSuccess("");
    if (!form.current || !form.next) { setError("Vui lòng điền đầy đủ"); return; }
    if (form.next !== form.confirm)  { setError("Mật khẩu mới không khớp"); return; }
    if (form.next.length < 6)        { setError("Mật khẩu tối thiểu 6 ký tự"); return; }

    try {
      setSaving(true);
      await api.put("/user/password", { currentPassword: form.current, newPassword: form.next });
      setForm({ current: "", next: "", confirm: "" });
      setSuccess("Đổi mật khẩu thành công!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Mật khẩu hiện tại không đúng");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <TabHeader title="Security" desc="Đổi mật khẩu tài khoản" />
      <div className="max-w-md space-y-4">
        <Field label="Mật khẩu hiện tại">
          <input type="password" value={form.current} onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))} placeholder="••••••••" className="input-field" />
        </Field>
        <Field label="Mật khẩu mới">
          <input type="password" value={form.next} onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))} placeholder="••••••••" className="input-field" />
        </Field>
        <Field label="Xác nhận mật khẩu mới">
          <input type="password" value={form.confirm} onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" className="input-field" />
        </Field>
      </div>
      {error   && <p className="mt-4 text-sm text-red-500">{error}</p>}
      {success && <p className="mt-4 text-sm text-emerald-500">{success}</p>}
      <button onClick={handleUpdate} disabled={saving} className="btn-primary mt-5">
        {saving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
      </button>
    </div>
  );
}

// ── Preferences ──────────────────────────────────────────────────
function PreferencesTab({ darkMode, setDarkMode }) {
  return (
    <div>
      <TabHeader title="Preferences" desc="Tùy chỉnh giao diện" />
      <SettingRow
        icon={<Moon size={18} />}
        title="Dark Mode"
        desc="Chuyển sang giao diện tối dịu mắt"
      >
        <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
      </SettingRow>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────
function NotificationsTab() {
  const [enabled, setEnabled] = useState(false);

  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setEnabled(true);
      new Notification("Smart Study", { body: "Thông báo đã được bật" });
    }
  };

  return (
    <div>
      <TabHeader title="Notifications" desc="Quản lý thông báo" />
      <SettingRow
        icon={<Bell size={18} />}
        title="Browser Notifications"
        desc="Nhận thông báo học tập trên trình duyệt"
      >
        <button onClick={enableNotifications} className="btn-primary">
          {enabled ? "Đã bật" : "Bật thông báo"}
        </button>
      </SettingRow>
    </div>
  );
}

// ── AI Settings ───────────────────────────────────────────────────
function AISettingsTab() {
  return (
    <div>
      <TabHeader title="AI Settings" desc="Thiết lập AI học tập" />
      <SettingRow
        icon={<Bot size={18} />}
        title="Study AI"
        desc="Các tùy chọn AI sẽ được bổ sung ở phiên bản sau"
      >
        <span className="rounded-full bg-blue-50 dark:bg-[#2a3347] px-3 py-1 text-xs font-medium text-blue-500 dark:text-blue-300">
          Coming soon
        </span>
      </SettingRow>
    </div>
  );
}

// ── Danger Zone ───────────────────────────────────────────────────
function DangerTab({ logout }) {
  return (
    <div>
      <TabHeader title="Danger Zone" desc="Các hành động nhạy cảm với tài khoản" danger />
      <div className="max-w-md rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10 p-5">
        <p className="text-sm font-semibold text-gray-800 dark:text-white">
          Đăng xuất tài khoản
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng hệ thống.
        </p>
        <button
          onClick={logout}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all active:scale-95"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────
function TabHeader({ title, desc, danger = false }) {
  return (
    <div className="mb-6 border-b border-gray-100 dark:border-[#2e3a4e] pb-4">
      <h2 className={`text-lg font-semibold ${danger ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
        {title}
      </h2>
      <p className="mt-1 text-sm text-gray-400">{desc}</p>
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

function SettingRow({ icon, title, desc, children }) {
  return (
    <div className="flex max-w-xl items-center justify-between gap-4 rounded-2xl bg-gray-50 dark:bg-[#2a3347] p-4 transition-colors">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 dark:bg-[#1e2433] text-blue-600 dark:text-blue-300">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
          <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
        checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
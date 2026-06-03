import { Menu, Search } from "lucide-react";
import { useAuth } from "../context/useAuth";
import NotificationCenter from "./NotificationCenter";
import { useSmartNotifications } from "../hooks/useSmartNotifications";

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const notifications = useSmartNotifications(user?.id);

  return (
    <div className="h-16 bg-white dark:bg-[#252d3d] shadow-sm border-b border-gray-100 dark:border-[#2e3a4e] flex items-center justify-between px-4 lg:px-6 gap-3 flex-shrink-0 transition-colors">

      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a3347] transition-all text-gray-600 dark:text-gray-300"
      >
        <Menu size={22} />
      </button>

      <div className="relative flex-1 max-w-xs hidden sm:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Tìm kiếm..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-[#2e3a4e] rounded-xl text-sm outline-none focus:border-blue-400 bg-gray-50 dark:bg-[#2a3347] dark:text-white dark:placeholder-gray-500 focus:bg-white dark:focus:bg-[#2e3a4e] transition-all"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationCenter
          items={notifications.items}
          loading={notifications.loading}
          summary={notifications.summary}
          onDismiss={notifications.dismissItem}
          onRefresh={notifications.loadNotifications}
          onSnooze={notifications.snoozeItem}
          getItemMessage={notifications.getItemMessage}
        />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-200 hidden sm:block font-medium">
            {user?.name || "Người dùng"}
          </span>
        </div>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition-all active:scale-95"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

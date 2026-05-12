import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Search, Settings, User } from "lucide-react";

export default function Navbar({ userName = "User", onSearch, onLogout }) {
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const avatarText = userName?.charAt(0)?.toUpperCase() || "U";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="relative flex h-16 items-center justify-between border-b border-teal-100 bg-[#A8D5D0] px-4 sm:px-6">
      <div className="relative w-full max-w-sm">
        <Search
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="search"
          placeholder="Search..."
          aria-label="Search"
          onChange={(e) => onSearch?.(e.target.value)}
          className="h-10 w-full rounded-full border border-white/70 bg-white pl-11 pr-4 text-sm text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      <div className="ml-4 flex items-center gap-2 text-gray-700">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/45 focus:outline-none focus:ring-2 focus:ring-teal-700"
        >
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#A8D5D0]" />
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="User menu"
            onClick={() => setOpenMenu((value) => !value)}
            className="flex h-10 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-700"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 font-semibold text-teal-700">
              {avatarText}
            </span>

            <span className="hidden max-w-24 truncate sm:block">
              {userName}
            </span>
          </button>

          {openMenu && (
            <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-800">
                  {userName}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Account menu
                </p>
              </div>

              <div className="p-1.5">
                <MenuItem icon={<User size={16} />} label="Profile" />

                <MenuItem icon={<Settings size={16} />} label="Settings" />

                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      {icon}
      {label}
    </button>
  );
}

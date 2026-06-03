import { useEffect, useRef, useState } from "react";
import { Bell, CalendarClock, Check, Clock3, X } from "lucide-react";

const TYPE_LABEL = {
  task: "Công việc",
  plan: "Kế hoạch",
};

const PRIORITY_LABEL = {
  high: "Cao",
  medium: "Vừa",
  low: "Thấp",
};

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function NotificationCenter({
  items,
  loading,
  summary,
  onDismiss,
  onRefresh,
  onSnooze,
  getItemMessage,
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const visibleItems = items.slice(0, 8);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        aria-label="Thông báo"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-10 w-10 place-items-center rounded-xl text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200 dark:hover:bg-[#2a3347]"
      >
        <Bell size={18} />
        {summary.total > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white ring-2 ring-white dark:ring-[#252d3d]">
            {summary.total > 9 ? "9+" : summary.total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-[#2e3a4e] dark:bg-[#252d3d]">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-[#2e3a4e]">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {summary.headline}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {summary.total} thông báo cần xem
              </p>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-[#2a3347]"
            >
              Làm mới
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {loading && (
              <div className="px-3 py-8 text-center text-sm text-gray-400">
                Đang kiểm tra lịch học...
              </div>
            )}

            {!loading && visibleItems.length === 0 && (
              <div className="px-3 py-8 text-center">
                <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <Check size={18} />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-100">
                  Chưa có việc cần nhắc
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  App sẽ ưu tiên nhắc các mục gần hạn hoặc quá hạn.
                </p>
              </div>
            )}

            {!loading &&
              visibleItems.map((item) => (
                <div
                  key={item.id}
                  className={`mb-2 rounded-xl border p-3 transition ${
                    item.urgent
                      ? "border-red-100 bg-red-50/70 dark:border-red-900/40 dark:bg-red-950/10"
                      : "border-gray-100 bg-gray-50 dark:border-[#2e3a4e] dark:bg-[#2a3347]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-[#1e2433] dark:text-gray-300">
                          {TYPE_LABEL[item.type]}
                        </span>
                        {item.type === "task" && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-200">
                            {PRIORITY_LABEL[item.priority]}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock size={13} />
                          {formatDate(item.due)}
                        </span>
                        <span className={item.daysLeft < 0 ? "font-medium text-red-600 dark:text-red-300" : ""}>
                          {getItemMessage(item)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label="Ẩn thông báo"
                      onClick={() => onDismiss(item.id)}
                      className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-white hover:text-gray-700 dark:hover:bg-[#1e2433] dark:hover:text-gray-100"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSnooze(item.id, 60)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:bg-[#1e2433] dark:text-gray-200 dark:hover:bg-[#344056]"
                  >
                    <Clock3 size={13} />
                    Nhắc lại sau 1 giờ
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SETTINGS = {
  enabled: false,
  reminderBefore: "30",
};

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysUntil(value) {
  const due = normalizeDate(value);
  if (!due) return null;

  const today = normalizeDate(new Date());
  return Math.round((due.getTime() - today.getTime()) / DAY_MS);
}

function priorityWeight(priority) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function storageKey(userId, suffix) {
  return `smart-study:${userId || "guest"}:${suffix}`;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function buildNotificationItems({ tasks, plans, reminderDays }) {
  const taskItems = tasks
    .filter((task) => task.status !== "done")
    .map((task) => {
      const diff = daysUntil(task.deadline);
      if (diff === null || diff > reminderDays) return null;

      const urgent = diff < 0 || diff <= 1 || task.priority === "high";
      return {
        id: `task-${task.id}`,
        type: "task",
        title: task.title,
        due: task.deadline,
        daysLeft: diff,
        priority: task.priority || "medium",
        urgent,
        score: (reminderDays - diff) + priorityWeight(task.priority) * 4 + (diff < 0 ? 20 : 0),
      };
    })
    .filter(Boolean);

  const planItems = plans
    .map((plan) => {
      const diff = daysUntil(plan.due);
      if (diff === null || diff > reminderDays) return null;

      return {
        id: `plan-${plan.id}`,
        type: "plan",
        title: plan.title,
        due: plan.due,
        daysLeft: diff,
        priority: "medium",
        urgent: diff < 0 || diff <= 1,
        score: reminderDays - diff + (diff < 0 ? 16 : 0),
      };
    })
    .filter(Boolean);

  return [...taskItems, ...planItems].sort((a, b) => b.score - a.score);
}

function getItemMessage(item) {
  if (item.daysLeft < 0) return `Quá hạn ${Math.abs(item.daysLeft)} ngày`;
  if (item.daysLeft === 0) return "Đến hạn hôm nay";
  if (item.daysLeft === 1) return "Đến hạn ngày mai";
  return `Còn ${item.daysLeft} ngày`;
}

export function useSmartNotifications(userId, options = {}) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [tasks, setTasks] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snoozed, setSnoozed] = useState({});
  const [dismissed, setDismissed] = useState({});

  const reminderDays = Number.parseInt(settings.reminderBefore, 10) || 30;
  const snoozeKey = storageKey(userId, "notification-snooze");
  const dismissedKey = storageKey(userId, "notification-dismissed");
  const firedKey = storageKey(userId, `notification-fired:${todayKey()}`);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, tasksRes, plansRes] = await Promise.all([
        api.get("/user/notifications"),
        api.get("/tasks"),
        api.get("/plans"),
      ]);

      setSettings({ ...DEFAULT_SETTINGS, ...settingsRes.data });
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      setSnoozed(readJson(snoozeKey, {}));
      setDismissed(readJson(dismissedKey, {}));
    } catch (err) {
      console.error("Load notifications failed:", err);
    } finally {
      setLoading(false);
    }
  }, [dismissedKey, snoozeKey]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const items = useMemo(() => {
    const now = Date.now();
    const today = todayKey();

    return buildNotificationItems({ tasks, plans, reminderDays })
      .filter((item) => (snoozed[item.id] || 0) <= now)
      .filter((item) => dismissed[item.id] !== today);
  }, [dismissed, plans, reminderDays, snoozed, tasks]);

  const summary = useMemo(() => {
    const urgentCount = items.filter((item) => item.urgent).length;
    const overdueCount = items.filter((item) => item.daysLeft < 0).length;
    const todayCount = items.filter((item) => item.daysLeft === 0).length;

    return {
      total: items.length,
      urgentCount,
      overdueCount,
      todayCount,
      headline:
        overdueCount > 0
          ? `${overdueCount} mục đã quá hạn`
          : todayCount > 0
            ? `${todayCount} mục đến hạn hôm nay`
            : urgentCount > 0
              ? `${urgentCount} mục cần ưu tiên`
              : "Không có việc gấp",
    };
  }, [items]);

  useEffect(() => {
    if (
      options.autoFire === false ||
      loading ||
      !settings.enabled ||
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const fired = readJson(firedKey, {});
    const topItems = items.filter((item) => item.urgent).slice(0, 3);
    const nextItem = topItems.find((item) => !fired[item.id]);

    if (!nextItem) return;

    new Notification("Smart Study Planner", {
      body: `${nextItem.title} - ${getItemMessage(nextItem)}`,
      tag: nextItem.id,
    });

    writeJson(firedKey, { ...fired, [nextItem.id]: true });
  }, [firedKey, items, loading, options.autoFire, settings.enabled]);

  const saveSettings = useCallback(async (nextSettings) => {
    const payload = { ...settings, ...nextSettings };
    setSettings(payload);
    await api.put("/user/notifications", payload);
  }, [settings]);

  const snoozeItem = useCallback((id, minutes = 60) => {
    const next = { ...snoozed, [id]: Date.now() + minutes * 60 * 1000 };
    setSnoozed(next);
    writeJson(snoozeKey, next);
  }, [snoozeKey, snoozed]);

  const dismissItem = useCallback((id) => {
    const next = { ...dismissed, [id]: todayKey() };
    setDismissed(next);
    writeJson(dismissedKey, next);
  }, [dismissed, dismissedKey]);

  return {
    items,
    loading,
    settings,
    summary,
    dismissItem,
    getItemMessage,
    loadNotifications,
    saveSettings,
    snoozeItem,
  };
}

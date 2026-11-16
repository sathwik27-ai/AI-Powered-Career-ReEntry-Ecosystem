import { useState, useEffect } from "react";
import { Bell, Check, Trash2, CheckCircle2 } from "lucide-react";
import { api } from "../../api/client";
import type { NotificationItem } from "../../api/types";

export function ListenerNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () => {
    api.notifications()
      .then((res) => setNotifications(res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow text-jelly-purple">Updates & Alerts</span>
          <h1 className="page-title mt-1">Notifications Center</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Stay updated with your mentor task assignments, quiz completions, and new returnship matches.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="jelly-btn inline-flex items-center gap-2 bg-gradient-to-r from-jelly-purple to-jelly-blueberry px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            <Check className="h-4 w-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-jelly-purple" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-ink-faint" />
          <h3 className="mt-3 text-base font-bold text-ink">No Notifications Yet</h3>
          <p className="mt-1 text-xs text-ink-soft">
            You're all caught up! New mentor messages and learning alerts will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl p-5 border transition flex items-start justify-between gap-4 ${
                n.is_read
                  ? "bg-white dark:bg-slate-800/60 border-line text-slate-700 dark:text-slate-300 shadow-sm"
                  : "bg-white dark:bg-slate-800 border-jelly-purple/40 shadow-card text-slate-900 dark:text-white"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${
                    n.is_read ? "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400" : "bg-gradient-to-tr from-jelly-purple to-jelly-strawberry"
                  }`}
                >
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{n.title}</h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
                  {n.created_at && (
                    <span className="mt-2 block text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {new Date(n.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(n.id)}
                  className="rounded-lg border border-line bg-surface px-3 py-1 text-xs font-bold text-ink-soft hover:bg-paper-deep"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

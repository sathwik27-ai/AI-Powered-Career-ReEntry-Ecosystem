import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  LogOut,
  Menu,
  Sparkles,
  User,
  X,
  Check,
  Shield,
  GraduationCap,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../../theme/ThemeToggle";
import { api } from "../../api/client";
import type { NotificationItem } from "../../api/types";

interface AppNavbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function AppNavbar({ onToggleSidebar, sidebarOpen }: AppNavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (user) {
      api.notifications()
        .then((res) => setNotifications(res || []))
        .catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleBadge = () => {
    if (user?.role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-jelly-purple/15 px-2.5 py-0.5 text-xs font-bold text-jelly-purple">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      );
    }
    if (user?.role === "trainer") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-jelly-lime/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <GraduationCap className="h-3 w-3" />
          Mentor
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-jelly-strawberry/15 px-2.5 py-0.5 text-xs font-bold text-jelly-strawberry">
        <Users className="h-3 w-3" />
        Learner
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-ink hover:bg-paper-deep md:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-jelly-purple to-jelly-strawberry text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-ink">
            ReStart<span className="text-jelly-strawberry">Her</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        <div className="hidden sm:block">{roleBadge()}</div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line text-ink-soft hover:bg-paper-deep hover:text-ink"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-jelly-strawberry px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-line bg-white dark:bg-[#1E293B] p-4 shadow-2xl z-50">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs font-bold text-plum-600 dark:text-plum-400 hover:underline"
                  >
                    <Check className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="mt-2.5 max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-xl p-2.5 text-xs transition border ${
                        n.is_read
                          ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50"
                          : "bg-plum-500/10 border-plum-500/25 dark:bg-plum-950/30 dark:border-plum-500/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className={`font-bold ${n.is_read ? "text-slate-800 dark:text-slate-200" : "text-slate-900 dark:text-white"}`}>
                          {n.title}
                        </span>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-jelly-purple shrink-0 mt-1" />}
                      </div>
                      <p className={`mt-0.5 text-[11px] font-medium leading-relaxed ${n.is_read ? "text-slate-600 dark:text-slate-300" : "text-slate-700 dark:text-slate-200"}`}>
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-xl border border-line p-1.5 hover:bg-paper-deep text-left"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-jelly-purple to-jelly-blueberry text-xs font-bold text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
            </div>
            <span className="hidden text-xs font-bold text-ink lg:inline-block max-w-[120px] truncate">
              {user?.name || "User"}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-line bg-surface p-2 shadow-pop z-50">
              <div className="border-b border-line px-3 py-2">
                <p className="text-xs font-bold text-ink truncate">{user?.name}</p>
                <p className="text-[11px] text-ink-faint truncate">{user?.email}</p>
                <div className="mt-1">{roleBadge()}</div>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rosewood-600 hover:bg-rosewood-100/50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

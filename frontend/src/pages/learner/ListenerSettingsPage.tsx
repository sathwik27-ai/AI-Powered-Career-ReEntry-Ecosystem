import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Moon, Sun, Bell, Shield, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { ThemeToggle } from "../../theme/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export function ListenerSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  // Account deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    api.settings()
      .then((res) => {
        if (res) {
          if (res.email_notifications !== undefined) setEmailAlerts(res.email_notifications);
          if (res.job_alerts !== undefined) setJobAlerts(res.job_alerts);
        }
      })
      .catch(() => { });
  }, []);

  const handleSave = async () => {
    try {
      await api.updateSettings({
        theme,
        email_notifications: emailAlerts,
        job_alerts: jobAlerts,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <span className="eyebrow text-jelly-purple">Preferences</span>
        <h1 className="page-title mt-1">Platform Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Customize your appearance theme, notifications, and privacy preferences.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      {/* Theme Appearance Card */}
      <div className="card p-6 bg-surface border border-line shadow-jelly">
        <h3 className="section-title">Visual Appearance</h3>
        <p className="text-xs text-ink-soft mt-1">
          ReStartHer features a light palette theme with vibrant jelly accents and high contrast text.
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <div>
            <div className="text-sm font-bold text-ink">Theme Mode</div>
            <div className="text-xs text-ink-faint">Active: <strong className="capitalize text-plum-600">Light Juicy Palette (Standard)</strong></div>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
            Active
          </span>
        </div>
      </div>

      {/* Notification Preferences Card */}
      <div className="card p-6 bg-surface border border-line shadow-jelly">
        <h3 className="section-title">Alerts & Notifications</h3>
        <p className="text-xs text-ink-soft mt-1">
          Manage email and in-app updates for mentorship tasks and job recommendations.
        </p>

        <div className="mt-5 space-y-4 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-ink">Mentor & Task Assignments</div>
              <div className="text-xs text-ink-faint">Notify when your trainer assigns a practice exercise or leaves notes</div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-line text-jelly-purple focus:ring-jelly-purple"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-ink">New Returnship Matches</div>
              <div className="text-xs text-ink-faint">Alert when new verified returnship opportunities match your mastered skills</div>
            </div>
            <input
              type="checkbox"
              checked={jobAlerts}
              onChange={(e) => setJobAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-line text-jelly-purple focus:ring-jelly-purple"
            />
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <button
            type="button"
            onClick={handleSave}
            className="jelly-btn bg-gradient-to-r from-jelly-purple to-jelly-blueberry px-5 py-2.5 text-xs font-bold text-white shadow-xs"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="card p-6 bg-surface border border-rosewood-600/30 dark:border-red-900/40 shadow-jelly">
        <div className="flex items-center gap-2.5 text-rosewood-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="section-title text-rosewood-600 dark:text-red-400">Danger Zone: Delete Account</h3>
        </div>
        <p className="mt-1 text-xs text-ink-soft leading-relaxed">
          If you wish to exit the platform, you can permanently delete your account. This will completely remove all your resume extractions, skill gap diagnostics, personalized daily roadmaps, mock interview history, and mentor notes. This action is irreversible.
        </p>

        <div className="mt-4 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => {
              setShowDeleteModal(true);
              setConfirmText("");
              setDeleteError(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-rosewood-600/40 bg-rosewood-100/50 dark:bg-red-950/30 px-4 py-2 text-xs font-bold text-rosewood-700 dark:text-red-300 hover:bg-rosewood-600 hover:text-white transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Permanently Delete My Account</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-ink">Delete Account Confirmation</h3>
                <p className="text-[11px] text-ink-faint">Irreversible permanent removal</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-ink-soft leading-relaxed">
              Are you sure you want to permanently exit and delete your account? All your coaching squad history, roadmap tasks, and saved applications will be deleted from the database immediately.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-ink mb-1">
                Type <strong className="text-red-600">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-xl border border-line bg-paper-deep px-3 py-2 text-xs font-bold text-ink focus:border-red-500 focus:outline-none"
              />
            </div>

            {deleteError && (
              <div className="mt-3 text-xs font-bold text-red-600">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper-deep"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmText !== "DELETE" || deleting}
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError(null);
                  try {
                    await api.deleteAccount();
                    logout();
                    navigate("/login", { replace: true });
                  } catch (err: any) {
                    setDeleteError(err?.message || "Failed to delete account. Please try again.");
                    setDeleting(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lift hover:bg-red-700 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{deleting ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

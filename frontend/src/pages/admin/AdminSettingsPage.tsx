import { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  Bell,
  Moon,
  Sun,
  Key,
  Database,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { api } from "../../api/client";
import { useTheme } from "../../theme/ThemeContext";

export function AdminSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<any>({
    email_notifications: true,
    job_alerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.settings();
      setSettings(res);
    } catch (err: any) {
      // Default fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await api.updateSettings({
        theme,
        email_notifications: settings.email_notifications,
        job_alerts: settings.job_alerts,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to update platform settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl">
      {/* Top Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-jelly-purple/10 px-3 py-1 text-xs font-bold text-jelly-purple mb-1">
          <Settings className="h-3.5 w-3.5" /> Governance
        </div>
        <h1 className="text-2xl font-extrabold text-ink">Administrative Settings</h1>
        <p className="text-xs text-ink-muted">
          Configure security baselines, platform alerts, and workspace presentation preferences.
        </p>
      </div>

      {saveSuccess && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> Preferences updated successfully.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Appearance Section */}
        <div className="jelly-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="h-5 w-5 text-jelly-purple" />
            <h2 className="text-base font-bold text-ink">Appearance &amp; Theme Palette</h2>
          </div>
          <p className="text-xs text-ink-muted mb-4">
            Platform is standardized on the juicy, high-contrast light palette.
          </p>

          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl border-2 border-jelly-purple bg-jelly-purple/10 text-jelly-purple flex items-center gap-2 text-xs font-bold">
              <Sun className="h-4 w-4" /> Light Pastel Standard (Active)
            </div>
          </div>
        </div>

        {/* Security Baseline Info */}
        <div className="jelly-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-jelly-strawberry" />
            <h2 className="text-base font-bold text-ink">Security &amp; Auth Configuration</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-paper-deep">
              <div>
                <p className="font-bold text-ink">JWT Access Token Life</p>
                <p className="text-ink-muted text-[11px]">Configured via <code className="font-mono">ACCESS_TOKEN_EXPIRE_MINUTES</code></p>
              </div>
              <span className="font-mono font-bold text-jelly-purple">1440 Minutes (24h)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-paper-deep">
              <div>
                <p className="font-bold text-ink">Password Hashing</p>
                <p className="text-ink-muted text-[11px]">Bcrypt with 12 rounds salted hashing</p>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Enforced</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-paper-deep">
              <div>
                <p className="font-bold text-ink">Job Application Auto-Submit Protection</p>
                <p className="text-ink-muted text-[11px]">Human-in-the-loop guarantee</p>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Locked to External Tab</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="jelly-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-jelly-blueberry" />
            <h2 className="text-base font-bold text-ink">System Alerts</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-paper-deep cursor-pointer">
              <div>
                <p className="font-bold text-ink">Email Notifications</p>
                <p className="text-ink-muted text-[11px]">Send weekly cohort digests to administrative inboxes</p>
              </div>
              <input
                type="checkbox"
                checked={settings.email_notifications}
                onChange={(e) =>
                  setSettings({ ...settings, email_notifications: e.target.checked })
                }
                className="h-4 w-4 rounded accent-jelly-purple"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-paper-deep cursor-pointer">
              <div>
                <p className="font-bold text-ink">Learner Intervention Alerts</p>
                <p className="text-ink-muted text-[11px]">Notify when a learner is flagged as stuck for &ge; 5 days</p>
              </div>
              <input
                type="checkbox"
                checked={settings.job_alerts}
                onChange={(e) =>
                  setSettings({ ...settings, job_alerts: e.target.checked })
                }
                className="h-4 w-4 rounded accent-jelly-purple"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="jelly-button py-2.5 px-6 text-xs font-bold text-white bg-gradient-to-r from-jelly-purple to-jelly-strawberry flex items-center gap-2 shadow-jelly disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}

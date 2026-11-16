import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../../theme/ThemeToggle";
import { CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export function TrainerSettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [specialization, setSpecialization] = useState("Full Stack & Java Backend Mentorship");
  const [maxLearners, setMaxLearners] = useState(25);
  const [bio, setBio] = useState(
    "Lead software engineer and returnship career coach with 12+ years experience mentoring women returning to tech."
  );
  const [saved, setSaved] = useState(false);

  // Account deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <span className="eyebrow text-jelly-lime">Mentor Profile</span>
        <h1 className="page-title mt-1">Trainer Profile & Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Update your mentorship caseload capacity, focus specializations, and account appearance.
        </p>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Trainer profile settings updated!</span>
        </div>
      )}

      <div className="card p-6 bg-surface border border-line shadow-jelly">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
              Specialization Domain
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
              Max Learner Capacity
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={maxLearners}
              onChange={(e) => setMaxLearners(Number(e.target.value))}
              className="field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
              Mentor Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper-deep/40 p-3 text-xs text-ink focus:border-jelly-lime focus:outline-none"
            />
          </div>

          <div className="border-t border-line pt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-ink">Visual Theme</span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
              Light Palette Active
            </span>
          </div>

          <button
            type="submit"
            className="jelly-btn bg-gradient-to-r from-jelly-lime to-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs"
          >
            Save Profile
          </button>
        </form>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="card p-6 bg-surface border border-rosewood-600/30 dark:border-red-900/40 shadow-jelly">
        <div className="flex items-center gap-2.5 text-rosewood-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="section-title text-rosewood-600 dark:text-red-400">Danger Zone: Delete Account</h3>
        </div>
        <p className="mt-1 text-xs text-ink-soft leading-relaxed">
          If you wish to exit the platform, you can permanently delete your mentor account. This will unassign your caseload of learners and permanently remove your coaching profile and mentorship logs.
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
            <span>Permanently Delete My Mentor Account</span>
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
                <h3 className="text-base font-extrabold text-ink">Delete Mentor Account</h3>
                <p className="text-[11px] text-ink-faint">Irreversible permanent removal</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-ink-soft leading-relaxed">
              Are you sure you want to permanently exit and delete your mentor account? Any learners assigned to you will be safely preserved and returned to the pool for admin reassignment.
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

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Shield,
  RefreshCw,
  Award,
  CheckCircle,
  XCircle,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { api } from "../../api/client";

export function AdminListenersPage() {
  const [listeners, setListeners] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reassignment modal
  const [selectedListener, setSelectedListener] = useState<any | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | "">("");
  const [assignNotes, setAssignNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminUsers({ role: "listener", search: search || undefined });
      setListeners(res.users || []);

      // Also fetch trainers for assignment dropdown
      const trainerRes = await api.adminUsers({ role: "trainer" });
      setTrainers(trainerRes.users || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load learners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleToggleStatus = async (user: any) => {
    try {
      await api.updateUserRole(user.id, { is_active: !user.is_active });
      setListeners((prev) =>
        prev.map((l) => (l.id === user.id ? { ...l, is_active: !user.is_active } : l))
      );
    } catch (err: any) {
      alert(err?.message || "Failed to update user status");
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListener || !selectedTrainerId) return;

    try {
      setSubmitting(true);
      await api.assignTrainer({
        trainer_id: Number(selectedTrainerId),
        listener_id: selectedListener.id,
        notes: assignNotes || undefined,
      });

      // Update local state
      const assignedTrainer = trainers.find((t) => t.id === Number(selectedTrainerId));
      setListeners((prev) =>
        prev.map((l) =>
          l.id === selectedListener.id
            ? {
                ...l,
                assigned_trainer_id: Number(selectedTrainerId),
                assigned_trainer_name: assignedTrainer?.name || "Assigned",
              }
            : l
        )
      );

      setSelectedListener(null);
      setSelectedTrainerId("");
      setAssignNotes("");
    } catch (err: any) {
      alert(err?.message || "Failed to assign trainer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-jelly-aqua/10 px-3 py-1 text-xs font-bold text-jelly-aqua mb-1">
            <Users className="h-3.5 w-3.5" /> Learner Cohorts
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Manage Learners</h1>
          <p className="text-xs text-ink-muted">
            Track return-to-work readiness, assign dedicated mentors, and support career breaks.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 rounded-2xl bg-paper-deep hover:bg-paper-subtle px-4 py-2.5 text-xs font-bold text-ink transition-all self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="jelly-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learners by name or email..."
            className="w-full rounded-xl bg-paper-deep pl-10 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-aqua/40"
          />
        </div>
        <div className="text-xs font-semibold text-ink-faint px-2 whitespace-nowrap">
          {listeners.length} Learners Found
        </div>
      </div>

      {/* Learners Table */}
      <div className="jelly-card p-6 overflow-hidden">
        {listeners.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-ink-faint mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-ink">No learners found</p>
            <p className="text-xs text-ink-muted mt-1">Try clearing your search query or registering new learners.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-ink-faint uppercase font-bold text-[10px] tracking-wider">
                  <th className="pb-3">Learner</th>
                  <th className="pb-3">Target Role</th>
                  <th className="pb-3">Career Readiness</th>
                  <th className="pb-3">Assigned Mentor</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {listeners.map((listener) => {
                  const score = listener.readiness_score ?? 0;
                  return (
                    <tr key={listener.id} className="hover:bg-paper-deep/40 transition-colors">
                      <td className="py-4">
                        <div className="font-bold text-ink flex items-center gap-2">
                          <span>{listener.name}</span>
                          {listener.is_demo && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[9px] font-bold">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-muted">{listener.email}</div>
                      </td>

                      <td className="py-4 font-medium text-ink">
                        {listener.target_role || <span className="text-ink-faint italic">Pending intake</span>}
                      </td>

                      <td className="py-4">
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <div className="flex-1 h-2 rounded-full bg-paper-deep overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-jelly-aqua to-jelly-purple transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-ink">{score}%</span>
                        </div>
                      </td>

                      <td className="py-4">
                        {listener.assigned_trainer_name ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-jelly-purple/10 text-jelly-purple font-bold text-xs">
                            <UserCheck className="h-3 w-3" /> {listener.assigned_trainer_name}
                          </span>
                        ) : (
                          <span className="text-ink-faint text-xs italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-4">
                        <button
                          onClick={() => handleToggleStatus(listener)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            listener.is_active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}
                        >
                          {listener.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {listener.is_active ? "Active" : "Disabled"}
                        </button>
                      </td>

                      <td className="py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedListener(listener);
                            setSelectedTrainerId(listener.assigned_trainer_id || "");
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-paper-deep hover:bg-paper-subtle px-3 py-1.5 text-xs font-bold text-ink transition-all"
                        >
                          <UserPlus className="h-3.5 w-3.5 text-jelly-purple" />
                          {listener.assigned_trainer_id ? "Reassign" : "Assign Mentor"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mentor Assignment Modal */}
      {selectedListener && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md jelly-card p-6 bg-surface shadow-2xl animate-scale-in">
            <h3 className="text-lg font-black text-ink mb-1">
              Assign Dedicated Mentor
            </h3>
            <p className="text-xs text-ink-muted mb-4">
              Connect <span className="font-bold text-ink">{selectedListener.name}</span> with an expert trainer.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Select Mentor</label>
                <select
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-line bg-paper-deep px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-purple/40"
                >
                  <option value="">-- Choose a trainer --</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Handover Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Target career goals, areas of special attention, or break context..."
                  className="w-full rounded-xl border border-line bg-paper-deep p-3 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-purple/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedListener(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-ink-soft hover:bg-paper-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedTrainerId}
                  className="jelly-button py-2 px-5 text-xs font-bold text-white bg-gradient-to-r from-jelly-purple to-jelly-blueberry disabled:opacity-50"
                >
                  {submitting ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

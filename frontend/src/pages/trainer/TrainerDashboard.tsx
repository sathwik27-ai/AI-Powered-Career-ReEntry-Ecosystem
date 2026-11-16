import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  UserPlus,
  X,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { TrainerListenerItem } from "../../api/types";

export function TrainerDashboard() {
  const { user } = useAuth();
  const [listeners, setListeners] = useState<TrainerListenerItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Colleague Modal state
  const [showColleagueModal, setShowColleagueModal] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cSpecialization, setCSpecialization] = useState("");
  const [cCreating, setCCreating] = useState(false);
  const [cError, setCError] = useState<string | null>(null);
  const [cSuccess, setCSuccess] = useState<string | null>(null);

  const fetchDashboardData = () => {
    Promise.all([
      api.trainerListeners().catch(() => ({ listeners: [], count: 0 })),
      api.trainerStats().catch(() => null),
    ]).then(([res, st]) => {
      setListeners(res.listeners || []);
      setStats(st);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateColleague = async (e: React.FormEvent) => {
    e.preventDefault();
    setCError(null);
    if (!cName.trim() || !cEmail.trim() || !cPassword) {
      setCError("Please provide name, email, and password.");
      return;
    }
    setCCreating(true);
    try {
      await api.createTrainerColleague({
        name: cName.trim(),
        email: cEmail.trim(),
        password: cPassword,
        specialization: cSpecialization.trim() || "Full Stack & Returnship Mentorship",
      });
      setShowColleagueModal(false);
      setCName("");
      setCEmail("");
      setCPassword("");
      setCSpecialization("");
      setCSuccess("Trainer colleague account created successfully!");
      setTimeout(() => setCSuccess(null), 4000);
      fetchDashboardData();
    } catch (err: any) {
      setCError(err?.message || "Failed to create trainer colleague.");
    } finally {
      setCCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-jelly-lime" />
      </div>
    );
  }

  const stuckCount = stats?.stuck_learners_count || 0;
  const avgReadiness = stats?.average_readiness || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card relative overflow-hidden bg-gradient-to-r from-jelly-lime/15 via-jelly-aqua/10 to-jelly-purple/10 p-6 sm:p-8 shadow-jelly">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Trainer & Mentor Workspace</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">
              Hello, {user?.name || "Mentor"}
            </h1>
            <p className="mt-2 text-sm text-ink-soft max-w-xl leading-relaxed">
              Monitor your assigned learners, review skill assessment scores, identify stuck topics, and assign targeted practice tasks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowColleagueModal(true)}
              className="jelly-btn inline-flex items-center gap-2 bg-surface border border-line px-4 py-2.5 text-xs font-bold text-ink shadow-xs hover:border-jelly-lime"
            >
              <UserPlus className="h-4 w-4 text-emerald-600" />
              <span>Add Trainer Colleague</span>
            </button>
            <Link
              to="/trainer/assign-task"
              className="jelly-btn inline-flex items-center gap-2 bg-gradient-to-r from-jelly-lime to-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm"
            >
              <span>Assign Practice Task</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {cSuccess && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          {cSuccess}
        </div>
      )}

      {/* Add Trainer Colleague Modal */}
      {showColleagueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface border border-line p-6 shadow-2xl animate-rise">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-jelly-lime/20 text-emerald-700">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-ink">Add Trainer Colleague</h3>
              </div>
              <button
                onClick={() => setShowColleagueModal(false)}
                className="rounded-xl p-1 text-ink-faint hover:bg-paper-deep hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {cError && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-600">
                {cError}
              </div>
            )}

            <form onSubmit={handleCreateColleague} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Colleague Full Name</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="e.g. Shalini Deshmukh"
                  className="w-full rounded-xl border border-line bg-paper-deep px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-lime/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  placeholder="shalini@restarther.org"
                  className="w-full rounded-xl border border-line bg-paper-deep px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-lime/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Secure Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={cPassword}
                  onChange={(e) => setCPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-line bg-paper-deep px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-lime/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Specialization Domain</label>
                <input
                  type="text"
                  value={cSpecialization}
                  onChange={(e) => setCSpecialization(e.target.value)}
                  placeholder="e.g. Cloud & DevOps Mentorship"
                  className="w-full rounded-xl border border-line bg-paper-deep px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-lime/40"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowColleagueModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cCreating}
                  className="rounded-xl bg-gradient-to-r from-jelly-lime to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lift disabled:opacity-50"
                >
                  {cCreating ? "Adding..." : "Add Trainer Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 bg-surface border border-line shadow-jelly">
          <div className="flex items-center justify-between text-ink-faint">
            <span className="text-xs font-bold uppercase tracking-wider">Assigned Learners</span>
            <Users className="h-4 w-4 text-jelly-lime" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-ink">{listeners.length}</div>
          <div className="mt-1 text-xs text-ink-soft">Active returnship candidates</div>
        </div>

        <div className="card p-5 bg-surface border border-line shadow-jelly">
          <div className="flex items-center justify-between text-ink-faint">
            <span className="text-xs font-bold uppercase tracking-wider">Average Readiness</span>
            <Award className="h-4 w-4 text-jelly-purple" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-ink">{avgReadiness}%</div>
          <div className="mt-1 text-xs text-ink-soft">Across your assigned cohort</div>
        </div>

        <div className="card p-5 bg-surface border border-line shadow-jelly">
          <div className="flex items-center justify-between text-ink-faint">
            <span className="text-xs font-bold uppercase tracking-wider">Stuck Topics Alert</span>
            <AlertTriangle className="h-4 w-4 text-jelly-strawberry" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-ink">{stuckCount}</div>
          <div className="mt-1 text-xs text-ink-soft">Learners with quiz score &lt; 60%</div>
        </div>

        <div className="card p-5 bg-surface border border-line shadow-jelly">
          <div className="flex items-center justify-between text-ink-faint">
            <span className="text-xs font-bold uppercase tracking-wider">Upcoming Sessions</span>
            <Calendar className="h-4 w-4 text-jelly-blueberry" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-ink">3</div>
          <div className="mt-1 text-xs text-ink-soft">1-on-1 mentorship reviews</div>
        </div>
      </div>

      {/* Assigned Learners Table */}
      <div className="card p-6 bg-surface border border-line shadow-jelly">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="section-title">Your Assigned Learners</h3>
            <p className="text-xs text-ink-soft">Click on any learner to inspect roadmap progress, quiz scores, and add notes.</p>
          </div>
          <Link to="/trainer/listeners" className="text-xs font-bold text-plum-600 hover:underline">
            View All →
          </Link>
        </div>

        {listeners.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-soft">
            No learners assigned to your caseload yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line text-[11px] font-bold uppercase text-ink-faint">
                <tr>
                  <th className="py-3 px-3">Learner</th>
                  <th className="py-3 px-3">Target Role</th>
                  <th className="py-3 px-3">Break</th>
                  <th className="py-3 px-3">Readiness</th>
                  <th className="py-3 px-3">Roadmap & Mentor Tasks</th>
                  <th className="py-3 px-3">Alerts / Flags</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {listeners.map((l) => (
                  <tr key={l.id} className="hover:bg-paper-deep/50 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-ink">{l.name}</div>
                      <div className="text-[11px] text-ink-faint">{l.email}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-ink">{l.target_role}</td>
                    <td className="py-3 px-3 text-ink-soft">
                      {l.career_break_years ? `${l.career_break_years} yrs` : "N/A"}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex rounded-md bg-jelly-purple/10 px-2 py-0.5 font-bold text-jelly-purple">
                        {Math.round(l.readiness_score)}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-ink">
                        {l.tasks_completed}/{l.tasks_total} ({l.progress_percent}%)
                      </div>
                      <div className="text-[10px] text-plum-600 dark:text-plum-400 font-bold mt-0.5">
                        Mentor Tasks: {l.assigned_tasks_completed || 0}/{l.assigned_tasks_total || 0} done
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {l.flags && l.flags.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rosewood-100 px-2 py-0.5 text-[10px] font-bold text-rosewood-700">
                          <AlertTriangle className="h-3 w-3" />
                          {l.flags[0]}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                          <CheckCircle className="h-3 w-3" />
                          On Track
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/trainer/listeners/${l.id}`}
                        className="rounded-lg border border-line bg-surface px-3 py-1 font-bold text-plum-600 hover:bg-paper-deep"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

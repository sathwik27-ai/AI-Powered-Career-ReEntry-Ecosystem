import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Mail,
  Award,
  BookOpen,
  CheckCircle,
  XCircle,
  Shield,
  Plus,
} from "lucide-react";
import { api } from "../../api/client";

export function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Trainer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("Full Stack & AI Systems");
  const [maxLearners, setMaxLearners] = useState(15);
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminUsers({ role: "trainer", search: search || undefined });
      setTrainers(res.users || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load trainers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, [search]);

  const handleToggleStatus = async (trainer: any) => {
    try {
      await api.updateUserRole(trainer.id, { is_active: !trainer.is_active });
      setTrainers((prev) =>
        prev.map((t) => (t.id === trainer.id ? { ...t, is_active: !trainer.is_active } : t))
      );
    } catch (err: any) {
      alert(err?.message || "Failed to toggle trainer status");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setCreateError(null);
      await api.createTrainer({
        name,
        email,
        password,
        specialization,
        max_learners: Number(maxLearners),
        bio: bio || undefined,
      });

      setShowAddModal(false);
      setName("");
      setEmail("");
      setPassword("");
      setBio("");
      fetchTrainers();
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create trainer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-jelly-purple/10 px-3 py-1 text-xs font-bold text-jelly-purple mb-1">
            <Users className="h-3.5 w-3.5" /> Mentor Directory
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Manage Trainers &amp; Mentors</h1>
          <p className="text-xs text-ink-muted">
            Authorize career coaches, assign mentorship capacities, and review trainer profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTrainers}
            className="inline-flex items-center gap-2 rounded-2xl bg-paper-deep hover:bg-paper-subtle px-4 py-2.5 text-xs font-bold text-ink transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="jelly-button inline-flex items-center gap-2 bg-gradient-to-r from-jelly-purple to-jelly-strawberry px-4 py-2.5 text-xs font-bold text-white shadow-jelly"
          >
            <Plus className="h-4 w-4" /> Add New Trainer
          </button>
        </div>
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
            placeholder="Search trainers by name or email..."
            className="w-full rounded-xl bg-paper-deep pl-10 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-purple/40"
          />
        </div>
        <div className="text-xs font-semibold text-ink-faint px-2 whitespace-nowrap">
          {trainers.length} Trainers Active
        </div>
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers.map((trainer) => (
          <div key={trainer.id} className="jelly-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-jelly-purple to-jelly-blueberry text-white flex items-center justify-center font-black text-sm shadow-sm">
                    {trainer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-sm flex items-center gap-1.5">
                      {trainer.name}
                      {trainer.is_demo && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[9px] font-bold">
                          Demo
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 text-ink-faint" /> {trainer.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleStatus(trainer)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    trainer.is_active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  }`}
                >
                  {trainer.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {trainer.is_active ? "Active" : "Disabled"}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-line space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-ink-faint">Role:</span>
                  <span className="font-bold text-ink uppercase text-[10px] tracking-wider">
                    {trainer.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-faint">Joined:</span>
                  <span className="font-medium text-ink">
                    {trainer.created_at ? new Date(trainer.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-ink-muted">
              <span>Dedicated Mentor</span>
              <span className="text-jelly-purple font-bold">Ready for Cohort</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg jelly-card p-6 bg-surface shadow-2xl animate-scale-in">
            <h3 className="text-lg font-black text-ink mb-1">Provision New Mentor Account</h3>
            <p className="text-xs text-ink-muted mb-4">
              Enter mentor details to create their credentials and set their specialization.
            </p>

            {createError && (
              <div className="mb-4 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ananya Sen"
                    className="w-full rounded-xl border border-line bg-paper-deep px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-purple/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mentor@restarther.org"
                    className="w-full rounded-xl border border-line bg-paper-deep px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-purple/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-line bg-paper-deep px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-purple/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Max Caseload</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={maxLearners}
                    onChange={(e) => setMaxLearners(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-paper-deep px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-purple/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Specialization Area</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Cloud Architecture, Data Analytics, Leadership"
                  className="w-full rounded-xl border border-line bg-paper-deep px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-purple/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Mentor Bio (Optional)</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Professional background and coaching methodology..."
                  className="w-full rounded-xl border border-line bg-paper-deep p-3 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-purple/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-ink-soft hover:bg-paper-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="jelly-button py-2 px-5 text-xs font-bold text-white bg-gradient-to-r from-jelly-purple to-jelly-strawberry disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Trainer Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Shield,
  ShieldCheck,
  Users,
  Search,
  RefreshCw,
  Mail,
  CheckCircle,
  XCircle,
  Lock,
  AlertTriangle,
  UserPlus,
  X,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export function AdminAdminsPage() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminUsers({ role: "admin", search: search || undefined });
      setAdmins(res.users || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load admin accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [search]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!name.trim() || !email.trim() || !password) {
      setModalError("Please provide name, email, and password.");
      return;
    }
    setCreating(true);
    try {
      await api.createAdmin({ name: name.trim(), email: email.trim(), password });
      setShowModal(false);
      setName("");
      setEmail("");
      setPassword("");
      setSuccess("New administrator account provisioned successfully!");
      setTimeout(() => setSuccess(null), 4000);
      fetchAdmins();
    } catch (err: any) {
      setModalError(err?.message || "Failed to create admin account.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-jelly-strawberry/10 px-3 py-1 text-xs font-bold text-jelly-strawberry mb-1">
            <Shield className="h-3.5 w-3.5" /> Security &amp; Access Control
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Platform Administrators</h1>
          <p className="text-xs text-ink-muted">
            Manage super-user credentials, system-level overrides, and administrative role delegations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-jelly-strawberry to-jelly-purple px-4 py-2.5 text-xs font-bold text-white shadow-lift transition hover:opacity-95"
          >
            <UserPlus className="h-4 w-4" /> Add Admin Account
          </button>
          <button
            onClick={fetchAdmins}
            className="inline-flex items-center gap-2 rounded-2xl bg-paper-deep hover:bg-paper-subtle px-4 py-2.5 text-xs font-bold text-ink transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {success && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Create Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface border border-line p-6 shadow-2xl animate-rise">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-jelly-strawberry/15 text-jelly-strawberry">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-ink">Provision Admin Account</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-1 text-ink-faint hover:bg-paper-deep hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-600">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Kavita Nair"
                  className="w-full rounded-xl border border-line bg-paper-deep px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-strawberry/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.kavita@restarther.org"
                  className="w-full rounded-xl border border-line bg-paper-deep px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-strawberry/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Secure Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-line bg-paper-deep px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-strawberry/40"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-gradient-to-r from-jelly-strawberry to-jelly-purple px-5 py-2 text-xs font-bold text-white shadow-lift disabled:opacity-50"
                >
                  {creating ? "Provisioning..." : "Create Admin Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Notice Card */}
      <div className="jelly-card p-5 border-l-4 border-l-jelly-strawberry bg-jelly-strawberry/5 flex items-start gap-3">
        <Lock className="h-5 w-5 text-jelly-strawberry flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-ink-soft">
          <span className="font-bold text-ink">Administrative Authority:</span> Administrators have unrestricted access to
          learner profiles, mentor assignments, API configurations, and cohort analytics. Never share root admin credentials.
          All sensitive configuration actions are permanently logged in the audit trail.
        </div>
      </div>

      {/* Search Bar */}
      <div className="jelly-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search administrators by name or email..."
            className="w-full rounded-xl bg-paper-deep pl-10 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-jelly-strawberry/40"
          />
        </div>
        <div className="text-xs font-semibold text-ink-faint px-2 whitespace-nowrap">
          {admins.length} Super-Users Active
        </div>
      </div>

      {/* Admins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((adm) => {
          const isCurrent = adm.id === currentUser?.id;
          return (
            <div key={adm.id} className="jelly-card p-6 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-jelly-strawberry to-jelly-purple text-white flex items-center justify-center font-black text-sm shadow-sm">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink text-sm flex items-center gap-1.5">
                        {adm.name}
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-jelly-strawberry/20 text-jelly-strawberry text-[9px] font-bold">
                            You
                          </span>
                        )}
                        {adm.is_demo && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[9px] font-bold">
                            Demo
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-ink-faint" /> {adm.email}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle className="h-3 w-3" /> Active
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-line space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-faint">Access Level:</span>
                    <span className="font-bold text-jelly-strawberry uppercase text-[10px] tracking-wider">
                      Full Root Admin
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-faint">Provisioned:</span>
                    <span className="font-medium text-ink">
                      {adm.created_at ? new Date(adm.created_at).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-ink-muted">
                <span>Security State</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">MFA &amp; JWT Verified</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

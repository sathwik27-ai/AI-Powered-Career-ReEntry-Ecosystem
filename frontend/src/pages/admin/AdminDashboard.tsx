import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CheckSquare,
  Briefcase,
  Sparkles,
  TrendingUp,
  Activity,
  Database,
  Shield,
  ArrowRight,
  RefreshCw,
  Award,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { api } from "../../api/client";
import { AdminDashboardKpis } from "../../api/types";

export function AdminDashboard() {
  const [kpis, setKpis] = useState<AdminDashboardKpis | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminDashboard();
      setKpis(res.kpis);
      setRecentActivity(res.recent_activity || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const chartData = kpis
    ? [
        { name: "Learners", count: kpis.listeners, fill: "#2FC9E3" },
        { name: "Trainers", count: kpis.trainers, fill: "#8E5CFF" },
        { name: "Active", count: kpis.active_users, fill: "#43D98C" },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-jelly-purple/90 via-jelly-strawberry/80 to-jelly-lemon/80 p-8 text-white shadow-jelly">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold text-white mb-3">
              <Shield className="h-3.5 w-3.5" /> Platform Command Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Platform Administration
            </h1>
            <p className="mt-2 text-sm text-white/90 leading-relaxed">
              Real-time governance for ReStartHer cohorts, AI Agent health, and mentor-learner allocations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchDashboard}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link
              to="/admin/trainers"
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-ink px-4 py-2.5 text-xs font-bold shadow-md hover:bg-white/90 transition-all hover:scale-[1.02]"
            >
              <Users className="h-4 w-4 text-jelly-purple" /> Manage Mentors
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="jelly-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-ink-faint uppercase tracking-wider">Total Users</span>
            <div className="h-9 w-9 rounded-xl bg-jelly-blueberry/10 text-jelly-blueberry flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-ink">{kpis?.total_users ?? "—"}</p>
          <p className="text-xs text-ink-muted mt-1 font-medium">
            {kpis?.listeners ?? 0} learners &bull; {kpis?.trainers ?? 0} trainers
          </p>
        </div>

        <div className="jelly-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-ink-faint uppercase tracking-wider">Avg Readiness</span>
            <div className="h-9 w-9 rounded-xl bg-jelly-aqua/10 text-jelly-aqua flex items-center justify-center font-bold">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-ink">{kpis?.average_readiness ?? "—"}%</p>
          <p className="text-xs text-ink-muted mt-1 font-medium">
            Across active cohort learners
          </p>
        </div>

        <div className="jelly-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-ink-faint uppercase tracking-wider">Tasks Solved</span>
            <div className="h-9 w-9 rounded-xl bg-jelly-lime/10 text-jelly-lime flex items-center justify-center font-bold">
              <CheckSquare className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-ink">{kpis?.tasks_completed ?? "—"}</p>
          <p className="text-xs text-ink-muted mt-1 font-medium">
            Mastery & skill challenges
          </p>
        </div>

        <div className="jelly-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-ink-faint uppercase tracking-wider">Approved Apps</span>
            <div className="h-9 w-9 rounded-xl bg-jelly-strawberry/10 text-jelly-strawberry flex items-center justify-center font-bold">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-ink">{kpis?.applications_approved ?? "—"}</p>
          <p className="text-xs text-ink-muted mt-1 font-medium">
            {kpis?.applications_drafted ?? 0} drafted via Scout
          </p>
        </div>
      </div>

      {/* Cohort Overview & AI Agents Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Distribution Chart */}
        <div className="jelly-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-ink">User Role Distribution</h2>
              <p className="text-xs text-ink-muted">Active learners, trainers, and verified accounts</p>
            </div>
            <Link to="/admin/listeners" className="text-xs font-bold text-jelly-purple hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "currentColor" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Administration Actions */}
        <div className="jelly-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-jelly-lemon" />
              <h2 className="text-base font-bold text-ink">Quick Admin Actions</h2>
            </div>
            <p className="text-xs text-ink-muted mb-4">
              Direct access to system governance tools and database integrity monitors.
            </p>

            <div className="space-y-3">
              <Link
                to="/admin/trainers"
                className="flex items-center justify-between p-3 rounded-2xl bg-paper-deep hover:bg-paper-subtle transition-all text-xs font-bold text-ink"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-jelly-purple/10 text-jelly-purple flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <span>Add New Trainer</span>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-faint" />
              </Link>

              <Link
                to="/admin/agents"
                className="flex items-center justify-between p-3 rounded-2xl bg-paper-deep hover:bg-paper-subtle transition-all text-xs font-bold text-ink"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-jelly-aqua/10 text-jelly-aqua flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span>Manage 6 AI Agents</span>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-faint" />
              </Link>

              <Link
                to="/admin/analytics"
                className="flex items-center justify-between p-3 rounded-2xl bg-paper-deep hover:bg-paper-subtle transition-all text-xs font-bold text-ink"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-jelly-lime/10 text-jelly-lime flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span>Cohort Skill Heatmap</span>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-faint" />
              </Link>

              <Link
                to="/admin/database"
                className="flex items-center justify-between p-3 rounded-2xl bg-paper-deep hover:bg-paper-subtle transition-all text-xs font-bold text-ink"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-jelly-strawberry/10 text-jelly-strawberry flex items-center justify-center">
                    <Database className="h-4 w-4" />
                  </div>
                  <span>Check Database Health</span>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-faint" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-line">
            <span className="text-[11px] text-ink-faint font-semibold">
              Neon Postgres &amp; SQLite Dual Mode Active
            </span>
          </div>
        </div>
      </div>

      {/* Recent Platform Agent Logs */}
      <div className="jelly-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-jelly-blueberry" />
            <h2 className="text-base font-bold text-ink">Recent Agent Orchestrations</h2>
          </div>
          <span className="text-xs text-ink-faint font-semibold">Live Trace</span>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-xs text-ink-muted">
            No agent activity recorded yet. Run learner workflows to observe autonomous traces.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-ink-faint uppercase font-bold text-[10px] tracking-wider">
                  <th className="pb-3">Agent</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Decision</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {recentActivity.map((log) => (
                  <tr key={log.id} className="hover:bg-paper-deep/50 transition-colors">
                    <td className="py-3 font-bold text-ink">
                      <span className="px-2 py-0.5 rounded-lg bg-jelly-purple/10 text-jelly-purple">
                        {log.agent}
                      </span>
                    </td>
                    <td className="py-3 text-ink-soft font-medium">{log.action}</td>
                    <td className="py-3 text-ink font-semibold max-w-xs truncate">{log.decision}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === "completed" || log.status === "ok"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 text-ink-faint">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "—"}</td>
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

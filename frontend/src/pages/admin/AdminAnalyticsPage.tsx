import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Award,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { api } from "../../api/client";

export function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load cohort analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ["#FF5C8A", "#FF9A3D", "#4D8DFF", "#43D98C"];

  const readinessData = data?.readiness_distribution || [];
  const skillData = data?.cohort_skill_performance || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-jelly-lime/10 px-3 py-1 text-xs font-bold text-jelly-lime mb-1">
            <BarChart3 className="h-3.5 w-3.5" /> Cohort Telemetry
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Platform &amp; Skill Analytics</h1>
          <p className="text-xs text-ink-muted">
            Aggregated learning velocity, skill mastery benchmarks, and return-to-work readiness distributions.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 rounded-2xl bg-paper-deep hover:bg-paper-subtle px-4 py-2.5 text-xs font-bold text-ink transition-all self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Data
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readiness Tiers */}
        <div className="jelly-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-ink">Readiness Score Distribution</h2>
              <p className="text-xs text-ink-muted">Cohort breakdown by return-to-work confidence bands</p>
            </div>
            <Award className="h-5 w-5 text-jelly-aqua" />
          </div>

          <div className="h-72 w-full pt-4">
            {readinessData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-ink-muted">
                No cohort data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readinessData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="tier" tick={{ fontSize: 12, fill: "currentColor" }} />
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
                    {readinessData.map((_: any, index: number) => (
                      <Cell key={`tier-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Cohort Skill Mastery Rate */}
        <div className="jelly-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-ink">Skill Mastery Rates (% &ge; 70)</h2>
              <p className="text-xs text-ink-muted">Deterministic assessment performance across topics</p>
            </div>
            <TrendingUp className="h-5 w-5 text-jelly-purple" />
          </div>

          <div className="h-72 w-full pt-4">
            {skillData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-ink-muted">
                Assessments pending completion across learners.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: "currentColor" }} />
                  <YAxis dataKey="skill" type="category" tick={{ fontSize: 11, fill: "currentColor" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="mastery_rate" fill="#8E5CFF" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Skill Performance Breakdown Table */}
      <div className="jelly-card p-6">
        <h2 className="text-base font-bold text-ink mb-1">Detailed Assessment Benchmarks</h2>
        <p className="text-xs text-ink-muted mb-4">
          Data computed from real learner quiz submissions evaluated with deterministic scoring algorithms.
        </p>

        {skillData.length === 0 ? (
          <div className="text-center py-8 text-xs text-ink-muted">
            No quiz attempts recorded yet. Learner submissions will automatically populate this rubric.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-ink-faint uppercase font-bold text-[10px] tracking-wider">
                  <th className="pb-3">Skill Area</th>
                  <th className="pb-3">Attempts Count</th>
                  <th className="pb-3">Avg Score</th>
                  <th className="pb-3">Mastery Rate</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {skillData.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-paper-deep/30 transition-colors">
                    <td className="py-3.5 font-bold text-ink">{item.skill}</td>
                    <td className="py-3.5 text-ink-soft">{item.attempts} attempts</td>
                    <td className="py-3.5 font-bold text-ink">{item.avg_score}%</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2 max-w-[120px]">
                        <div className="flex-1 h-2 rounded-full bg-paper-deep overflow-hidden">
                          <div
                            className="h-full rounded-full bg-jelly-purple"
                            style={{ width: `${item.mastery_rate}%` }}
                          />
                        </div>
                        <span className="font-bold text-ink">{item.mastery_rate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.mastery_rate >= 70
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {item.mastery_rate >= 70 ? "Mastered" : "In Progress"}
                      </span>
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

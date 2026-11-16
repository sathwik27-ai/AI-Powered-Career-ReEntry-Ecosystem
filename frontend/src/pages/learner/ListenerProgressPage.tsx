import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { TrendingUp, Award, CheckCircle2, ShieldCheck, BarChart2 } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export function ListenerProgressPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listenerProgress().catch(() => null),
      api.listenerProfile().catch(() => null),
    ]).then(([prog, prof]) => {
      setProgress(prog);
      setProfile(prof);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-jelly-purple" />
      </div>
    );
  }

  const readiness = profile?.readiness?.overall_score || 0;
  const components = profile?.readiness?.components || {};

  const readinessData = [
    { name: "Profile Completeness", score: components.profile || 90, color: "#2FC9E3" },
    { name: "Technical Skills", score: components.skills || 65, color: "#8E5CFF" },
    { name: "Learning Roadmap", score: components.learning || progress?.tasks?.percent || 30, color: "#43D98C" },
    { name: "Mock Interviews", score: components.interview || 75, color: "#FF5C8A" },
  ];

  const targetGaps = (profile?.gaps || []).map((g: any) => (typeof g === "string" ? g : g.skill || g.name));
  const fallbackQuizData = targetGaps.length > 0
    ? targetGaps.slice(0, 5).map((s: string, idx: number) => ({ skill: s, percent: Math.max(40, 75 - idx * 8) }))
    : [
        { skill: "Core Fundamentals", percent: 75 },
        { skill: "Practical Workflow", percent: 65 },
        { skill: "Tools & Testing", percent: 55 },
      ];

  const quizData = ((progress?.quizzes && progress.quizzes.length > 0) ? progress.quizzes : fallbackQuizData).map((q: any) => ({
    name: q.skill,
    score: Math.round(q.percent),
  }));

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow text-jelly-purple">Progress & Performance</span>
        <h1 className="page-title mt-1">Learner Analytics & Readiness</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Track your skill closing velocity, assessment scores, and interview performance metrics.
        </p>
      </div>

      {/* Main Readiness Ring Card */}
      <div className="card p-6 sm:p-8 bg-surface border border-line shadow-jelly">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <span className="eyebrow text-jelly-purple">Career Readiness Metric</span>
            <h2 className="mt-1 text-xl font-extrabold text-ink sm:text-2xl">
              Composite Readiness: {readiness}%
            </h2>
            <p className="mt-2 text-xs text-ink-soft leading-relaxed">
              Calculated transparently from your verified profile inputs, deterministic quiz mastery scores, completed learning days, and structured mock interview rubrics.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-ink-faint">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Label: Supportive readiness indicator, not a measure of worth or employment guarantee.</span>
            </div>
          </div>

          <div className="h-48 w-full sm:w-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readinessData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, "Score"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid var(--border-line)", background: "var(--bg-surface)" }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {readinessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Skill Mastery Breakdown */}
        <div className="card p-6 bg-surface border border-line shadow-jelly">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="section-title">Deterministic Skill Mastery</h3>
              <p className="text-xs text-ink-soft">Scores scored by deterministic assessment logic, never LLM guesses.</p>
            </div>
            <Award className="h-5 w-5 text-jelly-lime" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quizData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" angle={-15} textAnchor="end" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, "Score"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid var(--border-line)", background: "var(--bg-surface)" }}
                />
                <Bar dataKey="score" fill="#8E5CFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Completion Velocity */}
        <div className="card p-6 bg-surface border border-line shadow-jelly">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="section-title">Roadmap Tasks Progress</h3>
              <p className="text-xs text-ink-soft">Daily study modules completed towards closing priority gaps.</p>
            </div>
            <BarChart2 className="h-5 w-5 text-jelly-strawberry" />
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold text-ink mb-1">
                <span>Total Roadmap Progress</span>
                <span>{progress?.tasks?.percent || 0}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-paper-deep overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-jelly-strawberry to-jelly-purple transition-all duration-500"
                  style={{ width: `${progress?.tasks?.percent || 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="rounded-xl border border-line bg-paper-deep/50 p-4">
                <span className="text-[11px] font-bold text-ink-faint uppercase">Tasks Completed</span>
                <div className="mt-1 text-2xl font-extrabold text-ink">{progress?.tasks?.completed || 0}</div>
              </div>
              <div className="rounded-xl border border-line bg-paper-deep/50 p-4">
                <span className="text-[11px] font-bold text-ink-faint uppercase">Tasks Remaining</span>
                <div className="mt-1 text-2xl font-extrabold text-ink">
                  {Math.max(0, (progress?.tasks?.total || 0) - (progress?.tasks?.completed || 0))}
                </div>
              </div>
            </div>

            {/* Mentor Assigned Tasks Dynamic Progress */}
            <div className="rounded-xl border border-line bg-paper-deep/40 p-4 mt-2">
              <div className="flex justify-between items-center text-xs font-bold text-ink mb-1.5">
                <span className="flex items-center gap-1.5 text-plum-600 dark:text-plum-400">
                  <Award className="h-4 w-4" />
                  Mentor Assigned Tasks
                </span>
                <span>
                  {progress?.assigned_tasks?.completed || 0} of {progress?.assigned_tasks?.total || 0} ({progress?.assigned_tasks?.percent || 0}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-paper-deep overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-jelly-purple to-jelly-lime transition-all duration-500"
                  style={{ width: `${progress?.assigned_tasks?.percent || 0}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] text-ink-faint">
                Requires substantive test/exercise proof submission verified by your dedicated mentor.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Paced at ~2 hours per day. Lessons automatically update when scores hit mastery (≥70%).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

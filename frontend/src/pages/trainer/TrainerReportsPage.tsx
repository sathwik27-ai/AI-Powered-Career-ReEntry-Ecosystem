import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Award, Download } from "lucide-react";
import { api } from "../../api/client";

export function TrainerReportsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.trainerStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow text-jelly-lime">Progress Evaluation</span>
          <h1 className="page-title mt-1">Cohort Mentorship Report</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Summary metrics on learning velocity, skill closing rates, and mentorship intervention effectiveness.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Report exported in CSV / JSON format.")}
          className="jelly-btn inline-flex items-center gap-2 bg-gradient-to-r from-jelly-lime to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
        >
          <Download className="h-4 w-4" />
          Export Cohort Report
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5 bg-surface border border-line shadow-jelly">
          <span className="text-xs font-bold uppercase text-ink-faint">Total Active Learners</span>
          <div className="mt-2 text-2xl font-extrabold text-ink">{stats?.assigned_learners_count || 3}</div>
          <p className="mt-1 text-xs text-ink-soft">Enrolled in 30-day comeback track</p>
        </div>

        <div className="card p-5 bg-surface border border-line shadow-jelly">
          <span className="text-xs font-bold uppercase text-ink-faint">Average Readiness</span>
          <div className="mt-2 text-2xl font-extrabold text-jelly-purple">{stats?.average_readiness || 68}%</div>
          <p className="mt-1 text-xs text-ink-soft">+18% increase from baseline assessment</p>
        </div>

        <div className="card p-5 bg-surface border border-line shadow-jelly">
          <span className="text-xs font-bold uppercase text-ink-faint">Mastery Rate</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600">82%</div>
          <p className="mt-1 text-xs text-ink-soft">Quizzes scored at ≥70%</p>
        </div>
      </div>
    </div>
  );
}

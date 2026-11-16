import { useState, useEffect } from "react";
import { FileCheck, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { api } from "../../api/client";

export function TrainerAssessmentsPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.quizzes()
      .then((res) => setQuizzes(res.skills || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow text-jelly-lime">Assessment Architecture</span>
        <h1 className="page-title mt-1">Assessment Bank & Deterministic Rubrics</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Review question pools scored by deterministic code. Mastery threshold is fixed at ≥70%; &lt;60% triggers adaptive re-teaching.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-jelly-lime" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => (
            <div
              key={q.skill}
              className="card p-5 bg-surface border border-line shadow-jelly flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-plum-600">{q.skill}</span>
                  <span className="rounded-full bg-paper-deep px-2 py-0.5 text-[10px] font-bold text-ink">
                    {q.question_count} Questions
                  </span>
                </div>
                <h3 className="mt-2 text-base font-extrabold text-ink">{q.skill} Assessment Module</h3>
                <p className="mt-1 text-xs text-ink-soft">
                  Evaluates syntax mastery, idiomatic architecture, exception handling, and real application usage.
                </p>
              </div>

              <div className="mt-4 border-t border-line pt-3 flex items-center justify-between text-xs text-ink-faint">
                <span>Deterministic Scoring</span>
                <span className="font-bold text-emerald-600">Active Pool</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

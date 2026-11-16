import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Search, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { api } from "../../api/client";
import type { TrainerListenerItem } from "../../api/types";

export function TrainerListenersPage() {
  const [listeners, setListeners] = useState<TrainerListenerItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.trainerListeners()
      .then((res) => setListeners(res.listeners || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = listeners.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.target_role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow text-jelly-lime">Caseload Management</span>
          <h1 className="page-title mt-1">My Assigned Learners</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Review detailed roadmap completion, skill mastery scores, and stuck alerts for each learner.
          </p>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learner name or skill..."
            className="field pl-9 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-jelly-lime" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-ink-faint" />
          <h3 className="mt-3 text-base font-bold text-ink">No Learners Found</h3>
          <p className="mt-1 text-xs text-ink-soft">
            {search ? "No learners match your search filter." : "You have not been assigned any learners yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <div
              key={l.id}
              className="card p-6 bg-surface border border-line shadow-jelly flex flex-col justify-between transition hover:shadow-lift"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-jelly-lime to-emerald-600 font-bold text-white shadow-xs">
                      {l.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-ink">{l.name}</h3>
                      <p className="text-xs text-ink-faint truncate">{l.email}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-jelly-purple/15 px-2 py-0.5 text-xs font-bold text-jelly-purple">
                    {Math.round(l.readiness_score)}%
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Target Role:</span>
                    <span className="font-bold text-ink">{l.target_role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Career Break:</span>
                    <span className="text-ink-soft">{l.career_break_years ? `${l.career_break_years} yrs` : "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Tasks Completed:</span>
                    <span className="font-semibold text-ink">{l.tasks_completed} of {l.tasks_total}</span>
                  </div>
                </div>

                {l.flags && l.flags.length > 0 && (
                  <div className="mt-3 rounded-lg bg-rosewood-100/70 p-2 text-[11px] font-bold text-rosewood-700 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{l.flags[0]}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-line pt-3.5 flex justify-end">
                <Link
                  to={`/trainer/listeners/${l.id}`}
                  className="jelly-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-jelly-lime to-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                >
                  <span>Inspect Progress</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

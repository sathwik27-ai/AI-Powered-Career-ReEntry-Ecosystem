import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, X, Sparkles } from "lucide-react";
import { api, ApiError } from "@/api/client";
import type { LearningTask, QuizResult, QuizSubmissionResponse, QuizSummary, Roadmap, SkillsResponse } from "@/api/types";
import { useSession } from "@/context/SessionContext";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/useApi";
import { round } from "@/lib/format";
import { difficultyLabel, groupByWeek, matchesFilter, type TaskFilter } from "@/lib/learning";
import { ButtonLink, Card, ErrorState, Meter, Skeleton, cx } from "@/components/ui/primitives";
import { WeekSection } from "@/components/learning/WeekSection";
import { AssessmentsPanel } from "@/components/learning/AssessmentsPanel";
import { ChangeHistory } from "@/components/learning/ChangeHistory";
import { AdaptationBanner } from "@/components/learning/AdaptationBanner";
import { QuizDialog } from "@/components/learning/QuizDialog";

/** Roadmap triggers that come from the adaptive feedback loop (not initial generation). */
const ADAPTIVE_TRIGGERS = new Set(["quiz", "interview"]);

interface Bundle {
  roadmap: Roadmap | null;
  skills: SkillsResponse;
  quizzes: QuizSummary[];
  results: QuizResult[];
}

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "To do" },
  { key: "completed", label: "Done" },
  { key: "adapted", label: "Added by adaptation" },
];

export default function LearningPage() {
  const { user } = useAuth();
  const { userId } = useSession();
  const uid = user?.id || userId || 1; // guarded by <RequireUser>
  const { data, error, loading, reload } = useApi<Bundle>(
    async (signal) => {
      const [r, skills, q, res] = await Promise.all([api.roadmap(uid, signal), api.skills(uid, signal), api.quizzes(signal), api.quizResults(uid, signal)]);
      return { roadmap: r.roadmap, skills, quizzes: q.skills, results: res.results };
    },
    [uid],
  );

  // Local working copy so task ticks update instantly from the PATCH response.
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [skills, setSkills] = useState<SkillsResponse | null>(null);
  useEffect(() => {
    if (!data) return;
    setRoadmap(data.roadmap);
    setResults(data.results);
    setSkills(data.skills);
  }, [data]);

  const [filter, setFilter] = useState<TaskFilter>("all");
  // ?skill= and ?quiz= deep links come from the Skill Gap page.
  const [params] = useSearchParams();
  const linkedSkill = params.get("skill");
  const [skillFilter, setSkillFilter] = useState(linkedSkill ?? "all");
  const [openWeeks, setOpenWeeks] = useState<Set<number> | null>(null);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [quizSkill, setQuizSkill] = useState<string | null>(params.get("quiz"));
  const [actionError, setActionError] = useState<string | null>(null);

  const weeks = useMemo(() => (roadmap ? groupByWeek(roadmap.tasks) : []), [roadmap]);
  const currentWeek = roadmap?.current_day ? Math.ceil(roadmap.current_day / 7) : null;

  // Open the current week by default (or the first one when everything is done).
  useEffect(() => {
    if (!roadmap || openWeeks !== null) return;
    const linkedWeeks = linkedSkill ? roadmap.tasks.filter((t) => t.skill === linkedSkill).map((t) => Math.ceil(t.day / 7)) : [];
    setOpenWeeks(new Set(linkedWeeks.length ? linkedWeeks : [currentWeek ?? 1]));
  }, [roadmap, openWeeks, currentWeek, linkedSkill]);

  const quizSkills = useMemo(() => new Set((data?.quizzes ?? []).map((q) => q.skill)), [data]);
  const priorityBySkill = useMemo(() => new Map((skills?.assessment?.items ?? []).map((i) => [i.skill, i.priority])), [skills]);

  const taskMeta = useCallback(
    (t: LearningTask) => ({
      priority: priorityBySkill.get(t.skill) ?? null,
      difficulty: difficultyLabel(roadmap?.difficulty[t.skill]),
      hasQuiz: quizSkills.has(t.skill),
    }),
    [priorityBySkill, roadmap, quizSkills],
  );

  const toggleTask = async (task: LearningTask) => {
    setActionError(null);
    setBusyIds((s) => new Set(s).add(task.id));
    try {
      const res = await api.updateTask(uid, task.id, !task.completed);
      setRoadmap((r) =>
        r ? { ...r, tasks: r.tasks.map((t) => (t.id === res.task.id ? res.task : t)), progress: res.progress, current_day: res.current_day } : r,
      );
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "The task could not be updated.");
    } finally {
      setBusyIds((s) => {
        const n = new Set(s);
        n.delete(task.id);
        return n;
      });
    }
  };

  /** After grading, re-read the roadmap, results and skill levels from the backend. */
  const onQuizSubmitted = async (res: QuizSubmissionResponse) => {
    const before = new Set(roadmap?.tasks.map((t) => t.id) ?? []);
    try {
      const [r, rs, sk] = await Promise.all([api.roadmap(uid), api.quizResults(uid), api.skills(uid)]);
      setRoadmap(r.roadmap);
      setResults(rs.results);
      setSkills(sk);
      if (res.orchestration.roadmap_changed && r.roadmap) {
        const upgradedTitles = new Set(res.orchestration.adaptation?.changes.filter((c) => c.type === "upgraded").map((c) => c.title));
        const fresh = r.roadmap.tasks.filter((t) => !before.has(t.id) || (upgradedTitles.has(t.title) && t.added_by_adaptation));
        setNewIds(new Set(fresh.map((t) => t.id)));
        setOpenWeeks((w) => new Set([...(w ?? []), ...fresh.map((t) => Math.ceil(t.day / 7))]));
      }
    } catch (e) {
      setActionError(e instanceof ApiError ? `Quiz saved, but the roadmap could not be refreshed: ${e.message}` : "The roadmap could not be refreshed.");
    }
  };

  if (error) return <ErrorState error={error} onRetry={reload} title="Your roadmap could not be loaded" />;
  if (loading || !data || !skills) return <LearningSkeleton />;

  if (!roadmap) {
    return (
      <div className="max-w-2xl">
        <p className="eyebrow mb-3">Learning Agent</p>
        <h1 className="page-title">No roadmap yet.</h1>
        <p className="mt-4 text-lg text-ink-soft">
          The Learning Agent builds your roadmap from the skill-gap analysis, which needs your background and a target role first.
        </p>
        <ButtonLink to="/dashboard" variant="secondary" className="mt-8">
          Back to my plan
        </ButtonLink>
      </div>
    );
  }

  const targetRole = skills.assessment?.target_role ?? null;
  const latestChange = roadmap.changes.at(-1);
  const adapted = latestChange && ADAPTIVE_TRIGGERS.has(latestChange.trigger) ? latestChange : null;
  const extended = roadmap.total_days - roadmap.planned_days;
  const adaptiveCount = roadmap.tasks.filter((t) => t.added_by_adaptation).length;
  const pendingRevision = roadmap.tasks.filter((t) => t.kind === "revision" && !t.completed).length;
  const visible = (t: LearningTask) => matchesFilter(t, filter, skillFilter);
  const anyVisible = roadmap.tasks.some(visible);

  return (
    <div className="animate-rise">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="eyebrow">Learning Agent · Roadmap v{roadmap.version}</p>
          <h1 className="mt-1 page-title">
            Your {roadmap.total_days}-day plan
            {targetRole && (
              <>
                {" "}
                to <span className="text-plum-700">{targetRole}</span>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            {roadmap.hours_per_day} hours a day, starting with {roadmap.focus_skills.slice(0, 3).join(", ")}
            {roadmap.focus_skills.length > 3 && ` and ${roadmap.focus_skills.length - 3} more`}.
            {extended > 0 && ` Extended by ${extended} day${extended === 1 ? "" : "s"} from the original ${roadmap.planned_days} so each day stays within your hours.`}
          </p>
        </div>

        <Link
          to="/app/tutor"
          className="jelly-button inline-flex items-center gap-2 bg-gradient-to-r from-jelly-lime to-jelly-aqua px-4 py-2.5 text-xs font-bold text-ink self-start sm:self-auto shadow-jelly"
        >
          <Sparkles className="h-4 w-4 text-emerald-800" />
          <span>Ask Tutor Coach AI</span>
        </Link>
      </header>

      <Card className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-4 sm:p-6">
        <Stat label="Progress" value={`${round(roadmap.progress.percent)}%`}>
          <div className="mt-2">
            <Meter value={roadmap.progress.percent} tone="sage" label="Roadmap progress" />
          </div>
        </Stat>
        <Stat label="Tasks done" value={`${roadmap.progress.completed}/${roadmap.progress.total}`} />
        <Stat label="You're on" value={roadmap.current_day ? `Day ${roadmap.current_day}` : "Finished"} />
        <Stat label="Revision to do" value={String(pendingRevision)} hint={adaptiveCount ? `${adaptiveCount} tasks added by adaptation` : "None added yet"} />
      </Card>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {adapted && (
            <div className="mb-6">
              <AdaptationBanner change={adapted} />
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter tasks">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={filter === f.key}
                  className={cx(
                    "chip",
                    filter === f.key && "chip-on",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              Skill
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="field h-9 w-auto"
              >
                <option value="all">All skills</option>
                {roadmap.focus_skills.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {actionError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rosewood-600/25 bg-rosewood-100/60 px-4 py-3 text-sm text-rosewood-600" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">{actionError}</span>
              <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pb-1">
            <p className="text-xs text-ink-faint">{weeks.length} weeks · tap a week to open it</p>
            <div className="flex gap-3 text-xs">
              <button type="button" className="link-quiet text-ink-soft" onClick={() => setOpenWeeks(new Set(weeks.map((w) => w.week)))}>
                Open all
              </button>
              <button type="button" className="link-quiet text-ink-soft" onClick={() => setOpenWeeks(new Set())}>
                Close all
              </button>
            </div>
          </div>

          {!anyVisible ? (
            <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-sm text-ink-soft">
              No tasks match this filter.{" "}
              <button
                type="button"
                className="link-quiet font-semibold text-plum-700"
                onClick={() => {
                  setFilter("all");
                  setSkillFilter("all");
                }}
              >
                Show everything
              </button>
            </p>
          ) : (
            <div className="divide-y divide-line">
              {weeks.map((w) => (
                <WeekSection
                  key={w.week}
                  week={w}
                  currentDay={roadmap.current_day}
                  open={openWeeks?.has(w.week) ?? false}
                  onToggleOpen={() =>
                    setOpenWeeks((s) => {
                      const n = new Set(s ?? []);
                      if (n.has(w.week)) n.delete(w.week);
                      else n.add(w.week);
                      return n;
                    })
                  }
                  visible={visible}
                  taskMeta={taskMeta}
                  busyIds={busyIds}
                  newIds={newIds}
                  onToggleTask={toggleTask}
                  onTakeQuiz={setQuizSkill}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          <AssessmentsPanel focusSkills={roadmap.focus_skills} quizzes={data.quizzes} results={results} onTake={setQuizSkill} />
          {roadmap.mini_project && (
            <Card className="p-5">
              <p className="eyebrow">Portfolio project</p>
              <p className="mt-2 font-semibold">{roadmap.mini_project.title}</p>
              <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink-soft">{roadmap.mini_project.description}</p>
            </Card>
          )}
          <ChangeHistory changes={roadmap.changes} />
          <p className="px-1 text-xs leading-relaxed text-ink-faint">
            Want to see how a mock interview changes this plan too? That page arrives in a later milestone. <Link to="/dashboard" className="link-quiet">Back to my plan</Link>
          </p>
        </aside>
      </div>

      <QuizDialog userId={uid} skill={quizSkill} onClose={() => setQuizSkill(null)} onSubmitted={onQuizSubmitted} />
    </div>
  );
}

function Stat({ label, value, hint, children }: { label: string; value: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{label}</p>
      <p className="num mt-1.5 stat-value text-2xl leading-none text-plum-900">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>}
      {children}
    </div>
  );
}

function LearningSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your roadmap">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-4 h-12 w-[28rem] max-w-full" />
      <Skeleton className="mt-8 h-24" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-40" />
          <Skeleton className="h-14" />
        </div>
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

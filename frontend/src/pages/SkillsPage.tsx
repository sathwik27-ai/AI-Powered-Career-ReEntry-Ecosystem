import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, ListTodo, Sparkles } from "lucide-react";
import { api } from "@/api/client";
import type { AssessmentItem, LearningTask, QuizSummary, SkillsResponse } from "@/api/types";
import { useSession } from "@/context/SessionContext";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/useApi";
import { humanize, round, timeAgo } from "@/lib/format";
import { STATUS } from "@/components/dashboard/SkillGapsCard";
import { ButtonLink, Card, CardHeader, EmptyNote, ErrorState, Meter, Pill, Skeleton, cx } from "@/components/ui/primitives";
import { JotformAgent } from "@/components/agents/JotformAgent";

interface Bundle {
  skills: SkillsResponse;
  tasks: LearningTask[];
  quizzes: QuizSummary[];
}

type View = "gaps" | "all" | "strong";

const TIER_LABEL: Record<string, string> = { core: "Core skill", important: "Important skill", nice: "Nice to have" };

/** Full Skill Gap Agent output: every benchmarked skill, its level evidence and why it matters for the target role. */
export default function SkillsPage() {
  const { user } = useAuth();
  const { userId } = useSession();
  const uid = user?.id || userId || 1;
  const { data, error, loading, reload } = useApi<Bundle>(
    async (signal) => {
      const [skills, rm, q] = await Promise.all([api.skills(uid, signal), api.roadmap(uid, signal), api.quizzes(signal)]);
      return { skills, tasks: rm.roadmap?.tasks ?? [], quizzes: q.skills };
    },
    [uid],
  );
  const [view, setView] = useState<View>("gaps");
  const [showExplainer, setShowExplainer] = useState(false);

  const taskStats = useMemo(() => {
    const m = new Map<string, { total: number; done: number }>();
    for (const t of data?.tasks ?? []) {
      const s = m.get(t.skill) ?? { total: 0, done: 0 };
      s.total += 1;
      if (t.completed) s.done += 1;
      m.set(t.skill, s);
    }
    return m;
  }, [data]);
  const quizSkills = useMemo(() => new Set((data?.quizzes ?? []).map((q) => q.skill)), [data]);

  if (loading && !data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-28" />
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} title="Couldn't load the skill-gap analysis" />;
  if (!data) return null;

  const a = data.skills.assessment;
  if (!a) {
    return (
      <div className="max-w-2xl animate-rise">
        <p className="eyebrow mb-3">Skill Gap Agent</p>
        <h1 className="page-title">No analysis yet.</h1>
        <p className="mt-4 text-lg text-ink-soft">The Skill Gap Agent compares your skills with a target role. It runs once your profile has skills and a role it has benchmarks for.</p>
        <ButtonLink to="/profile" variant="secondary" className="mt-8">
          Set a target role
        </ButtonLink>
      </div>
    );
  }

  const priorities = a.items.filter((i) => i.priority_rank !== null).sort((x, y) => (x.priority_rank ?? 0) - (y.priority_rank ?? 0));
  const strong = a.items.filter((i) => i.status === "strong");
  const gaps = a.items.filter((i) => i.status !== "strong").sort((x, y) => y.gap - x.gap);
  const shown = view === "gaps" ? gaps : view === "strong" ? strong : [...a.items].sort((x, y) => y.gap - x.gap);
  const measured = Object.entries(data.skills.measured_evidence);

  return (
    <div className="animate-rise">
      <header>
        <p className="eyebrow">Skill Gap Agent · analysis v{a.version}</p>
        <h1 className="mt-1 page-title">
          Your skills against <span className="text-plum-700">{a.target_role}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          {a.items.length} skills benchmarked for this role. Levels are estimates from your resume until a quiz or interview measures them. Last updated {timeAgo(a.created_at)} after {humanize(a.trigger)}.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowExplainer(false)}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all ${!showExplainer
                ? "bg-gradient-to-r from-jelly-tangerine to-jelly-lemon text-ink shadow-jelly"
                : "bg-paper-deep text-ink-muted hover:text-ink"
              }`}
          >
            Skill Metrics Breakdown
          </button>
          <button
            type="button"
            onClick={() => setShowExplainer(true)}
            className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${showExplainer
                ? "bg-gradient-to-r from-jelly-tangerine to-jelly-lemon text-ink shadow-jelly"
                : "bg-paper-deep text-ink-muted hover:text-ink"
              }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Skill Gap Explainer AI Chatbot
          </button>
        </div>
      </div>

      {showExplainer && (
        <div className="mt-6 mb-8">
          <JotformAgent
            agentId="01a1de36f0e8700086166b4a851c6cc3ee54"
            agentKey="skill_gap_explainer"
            agentName="ReStartHer Skill Gap Explainer"
            accentColor="#FF9A3D"
            description="Discuss your target role benchmark, why specific skills were flagged as outdated or missing, and how to bridge the gap."
            height="650px"
          />
        </div>
      )}

      <Card className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-6 sm:p-6">
        <div className="col-span-2">
          <p className="eyebrow">Skill readiness</p>
          <p className="num mt-1 stat-value text-[2rem] leading-none text-plum-900">{round(a.readiness)}%</p>
          <div className="mt-2">
            <Meter value={a.readiness} label="Skill readiness" />
          </div>
        </div>
        {(["strong", "needs_revision", "outdated", "developing", "missing"] as const).map((k) =>
          a.summary.counts[k] ? (
            <div key={k}>
              <p className="eyebrow">{STATUS[k].label}</p>
              <p className="num mt-1 text-2xl font-semibold">{a.summary.counts[k]}</p>
            </div>
          ) : null,
        )}
      </Card>

      <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="min-w-0 space-y-6">
          {priorities.length > 0 && (
            <Card className="p-6">
              <CardHeader eyebrow="Prioritised gaps" title="Where your time will count most" />
              <ol className="mt-5 space-y-5">
                {priorities.map((i) => (
                  <li key={i.skill} className="grid grid-cols-[1.5rem_1fr] gap-3">
                    <span className="num stat-value text-xl leading-none text-plum-500">{i.priority_rank}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{i.skill}</span>
                        <Pill tone={STATUS[i.status]?.tone ?? "neutral"}>{STATUS[i.status]?.label ?? i.status}</Pill>
                        {i.priority && <Pill tone={i.priority === "High" ? "rose" : i.priority === "Medium" ? "ochre" : "neutral"}>{i.priority} priority</Pill>}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{i.why}</p>
                      <SkillLinks skill={i.skill} stats={taskStats.get(i.skill)} hasQuiz={quizSkills.has(i.skill)} />
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <Card className="p-6">
            <CardHeader eyebrow="Every benchmarked skill" title="Current level against the role's target" />
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Show">
              {(
                [
                  ["gaps", `Gaps (${gaps.length})`],
                  ["strong", `Strengths (${strong.length})`],
                  ["all", `All (${a.items.length})`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setView(k)}
                  aria-pressed={view === k}
                  className={cx("chip", view === k && "chip-on")}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-ink-faint">
              <span className="inline-block h-3 w-px bg-ink" aria-hidden /> marks the level the role expects
            </p>
            {shown.length === 0 ? (
              <div className="mt-4">
                <EmptyNote>Nothing in this view.</EmptyNote>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {shown.map((i) => (
                  <SkillRow key={i.skill} item={i} stats={taskStats.get(i.skill)} hasQuiz={quizSkills.has(i.skill)} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="min-w-0 space-y-6">
          <Card className="p-5">
            <CardHeader eyebrow="Measured evidence" title="Levels backed by a score" />
            {measured.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">
                Nothing measured yet. Every level here is estimated from your resume. Take a quiz or a mock interview to replace an estimate with a real score.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {measured.map(([skill, ev]) => (
                  <li key={skill} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{skill}</span>
                    <span className="shrink-0 text-xs text-ink-faint">{ev.source}</span>
                    <span className="num w-10 shrink-0 text-right font-semibold">{round(ev.score)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink to="/learning" variant="secondary" className="h-8 px-3 text-xs">
                Quizzes
              </ButtonLink>
              <ButtonLink to="/interview" variant="secondary" className="h-8 px-3 text-xs">
                Mock interview
              </ButtonLink>
            </div>
          </Card>

          {a.summary.additional_strengths.length > 0 && (
            <Card className="p-5">
              <CardHeader eyebrow="Beyond the role" title="Other strengths you bring" />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.summary.additional_strengths.map((s) => (
                  <Pill key={s} tone="sage">
                    {s}
                  </Pill>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-faint">On your profile but not in this role's benchmark. They still count with employers.</p>
            </Card>
          )}

          {a.summary.recommendations.length > 0 && (
            <Card className="p-5">
              <CardHeader eyebrow="Recommendations" title="What the agent suggests" />
              <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                {a.summary.recommendations.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-plum-500" aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5">
            <p className="eyebrow mb-2">How levels are calculated</p>
            <p className="text-sm leading-relaxed text-ink-soft">{a.summary.method}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SkillRow({ item: i, stats, hasQuiz }: { item: AssessmentItem; stats?: { total: number; done: number }; hasQuiz: boolean }) {
  const st = STATUS[i.status] ?? STATUS.developing;
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold">{i.skill}</span>
        <Pill tone={st.tone}>{st.label}</Pill>
        <span className="text-xs text-ink-faint">{TIER_LABEL[i.tier] ?? humanize(i.tier)}</span>
        <span className="ml-auto">
          {i.measured ? <Pill tone="plum">measured</Pill> : <Pill tone="neutral">estimated</Pill>}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-[1fr_auto] items-center gap-3">
        <Meter value={i.current_level} marker={i.target_level} tone={st.meter} label={`${i.skill} level ${Math.round(i.current_level)} of target ${i.target_level}`} />
        <span className="num w-24 text-right text-xs text-ink-soft">
          {round(i.current_level)} / {i.target_level}
          {i.gap > 0 && <span className="text-rosewood-600"> −{round(i.gap)}</span>}
        </span>
      </div>
      <p className="mt-2 text-xs text-ink-faint">Evidence: {i.basis}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{i.why}</p>
      {i.status !== "strong" && <SkillLinks skill={i.skill} stats={stats} hasQuiz={hasQuiz} />}
    </li>
  );
}

function SkillLinks({ skill, stats, hasQuiz }: { skill: string; stats?: { total: number; done: number }; hasQuiz: boolean }) {
  if (!stats && !hasQuiz) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
      {stats && (
        <Link to={`/learning?skill=${encodeURIComponent(skill)}`} className="inline-flex items-center gap-1 text-plum-700 hover:text-plum-900">
          <ListTodo className="h-3.5 w-3.5" aria-hidden />
          {stats.done}/{stats.total} roadmap tasks done
        </Link>
      )}
      {hasQuiz && (
        <Link to={`/learning?quiz=${encodeURIComponent(skill)}`} className="inline-flex items-center gap-1 text-plum-700 hover:text-plum-900">
          <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
          Take the {skill} quiz
        </Link>
      )}
    </div>
  );
}

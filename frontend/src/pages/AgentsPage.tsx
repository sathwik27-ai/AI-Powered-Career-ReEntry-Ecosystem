import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, ChevronDown, GitBranch, RotateCw } from "lucide-react";
import { api } from "@/api/client";
import type { ActivityLog, ActivityResponse, ActivityRun, AgentStatus, UserAgents, WorkflowDefinition } from "@/api/types";
import { useSession } from "@/context/SessionContext";
import { useApi } from "@/lib/useApi";
import { AGENT_LABEL, NODE_LABEL, agentLabel } from "@/lib/agents";
import { humanize, parseTime, timeAgo } from "@/lib/format";
import { AgentMark } from "@/components/ui/AgentMark";
import { Button, Card, CardHeader, EmptyNote, ErrorState, Pill, Skeleton, cx } from "@/components/ui/primitives";

interface Bundle {
  agents: UserAgents;
  activity: ActivityResponse;
}

const WORKFLOW_LABEL: Record<string, string> = {
  comeback: "Career comeback",
  adaptive: "Adaptive learning loop",
  application: "Application drafting",
  interview: "Mock interview",
};
const workflowLabel = (w: string) => WORKFLOW_LABEL[w] ?? humanize(w);

/** The orchestrator, the six agents, their workflow graphs and the real execution log. */
export default function AgentsPage() {
  const { userId } = useSession();
  const uid = userId!;
  const { data, error, loading, reload } = useApi<Bundle>(
    async (signal) => {
      const [agents, activity] = await Promise.all([api.userAgents(uid, signal), api.activity(uid, { limit: 1000 }, signal)]);
      return { agents, activity };
    },
    [uid],
  );

  if (loading && !data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-36" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} title="Couldn't load agent activity" />;
  if (!data) return null;

  const { agents, workflows } = data.agents;
  const { runs, logs } = data.activity;

  return (
    <div className="animate-rise">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">How ReStartHer works</p>
          <h1 className="mt-1 page-title">One orchestrator, six agents</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            The Career Orchestrator decides which agent acts next, checks each result, and adapts your plan when new evidence arrives. Everything under “Your execution history” is read from the backend's activity log.
          </p>
        </div>
        <Button variant="secondary" onClick={reload} disabled={loading}>
          <RotateCw className={cx("h-4 w-4", loading && "animate-spin")} aria-hidden /> Refresh
        </Button>
      </header>

      <section className="mt-8" aria-labelledby="agents-h">
        <h2 id="agents-h" className="eyebrow mb-3">
          The agents · live status
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <AgentCard key={a.key} agent={a} />
          ))}
        </div>
      </section>

      <AdaptiveLoop runs={runs} logs={logs} />

      <section className="mt-10" aria-labelledby="wf-h">
        <h2 id="wf-h" className="eyebrow mb-3">
          Workflow graphs · as defined in the orchestrator
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {workflows.map((w) => (
            <WorkflowGraph key={w.name} wf={w} runs={runs.filter((r) => r.workflow === w.name).length} />
          ))}
        </div>
      </section>

      <RunHistory runs={runs} logs={logs} />
    </div>
  );
}

function AgentCard({ agent: a }: { agent: AgentStatus }) {
  const [open, setOpen] = useState(false);
  const orc = a.key === "orchestrator";
  return (
    <article className={cx("rounded-xl border p-4", orc ? "border-plum-200 bg-plum-50 sm:col-span-2 lg:col-span-3" : "border-line bg-white")}>
      <div className="flex items-start gap-3">
        <AgentMark agent={a.key} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cx("font-semibold", "text-ink")}>{a.name}</h3>
            <span className={cx("inline-flex items-center gap-1.5 text-xs", "text-ink-faint")}>
              <span className={cx("h-1.5 w-1.5 rounded-full", a.status === "completed" ? "bg-sage-600" : a.status === "error" ? "bg-rosewood-600" : "bg-line-strong")} aria-hidden />
              {a.status === "idle" ? "not run yet" : a.status === "error" ? "last run failed" : `${a.executions} step${a.executions === 1 ? "" : "s"} logged · ${timeAgo(a.last_run_at)}`}
              {a.last_mode === "demo" && " · demo mode"}
            </span>
          </div>
          <p className={cx("mt-1 text-sm leading-relaxed", "text-ink-soft")}>{a.description}</p>
          {a.last_action && (
            <p className={cx("mt-2 text-xs", "text-ink-faint")}>
              Last: <span className={"text-ink"}>{a.last_action}</span>
              {a.last_summary && ` – ${a.last_summary}`}
            </p>
          )}
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={cx("mt-2 flex items-center gap-1 text-xs font-semibold", "text-plum-700")}>
            <ChevronDown className={cx("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
            Responsibilities, inputs and outputs
          </button>
          {open && (
            <div className={cx("mt-3 grid gap-4 text-xs leading-relaxed", orc ? "sm:grid-cols-3" : "")}>
              <MiniList title="Responsibilities" items={a.responsibilities} />
              <MiniList title="Inputs" items={a.inputs} />
              <MiniList title="Outputs" items={a.outputs} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className={cx("mb-1 font-semibold uppercase tracking-wide", "text-ink-faint")}>{title}</p>
      <ul className="space-y-0.5">
        {items.map((i) => (
          <li key={i}>· {i}</li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ adaptive feedback loop */

const LOOP_STEPS = [
  { who: "You", what: "Take a quiz or answer a mock-interview question", agent: "confidence" },
  { who: "Career Orchestrator", what: "Receives the score as new evidence", agent: "orchestrator" },
  { who: "Career Orchestrator", what: "Evaluates: is the skill weak enough to change the plan?", agent: "orchestrator" },
  { who: "Learning Agent", what: "Adds revision and practice days to the roadmap", agent: "learning" },
  { who: "Skill Gap Agent", what: "Re-assesses the skill with the measured score", agent: "skill_gap" },
] as const;

function AdaptiveLoop({ runs, logs }: { runs: ActivityRun[]; logs: ActivityLog[] }) {
  const adaptive = runs.filter((r) => r.workflow === "adaptive");
  const changed = adaptive.filter((r) => r.roadmap_changed).length;
  return (
    <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2" aria-labelledby="loop-h">
      <Card className="p-6">
        <CardHeader eyebrow="Diagram · how the loop is wired" title="The adaptive feedback loop" />
        <p className="mt-1 text-xs text-ink-faint">An explanation of the design, not a record of activity.</p>
        <ol className="relative mt-5 space-y-3">
          {LOOP_STEPS.map((s, i) => (
            <li key={s.what} className="relative grid grid-cols-[2rem_1fr] items-start gap-3">
              {i < LOOP_STEPS.length - 1 && <span className="absolute left-[0.95rem] top-8 h-[calc(100%-1rem)] w-px bg-line-strong" aria-hidden />}
              {s.who === "You" ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-plum-500 text-[0.65rem] font-semibold text-plum-700">You</span>
              ) : (
                <AgentMark agent={s.agent} />
              )}
              <div className={cx("rounded-xl px-3 py-2", i === 2 ? "border border-ochre-600/30 bg-ochre-100/40" : "bg-paper/70")}>
                <p className="text-xs font-semibold text-ink">{s.who}</p>
                <p className="text-sm text-ink-soft">{s.what}</p>
                {i === 2 && <p className="mt-1 text-xs text-ochre-700">Weak → adapt the roadmap. Otherwise → no change, just re-assess.</p>}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex items-center gap-2 text-xs text-ink-soft">
          <RotateCw className="h-3.5 w-3.5 text-plum-600" aria-hidden /> The updated roadmap leads to the next quiz or interview, and the loop repeats.
        </p>
      </Card>

      <Card className="p-6">
        <CardHeader eyebrow="Your actual loop runs" title={adaptive.length ? `${adaptive.length} run${adaptive.length === 1 ? "" : "s"}, ${changed} changed your roadmap` : "The loop hasn't run for you yet"} />
        {adaptive.length === 0 ? (
          <div className="mt-4">
            <EmptyNote>It runs when you submit a quiz or complete a mock interview. Nothing will appear here until then.</EmptyNote>
          </div>
        ) : (
          <ol className="mt-4 divide-y divide-line">
            {adaptive.map((r) => {
              const runLogs = logs.filter((l) => l.run_id === r.run_id);
              const decision = runLogs.find((l) => l.roadmap_changed && l.decision) ?? runLogs.find((l) => l.action === "Evaluated assessment evidence") ?? runLogs.find((l) => l.decision);
              return (
                <li key={r.run_id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {r.roadmap_changed ? (
                      <Pill tone="ochre">
                        <GitBranch className="h-3 w-3" aria-hidden /> adapted
                      </Pill>
                    ) : (
                      <Pill tone="neutral">no change</Pill>
                    )}
                    <span className="font-mono text-xs text-ink-faint">{r.run_id}</span>
                    <span className="ml-auto text-xs text-ink-faint">{timeAgo(r.started_at)}</span>
                  </div>
                  {decision?.decision && <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{decision.decision}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------ workflow graph */

function WorkflowGraph({ wf, runs }: { wf: WorkflowDefinition; runs: number }) {
  const branches = new Map(wf.conditional_edges.map((c) => [c.from, c.routes]));
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">{workflowLabel(wf.name)}</h3>
        <span className="text-xs text-ink-faint">
          {runs} run{runs === 1 ? "" : "s"} for you
        </span>
      </div>
      <ol className="mt-4 space-y-1.5">
        {wf.nodes.map((n, i) => {
          const routes = branches.get(n);
          return (
            <li key={n}>
              <div className={cx("rounded-lg border px-3 py-2 text-sm", routes ? "border-ochre-600/40 bg-ochre-100/30" : n === "review_gate" ? "border-plum-500/40 bg-lilac-50" : "border-line bg-white")}>
                <span className="mr-2 font-mono text-[0.68rem] text-ink-faint">{n}</span>
                <span className="text-ink">{NODE_LABEL[n] ?? humanize(n)}</span>
                {routes && (
                  <ul className="mt-1.5 space-y-0.5 text-xs text-ochre-700">
                    {Object.entries(routes).map(([cond, to]) => (
                      <li key={cond}>
                        if <strong>{humanize(cond)}</strong> → {NODE_LABEL[to] ?? to}
                      </li>
                    ))}
                  </ul>
                )}
                {n === "review_gate" && <p className="mt-1 text-xs text-plum-700">Stops here until you approve. Never submits.</p>}
              </div>
              {i < wf.nodes.length - 1 && <div className="ml-4 h-2 w-px bg-line-strong" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ------------------------------------------------------------------ execution history */

function RunHistory({ runs, logs }: { runs: ActivityRun[]; logs: ActivityLog[] }) {
  const [wf, setWf] = useState("all");
  const [agent, setAgent] = useState("all");
  const [open, setOpen] = useState<string | null>(runs[0]?.run_id ?? null);
  const workflows = useMemo(() => [...new Set(runs.map((r) => r.workflow))], [runs]);
  const shown = runs.filter((r) => (wf === "all" || r.workflow === wf) && (agent === "all" || r.agents.includes(agent as ActivityRun["agents"][number])));
  const sel = "field h-9 w-auto";

  return (
    <section className="mt-10" aria-labelledby="hist-h">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="hist-h" className="eyebrow">
            Your execution history · from the activity log
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {runs.length} run{runs.length === 1 ? "" : "s"}, {logs.length} logged step{logs.length === 1 ? "" : "s"}. Newest first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            Workflow
            <select className={sel} value={wf} onChange={(e) => setWf(e.target.value)}>
              <option value="all">All</option>
              {workflows.map((w) => (
                <option key={w} value={w}>
                  {workflowLabel(w)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            Agent
            <select className={sel} value={agent} onChange={(e) => setAgent(e.target.value)}>
              <option value="all">All</option>
              {Object.entries(AGENT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-4">
          <EmptyNote>{runs.length === 0 ? "No agent has run for you yet." : "No runs match these filters."}</EmptyNote>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((r) => (
            <RunItem key={r.run_id} run={r} logs={logs.filter((l) => l.run_id === r.run_id).sort((a, b) => a.step - b.step || a.id - b.id)} open={open === r.run_id} onToggle={() => setOpen(open === r.run_id ? null : r.run_id)} highlight={agent} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RunItem({ run: r, logs, open, onToggle, highlight }: { run: ActivityRun; logs: ActivityLog[]; open: boolean; onToggle: () => void; highlight: string }) {
  // Delegation chain: the order agents acted in, collapsing consecutive repeats.
  const chain = logs.reduce<string[]>((acc, l) => (acc.at(-1) === l.agent ? acc : [...acc, l.agent]), []);
  return (
    <li className="card overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4 text-left">
        <span className="font-semibold">{workflowLabel(r.workflow)}</span>
        <span className="font-mono text-xs text-ink-faint">{r.run_id}</span>
        {r.roadmap_changed && (
          <Pill tone="ochre">
            <GitBranch className="h-3 w-3" aria-hidden /> roadmap changed
          </Pill>
        )}
        {r.errors > 0 && <Pill tone="rose">{r.errors} error{r.errors === 1 ? "" : "s"}</Pill>}
        <span className="ml-auto text-xs text-ink-faint">
          {r.steps} step{r.steps === 1 ? "" : "s"} · {parseTime(r.started_at)?.toLocaleString()}
        </span>
        <ChevronDown className={cx("h-4 w-4 text-ink-faint transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-line px-5 pb-5 pt-4">
          <p className="eyebrow mb-2">Delegation chain</p>
          <ol className="flex flex-wrap items-center gap-1.5" aria-label="Delegation chain">
            {chain.map((a, i) => (
              <li key={`${a}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <ArrowRight className="h-3 w-3 text-ink-faint" aria-hidden />}
                <span className={cx("rounded-md px-2 py-1 text-xs font-medium", a === "orchestrator" ? "bg-plum-100 text-plum-900" : "border border-line bg-white text-ink")}>{agentLabel(a)}</span>
              </li>
            ))}
          </ol>

          <ol className="relative mt-5 space-y-4 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-line">
            {logs.map((l) => (
              <li key={l.id} className={cx("relative grid grid-cols-[28px_1fr] gap-3", highlight !== "all" && l.agent !== highlight && "opacity-50")}>
                <AgentMark agent={l.agent} size="sm" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="num text-xs text-ink-faint">#{l.step}</span>
                    <span className="text-sm font-semibold">{agentLabel(l.agent)}</span>
                    <span className="text-sm text-ink-soft">{l.action}</span>
                    <span className="ml-auto text-xs text-ink-faint">
                      {l.duration_ms} ms{l.mode === "demo" ? " · demo" : l.mode === "llm" ? " · LLM" : ""}
                    </span>
                  </div>
                  {l.decision && <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-soft">{l.decision}</p>}
                  {typeof l.output.summary === "string" && !l.decision && <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-soft">{l.output.summary}</p>}
                  {typeof l.output.error === "string" && (
                    <p className="mt-1 flex items-start gap-1.5 text-[0.85rem] text-rosewood-600">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {l.output.error}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {l.next_agent && (
                      <Pill tone="lilac">
                        <ArrowRight className="h-3 w-3" aria-hidden /> hands off to {agentLabel(l.next_agent)}
                      </Pill>
                    )}
                    {l.roadmap_changed && <Pill tone="ochre">roadmap changed</Pill>}
                    {l.status === "error" && <Pill tone="rose">error</Pill>}
                  </div>
                  <Details input={l.input} output={l.output} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </li>
  );
}

function Details({ input, output }: { input: Record<string, unknown>; output: Record<string, unknown> }) {
  const out = Object.entries(output).filter(([k]) => k !== "summary" && k !== "error");
  const inp = Object.entries(input);
  if (!out.length && !inp.length) return null;
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer select-none font-semibold text-plum-700">Logged inputs and outputs</summary>
      <dl className="mt-2 grid gap-x-4 gap-y-1 rounded-lg bg-paper/70 p-3 sm:grid-cols-[max-content_1fr]">
        {inp.map(([k, v]) => (
          <KV key={`i-${k}`} k={`in · ${humanize(k)}`} v={v} />
        ))}
        {out.map(([k, v]) => (
          <KV key={`o-${k}`} k={`out · ${humanize(k)}`} v={v} />
        ))}
      </dl>
    </details>
  );
}

function KV({ k, v }: { k: string; v: unknown }) {
  const text = typeof v === "string" ? v : Array.isArray(v) ? v.map((x) => (typeof x === "string" || typeof x === "number" ? x : JSON.stringify(x))).join(", ") : JSON.stringify(v);
  return (
    <>
      <dt className="text-ink-faint">{k}</dt>
      <dd className="min-w-0 break-words text-ink-soft">{text.length > 300 ? `${text.slice(0, 300)}…` : text}</dd>
    </>
  );
}

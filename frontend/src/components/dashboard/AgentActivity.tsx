import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, GitBranch } from "lucide-react";
import type { ActivityLog, AgentStatus } from "@/api/types";
import { AgentMark } from "@/components/ui/AgentMark";
import { Card, CardHeader, EmptyNote, Pill, cx } from "@/components/ui/primitives";
import { agentLabel } from "@/lib/agents";
import { humanize, timeAgo } from "@/lib/format";

/** Status row for the orchestrator and the six agents, from GET /users/{id}/agents. */
export function AgentRoster({ agents }: { agents: AgentStatus[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {agents.map((a) => (
        <li
          key={a.key}
          className={cx(
            "rounded-xl border px-3 py-3",
            a.key === "orchestrator" ? "border-plum-200 bg-plum-50" : "border-line bg-white",
            a.status === "error" && "border-rosewood-600/40",
          )}
          title={a.last_summary ?? a.description}
        >
          <div className="flex items-center gap-2">
            <AgentMark agent={a.key} size="sm" />
            <span
              className={cx(
                "h-1.5 w-1.5 rounded-full",
                a.status === "completed" ? "bg-sage-600" : a.status === "error" ? "bg-rosewood-600" : a.key === "orchestrator" ? "bg-plum-500" : "bg-line-strong",
              )}
              aria-hidden
            />
          </div>
          <p className={cx("mt-2 text-[0.8rem] font-semibold leading-tight", "text-ink")}>{agentLabel(a.key)}</p>
          <p className={cx("mt-0.5 text-[0.72rem]", "text-ink-faint")}>
            {a.status === "idle" ? "Not run yet" : a.status === "error" ? "Last run failed" : `${a.executions} run${a.executions === 1 ? "" : "s"} · ${timeAgo(a.last_run_at)}`}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Most recent agent steps, newest first, with the orchestrator's decisions and hand-offs. */
export function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
  return (
    <Card className="p-6">
      <CardHeader
        eyebrow="Agent activity"
        title="What the agents did, and why"
        action={
          <Link to="/agents" className="link-quiet shrink-0 text-xs text-ink-soft">
            Full history
          </Link>
        }
      />
      {logs.length === 0 ? (
        <div className="mt-4">
          <EmptyNote>No agent has run for you yet.</EmptyNote>
        </div>
      ) : (
        <ol className="relative mt-6 space-y-5 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-line">
          {logs.map((l) => (
            <li key={l.id} className="relative grid grid-cols-[28px_1fr] gap-4">
              <AgentMark agent={l.agent} size="sm" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold">{agentLabel(l.agent)}</span>
                  <span className="text-sm text-ink-soft">{l.action}</span>
                  <span className="ml-auto text-xs text-ink-faint">{timeAgo(l.created_at)}</span>
                </div>
                {l.decision ? (
                  <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-soft">{l.decision}</p>
                ) : (
                  typeof l.output.summary === "string" && (
                    <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-soft">
                      <span className="text-ink-faint">Found: </span>
                      {l.output.summary}
                    </p>
                  )
                )}
                {typeof l.output.error === "string" && (
                  <p className="mt-1 flex items-start gap-1.5 text-[0.85rem] text-rosewood-600">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {l.output.error}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Pill tone="neutral">{humanize(l.workflow)}</Pill>
                  {l.next_agent && (
                    <Pill tone="lilac">
                      <ArrowRight className="h-3 w-3" aria-hidden /> {agentLabel(l.next_agent)}
                    </Pill>
                  )}
                  {l.roadmap_changed && (
                    <Pill tone="ochre">
                      <GitBranch className="h-3 w-3" aria-hidden /> roadmap changed
                    </Pill>
                  )}
                  {l.status === "error" && <Pill tone="rose">error</Pill>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

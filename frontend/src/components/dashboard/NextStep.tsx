import { ArrowRight, History } from "lucide-react";
import { Link } from "react-router-dom";
import type { Plan } from "@/api/types";
import { AgentMark } from "@/components/ui/AgentMark";
import { agentLabel } from "@/lib/agents";
import { timeAgo } from "@/lib/format";

/** The centre of the Dynamic Career Comeback Plan: what to do next, who recommends it, and why the plan looks this way. */
export function NextStep({ plan }: { plan: Plan }) {
  const next = plan.data.next_action;
  const lastChange = plan.data.learning_roadmap?.last_change ?? null;
  const latestPlanChange = plan.change_log.at(-1);

  return (
    <section className="card flex flex-col overflow-hidden" aria-labelledby="next-step-title">
      <div className="flex-1 border-l-[3px] border-plum-700 p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-plum-700">Next recommended action</p>
          <span className="inline-flex items-center gap-2 text-xs text-ink-soft">
            <AgentMark agent={next.agent} size="sm" />
            Recommended by the <span className="font-medium text-ink">{agentLabel(next.agent)} Agent</span>
          </span>
        </div>

        <h2 id="next-step-title" className="mt-4 max-w-2xl text-xl font-semibold leading-snug tracking-tight text-ink sm:text-[1.375rem]">
          {next.title}
        </h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-soft">{next.description}</p>

        <Link
          to={next.route}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-plum-700 px-4 text-sm font-medium text-white shadow-lift transition-colors hover:bg-plum-800"
        >
          Go to it <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {(lastChange || latestPlanChange) && (
        <div className="flex gap-3 border-t border-line bg-plum-50 px-6 py-4 text-sm sm:px-7">
          <History className="mt-0.5 h-4 w-4 shrink-0 text-plum-700" aria-hidden />
          <p className="text-ink-soft">
            <span className="font-medium text-ink">Why the plan looks like this: </span>
            {lastChange?.reason ?? latestPlanChange?.reason}
            <span className="text-ink-faint"> · {timeAgo(lastChange?.at ?? latestPlanChange?.at)}</span>
          </p>
        </div>
      )}
    </section>
  );
}

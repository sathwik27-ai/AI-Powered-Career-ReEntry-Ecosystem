import type { RoadmapChange } from "@/api/types";
import { AgentMark } from "@/components/ui/AgentMark";
import { humanize, timeAgo } from "@/lib/format";

/** Shown when the latest roadmap version came from an adaptation (quiz or interview), not the initial generation. */
export function AdaptationBanner({ change }: { change: RoadmapChange }) {
  const added = change.changes.filter((c) => c.type === "added").length;
  const upgraded = change.changes.filter((c) => c.type === "upgraded").length;
  const parts = [added && `${added} task${added === 1 ? "" : "s"} added`, upgraded && `${upgraded} upgraded to a challenge`].filter(Boolean);

  return (
    <section className="flex gap-4 rounded-xl border border-ochre-600/25 bg-ochre-100/50 p-5" aria-live="polite">
      <AgentMark agent="learning" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">
          Your roadmap was adapted after your {humanize(change.trigger)} · v{change.version}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{change.reason}.</p>
        <p className="mt-1.5 text-xs text-ink-faint">
          {parts.join(" · ")}
          {parts.length > 0 && " · "}completed tasks kept as they were · {timeAgo(change.at)}
        </p>
      </div>
    </section>
  );
}

import type { PlanChange } from "@/api/types";
import { Card, CardHeader } from "@/components/ui/primitives";
import { humanize, timeAgo } from "@/lib/format";

/** The plan's change log, newest first. This is where an adaptation after a quiz or interview shows up. */
export function PlanHistory({ changes }: { changes: PlanChange[] }) {
  const items = [...changes].reverse().slice(0, 6);
  return (
    <Card className="p-6">
      <CardHeader eyebrow="Plan history" title="How your plan has changed" />
      <ol className="mt-5 space-y-4">
        {items.map((c) => (
          <li key={`${c.version}-${c.at}`} className="grid grid-cols-[2.5rem_1fr] gap-3">
            <span className="num text-base font-semibold leading-none text-plum-500">v{c.version}</span>
            <div>
              <p className="text-sm leading-relaxed">{c.reason}</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {humanize(c.trigger)} · {timeAgo(c.at)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

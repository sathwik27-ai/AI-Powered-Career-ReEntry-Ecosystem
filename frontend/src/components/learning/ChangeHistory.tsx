import type { RoadmapChange } from "@/api/types";
import { Card, CardHeader } from "@/components/ui/primitives";
import { humanize, timeAgo } from "@/lib/format";
import { kindLabel } from "@/lib/learning";

/** Every roadmap version and the exact edits the Learning Agent made, newest first. */
export function ChangeHistory({ changes }: { changes: RoadmapChange[] }) {
  const items = [...changes].reverse();
  return (
    <Card className="p-5">
      <CardHeader eyebrow="Learning Agent" title="Roadmap history" />
      <ol className="mt-4 space-y-5">
        {items.map((c) => (
          <li key={`${c.version}-${c.at}`} className="grid grid-cols-[2.25rem_1fr] gap-3">
            <span className="num text-base font-semibold leading-none text-plum-500">v{c.version}</span>
            <div className="min-w-0">
              <p className="text-sm leading-relaxed">{c.reason}</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {humanize(c.trigger)} · {timeAgo(c.at)}
              </p>
              {c.changes.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-ink-soft">
                  {c.changes.map((ch, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="num w-11 shrink-0 text-ink-faint">Day {ch.day}</span>
                      <span className="min-w-0">
                        {ch.type === "upgraded" ? (
                          <>
                            <span className="font-medium text-sage-700">Upgraded</span> “{ch.replaced}” to a challenge
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-ochre-700">Added</span> {ch.title}
                            {!ch.title.toLowerCase().startsWith(ch.kind) && <span className="text-ink-faint"> ({kindLabel(ch.kind).toLowerCase()})</span>}
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

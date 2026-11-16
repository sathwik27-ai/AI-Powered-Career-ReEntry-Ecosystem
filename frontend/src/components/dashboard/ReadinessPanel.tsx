import type { Readiness } from "@/api/types";
import { Card, Meter } from "@/components/ui/primitives";
import { round } from "@/lib/format";

const PARTS: { key: keyof Readiness["components"]; label: string; empty: string }[] = [
  { key: "profile", label: "Profile", empty: "Not started" },
  { key: "skills", label: "Skills", empty: "Not assessed" },
  { key: "learning", label: "Learning", empty: "No roadmap yet" },
  { key: "interview", label: "Interview", empty: "No mock interview yet" },
];

export function ReadinessPanel({ readiness }: { readiness: Readiness }) {
  return (
    <Card className="flex flex-col p-6 sm:p-7">
      <p className="text-[0.9375rem] font-semibold text-ink">Career readiness</p>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="num stat-value text-[2.5rem] leading-none">{round(readiness.overall)}</span>
        <span className="text-sm text-ink-faint">/ 100</span>
      </div>
      <div className="mt-3">
        <Meter value={readiness.overall} label="Overall readiness" />
      </div>

      <ul className="mt-6 space-y-4 border-t border-line pt-5">
        {PARTS.map((p) => {
          const v = readiness.components[p.key];
          return (
            <li key={p.key}>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="font-medium">
                  {p.label} <span className="text-xs font-normal text-ink-faint">· weight {readiness.weights[p.key]}</span>
                </span>
                <span className="num text-ink-soft">{v === null ? <span className="text-xs text-ink-faint">{p.empty}</span> : round(v)}</span>
              </div>
              <Meter value={v ?? 0} tone={v === null ? "plum" : v >= 70 ? "sage" : v >= 40 ? "plum" : "ochre"} label={`${p.label} readiness`} />
            </li>
          );
        })}
      </ul>

      <p className="mt-auto pt-6 text-xs leading-relaxed text-ink-faint">
        {readiness.disclaimer} Parts with no data yet are left out of the total rather than counted as zero.
      </p>
    </Card>
  );
}

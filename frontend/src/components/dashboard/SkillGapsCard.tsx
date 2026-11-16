import { Link } from "react-router-dom";
import type { PriorityGap, SkillStatus } from "@/api/types";
import { Card, CardHeader, EmptyNote, Meter, Pill } from "@/components/ui/primitives";
import { round } from "@/lib/format";

export const STATUS: Record<SkillStatus, { label: string; tone: "sage" | "ochre" | "rose" | "lilac" | "neutral"; meter: "sage" | "ochre" | "rose" | "plum" }> = {
  strong: { label: "Strong", tone: "sage", meter: "sage" },
  outdated: { label: "Outdated", tone: "ochre", meter: "ochre" },
  needs_revision: { label: "Needs revision", tone: "lilac", meter: "plum" },
  developing: { label: "Developing", tone: "lilac", meter: "plum" },
  missing: { label: "Not yet learned", tone: "rose", meter: "rose" },
};

export function SkillGapsCard({ gaps, targetRole }: { gaps: PriorityGap[]; targetRole: string | null }) {
  return (
    <Card className="p-6">
      <CardHeader
        eyebrow="Skill Gap Agent"
        title={targetRole ? `What to refresh for ${targetRole}` : "Top skill gaps"}
        action={
          <Link to="/skills" className="link-quiet shrink-0 text-xs text-ink-soft">
            Full analysis
          </Link>
        }
      />
      {gaps.length === 0 ? (
        <div className="mt-4">
          <EmptyNote>No skill-gap analysis yet. It runs as soon as a target role is set.</EmptyNote>
        </div>
      ) : (
        <ol className="mt-5 divide-y divide-line">
          {gaps.map((g, i) => {
            const st = STATUS[g.status] ?? STATUS.developing;
            return (
              <li key={g.skill} className="grid grid-cols-[1.25rem_1fr] gap-3 py-3.5 first:pt-0 last:pb-0">
                <span className="num pt-0.5 text-sm font-semibold leading-none text-ink-faint">{i + 1}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">{g.skill}</span>
                    <Pill tone={st.tone}>{st.label}</Pill>
                    <span className="ml-auto num text-xs text-ink-soft">
                      {round(g.current_level)} → {g.target_level}
                      <span className="ml-1.5 text-ink-faint">{g.measured ? "measured" : "estimated"}</span>
                    </span>
                  </div>
                  <div className="mt-2">
                    <Meter value={g.current_level} marker={g.target_level} tone={st.meter} label={`${g.skill} level`} />
                  </div>
                  <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-soft">{g.why}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

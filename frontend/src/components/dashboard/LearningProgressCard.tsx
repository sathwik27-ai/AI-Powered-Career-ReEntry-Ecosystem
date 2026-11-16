import { Link } from "react-router-dom";
import { Check, CornerDownRight } from "lucide-react";
import type { PlanRoadmap } from "@/api/types";
import { Card, CardHeader, EmptyNote, Meter, Pill, cx } from "@/components/ui/primitives";
import { round } from "@/lib/format";

const KIND: Record<string, string> = {
  learn: "Learn",
  practice: "Practice",
  quiz: "Quiz",
  revision: "Revision",
  challenge: "Challenge",
  project: "Project",
};

export function LearningProgressCard({ roadmap }: { roadmap: PlanRoadmap | null }) {
  if (!roadmap) {
    return (
      <Card className="p-6">
        <CardHeader eyebrow="Learning Agent" title="Learning progress" />
        <div className="mt-4">
          <EmptyNote>Your roadmap appears here once the Skill Gap Agent has something to work from.</EmptyNote>
        </div>
      </Card>
    );
  }

  const day = roadmap.current_day;
  const today = roadmap.upcoming_tasks.filter((t) => t.day === day);
  const later = roadmap.upcoming_tasks.filter((t) => t.day !== day).slice(0, 3);
  const extended = roadmap.total_days > roadmap.planned_days;

  return (
    <Card className="p-6">
      <CardHeader
        eyebrow="Learning Agent"
        title={day ? `Day ${day} of ${roadmap.total_days}` : "Roadmap complete"}
        action={
          <Link to="/learning" className="link-quiet shrink-0 text-xs text-ink-soft">
            Open roadmap
          </Link>
        }
      />

      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1">
          <Meter value={roadmap.progress.percent} tone="sage" label="Roadmap progress" />
        </div>
        <span className="num text-sm text-ink-soft">
          {roadmap.progress.completed}/{roadmap.progress.total} tasks · {round(roadmap.progress.percent)}%
        </span>
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        Roadmap v{roadmap.version} · {roadmap.hours_per_day} h a day
        {extended && ` · extended from ${roadmap.planned_days} to ${roadmap.total_days} days by adaptation`}
      </p>

      {today.length > 0 && (
        <>
          <p className="eyebrow mb-2 mt-6">Today</p>
          <ul className="space-y-2">
            {today.map((t) => (
              <li
                key={t.id}
                className={cx("rounded-xl border px-4 py-3", t.added_by_adaptation ? "border-ochre-600/30 bg-ochre-100/40" : "border-line bg-paper/50")}
              >
                <div className="flex items-start gap-3">
                  <span className={cx("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border", t.completed ? "border-sage-600 bg-sage-600 text-white" : "border-line-strong bg-white")}>
                    {t.completed && <Check className="h-3 w-3" aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{t.title}</p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {KIND[t.kind] ?? t.kind} · {t.skill} · {t.minutes} min
                    </p>
                    {t.adaptation_note && (
                      <p className="mt-2 flex gap-1.5 text-xs text-ochre-700">
                        <CornerDownRight className="mt-px h-3 w-3 shrink-0" aria-hidden /> Added by adaptation: {t.adaptation_note}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {later.length > 0 && (
        <>
          <p className="eyebrow mb-2 mt-5">Coming up</p>
          <ul className="space-y-1.5 text-sm">
            {later.map((t) => (
              <li key={t.id} className="flex min-w-0 items-baseline gap-3">
                <span className="num w-12 shrink-0 text-xs text-ink-faint">Day {t.day}</span>
                <span className="min-w-0 truncate">{t.title}</span>
                {t.added_by_adaptation && <Pill tone="ochre">adapted</Pill>}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

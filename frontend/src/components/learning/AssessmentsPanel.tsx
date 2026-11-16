import type { QuizResult, QuizSummary } from "@/api/types";
import { Card, CardHeader, cx } from "@/components/ui/primitives";
import { round, timeAgo } from "@/lib/format";
import { scoreTone } from "@/lib/learning";

const TONE_TEXT = { sage: "text-sage-700", plum: "text-plum-700", ochre: "text-ochre-700", rose: "text-rosewood-600" } as const;

/** Quizzes available for the roadmap's focus skills, with the latest real result for each. */
export function AssessmentsPanel({
  focusSkills,
  quizzes,
  results,
  onTake,
}: {
  focusSkills: string[];
  quizzes: QuizSummary[];
  results: QuizResult[];
  onTake: (skill: string) => void;
}) {
  const available = new Map(quizzes.map((q) => [q.skill, q.questions]));
  const latest = new Map<string, QuizResult>();
  for (const r of results) if (!latest.has(r.skill)) latest.set(r.skill, r); // results come newest first

  return (
    <Card className="p-5">
      <CardHeader eyebrow="Assessments" title="Measure a skill" />
      <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink-soft">
        A score replaces the estimated level, and the Learning Agent may change your roadmap in response.
      </p>
      <ul className="mt-4 divide-y divide-line">
        {focusSkills.map((skill) => {
          const n = available.get(skill);
          const last = latest.get(skill);
          return (
            <li key={skill} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{skill}</p>
                <p className="text-xs text-ink-faint">
                  {n === undefined ? "No assessment yet" : last ? `Last: ${timeAgo(last.created_at)}` : `${n} questions · not taken`}
                </p>
              </div>
              {last && <span className={cx("num text-base font-semibold leading-none", TONE_TEXT[scoreTone(last.percent)])}>{round(last.percent)}%</span>}
              {n !== undefined && (
                <button
                  type="button"
                  onClick={() => onTake(skill)}
                  className="rounded-full border border-line-strong px-3 py-1 text-xs font-semibold text-plum-800 transition hover:border-plum-500"
                >
                  {last ? "Retake" : "Start"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

import { Check, CornerDownRight, ExternalLink, Loader2, Trophy } from "lucide-react";
import type { LearningTask } from "@/api/types";
import { Pill, cx } from "@/components/ui/primitives";
import { kindLabel } from "@/lib/learning";

interface Props {
  task: LearningTask;
  priority: string | null;
  difficulty: string | null;
  busy: boolean;
  isNew: boolean;
  hasQuiz: boolean;
  onToggle: (task: LearningTask) => void;
  onTakeQuiz: (skill: string) => void;
}

const KIND_TONE: Record<string, "lilac" | "ochre" | "sage" | "plum" | "neutral" | "rose"> = {
  revision: "ochre",
  challenge: "sage",
  quiz: "plum",
  project: "lilac",
};

export function TaskItem({ task: t, priority, difficulty, busy, isNew, hasQuiz, onToggle, onTakeQuiz }: Props) {
  const isQuiz = t.kind === "quiz";
  return (
    <li
      className={cx(
        "group rounded-xl border px-4 py-3.5 transition-colors",
        t.added_by_adaptation ? "border-ochre-600/25 bg-ochre-100/30" : "border-line bg-white",
        t.completed && "bg-paper/60",
        isNew && "ring-2 ring-ochre-600/40",
      )}
    >
      <div className="flex items-start gap-3.5">
        {isQuiz ? (
          <span
            className={cx(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              t.completed ? "bg-sage-600 text-white" : "bg-plum-100 text-plum-800",
            )}
            title={t.completed ? "Assessment taken" : "Completed by taking the assessment"}
          >
            {t.completed ? <Check className="h-3 w-3" aria-hidden /> : <Trophy className="h-2.5 w-2.5" aria-hidden />}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onToggle(t)}
            disabled={busy}
            aria-pressed={t.completed}
            aria-label={t.completed ? `Mark "${t.title}" as not done` : `Mark "${t.title}" as done`}
            className={cx(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
              t.completed ? "border-sage-600 bg-sage-600 text-white" : "border-line-strong bg-white hover:border-plum-500",
              busy && "opacity-60",
            )}
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin text-ink-soft" aria-hidden /> : t.completed && <Check className="h-3 w-3" aria-hidden />}
          </button>
        )}

        <div className="min-w-0 flex-1">
          <p className={cx("text-[0.93rem] font-medium leading-snug", t.completed && "text-ink-soft line-through decoration-line-strong")}>{t.title}</p>
          <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-soft">{t.description}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
            <Pill tone={KIND_TONE[t.kind] ?? "neutral"}>{kindLabel(t.kind)}</Pill>
            <Pill tone="neutral">{t.skill}</Pill>
            <span className="text-ink-faint">{t.minutes} min</span>
            {priority && <span className="text-ink-faint">· {priority} priority</span>}
            {difficulty && <span className="text-ink-faint">· {difficulty}</span>}
            {isNew && <Pill tone="ochre">new</Pill>}
          </div>

          {t.adaptation_note && (
            <p className="mt-2.5 flex gap-1.5 text-[0.8rem] leading-relaxed text-ochre-700">
              <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                <span className="font-semibold">Why this is here: </span>
                {t.adaptation_note}
              </span>
            </p>
          )}

          {(t.resource_url || (isQuiz && !t.completed)) && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {isQuiz && !t.completed && (
                <button
                  type="button"
                  onClick={() => onTakeQuiz(t.skill)}
                  disabled={!hasQuiz}
                  className="inline-flex items-center gap-1.5 rounded-md bg-plum-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-plum-800 disabled:opacity-50"
                >
                  {hasQuiz ? `Take the ${t.skill} assessment` : "No assessment available yet"}
                </button>
              )}
              {t.resource_url && (
                <a
                  href={t.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-plum-700 hover:text-plum-900 hover:decoration-plum-500"
                >
                  {t.resource_title ?? "Open resource"} <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

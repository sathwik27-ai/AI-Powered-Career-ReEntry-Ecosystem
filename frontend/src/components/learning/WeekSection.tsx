import { ChevronDown } from "lucide-react";
import type { LearningTask } from "@/api/types";
import { cx } from "@/components/ui/primitives";
import type { WeekGroup } from "@/lib/learning";
import { TaskItem } from "./TaskItem";

interface Props {
  week: WeekGroup;
  currentDay: number | null;
  open: boolean;
  onToggleOpen: () => void;
  visible: (t: LearningTask) => boolean;
  taskMeta: (t: LearningTask) => { priority: string | null; difficulty: string | null; hasQuiz: boolean };
  busyIds: Set<number>;
  newIds: Set<number>;
  onToggleTask: (t: LearningTask) => void;
  onTakeQuiz: (skill: string) => void;
}

export function WeekSection({ week, currentDay, open, onToggleOpen, visible, taskMeta, busyIds, newIds, onToggleTask, onTakeQuiz }: Props) {
  const days = week.days.map((d) => ({ ...d, shown: d.tasks.filter(visible) })).filter((d) => d.shown.length > 0);
  const isCurrent = currentDay !== null && currentDay >= week.firstDay && currentDay <= week.lastDay;
  const done = week.completed === week.total;
  const pct = week.total ? Math.round((100 * week.completed) / week.total) : 0;
  const lastDay = week.days.at(-1)?.day ?? week.lastDay;

  return (
    <section className="relative">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        className="flex w-full items-center gap-4 rounded-xl py-3 text-left"
      >
        <span
          className={cx(
            "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full border text-center",
            done ? "border-sage-600 bg-sage-600 text-white" : isCurrent ? "border-plum-700 bg-plum-700 text-white" : "border-line-strong bg-white text-ink-soft",
          )}
        >
          <span className="text-[0.55rem] font-semibold uppercase leading-none tracking-wider opacity-80">Wk</span>
          <span className="num text-sm font-semibold leading-none">{week.week}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold">
              Days {week.days[0]?.day ?? week.firstDay}–{lastDay}
            </span>
            {isCurrent && <span className="text-xs font-semibold text-plum-600">This week</span>}
          </span>
          <span className="mt-1 flex items-center gap-3">
            <span className="h-1 w-28 overflow-hidden rounded-full bg-paper-deep">
              <span className="block h-full rounded-full bg-sage-600" style={{ width: `${pct}%` }} />
            </span>
            <span className="num text-xs text-ink-faint">
              {week.completed}/{week.total} done
            </span>
          </span>
        </span>
        <ChevronDown className={cx("h-4 w-4 shrink-0 text-ink-faint transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="ml-[21px] border-l border-line pb-4 pl-6 sm:pl-8">
          {days.length === 0 ? (
            <p className="py-3 text-sm text-ink-faint">No tasks in this week match the current filter.</p>
          ) : (
            days.map((d) => (
              <div key={d.day} className="relative pt-4">
                <span
                  className={cx(
                    "absolute -left-[29px] top-[22px] h-2.5 w-2.5 rounded-full border-2 border-paper sm:-left-[37px]",
                    d.done ? "bg-sage-600" : d.day === currentDay ? "bg-plum-700" : "bg-line-strong",
                  )}
                  aria-hidden
                />
                <div className="mb-2.5 flex items-baseline gap-2">
                  <h3 className="text-sm font-semibold">Day {d.day}</h3>
                  {d.day === currentDay && <span className="text-xs font-semibold text-plum-600">Today</span>}
                  <span className="text-xs text-ink-faint">· {d.minutes} min</span>
                </div>
                <ul className="space-y-2">
                  {d.shown.map((t) => {
                    const meta = taskMeta(t);
                    return (
                      <TaskItem
                        key={t.id}
                        task={t}
                        priority={meta.priority}
                        difficulty={meta.difficulty}
                        hasQuiz={meta.hasQuiz}
                        busy={busyIds.has(t.id)}
                        isNew={newIds.has(t.id)}
                        onToggle={onToggleTask}
                        onTakeQuiz={onTakeQuiz}
                      />
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

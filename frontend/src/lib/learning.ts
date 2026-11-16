import type { LearningTask } from "@/api/types";

/** Task kinds produced by the Learning Agent (generate + adapt). */
export const KIND_LABEL: Record<string, string> = {
  learn: "Learn",
  practice: "Practice",
  quiz: "Assessment",
  reflect: "Reflect",
  project: "Project",
  revision: "Revision",
  challenge: "Challenge",
};

export const DIFFICULTY_LABEL: Record<string, string> = {
  foundation: "Foundation",
  refresher: "Refresher",
  reinforce: "Reinforce",
  advanced: "Advanced",
};

export function kindLabel(kind: string): string {
  return KIND_LABEL[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function difficultyLabel(level: string | undefined): string | null {
  if (!level) return null;
  return DIFFICULTY_LABEL[level] ?? level;
}

export interface DayGroup {
  day: number;
  tasks: LearningTask[];
  minutes: number;
  done: boolean;
}

export interface WeekGroup {
  week: number;
  firstDay: number;
  lastDay: number;
  days: DayGroup[];
  completed: number;
  total: number;
}

/** Tasks arrive sorted by (day, order). Group them into days, then 7-day weeks. */
export function groupByWeek(tasks: LearningTask[]): WeekGroup[] {
  const byDay = new Map<number, LearningTask[]>();
  for (const t of tasks) {
    const list = byDay.get(t.day) ?? [];
    list.push(t);
    byDay.set(t.day, list);
  }
  const weeks = new Map<number, WeekGroup>();
  for (const day of [...byDay.keys()].sort((a, b) => a - b)) {
    const dayTasks = byDay.get(day)!.sort((a, b) => a.order - b.order);
    const week = Math.ceil(day / 7);
    const w = weeks.get(week) ?? { week, firstDay: (week - 1) * 7 + 1, lastDay: week * 7, days: [], completed: 0, total: 0 };
    w.days.push({ day, tasks: dayTasks, minutes: dayTasks.reduce((s, t) => s + t.minutes, 0), done: dayTasks.every((t) => t.completed) });
    w.completed += dayTasks.filter((t) => t.completed).length;
    w.total += dayTasks.length;
    weeks.set(week, w);
  }
  return [...weeks.values()].sort((a, b) => a.week - b.week);
}

export type TaskFilter = "all" | "pending" | "completed" | "adapted";

export function matchesFilter(t: LearningTask, filter: TaskFilter, skill: string): boolean {
  if (skill !== "all" && t.skill !== skill) return false;
  if (filter === "pending") return !t.completed;
  if (filter === "completed") return t.completed;
  if (filter === "adapted") return t.added_by_adaptation;
  return true;
}

export function scoreTone(percent: number): "sage" | "plum" | "ochre" | "rose" {
  if (percent >= 85) return "sage";
  if (percent >= 60) return "plum";
  if (percent >= 40) return "ochre";
  return "rose";
}

import { useState, useEffect } from "react";
import { CheckSquare, ArrowRight, CheckCircle2, User } from "lucide-react";
import { api } from "../../api/client";
import type { TrainerListenerItem } from "../../api/types";

export function TrainerAssignTaskPage() {
  const [listeners, setListeners] = useState<TrainerListenerItem[]>([]);
  const [selectedListenerId, setSelectedListenerId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [skill, setSkill] = useState("Spring Boot");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("Day 10");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.trainerListeners().then((res) => {
      const items = res.listeners || [];
      setListeners(items);
      if (items.length > 0) setSelectedListenerId(items[0].id);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListenerId || !title || !skill) return;
    setSubmitting(true);
    setMsg(null);
    try {
      await api.assignTask(Number(selectedListenerId), {
        title,
        skill,
        description,
        due_date: dueDate,
      });
      setMsg("Task assigned successfully and pushed to learner's roadmap!");
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setMsg(err?.message || "Failed to assign task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <span className="eyebrow text-jelly-lime">Curriculum Customization</span>
        <h1 className="page-title mt-1">Assign Practice Tasks</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Send practice assignments or extra resource tasks to your assigned learners. The Tutor Agent folds them into the learner's schedule.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="card p-6 bg-surface border border-line shadow-jelly">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
              Select Learner
            </label>
            <select
              value={selectedListenerId}
              onChange={(e) => setSelectedListenerId(Number(e.target.value))}
              className="field"
              required
            >
              {listeners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {l.target_role} ({Math.round(l.readiness_score)}% readiness)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
              Task Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build Custom Exception Handler in Spring Boot"
              className="field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                Target Skill
              </label>
              <input
                type="text"
                required
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="e.g. Spring Boot, SQL, Docker"
                className="field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                Target Day / Timeline
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. Day 10"
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
              Detailed Instructions & Practice Scope
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the worked example to review, requirements for the practice implementation, and expected test coverage..."
              className="w-full rounded-xl border border-line bg-paper-deep/40 p-3 text-xs text-ink focus:border-jelly-lime focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="jelly-btn flex h-11 w-full items-center justify-center gap-2 bg-gradient-to-r from-jelly-lime to-emerald-600 text-sm font-bold text-white shadow-xs disabled:opacity-50"
          >
            {submitting ? "Assigning..." : "Assign Task to Learner"}
          </button>
        </form>
      </div>
    </div>
  );
}

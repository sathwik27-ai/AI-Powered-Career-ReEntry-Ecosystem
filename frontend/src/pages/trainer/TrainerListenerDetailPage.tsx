import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  CheckCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Mic,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { api } from "../../api/client";

export function TrainerListenerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskSkill, setTaskSkill] = useState("Spring Boot");
  const [submittingTask, setSubmittingTask] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const listenerId = Number(id);

  const loadDetail = () => {
    if (!listenerId) return;
    api.trainerListenerDetail(listenerId)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDetail();
  }, [listenerId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent) return;
    setSubmittingNote(true);
    try {
      await api.addTrainerNote(listenerId, { content: noteContent, category: "guidance" });
      setNoteContent("");
      setMsg("Mentorship note saved successfully.");
      loadDetail();
    } catch {}
    setSubmittingNote(false);
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskSkill) return;
    setSubmittingTask(true);
    try {
      await api.assignTask(listenerId, {
        title: taskTitle,
        description: taskDesc,
        skill: taskSkill,
      });
      setTaskTitle("");
      setTaskDesc("");
      setMsg("Practice task assigned and learner notified.");
      loadDetail();
    } catch {}
    setSubmittingTask(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-jelly-lime" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-base font-bold text-ink">Learner Not Found</h3>
        <p className="mt-1 text-xs text-ink-soft">Could not retrieve information for learner #{listenerId}.</p>
        <Link to="/trainer/listeners" className="jelly-btn mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-jelly-purple">
          Back to Learners
        </Link>
      </div>
    );
  }

  const { listener, profile, readiness, gaps, tasks, quizzes, interviews, notes, assigned_tasks } = data;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/trainer/listeners"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-paper-deep"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Assigned Cohort</span>
        </Link>
        <span className="text-xs text-ink-faint">Learner ID #{listener.id}</span>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="card p-6 bg-surface border border-line shadow-jelly">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-jelly-lime to-emerald-600 text-xl font-bold text-white shadow-sm">
              {listener.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-ink">{listener.name}</h1>
              <div className="text-xs text-ink-soft">{listener.email}</div>
              <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-paper-deep px-2 py-0.5 font-bold text-ink">
                  Target: {profile?.target_role || "Backend Developer"}
                </span>
                <span className="rounded-md bg-paper-deep px-2 py-0.5 text-ink-soft">
                  Career Break: {profile?.career_break_years ? `${profile.career_break_years} years` : "None"}
                </span>
                <span className="rounded-md bg-paper-deep px-2 py-0.5 text-ink-soft">
                  Daily Pacing: {profile?.hours_per_day || 2} hrs/day
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-line bg-paper-deep/50 p-4">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase text-ink-faint">Readiness</span>
              <div className="text-2xl font-extrabold text-jelly-purple">
                {Math.round(readiness?.overall_score || 0)}%
              </div>
            </div>
            <div className="h-8 w-px bg-line" />
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase text-ink-faint">Tasks Done</span>
              <div className="text-2xl font-extrabold text-ink">
                {tasks.filter((t: any) => t.completed).length}/{tasks.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Skill Gaps and Quizzes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Identified Skill Gaps */}
        <div className="card p-6 bg-surface border border-line shadow-jelly">
          <h3 className="section-title">Identified Skill Gaps</h3>
          <p className="text-xs text-ink-soft mb-4">Gaps discovered comparing past background vs real job demand.</p>

          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {gaps.length === 0 ? (
              <p className="text-xs text-ink-faint">No skill gaps logged.</p>
            ) : (
              gaps.map((g: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-paper-deep/40 p-2.5 text-xs"
                >
                  <span className="font-bold text-ink">{g.skill}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-faint">Current: {g.current_level} / Target: {g.target_level}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        g.priority === "high"
                          ? "bg-rosewood-100 text-rosewood-700"
                          : "bg-paper-deep text-ink-soft"
                      }`}
                    >
                      {g.priority || "Medium"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assessment Attempts */}
        <div className="card p-6 bg-surface border border-line shadow-jelly">
          <h3 className="section-title">Deterministic Quiz Scores</h3>
          <p className="text-xs text-ink-soft mb-4">Objective assessment results (≥70% triggers mastery).</p>

          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {quizzes.length === 0 ? (
              <p className="text-xs text-ink-faint">No assessment attempts yet.</p>
            ) : (
              quizzes.map((q: any) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-xl bg-paper-deep/40 p-2.5 text-xs"
                >
                  <div>
                    <span className="font-bold text-ink">{q.skill}</span>
                    <span className="ml-2 text-[11px] text-ink-faint">({q.correct}/{q.total} correct)</span>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 font-bold ${
                      q.percent >= 70
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-rosewood-100 text-rosewood-700"
                    }`}
                  >
                    {Math.round(q.percent)}% {q.percent >= 70 ? "Mastered" : "Revision Needed"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grid: Mentor Actions (Add Note + Assign Task) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mentor Notes */}
        <div className="card p-6 bg-surface border border-line shadow-jelly">
          <h3 className="section-title">Mentorship Observations</h3>
          <p className="text-xs text-ink-soft mb-3">Record 1-on-1 observations and coaching guidance.</p>

          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              required
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="e.g. Discussed modern Spring Boot REST controller best practices..."
              className="w-full rounded-xl border border-line bg-paper-deep/40 p-3 text-xs text-ink focus:border-jelly-lime focus:outline-none"
            />
            <button
              type="submit"
              disabled={submittingNote}
              className="jelly-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-jelly-lime to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submittingNote ? "Saving..." : "Save Note"}</span>
            </button>
          </form>

          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {notes.map((n: any) => (
              <div key={n.id} className="rounded-xl border border-line/60 bg-paper-deep/30 p-2.5 text-xs">
                <p className="text-ink">{n.content}</p>
                <span className="mt-1 block text-[10px] text-ink-faint">{n.created_at?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assign Practice Task */}
        <div className="card p-6 bg-surface border border-line shadow-jelly">
          <h3 className="section-title">Assign Practice Task</h3>
          <p className="text-xs text-ink-soft mb-3">Send a specific exercise that integrates into her roadmap.</p>

          <form onSubmit={handleAssignTask} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-ink-faint uppercase">Task Title</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Build JPA CRUD Repository with Tests"
                className="field text-xs h-9"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-ink-faint uppercase">Target Skill</label>
              <input
                type="text"
                required
                value={taskSkill}
                onChange={(e) => setTaskSkill(e.target.value)}
                placeholder="e.g. Spring Boot"
                className="field text-xs h-9"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-ink-faint uppercase">Instructions</label>
              <textarea
                rows={2}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Details or resources..."
                className="w-full rounded-xl border border-line bg-paper-deep/40 p-2 text-xs text-ink focus:border-jelly-lime focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submittingTask}
              className="jelly-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-jelly-lime to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{submittingTask ? "Assigning..." : "Assign to Learner"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Assigned Tasks & Learner Submissions Section */}
      <div className="card p-6 bg-surface border border-line shadow-jelly">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h3 className="section-title">Assigned Tasks & Learner Verification Proof</h3>
            <p className="text-xs text-ink-soft">
              Real-time submission log of practice tasks and test proof submitted by this learner.
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {assigned_tasks?.filter((t: any) => t.status === "completed").length || 0} of {assigned_tasks?.length || 0} Completed
          </span>
        </div>

        {(!assigned_tasks || assigned_tasks.length === 0) ? (
          <div className="py-8 text-center text-xs text-ink-faint">
            No practice tasks assigned to this learner yet. Use the form above to assign targeted exercises.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {assigned_tasks.map((at: any) => {
              const isCompleted = at.status === "completed";
              return (
                <div
                  key={at.id}
                  className={`rounded-2xl border p-4 transition ${
                    isCompleted
                      ? "border-emerald-500/30 bg-emerald-500/5 text-ink"
                      : "border-line bg-paper-deep/30"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-ink">{at.title}</h4>
                        <span className="rounded-full bg-paper-deep px-2 py-0.5 text-[10px] font-bold text-plum-600">
                          {at.skill}
                        </span>
                        {at.due_date && (
                          <span className="text-[10px] text-ink-faint">Due: {at.due_date}</span>
                        )}
                      </div>
                      {at.description && (
                        <p className="mt-1 text-xs text-ink-soft">{at.description}</p>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        isCompleted
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : null}
                      <span>{isCompleted ? "Completed with Proof" : "Awaiting Proof"}</span>
                    </span>
                  </div>

                  {/* Learner's Proof Submission */}
                  {at.feedback ? (
                    <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">
                          Learner's Submitted Completion Proof:
                        </span>
                        {at.completed_at && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                            Verified on {new Date(at.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-ink-soft leading-relaxed">{at.feedback}</p>
                    </div>
                  ) : isCompleted ? (
                    <div className="mt-2 text-[11px] text-emerald-600">
                      ✓ Marked complete by learner.
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

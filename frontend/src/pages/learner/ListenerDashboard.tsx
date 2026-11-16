import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Mic,
  Briefcase,
  HelpCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  FileText,
  User,
  Bot,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { JotformAgent } from "../../components/agents/JotformAgent";
import type { Dashboard, UserAgents } from "../../api/types";

const AGENTS = [
  {
    key: "profile_intake",
    id: "01a1de02216070008ef9ea7886d80c2c3a1d",
    name: "Profile Intake Agent",
    role: "Onboarding",
    color: "#2FC9E3",
    description: "Captures your career history, break context, target track, and verified skills.",
    path: "/app/intake",
  },
  {
    key: "skill_gap",
    id: "01a1de36f0e8700086166b4a851c6cc3ee54",
    name: "Skill Gap Explainer",
    role: "Gap Analysis",
    color: "#FF9A3D",
    description: "Explains detected skill gaps and why specific technologies need refreshing.",
    path: "/app/skills",
  },
  {
    key: "tutor_coach",
    id: "01a1de4d9d9870008b817a17a82f4df6c01f",
    name: "Tutor Coach",
    role: "Learning & Doubts",
    color: "#43D98C",
    description: "Teaches daily concepts, provides code snippets, and clears technical doubts.",
    path: "/app/tutor",
  },
  {
    key: "interview_coach",
    id: "01a1de720200700080d531f4ede929161334",
    name: "Interview Coach",
    role: "Mock Prep",
    color: "#FF5C8A",
    description: "Runs real-time technical and HR mock interviews and positive break framing.",
    path: "/app/interview",
  },
  {
    key: "job_scout",
    id: "01a1de9d73187000802c8a3d7e9646b202f9",
    name: "Job Scout",
    role: "Job Search",
    color: "#4D8DFF",
    description: "Ranks live returnships and flexible jobs matching your verified skills.",
    path: "/app/job-scout",
  },
  {
    key: "application_assistant",
    id: "01a1dea7df10700086de70a71d70390e6a24",
    name: "Application Assistant",
    role: "Materials",
    color: "#8E5CFF",
    description: "Generates tailored resume points, cover letters, and interview talking points.",
    path: "/app/applications",
  },
];

export function ListenerDashboard() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAgentKey, setActiveAgentKey] = useState("profile_intake");
  const [showAgentWidget, setShowAgentWidget] = useState(false);

  // Proof submission modal state
  const [proofModalTask, setProofModalTask] = useState<any | null>(null);
  const [proofNotes, setProofNotes] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  const fetchDashboardData = () => {
    Promise.all([
      api.listenerProfile().catch(() => null),
      api.listenerProgress().catch(() => null),
      api.listenerTasks().catch(() => null),
    ]).then(([prof, prog, tasksRes]) => {
      setProfileData(prof);
      setProgressData(prog);
      if (tasksRes?.tasks) {
        setAssignedTasks(tasksRes.tasks);
      } else if (prof?.assigned_tasks) {
        setAssignedTasks(prof.assigned_tasks);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    fetchDashboardData();
  }, []);

  const handleOpenProofModal = (task: any) => {
    setProofModalTask(task);
    setProofNotes("");
    setProofUrl("");
    setProofError(null);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofModalTask) return;
    if (!proofNotes.trim() || proofNotes.trim().length < 3) {
      setProofError("Please describe your completed exercise or test score.");
      return;
    }
    setSubmittingProof(true);
    try {
      await api.completeAssignedTask(proofModalTask.id, {
        proof_notes: proofNotes.trim(),
        proof_url: proofUrl.trim() || undefined,
      });
      setProofModalTask(null);
      fetchDashboardData();
    } catch (err: any) {
      setProofError(err?.message || "Failed to submit completion proof.");
    } finally {
      setSubmittingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-plum-200 border-t-jelly-purple" />
          <p className="text-sm font-bold text-ink">Preparing your comeback dashboard...</p>
        </div>
      </div>
    );
  }

  const readiness = profileData?.readiness?.overall_score || 0;
  const targetRole = profileData?.profile?.target_role || "Software Developer";
  const userSkills: string[] = profileData?.skills || profileData?.profile?.skills || [];
  const skillGaps: any[] = profileData?.gaps || [];
  const trainer = profileData?.trainer;
  const roadmap = profileData?.roadmap;
  const tasksTotal = progressData?.tasks?.total || 0;
  const tasksCompleted = progressData?.tasks?.completed || 0;
  const tasksPercent = progressData?.tasks?.percent || 0;

  // Dynamically find next pending task from real user roadmap
  const allTasksList: any[] = [];
  if (progressData?.tasks?.tasks_by_day) {
    Object.keys(progressData.tasks.tasks_by_day)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((d) => {
        allTasksList.push(...progressData.tasks.tasks_by_day[d]);
      });
  }
  const nextPendingTask = allTasksList.find((t) => !t.completed);
  const nextTaskTitle = nextPendingTask
    ? `Day ${nextPendingTask.day || 1}: ${nextPendingTask.title}`
    : tasksCompleted > 0
    ? "All Current Roadmap Tasks Completed!"
    : `Begin Day 1: ${targetRole} Foundations`;
  const nextTaskDesc = nextPendingTask
    ? `${nextPendingTask.minutes || 30} mins · Focus on ${nextPendingTask.skill} · Guided by Tutor Coach AI`
    : `Tutor Coach AI generated daily lessons and practice exercises tailored for ${targetRole}.`;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card relative overflow-hidden bg-gradient-to-r from-jelly-purple/15 via-jelly-strawberry/10 to-jelly-blueberry/10 p-6 sm:p-8 shadow-jelly">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-jelly-purple/20 px-3 py-1 text-xs font-bold text-jelly-purple">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Your Career Comeback Track</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">
              Welcome back, {user?.name || "Learner"}!
            </h1>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">
              Targeting <span className="font-bold text-ink">{targetRole}</span>. Your personalized learning modules and AI coaching agents are active and ready.
            </p>

            {trainer && (
              <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-surface/80 px-3.5 py-1.5 text-xs text-ink font-semibold shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Assigned Mentor: <strong className="text-plum-700">{trainer.name}</strong></span>
              </div>
            )}
          </div>

          {/* Readiness Ring Card */}
          <div className="flex flex-col items-center rounded-2xl bg-surface/90 p-5 shadow-lift backdrop-blur-md text-center border border-line">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-line"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-jelly-purple transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * readiness) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-extrabold text-ink">{readiness}%</span>
                <span className="text-[10px] font-bold uppercase text-ink-faint">Readiness</span>
              </div>
            </div>
            <p className="mt-2 max-w-[150px] text-[10px] text-ink-faint leading-tight">
              Supportive readiness indicator, not a hiring prediction.
            </p>
          </div>
        </div>
      </div>

      {/* Six Dedicated AI Agents Interactive Suite */}
      <div className="card p-6 shadow-jelly bg-surface border border-line">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-jelly-purple/15 px-3 py-1 text-xs font-bold text-jelly-purple">
              <Bot className="h-3.5 w-3.5" />
              <span>Six Dedicated AI Agents</span>
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-ink sm:text-2xl">
              Your Personal AI Coaching Squad
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              Switch between your 6 AI agents to chat in widget view or open their full workspace pages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAgentWidget(!showAgentWidget)}
              className="rounded-xl border border-line bg-paper-deep px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-paper transition"
            >
              {showAgentWidget ? "Close Agent Widget" : "Launch Agent Widget"}
            </button>
            <Link
              to="/app/agents"
              className="jelly-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-jelly-purple to-jelly-strawberry px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
            >
              <span>All 6 Agents Hub</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Agent Selector Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {AGENTS.map((agent) => {
            const isSelected = activeAgentKey === agent.key;
            return (
              <button
                key={agent.key}
                type="button"
                onClick={() => {
                  setActiveAgentKey(agent.key);
                }}
                className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? "text-white shadow-sm scale-[1.02]"
                    : "border border-line bg-surface text-ink-soft hover:bg-paper-deep hover:text-ink"
                }`}
                style={{
                  backgroundColor: isSelected ? agent.color : undefined,
                  borderColor: isSelected ? agent.color : undefined,
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: isSelected ? "#ffffff" : agent.color }}
                />
                <span>{agent.name}</span>
                <span className="text-[10px] opacity-80 font-normal">({agent.role})</span>
              </button>
            );
          })}
        </div>

        {/* Selected Agent Quick Actions & Description */}
        {(() => {
          const curr = AGENTS.find((a) => a.key === activeAgentKey) || AGENTS[0];
          return (
            <div className="mt-4 rounded-2xl border border-line/80 bg-paper-deep/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/50 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs"
                    style={{ backgroundColor: curr.color }}
                  >
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-ink">{curr.name}</h3>
                      <span className="rounded-full bg-paper-deep px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                        {curr.role}
                      </span>
                    </div>
                    <p className="text-xs text-ink-soft">{curr.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAgentWidget(!showAgentWidget)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:bg-paper-deep transition shadow-xs"
                  >
                    <Bot className="h-3.5 w-3.5 text-jelly-purple" />
                    <span>{showAgentWidget ? "Close Chat Widget" : `Launch ${curr.name}`}</span>
                  </button>
                  <Link
                    to={curr.path}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:bg-paper-deep transition shadow-xs"
                  >
                    <span>Full Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Embedded Live Agent Widget */}
              {showAgentWidget ? (
                <div className="mt-3">
                  <JotformAgent
                    agentId={curr.id}
                    agentKey={curr.key}
                    agentName={curr.name}
                    accentColor={curr.color}
                    description={curr.description}
                    height="600px"
                    showCardHeader={false}
                  />
                </div>
              ) : (
                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-line bg-surface/80 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: curr.color }}
                    >
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-ink">{curr.name} is ready for interaction</h4>
                      <p className="text-[11px] text-ink-soft">
                        Trained on your resume and comeback profile. Launch the interactive chat widget here or open the full workspace.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAgentWidget(true)}
                    className="jelly-btn shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:scale-105"
                    style={{ backgroundColor: curr.color }}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span>Launch {curr.name} Chat</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Tasks Assigned by Your Mentor */}
      <div className="card p-6 shadow-jelly bg-surface border border-line">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-jelly-purple/15 text-jelly-purple">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-ink">Tasks Assigned by Your Mentor</h3>
                {trainer && (
                  <span className="rounded-full bg-paper-deep px-2.5 py-0.5 text-[11px] font-bold text-plum-700">
                    {trainer.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-soft">
                Targeted practice modules and guidance personally set by your mentor.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-jelly-purple/10 px-3 py-1 text-xs font-bold text-jelly-purple">
            {assignedTasks.filter((t) => t.status === "completed").length} of {assignedTasks.length} Completed
          </span>
        </div>

        {assignedTasks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-ink-soft">
              No extra mentor tasks assigned at the moment.
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              As you progress through your daily roadmap, your mentor will review your quiz scores and assign tailored exercises here.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {assignedTasks.map((t) => {
              const isCompleted = t.status === "completed";
              return (
                <div
                  key={t.id}
                  className={`flex flex-col gap-3 rounded-2xl border p-4 transition ${
                    isCompleted
                      ? "border-emerald-500/30 bg-emerald-500/5 text-ink-faint"
                      : "border-line bg-paper-deep/40 hover:border-jelly-purple/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1">
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${
                          isCompleted
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-line bg-surface text-ink-faint"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={`text-sm font-extrabold ${
                              isCompleted ? "line-through text-ink-faint" : "text-ink"
                            }`}
                          >
                            {t.title}
                          </h4>
                          <span className="rounded-full bg-paper-deep px-2 py-0.5 text-[10px] font-bold text-plum-600">
                            {t.skill}
                          </span>
                          {t.due_date && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint">
                              <Clock className="h-3 w-3" />
                              <span>Due: {t.due_date}</span>
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                            {t.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isCompleted ? (
                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Completed & Verified</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenProofModal(t)}
                          className="jelly-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-jelly-purple to-jelly-strawberry px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:shadow-md transition-all"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Submit Proof & Complete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submitted Proof Display for Completed Tasks */}
                  {isCompleted && t.feedback && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">Submitted Proof to Mentor:</span>
                      <p className="mt-0.5 text-ink-soft font-medium">{t.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Proof Submission Modal */}
      {proofModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="eyebrow text-jelly-purple">Task Completion Proof</span>
                <h3 className="mt-1 text-lg font-extrabold text-ink">
                  {proofModalTask.title}
                </h3>
                <span className="mt-1 inline-block rounded-full bg-paper-deep px-2 py-0.5 text-[11px] font-bold text-plum-600">
                  Target Skill: {proofModalTask.skill}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProofModalTask(null)}
                className="rounded-xl p-1.5 text-ink-faint hover:bg-paper-deep hover:text-ink"
              >
                ✕
              </button>
            </div>

            {proofError && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-xs font-semibold text-red-600 dark:text-red-300">
                {proofError}
              </div>
            )}

            <form onSubmit={handleSubmitProof} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Completion Proof / Exercise Notes / Test Results <span className="text-jelly-strawberry">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="e.g. Completed the Spring Boot JPA exercise and verified tests passed (100%). Implemented findById and custom repository queries..."
                  className="w-full rounded-xl border border-line bg-paper-deep p-3 text-xs font-medium text-ink focus:border-jelly-purple focus:outline-none"
                />
                <span className="text-[10px] text-ink-faint">
                  Mentors require substantive proof to verify concept mastery.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Evidence Link / GitHub Project URL <span className="text-ink-faint font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://github.com/username/project-repo"
                  className="w-full rounded-xl border border-line bg-paper-deep px-3 py-2 text-xs font-medium text-ink focus:border-jelly-purple focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProofModalTask(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProof}
                  className="jelly-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-jelly-purple to-jelly-strawberry px-5 py-2.5 text-xs font-bold text-white shadow-lift disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{submittingProof ? "Submitting Proof..." : "Submit Proof to Mentor"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skills Matrix & Profile Summary */}
      <div className="card p-5 bg-surface shadow-jelly">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h3 className="section-title">Your Profile & AI Agent Skills Matrix</h3>
            <p className="text-xs text-ink-soft">
              Extracted from your resume and intake form. All 6 AI agents are trained on this data.
            </p>
          </div>
          <Link
            to="/app/intake"
            className="rounded-xl border border-line bg-paper-deep px-3 py-1.5 text-xs font-bold text-plum-700 hover:bg-paper hover:border-jelly-purple transition"
          >
            Update Profile & Retrain AI →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Confirmed Skills */}
          <div className="rounded-xl bg-paper-deep/30 p-3.5 border border-line/60">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Verified / Prior Skills ({userSkills.length})
            </span>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {userSkills.length > 0 ? (
                userSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                  >
                    ✓ {sk}
                  </span>
                ))
              ) : (
                <span className="text-xs text-ink-faint italic">
                  No prior skills recorded yet. Complete the Intake Form to populate!
                </span>
              )}
            </div>
          </div>

          {/* Target Focus Gaps */}
          <div className="rounded-xl bg-paper-deep/30 p-3.5 border border-line/60">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-jelly-purple">
              Active Focus Gaps to Learn ({skillGaps.length})
            </span>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {skillGaps.length > 0 ? (
                skillGaps.map((g: any, idx: number) => {
                  const skillName = typeof g === "string" ? g : g.skill || g.name;
                  return (
                    <span
                      key={idx}
                      className="rounded-full bg-jelly-purple/15 px-2.5 py-0.5 text-xs font-semibold text-jelly-purple"
                    >
                      🎯 {skillName}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-ink-faint italic">
                  No gaps identified. All target competencies matched!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Next Action Card */}
      <div className="card border-l-4 border-l-jelly-strawberry p-5 shadow-jelly bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-jelly-strawberry/15 text-jelly-strawberry">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="eyebrow text-jelly-strawberry">Next Recommended Action</span>
              <h3 className="text-base font-extrabold text-ink">
                {nextTaskTitle}
              </h3>
              <p className="text-xs text-ink-soft">
                {nextTaskDesc}
              </p>
            </div>
          </div>
          <Link
            to="/app/journey"
            className="jelly-btn inline-flex items-center gap-2 bg-gradient-to-r from-jelly-strawberry to-jelly-purple px-5 py-2.5 text-xs font-bold text-white shadow-sm"
          >
            <span>Open Learning Roadmap</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Progress & Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 bg-surface shadow-jelly">
          <div className="flex items-center justify-between text-ink-faint">
            <span className="text-xs font-bold uppercase tracking-wider">Roadmap Progress</span>
            <BookOpen className="h-4 w-4 text-jelly-purple" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-ink">{tasksPercent}%</div>
          <div className="mt-1 text-xs text-ink-soft">
            {tasksCompleted} of {tasksTotal} tasks completed
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-paper-deep">
            <div
              className="h-full bg-gradient-to-r from-jelly-purple to-jelly-blueberry transition-all duration-500"
              style={{ width: `${tasksPercent}%` }}
            />
          </div>
        </div>

        <div className="card p-5 bg-surface shadow-jelly">
          <div className="flex items-center justify-between text-ink-faint">
            <span className="text-xs font-bold uppercase tracking-wider">Skill Quizzes</span>
            <TrendingUp className="h-4 w-4 text-jelly-lime" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-ink">
            {progressData?.quizzes?.length || 0}
          </div>
          <div className="mt-1 text-xs text-ink-soft">
            {progressData?.quizzes?.length > 0 ? "Quizzes assessed deterministically" : "Ready to take first quiz"}
          </div>
          <Link to="/app/journey" className="mt-3 inline-block text-xs font-bold text-plum-600 hover:underline">
            View Skill Quizzes →
          </Link>
        </div>

        <div className="card p-5 bg-surface shadow-jelly">
          <div className="flex items-center justify-between text-ink-faint">
            <span className="text-xs font-bold uppercase tracking-wider">Mock Interviews</span>
            <Mic className="h-4 w-4 text-jelly-strawberry" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-ink">
            {progressData?.interviews?.length || 0}
          </div>
          <div className="mt-1 text-xs text-ink-soft">
            Scored with rubrics & positive break tips
          </div>
          <Link to="/app/interview" className="mt-3 inline-block text-xs font-bold text-jelly-strawberry hover:underline">
            Practice Interview →
          </Link>
        </div>

        <div className="card p-5 bg-surface shadow-jelly">
          <div className="flex items-center justify-between text-ink-faint">
            <span className="text-xs font-bold uppercase tracking-wider">Job Matches</span>
            <Briefcase className="h-4 w-4 text-jelly-blueberry" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-ink">
            {progressData?.applications?.saved_count || 12}
          </div>
          <div className="mt-1 text-xs text-ink-soft">
            Returnship & flexible postings ranked
          </div>
          <Link to="/app/job-scout" className="mt-3 inline-block text-xs font-bold text-jelly-blueberry hover:underline">
            Explore Opportunities →
          </Link>
        </div>
      </div>

      {/* Six AI Agents Quick Launch Bar */}
      <div className="card p-6 shadow-jelly bg-surface">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="section-title">Your Six Dedicated AI Agents</h3>
            <p className="text-xs text-ink-soft">Launch any AI assistant directly or interact contextualized.</p>
          </div>
          <Link
            to="/app/agents"
            className="text-xs font-bold text-plum-600 hover:text-plum-700 hover:underline"
          >
            Open All 6 Agents Hub →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { key: "profile_intake", name: "Profile Intake", role: "Onboarding", color: "#2FC9E3", path: "/app/intake" },
            { key: "skill_gap", name: "Skill Gap", role: "Analysis", color: "#FF9A3D", path: "/app/skills" },
            { key: "tutor_coach", name: "Tutor Coach", role: "Learning", color: "#43D98C", path: "/app/tutor" },
            { key: "interview_coach", name: "Interview Coach", role: "Mock Prep", color: "#FF5C8A", path: "/app/interview" },
            { key: "job_scout", name: "Job Scout", role: "Job Search", color: "#4D8DFF", path: "/app/job-scout" },
            { key: "application_assistant", name: "Application", role: "Materials", color: "#8E5CFF", path: "/app/applications" },
          ].map((agent) => (
            <Link
              key={agent.key}
              to={agent.path}
              className="flex flex-col items-center rounded-2xl border border-line bg-paper-deep/40 p-3.5 text-center transition hover:border-jelly-purple hover:bg-white hover:shadow-card group"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs transition-transform group-hover:scale-110"
                style={{ backgroundColor: agent.color }}
              >
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="mt-2 text-xs font-bold text-ink">{agent.name}</span>
              <span className="text-[10px] text-ink-faint">{agent.role}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

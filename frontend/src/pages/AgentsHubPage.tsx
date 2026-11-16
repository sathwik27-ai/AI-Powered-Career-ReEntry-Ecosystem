import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Bot,
  UserPlus,
  Target,
  BookOpen,
  Mic,
  Briefcase,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { api } from "../api/client";
import type { JotformAgentInfo } from "../api/types";

export const FALLBACK_AGENTS: JotformAgentInfo[] = [
  {
    key: "profile_intake",
    name: "ReStartHer Profile Intake",
    description: "Welcomes new learners, collects professional background, previous experience, education, skills, interests and career goals to guide onboarding.",
    role_summary: "Onboarding & Background Intake Assistant",
    jotform_id: "01a1de02216070008ef9ea7886d80c2c3a1d",
    accent_color: "#2FC9E3", // aqua
    icon: "UserPlus",
    category: "Onboarding",
    status: "active",
  },
  {
    key: "skill_gap",
    name: "ReStartHer Skill Gap Explainer",
    description: "Compares previous background against target role benchmarks, explains identified skill gaps in simple terms, and recommends focus areas.",
    role_summary: "Skill Gap Analysis & Benchmark Explainer",
    jotform_id: "01a1de36f0e8700086166b4a851c6cc3ee54",
    accent_color: "#FF9A3D", // tangerine
    icon: "Target",
    category: "Analysis",
    status: "active",
  },
  {
    key: "tutor_coach",
    name: "ReStartHer Tutor Coach",
    description: "Personalized AI tutor that explains learning topics in plain language, answers doubts, provides worked examples, and supports practice exercises.",
    role_summary: "Personalized Learning & Doubt Solver",
    jotform_id: "01a1de4d9d9870008b817a17a82f4df6c01f",
    accent_color: "#43D98C", // lime
    icon: "BookOpen",
    category: "Learning",
    status: "active",
  },
  {
    key: "interview_coach",
    name: "ReStartHer Interview Coach",
    description: "Runs supportive technical and HR mock interview sessions, asks realistic role questions, guides career-break answers positively, and scores responses.",
    role_summary: "Mock Interview & Confidence Coach",
    jotform_id: "01a1de720200700080d531f4ede929161334",
    accent_color: "#FF5C8A", // strawberry
    icon: "Mic",
    category: "Interview Prep",
    status: "active",
  },
  {
    key: "job_scout",
    name: "ReStartHer Job Scout",
    description: "Explains recommended job opportunities and returnships, clarifies skill matches and missing requirements, prioritizes postings, and provides direct search links.",
    role_summary: "Opportunity Prioritization & Job Search Guide",
    jotform_id: "01a1de9d73187000802c8a3d7e9646b202f9",
    accent_color: "#4D8DFF", // blueberry
    icon: "Briefcase",
    category: "Career & Jobs",
    status: "active",
  },
  {
    key: "application_assistant",
    name: "ReStartHer Application Assistant",
    description: "Drafts tailored resume summaries, persuasive cover letters, and interview prep notes grounded strictly in learner facts. Requires human approval before applying.",
    role_summary: "Tailored Application Materials & Draft Assistant",
    jotform_id: "01a1dea7df10700086de70a71d70390e6a24",
    accent_color: "#8E5CFF", // grape
    icon: "FileText",
    category: "Applications",
    status: "active",
  },
];

export function AgentsHubPage({ basePath = "/app" }: { basePath?: string }) {
  const [agents, setAgents] = useState<JotformAgentInfo[]>(FALLBACK_AGENTS);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    api.jotformAgents()
      .then((data) => {
        if (data && data.length > 0) {
          setAgents(data);
        }
      })
      .catch(() => {});
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "UserPlus":
        return <UserPlus className="h-6 w-6" />;
      case "Target":
        return <Target className="h-6 w-6" />;
      case "BookOpen":
        return <BookOpen className="h-6 w-6" />;
      case "Mic":
        return <Mic className="h-6 w-6" />;
      case "Briefcase":
        return <Briefcase className="h-6 w-6" />;
      case "FileText":
        return <FileText className="h-6 w-6" />;
      default:
        return <Bot className="h-6 w-6" />;
    }
  };

  const filteredAgents =
    filter === "all" ? agents : agents.filter((a) => a.category.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="card relative overflow-hidden bg-gradient-to-br from-jelly-purple/10 via-jelly-strawberry/5 to-jelly-aqua/10 p-6 sm:p-8 shadow-jelly">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-jelly-purple/20 px-3 py-1 text-xs font-bold text-jelly-purple">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Agent Ecosystem</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">
            Six Dedicated Specialized AI Agents
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Each agent is custom-trained for a specific stage of your career comeback: from profile intake and skill-gap diagnosis to automated tutoring, mock interviews, opportunity scouting, and application drafting.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink">
            <span className="flex items-center gap-1 rounded-lg bg-surface/80 px-2.5 py-1 shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Isolated Sandboxes
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-surface/80 px-2.5 py-1 shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Human-in-the-Loop Approval
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-surface/80 px-2.5 py-1 shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Zero Fake Applications
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["all", "onboarding", "analysis", "learning", "interview", "career", "applications"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-all ${
                filter === cat
                  ? "bg-gradient-to-r from-jelly-purple to-jelly-blueberry text-white shadow-sm"
                  : "bg-surface border border-line text-ink-soft hover:bg-paper-deep"
              }`}
            >
              {cat === "all" ? "All Agents (6)" : cat}
            </button>
          ))}
        </div>
        <span className="text-xs font-medium text-ink-faint">
          Showing {filteredAgents.length} verified AI agent{filteredAgents.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgents.map((agent, idx) => (
          <div
            key={agent.key}
            className="card group flex flex-col justify-between overflow-hidden border border-line bg-surface p-6 shadow-jelly transition hover:shadow-lift"
            style={{ borderTop: `4px solid ${agent.accent_color}` }}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md transition-transform group-hover:scale-110"
                  style={{ backgroundColor: agent.accent_color }}
                >
                  {getIcon(agent.icon)}
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Agent {idx + 1}
                  </span>
                  <div className="mt-1 text-[11px] font-semibold text-ink-faint">{agent.category}</div>
                </div>
              </div>

              <h3 className="mt-4 text-base font-extrabold text-ink">{agent.name}</h3>
              <p className="mt-1 text-xs font-bold text-plum-600">{agent.role_summary}</p>
              <p className="mt-2.5 text-xs leading-relaxed text-ink-soft">{agent.description}</p>
            </div>

            <div className="mt-6 border-t border-line/80 pt-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/agents/${agent.key}`)}
                  className="jelly-btn flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: agent.accent_color }}
                >
                  <span>Launch Agent</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <a
                  href={`https://agent.jotform.com/${agent.jotform_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs font-semibold text-ink-soft hover:bg-paper-deep"
                  title="Open in new window"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Direct Tab</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

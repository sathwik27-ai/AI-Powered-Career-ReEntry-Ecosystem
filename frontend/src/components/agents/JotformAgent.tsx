import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  UserCheck,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface JotformAgentProps {
  agentId: string;
  agentKey: string;
  agentName: string;
  accentColor?: string;
  description?: string;
  height?: string;
  showCardHeader?: boolean;
}

export function JotformAgent({
  agentId,
  agentKey,
  agentName,
  accentColor = "#8E5CFF",
  description,
  height = "680px",
  showCardHeader = true,
}: JotformAgentProps) {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const directUrl = `https://agent.jotform.com/${agentId}`;

  useEffect(() => {
    // Fetch current learner profile to train and summarize agent context
    api.listenerProfile()
      .then((data) => setProfileData(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);

    // Record agent activity in backend
    api.logAgentActivity({
      agent_key: agentKey,
      action: `Opened ${agentName} chat`,
    }).catch(() => {});

    // Ensure any stray Jotform floating circular widgets are removed from the page
    const existingWidgets = document.querySelectorAll("[id*='jfAgent'], [class*='jfAgent']");
    existingWidgets.forEach((w) => w.remove());

    const scrollPos = window.scrollY;
    const timer = setTimeout(() => {
      setLoading(false);
      // Prevent child iframe from jarringly scrolling the parent window
      if (Math.abs(window.scrollY - scrollPos) > 100) {
        window.scrollTo({ top: scrollPos, behavior: "instant" });
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      const floatingWidgets = document.querySelectorAll("[id*='jfAgent'], [class*='jfAgent']");
      floatingWidgets.forEach((w) => w.remove());
    };
  }, [agentId, agentKey, agentName, iframeKey]);

  const handleRefresh = () => {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const targetRole = profileData?.profile?.target_role || "Software Developer";
  const breakYears = profileData?.profile?.career_break_years ?? 2;
  const breakReason = profileData?.profile?.career_break_reason || "Career break";
  const prevRole = profileData?.profile?.previous_role || "Engineer";
  const skillsList = profileData?.skills || profileData?.profile?.skills || [];
  const skillsText = skillsList.length > 0 ? skillsList.slice(0, 5).join(", ") : "Core programming";
  const gapsList = profileData?.gaps || [];
  const gapsText = gapsList.length > 0 ? gapsList.slice(0, 4).map((g: any) => g.skill).join(", ") : "Curriculum topics";

  // Pre-generate tailored prompt for the learner to train this agent
  const getAgentPrompt = () => {
    const learnerName = user?.name || "Learner";
    switch (agentKey) {
      case "profile_intake":
        return `Hi! My name is ${learnerName}. I am re-entering the tech workforce after a ${breakYears}-year career break (${breakReason}). My previous role was ${prevRole}, and I am targeting ${targetRole}. My prior skills include: ${skillsText}. Please review my background and guide my comeback plan.`;
      case "skill_gap":
      case "skill_gap_explainer":
        return `Hi! My name is ${learnerName}. I am preparing to return as a ${targetRole}. My existing skills are ${skillsText}, and my identified learning gaps are ${gapsText}. Please explain which skills I should prioritize and why.`;
      case "tutor_coach":
        return `Hi Tutor Coach! I am ${learnerName}, preparing for ${targetRole} after a ${breakYears}-year break. Please teach me ${gapsList[0]?.skill || "my primary skill gap"} with clear explanations, step-by-step code examples, and practice questions.`;
      case "interview_coach":
        return `Hi Interview Coach! I am ${learnerName}. Please run a supportive mock interview for a ${targetRole} role. I had a ${breakYears}-year career break due to ${breakReason}. Please ask me realistic questions and help me articulate my break with confidence.`;
      case "job_scout":
        return `Hi Job Scout! I am ${learnerName}, returning to tech as a ${targetRole}. My key skills are ${skillsText}, and I am learning ${gapsText}. What returnships, flexible arrangements, and opportunities best fit my profile?`;
      case "application_assistant":
        return `Hi Application Assistant! I am ${learnerName}. Please help me draft a resume summary and cover letter tailored for a ${targetRole} position, highlighting my transferable skills in ${skillsText} and framing my career break positively.`;
      default:
        return `Hi! I am ${learnerName}, targeting ${targetRole} after a ${breakYears}-year career break (${breakReason}). My background is in ${prevRole}. Existing skills: ${skillsText}. Gaps: ${gapsText}.`;
    }
  };

  const handleCopyPrompt = () => {
    const prompt = getAgentPrompt();
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  return (
    <div className="card overflow-hidden border border-line bg-surface p-0 shadow-jelly transition-all">
      {showCardHeader && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4"
          style={{ borderTop: `4px solid ${accentColor}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-ink text-sm sm:text-base">{agentName}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live AI Agent
                </span>
              </div>
              {description && <p className="text-xs text-ink-soft line-clamp-1">{description}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-paper-deep transition-all"
              title="Restart session"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-paper-deep transition-all"
              title="Open full view in a new browser tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Full Tab</span>
            </a>
          </div>
        </div>
      )}

      {/* Dynamic Profile Training Context Bar */}
      <div className="border-b border-line/70 bg-gradient-to-r from-paper-deep/70 via-surface to-paper-deep/50 px-5 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-extrabold text-ink">Trained on {user?.name || "Your"} Profile:</span>
                <span className="rounded-md bg-plum-600/10 px-1.5 py-0.5 font-bold text-plum-700 dark:text-plum-300">
                  {targetRole}
                </span>
                <span className="rounded-md bg-paper-deep px-1.5 py-0.5 text-ink-soft">
                  {breakYears}y break
                </span>
                {skillsList.length > 0 && (
                  <span className="hidden md:inline text-ink-faint">
                    · Skills: {skillsList.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold transition-all shadow-xs ${
                copiedPrompt
                  ? "bg-emerald-600 text-white"
                  : "bg-surface border border-line text-ink hover:border-jelly-purple"
              }`}
              title="Copy customized prompt grounded in your profile to paste into the chat"
            >
              {copiedPrompt ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Prompt Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-jelly-purple" />
                  <span>Send Profile to Chat</span>
                </>
              )}
            </button>
            {agentKey !== "profile_intake" ? (
              <Link
                to="/app/intake"
                className="text-[11px] font-bold text-plum-600 hover:underline"
              >
                Edit Profile
              </Link>
            ) : (
              <a
                href="#intake-form"
                className="text-[11px] font-bold text-plum-600 hover:underline"
              >
                Intake Form & Resume ↓
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Safety & Sandbox Notice */}
      <div className="flex items-center gap-2 border-b border-line/60 bg-paper-deep/40 px-5 py-2 text-xs text-ink-soft">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="font-medium text-[11px]">
          Dedicated AI Agent. Actions run in a secure sandbox; ReStartHer never auto-submits applications.
        </span>
      </div>

      {/* Embedded Chatbot Viewport */}
      <div
        ref={containerRef}
        id={`jotform-container-${agentId}`}
        className="relative w-full overflow-hidden bg-white dark:bg-[#1E1638]"
        style={{ height, minHeight: "560px" }}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/90 backdrop-blur-sm">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-transparent"
              style={{ borderTopColor: accentColor }}
            />
            <p className="mt-3 text-sm font-bold text-ink">Connecting to {agentName}...</p>
            <p className="text-xs text-ink-faint">Initializing interactive chat interface</p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={directUrl}
          title={agentName}
          className="h-full w-full border-none"
          allow="microphone; camera; clipboard-write"
          tabIndex={-1}
          loading="lazy"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}

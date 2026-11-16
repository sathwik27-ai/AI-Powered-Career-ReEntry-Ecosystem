import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Bot, ShieldCheck } from "lucide-react";
import { JotformAgent } from "../components/agents/JotformAgent";
import { api } from "../api/client";
import type { JotformAgentInfo } from "../api/types";
import { FALLBACK_AGENTS } from "./AgentsHubPage";

export function AgentViewPage({ backUrl }: { backUrl?: string }) {
  const params = useParams();
  const location = useLocation();
  const agentKey = params.agentKey || params.key;

  const computedBackUrl =
    backUrl ||
    (location.pathname.startsWith("/trainer")
      ? "/trainer/agents"
      : location.pathname.startsWith("/admin")
      ? "/admin/agents"
      : "/app/agents");

  const [agent, setAgent] = useState<JotformAgentInfo | null>(() => {
    return FALLBACK_AGENTS.find((a) => a.key === agentKey) || null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agentKey) {
      const fallback = FALLBACK_AGENTS.find((a) => a.key === agentKey);
      if (fallback) setAgent(fallback);

      api.jotformAgents()
        .then((agents) => {
          const match = agents.find((a) => a.key === agentKey);
          if (match) {
            setAgent(match);
          }
        })
        .catch(() => {});
    }
  }, [agentKey]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-jelly-purple" />
          <p className="text-xs font-bold text-ink">Loading Agent...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="card p-8 text-center">
        <Bot className="mx-auto h-12 w-12 text-ink-faint" />
        <h2 className="mt-3 text-lg font-bold text-ink">Agent Not Found</h2>
        <p className="mt-1 text-xs text-ink-soft">Could not locate the requested AI agent configuration.</p>
        <Link
          to={computedBackUrl}
          className="jelly-btn mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-jelly-purple to-jelly-blueberry px-4 py-2 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to AI Agents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top back bar */}
      <div className="flex items-center justify-between">
        <Link
          to={computedBackUrl}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-paper-deep hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Agents</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Secure Jotform Embed Session</span>
        </div>
      </div>

      {/* Main Agent Interface */}
      <JotformAgent
        agentId={agent.jotform_id}
        agentKey={agent.key}
        agentName={agent.name}
        description={agent.description}
        accentColor={agent.accent_color}
        height="720px"
        showCardHeader={true}
      />
    </div>
  );
}

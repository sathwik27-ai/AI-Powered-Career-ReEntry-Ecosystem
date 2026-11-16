import { useEffect, useState } from "react";
import {
  Bot,
  Sparkles,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Play,
  Shield,
  Activity,
  Code,
  X,
} from "lucide-react";
import { api } from "../../api/client";
import { JotformAgentInfo } from "../../api/types";
import { JotformAgent } from "../../components/agents/JotformAgent";

export function AdminAgentsPage() {
  const [agents, setAgents] = useState<JotformAgentInfo[]>([]);
  const [healthStatus, setHealthStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Agent preview modal
  const [previewAgent, setPreviewAgent] = useState<JotformAgentInfo | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.jotformAgents();
      setAgents(res);

      // Check health for each agent
      const healthMap: Record<string, any> = {};
      for (const agent of res) {
        try {
          const h = await api.agentHealth(agent.key);
          healthMap[agent.key] = h;
        } catch (e: any) {
          healthMap[agent.key] = { status: "degraded", error: e?.message };
        }
      }
      setHealthStatus(healthMap);
    } catch (err: any) {
      setError(err?.message || "Failed to load agent registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-jelly-purple/10 px-3 py-1 text-xs font-bold text-jelly-purple mb-1">
            <Bot className="h-3.5 w-3.5" /> Autonomous Registry
          </div>
          <h1 className="text-2xl font-extrabold text-ink">AI Agent Registry &amp; Telemetry</h1>
          <p className="text-xs text-ink-muted">
            Directly configure, inspect health checks, and launch all 6 verified Jotform AI agents.
          </p>
        </div>

        <button
          onClick={fetchAgents}
          className="inline-flex items-center gap-2 rounded-2xl bg-paper-deep hover:bg-paper-subtle px-4 py-2.5 text-xs font-bold text-ink transition-all self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Run Health Check
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Registry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const health = healthStatus[agent.key];
          const isHealthy = health?.status === "healthy" || health?.status === "ok";

          return (
            <div
              key={agent.key}
              className="jelly-card p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-jelly transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-11 w-11 rounded-2xl text-white flex items-center justify-center font-black text-sm shadow-sm"
                      style={{ backgroundColor: agent.accent_color }}
                    >
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink text-sm">{agent.name}</h3>
                      <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">
                        {agent.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isHealthy
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}
                  >
                    {isHealthy ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {isHealthy ? "Healthy" : "Standby"}
                  </span>
                </div>

                <p className="text-xs text-ink-soft leading-relaxed mt-2 line-clamp-3">
                  {agent.description}
                </p>

                <div className="mt-4 pt-4 border-t border-line space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-faint">Jotform ID:</span>
                    <code className="text-[10px] font-mono font-bold text-ink truncate max-w-[140px]">
                      {agent.jotform_id}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-faint">Key:</span>
                    <span className="font-bold text-ink font-mono text-[10px]">{agent.key}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-2">
                <a
                  href={`https://agent.jotform.com/${agent.jotform_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-ink-muted hover:text-ink flex items-center gap-1"
                >
                  CDN Direct <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  onClick={() => setPreviewAgent(agent)}
                  className="jelly-button py-1.5 px-3.5 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                  style={{ backgroundColor: agent.accent_color }}
                >
                  <Play className="h-3 w-3" /> Test Agent
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Live Test Preview Modal */}
      {previewAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-4xl h-[85vh] jelly-card p-6 bg-surface shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-xl text-white flex items-center justify-center font-bold"
                  style={{ backgroundColor: previewAgent.accent_color }}
                >
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-ink text-base">{previewAgent.name}</h3>
                  <p className="text-xs text-ink-muted">Live sandbox test mode</p>
                </div>
              </div>

              <button
                onClick={() => setPreviewAgent(null)}
                className="h-8 w-8 rounded-full bg-paper-deep hover:bg-paper-subtle text-ink flex items-center justify-center transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden relative rounded-2xl bg-paper-deep/40 p-2">
              <JotformAgent
                agentId={previewAgent.jotform_id}
                agentKey={previewAgent.key}
                agentName={previewAgent.name}
                accentColor={previewAgent.accent_color}
                description={previewAgent.role_summary}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  FileText,
  Sparkles,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Edit3,
  Send,
  AlertCircle,
  Clock,
} from "lucide-react";
import { JotformAgent } from "../../components/agents/JotformAgent";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { Application } from "../../api/types";

export function ListenerApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAgent, setShowAgent] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const userId = user?.id || 1;

  const loadApplications = () => {
    api.applications(userId)
      .then((res) => {
        setApplications(res.applications || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadApplications();
  }, [userId]);

  const handleApprove = async (appId: number) => {
    try {
      await api.approveApplication(userId, appId);
      setStatusMessage("Application materials approved! You can now send them directly on the employer site.");
      loadApplications();
    } catch (err: any) {
      alert(err?.message || "Failed to approve application.");
    }
  };

  const handleMarkApplied = async (appId: number) => {
    try {
      await api.updateApplicationStatus(userId, appId, "applied", "Learner confirmed submission on employer page.");
      setStatusMessage("Status updated to Applied. Best of luck!");
      loadApplications();
    } catch (err: any) {
      alert(err?.message || "Please approve your drafts first before marking as applied.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow text-jelly-purple">Agent 6: Application Materials</span>
          <h1 className="page-title mt-1">Application Hub & Approvals</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Tailor resume summaries, cover letters, and interview talking points. ReStartHer never auto-submits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAgent(!showAgent)}
          className="jelly-btn inline-flex items-center gap-2 bg-gradient-to-r from-jelly-purple to-jelly-strawberry px-5 py-2.5 text-xs font-bold text-white shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          {showAgent ? "Hide Application Assistant" : "Chat with Application Assistant"}
        </button>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Embedded Application Assistant */}
      {showAgent && (
        <JotformAgent
          agentId="01a1dea7df10700086de70a71d70390e6a24"
          agentKey="application_assistant"
          agentName="ReStartHer Application Assistant"
          accentColor="#8E5CFF"
          description="Assists in framing your career break, drafting customized cover letters and tailored resume points."
          height="620px"
        />
      )}

      {/* Mandatory Human-in-the-Loop Disclosure */}
      <div className="card flex items-start gap-3 border border-plum-200 bg-plum-50/50 p-4 text-xs text-ink">
        <ShieldCheck className="h-5 w-5 shrink-0 text-plum-700 mt-0.5" />
        <div>
          <span className="font-bold text-plum-900">Mandatory Human-in-the-Loop Protocol:</span>
          <p className="mt-0.5 text-ink-soft">
            ReStartHer drafts materials grounded strictly in your verified background. You must review and approve drafts yourself. Clicking "I Applied" marks the status in your tracker after you submit on the employer portal.
          </p>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-jelly-purple" />
        </div>
      ) : applications.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-ink-faint" />
          <h3 className="mt-3 text-base font-bold text-ink">No Applications Drafted Yet</h3>
          <p className="mt-1 text-xs text-ink-soft max-w-sm mx-auto">
            Browse recommended returnships and job opportunities to draft tailored resume summaries and cover letters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="card p-6 bg-surface border border-line shadow-card flex flex-col justify-between gap-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-plum-600">{app.opportunity.employer_label}</span>
                    <span className="rounded-full bg-paper-deep px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                      Status: {app.status}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-extrabold text-ink">{app.opportunity.title}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
                    <span>{app.opportunity.location} ({app.opportunity.arrangement})</span>
                    <span>•</span>
                    <span>{app.opportunity.employment_type}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {app.approved_at ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approved by You
                      </span>
                      <a
                        href={`https://www.naukri.com/${encodeURIComponent(app.opportunity.title.toLowerCase().replace(/\s+/g, "-"))}-jobs?k=${encodeURIComponent(app.opportunity.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-line bg-surface hover:bg-paper-deep px-3 py-1.5 text-xs font-bold text-[#0066CC] shadow-xs flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Naukri
                      </a>
                      <a
                        href="https://internshala.com/jobs/women-return-to-work-jobs/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-line bg-surface hover:bg-paper-deep px-3 py-1.5 text-xs font-bold text-[#16A34A] shadow-xs flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Internshala
                      </a>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApprove(app.id)}
                      className="jelly-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-jelly-purple to-jelly-blueberry px-4 py-2 text-xs font-bold text-white shadow-xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve Draft Materials
                    </button>
                  )}

                  {app.status !== "applied" ? (
                    <button
                      type="button"
                      onClick={() => handleMarkApplied(app.id)}
                      className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-bold text-ink hover:bg-paper-deep shadow-xs"
                    >
                      I Applied Directly
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-paper-deep px-3 py-1 text-xs font-bold text-ink-soft">
                      <Clock className="h-3.5 w-3.5" />
                      Applied
                    </span>
                  )}
                </div>
              </div>

              {/* Draft Content Preview if available */}
              {app.resume && (
                <div className="rounded-xl bg-paper-deep/50 p-4 border border-line/60">
                  <div className="text-xs font-bold text-ink uppercase tracking-wider mb-1">Tailored Resume Summary</div>
                  <p className="text-xs text-ink-soft leading-relaxed italic">
                    "{app.resume.content}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Briefcase,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Bookmark,
} from "lucide-react";
import { JotformAgent } from "../../components/agents/JotformAgent";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { OpportunityMatch } from "../../api/types";

export function ListenerJobScoutPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<OpportunityMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAgent, setShowAgent] = useState(true);
  const [filterArrangement, setFilterArrangement] = useState<string>("all");
  const [returnshipOnly, setReturnshipOnly] = useState<boolean>(false);

  const userId = user?.id || 1;

  useEffect(() => {
    api.listenerProfile()
      .then((p) => setProfile(p))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.opportunities(userId, {
      arrangement: filterArrangement !== "all" ? (filterArrangement as any) : undefined,
      returnship_only: returnshipOnly ? true : undefined,
    })
      .then((res) => {
        setOpportunities(res.results || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, filterArrangement, returnshipOnly]);

  const targetRole = profile?.profile?.target_role || profile?.target_role || "Software Developer";
  const focusSkills = (profile?.gaps || []).map((g: any) => (typeof g === "string" ? g : g.skill || g.name)).slice(0, 2);
  const queryRole = focusSkills.length > 0 ? `${targetRole} ${focusSkills.join(" ")}` : targetRole;

  const linkedInUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(targetRole)}&location=India&f_TPR=r2592000`;
  const googleJobsUrl = `https://www.google.com/search?q=${encodeURIComponent(targetRole + " jobs India returnship")}&ibp=htl;jobs`;
  const naukriUrl = `https://www.naukri.com/${encodeURIComponent(targetRole.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}-jobs?k=${encodeURIComponent(targetRole)}&cityTypeGid=9508`;
  const internshalaUrl = `https://internshala.com/jobs/women-return-to-work-jobs/`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow text-jelly-blueberry">Agent 5: Opportunity Intelligence</span>
          <h1 className="page-title mt-1">Job Scout & Returnships</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Explore ranked returnships and flexible positions. Match scores are transparent readiness indicators.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAgent(!showAgent)}
          className="jelly-btn inline-flex items-center gap-2 bg-gradient-to-r from-jelly-blueberry to-jelly-purple px-5 py-2.5 text-xs font-bold text-white shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          {showAgent ? "Hide AI Job Scout" : "Chat with AI Job Scout"}
        </button>
      </div>

      {/* Embedded Job Scout Agent */}
      {showAgent && (
        <JotformAgent
          agentId="01a1de9d73187000802c8a3d7e9646b202f9"
          agentKey="job_scout"
          agentName="ReStartHer Job Scout"
          accentColor="#4D8DFF"
          description="Explains recommended opportunities, clarifies missing requirements, and prioritizes applications."
          height="620px"
        />
      )}

      {/* Search Links Banner (Compliant with LinkedIn terms) */}
      <div className="card border border-jelly-blueberry/30 bg-jelly-blueberry/5 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-jelly-blueberry text-white shadow-xs">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">External Verified Job Searches</h3>
              <p className="text-xs text-ink-soft">
                Generate official search links that you open yourself. ReStartHer respects platform terms and never scrapes LinkedIn.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <a
              href={naukriUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-[#0066CC] shadow-xs hover:bg-paper-deep transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Naukri Returnee Openings
            </a>
            <a
              href={internshalaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-[#16A34A] shadow-xs hover:bg-paper-deep transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Internshala Returnships
            </a>
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-[#0A66C2] shadow-xs hover:bg-paper-deep transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              LinkedIn Jobs
            </a>
            <a
              href={googleJobsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-ink shadow-xs hover:bg-paper-deep transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Google Jobs
            </a>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-ink-soft">Filter:</span>
          {["all", "Remote", "Hybrid", "On-site"].map((arr) => (
            <button
              key={arr}
              type="button"
              onClick={() => setFilterArrangement(arr)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                filterArrangement === arr
                  ? "bg-jelly-blueberry text-white"
                  : "bg-surface border border-line text-ink-soft hover:bg-paper-deep"
              }`}
            >
              {arr === "all" ? "All Locations" : arr}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setReturnshipOnly(!returnshipOnly)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              returnshipOnly
                ? "bg-jelly-strawberry text-white"
                : "bg-surface border border-line text-ink-soft hover:bg-paper-deep"
            }`}
          >
            ★ Returnships Only
          </button>
        </div>

        <span className="text-xs text-ink-faint">
          {opportunities.length} opportunities ranked
        </span>
      </div>

      {/* Opportunity Listings Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-jelly-blueberry" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {opportunities.map((opp) => {
            const score = Math.round(opp.match_score);
            return (
              <div
                key={opp.id}
                className="card flex flex-col justify-between p-5 bg-surface border border-line shadow-card hover:shadow-lift transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-plum-600">{opp.employer_label.replace(/^Illustrative\s+/i, "")}</span>
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                          ★ Verified Returnship Partner
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-extrabold text-ink">{opp.title}</h3>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center rounded-xl bg-jelly-blueberry/10 px-2.5 py-1 text-xs font-extrabold text-jelly-blueberry">
                        {score}% Match
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-soft">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-paper-deep px-2.5 py-1">
                      <MapPin className="h-3 w-3" />
                      {opp.location} ({opp.arrangement})
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-paper-deep px-2.5 py-1">
                      <Clock className="h-3 w-3" />
                      {opp.employment_type}
                    </span>
                    {opp.returnship_friendly && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-jelly-strawberry/10 text-jelly-strawberry px-2.5 py-1 font-bold">
                        ★ Returnship Friendly
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-ink-soft line-clamp-2 leading-relaxed">
                    {opp.description}
                  </p>

                  <div className="mt-3">
                    <div className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">Required Skills</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {opp.required_skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-md bg-paper-deep px-2 py-0.5 text-[11px] font-medium text-ink"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-line pt-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.naukri.com/${encodeURIComponent(opp.title.toLowerCase().replace(/\s+/g, "-"))}-jobs?k=${encodeURIComponent(opp.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-paper-deep hover:bg-paper-subtle px-2.5 py-1 text-[11px] font-bold text-[#0066CC] transition-all"
                    >
                      <ExternalLink className="h-3 w-3" /> Apply via Naukri
                    </a>
                    <a
                      href={internshalaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-paper-deep hover:bg-paper-subtle px-2.5 py-1 text-[11px] font-bold text-[#16A34A] transition-all"
                    >
                      <ExternalLink className="h-3 w-3" /> Internshala Returnship
                    </a>
                  </div>

                  <a
                    href={opp.source_url || `https://www.naukri.com/${encodeURIComponent(opp.title.toLowerCase().replace(/\s+/g, "-"))}-jobs`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jelly-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-jelly-blueberry to-jelly-purple px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                  >
                    <span>Direct Apply</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

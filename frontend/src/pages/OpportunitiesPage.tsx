import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Info, RotateCcw, SlidersHorizontal } from "lucide-react";
import { api, ApiError } from "@/api/client";
import { EMPLOYMENT_TYPES, type EmploymentType, type OpportunityFilters, type OpportunityMatch, type WorkArrangement } from "@/api/types";
import { useSession } from "@/context/SessionContext";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/useApi";
import { Button, ButtonLink, EmptyNote, ErrorState, Skeleton, cx } from "@/components/ui/primitives";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";

/** Arrangement values listings actually carry (the API filter compares against them exactly). */
const ARRANGEMENTS: WorkArrangement[] = ["Remote", "Hybrid", "On-site"];

type Tab = "matched" | "saved";

const select =
  "field";

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const { userId } = useSession();
  const uid = user?.id || userId || 1;
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("matched");
  const [filters, setFilters] = useState<OpportunityFilters>({});
  const [draft, setDraft] = useState<OpportunityFilters>({});
  const [flexibleOnly, setFlexibleOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // small screens only

  const matched = useApi((signal) => api.opportunities(uid, filters, signal), [uid, JSON.stringify(filters)]);
  const saved = useApi((signal) => api.savedOpportunities(uid, signal), [uid]);

  // Local copies so save/unsave reflect immediately.
  const [items, setItems] = useState<OpportunityMatch[]>([]);
  const [savedItems, setSavedItems] = useState<OpportunityMatch[]>([]);
  useEffect(() => {
    if (matched.data) setItems(matched.data.results);
  }, [matched.data]);
  useEffect(() => {
    if (saved.data) setSavedItems(saved.data.results);
  }, [saved.data]);

  const [busySave, setBusySave] = useState<number | null>(null);
  const [busyDraft, setBusyDraft] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const toggleSave = async (o: OpportunityMatch) => {
    setBusySave(o.id);
    setActionError(null);
    try {
      if (o.saved) await api.unsaveOpportunity(uid, o.id);
      else await api.saveOpportunity(uid, o.id);
      const next = !o.saved;
      setItems((list) => list.map((x) => (x.id === o.id ? { ...x, saved: next } : x)));
      if (next) setSavedItems((list) => [{ ...o, saved: true, saved_at: new Date().toISOString() }, ...list.filter((x) => x.id !== o.id)]);
      else setSavedItems((list) => list.filter((x) => x.id !== o.id));
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusySave(null);
    }
  };

  const draftApplication = async (o: OpportunityMatch) => {
    setBusyDraft(o.id);
    setActionError(null);
    try {
      const res = await api.createApplication(uid, o.id);
      navigate(`/applications?id=${res.application.id}`);
    } catch (err) {
      setActionError((err as Error).message);
      setBusyDraft(null);
    }
  };

  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    const clean: OpportunityFilters = {};
    if (draft.arrangement) clean.arrangement = draft.arrangement;
    if (draft.employment_type) clean.employment_type = draft.employment_type;
    if (draft.location?.trim()) clean.location = draft.location.trim();
    if (draft.role?.trim()) clean.role = draft.role.trim();
    if (draft.returnship_only) clean.returnship_only = true;
    setFilters(clean);
  };
  const resetFilters = () => {
    setDraft({});
    setFilters({});
    setFlexibleOnly(false);
  };

  const noProfile = matched.error instanceof ApiError && matched.error.status === 409;
  const list = (tab === "matched" ? items : savedItems).filter((o) => !flexibleOnly || o.flexible_hours);
  const disclaimer = matched.data?.disclaimer ?? saved.data?.disclaimer;
  const active = tab === "matched" ? matched : saved;
  const filterCount = Object.keys(filters).length + (flexibleOnly ? 1 : 0);

  if (noProfile) {
    return (
      <div className="max-w-2xl animate-rise">
        <p className="eyebrow mb-3">Opportunity Discovery Agent</p>
        <h1 className="page-title">Matches need a profile first.</h1>
        <p className="mt-4 text-lg text-ink-soft">{matched.error?.message}</p>
        <ButtonLink to="/onboarding" className="mt-8">
          Start onboarding
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <header>
        <p className="eyebrow">Opportunity Discovery Agent</p>
        <h1 className="mt-1 page-title">Roles ranked for your comeback</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">Each match explains itself: which of your skills it uses, what you're already learning, and what's still missing.</p>
      </header>

      <div className="mt-6 flex gap-3 rounded-xl border border-dashed border-ochre-600/40 bg-ochre-100/40 px-4 py-3 text-sm text-ochre-700" role="note">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <strong>Curated Returnship Openings.</strong> ReStartHer matches your current skill readiness with flexible roles, returnships, and verified openings on Naukri and Internshala.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Opportunity lists">
        {(
          [
            ["matched", `Matched${matched.data ? ` (${matched.data.count})` : ""}`],
            ["saved", `Saved (${savedItems.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cx("chip h-9 px-4", tab === k && "chip-on")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="min-w-0">
          <Button type="button" variant="secondary" className="w-full lg:hidden" aria-expanded={showFilters} aria-controls="opp-filters" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden /> {showFilters ? "Hide filters" : `Filters${filterCount ? ` (${filterCount})` : ""}`}
          </Button>
          <form id="opp-filters" onSubmit={applyFilters} className={cx("card space-y-4 p-5 lg:sticky lg:top-24 lg:mt-0 lg:block", showFilters ? "mt-3 block" : "hidden")} aria-label="Filter opportunities">
            <p className="eyebrow">Filters</p>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Work arrangement</span>
              <select className={select} value={draft.arrangement ?? ""} onChange={(e) => setDraft({ ...draft, arrangement: (e.target.value || undefined) as WorkArrangement | undefined })} disabled={tab === "saved"}>
                <option value="">Any</option>
                {ARRANGEMENTS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Employment type</span>
              <select className={select} value={draft.employment_type ?? ""} onChange={(e) => setDraft({ ...draft, employment_type: (e.target.value || undefined) as EmploymentType | undefined })} disabled={tab === "saved"}>
                <option value="">Any</option>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Location</span>
              <input className={select} value={draft.location ?? ""} maxLength={80} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="City or Remote" disabled={tab === "saved"} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Role</span>
              <input className={select} value={draft.role ?? ""} maxLength={80} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="e.g. Backend" disabled={tab === "saved"} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-plum-700" checked={!!draft.returnship_only} onChange={(e) => setDraft({ ...draft, returnship_only: e.target.checked })} disabled={tab === "saved"} />
              Returnship-friendly only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-plum-700" checked={flexibleOnly} onChange={(e) => setFlexibleOnly(e.target.checked)} />
              Flexible hours only
            </label>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="h-9 flex-1 px-3.5" disabled={tab === "saved"}>
                Apply
              </Button>
              {filterCount > 0 && (
                <Button type="button" variant="quiet" className="h-9 px-3" onClick={resetFilters} aria-label="Clear filters">
                  <RotateCcw className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </div>
            {tab === "saved" && <p className="text-xs text-ink-faint">Server filters apply to the Matched list.</p>}
          </form>
        </aside>

        <section className="min-w-0 space-y-4" aria-live="polite" aria-busy={active.loading}>
          {actionError && (
            <p className="rounded-xl bg-rosewood-100 px-4 py-3 text-sm text-rosewood-600" role="alert">
              {actionError}
            </p>
          )}
          {active.error && !noProfile ? (
            <ErrorState error={active.error} onRetry={active.reload} title="Couldn't load opportunities" />
          ) : active.loading && list.length === 0 ? (
            <>
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </>
          ) : list.length === 0 ? (
            <EmptyNote
              action={
                tab === "matched" && filterCount > 0 ? (
                  <Button variant="secondary" onClick={resetFilters}>
                    Clear filters
                  </Button>
                ) : tab === "saved" ? (
                  <Button variant="secondary" onClick={() => setTab("matched")}>
                    Browse matches
                  </Button>
                ) : undefined
              }
            >
              {tab === "saved" ? "You haven't saved any opportunities yet." : filterCount > 0 ? "No opportunities match these filters." : "No opportunities found for your profile yet."}
            </EmptyNote>
          ) : (
            list.map((o) => (
              <OpportunityCard key={o.id} opp={o} saving={busySave === o.id} drafting={busyDraft === o.id} onToggleSave={() => toggleSave(o)} onDraft={() => draftApplication(o)} />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

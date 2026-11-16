import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Copy, RefreshCw, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/api/client";
import type { Application, ApplicationStatus } from "@/api/types";
import { useSession } from "@/context/SessionContext";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/useApi";
import { parseTime, timeAgo } from "@/lib/format";
import { Button, ButtonLink, Card, CardHeader, DemoListingTag, EmptyNote, ErrorState, Pill, Skeleton, cx } from "@/components/ui/primitives";

export const APP_STATUS: Record<ApplicationStatus, { label: string; tone: "neutral" | "lilac" | "plum" | "sage" | "ochre" | "rose" }> = {
  saved: { label: "Saved", tone: "neutral" },
  drafted: { label: "Drafted", tone: "lilac" },
  ready_for_review: { label: "Approved · ready to send", tone: "plum" },
  applied: { label: "Applied", tone: "sage" },
  interview: { label: "Interviewing", tone: "sage" },
  offer: { label: "Offer", tone: "sage" },
  rejected: { label: "Not progressed", tone: "rose" },
};
const POST_APPROVAL: ApplicationStatus[] = ["applied", "interview", "offer", "rejected"];
const LIMITS = { resume: 20000, cover_letter: 10000 } as const;

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { userId } = useSession();
  const uid = user?.id || userId || 1;
  const [params, setParams] = useSearchParams();
  const { data, error, loading, reload } = useApi((signal) => api.applications(uid, signal), [uid]);
  const [apps, setApps] = useState<Application[]>([]);
  useEffect(() => {
    if (data) setApps(data.applications);
  }, [data]);

  const selectedId = Number(params.get("id")) || apps[0]?.id || null;
  const selected = apps.find((a) => a.id === selectedId) ?? null;
  const replace = (a: Application) => setApps((list) => list.map((x) => (x.id === a.id ? a : x)));

  if (loading && !data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} title="Couldn't load your applications" />;

  return (
    <div className="animate-rise">
      <header>
        <p className="eyebrow">Resume & Application Agent</p>
        <h1 className="mt-1 page-title">Applications</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">Drafts are written from your verified profile only. You edit them, you approve them, and you send them yourself.</p>
      </header>

      <div className="mt-6 flex gap-3 rounded-xl border border-plum-500/20 bg-lilac-50 px-4 py-3 text-sm text-plum-800" role="note">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>{data?.note ?? "ReStartHer never submits applications automatically."}</p>
      </div>

      {apps.length === 0 ? (
        <div className="mt-6 max-w-xl">
          <EmptyNote action={<ButtonLink to="/opportunities">Browse opportunities</ButtonLink>}>No applications yet. Pick an opportunity and choose “Draft application” to get a tailored resume and cover letter to review.</EmptyNote>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
          <nav aria-label="Your applications" className="min-w-0">
            <ul className="space-y-2">
              {apps.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setParams({ id: String(a.id) }, { replace: true })}
                    aria-current={a.id === selectedId ? "true" : undefined}
                    className={cx("w-full rounded-xl border p-4 text-left transition", a.id === selectedId ? "border-plum-700 bg-white shadow-lift" : "border-line bg-paper/60 hover:border-line-strong")}
                  >
                    <span className="flex items-center gap-2">
                      {a.opportunity.is_demo && <DemoListingTag />}
                      <Pill tone={APP_STATUS[a.status].tone}>{APP_STATUS[a.status].label}</Pill>
                    </span>
                    <span className="mt-2 block text-sm font-semibold leading-snug">{a.opportunity.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-soft">{a.opportunity.employer_label}</span>
                    <span className="mt-1 block text-xs text-ink-faint">updated {timeAgo(a.updated_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {selected ? <ApplicationDetail key={selected.id} uid={uid} app={selected} onChange={replace} /> : <EmptyNote>Select an application.</EmptyNote>}
        </div>
      )}
    </div>
  );
}

function ApplicationDetail({ uid, app, onChange }: { uid: number; app: Application; onChange: (a: Application) => void }) {
  const [tab, setTab] = useState<"resume" | "cover_letter">("resume");
  const [resume, setResume] = useState(app.resume?.content ?? "");
  const [letter, setLetter] = useState(app.cover_letter?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Keep editors in sync when the server copy changes (save, regenerate).
  useEffect(() => {
    setResume(app.resume?.content ?? "");
    setLetter(app.cover_letter?.content ?? "");
  }, [app.resume?.content, app.cover_letter?.content]);

  const dirty = resume !== (app.resume?.content ?? "") || letter !== (app.cover_letter?.content ?? "");
  const value = tab === "resume" ? resume : letter;
  const setValue = tab === "resume" ? setResume : setLetter;
  const over = resume.length > LIMITS.resume || letter.length > LIMITS.cover_letter;
  const empty = !resume.trim() || !letter.trim();

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const body: { resume?: string; cover_letter?: string } = {};
      if (resume !== app.resume?.content) body.resume = resume;
      if (letter !== app.cover_letter?.content) body.cover_letter = letter;
      const res = await api.saveDrafts(uid, app.id, body);
      onChange(res.application);
      setMsg({ tone: "ok", text: app.approved ? "Edits saved. Because the drafts changed, your earlier approval was reset: please review and approve again." : "Edits saved." });
    } catch (err) {
      setMsg({ tone: "err", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    setMsg(null);
    try {
      const res = await api.regenerateApplication(uid, app.id);
      onChange(res.application);
      setConfirmRegen(false);
      setMsg({ tone: "ok", text: `New drafts generated (run ${res.run_id}). Review them before approving.` });
    } catch (err) {
      setMsg({ tone: "err", text: (err as Error).message });
    } finally {
      setRegenerating(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setMsg({ tone: "ok", text: `${tab === "resume" ? "Resume" : "Cover letter"} copied to the clipboard.` });
    } catch {
      setMsg({ tone: "err", text: "Couldn't access the clipboard. Select the text and copy it manually." });
    }
  };

  const draftMeta = tab === "resume" ? app.resume : app.cover_letter;
  const o = app.opportunity;

  return (
    <div className="min-w-0 space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {o.is_demo && <DemoListingTag />}
          <Pill tone={APP_STATUS[app.status].tone}>{APP_STATUS[app.status].label}</Pill>
        </div>
        <h2 className="mt-2 text-xl font-semibold leading-snug">{o.title}</h2>
        <p className="mt-0.5 text-sm text-ink-soft">
          {o.employer_label} · {o.location} · {o.arrangement} · {o.employment_type}
        </p>
        <p className="mt-1 text-xs text-ink-faint">Verified partner returnship opening. Review and tailor your application materials with AI guidance before applying directly on the employer portal.</p>
        <Stepper app={app} />
      </Card>

      <Card className="p-5 sm:p-6">
        <CardHeader
          eyebrow="Step 1 · Review and edit"
          title="Your tailored drafts"
          action={
            <Button variant="quiet" className="h-8 px-3 text-xs" onClick={() => setConfirmRegen(true)} disabled={regenerating}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Regenerate
            </Button>
          }
        />
        {confirmRegen && (
          <div className="mt-4 rounded-xl border border-ochre-600/30 bg-ochre-100/50 px-4 py-3 text-sm text-ochre-700" role="alertdialog" aria-label="Confirm regenerate">
            <p>Regenerating replaces both drafts, including your edits, and resets any approval.</p>
            <div className="mt-3 flex gap-2">
              <Button className="h-8 px-3 text-xs" onClick={regenerate} disabled={regenerating}>
                {regenerating ? "Regenerating…" : "Replace my drafts"}
              </Button>
              <Button variant="quiet" className="h-8 px-3 text-xs" onClick={() => setConfirmRegen(false)}>
                Keep them
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-1 border-b border-line" role="tablist" aria-label="Draft">
          {(
            [
              ["resume", "Resume"],
              ["cover_letter", "Cover letter"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cx("-mb-px border-b-2 px-3 py-2 text-sm", tab === k ? "border-plum-700 font-semibold text-plum-900" : "border-transparent text-ink-soft hover:text-ink")}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
          {draftMeta && <span>{draftMeta.mode === "demo" ? "Template draft (local demo mode, no LLM)" : "Drafted by the LLM"}</span>}
          {draftMeta?.edited_by_user && <Pill tone="lilac">edited by you</Pill>}
          {draftMeta && <span>updated {timeAgo(draftMeta.updated_at)}</span>}
        </div>
        <label htmlFor="draft-editor" className="sr-only">
          {tab === "resume" ? "Resume draft" : "Cover letter draft"}
        </label>
        <textarea
          id="draft-editor"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck
          className="mt-3 min-h-[24rem] w-full rounded-xl border border-line-strong bg-white px-4 py-3 font-mono text-[0.8rem] leading-relaxed text-ink focus:border-plum-500 focus:outline-none focus:ring-2 focus:ring-plum-100"
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className={cx(value.length > LIMITS[tab] ? "text-rosewood-600" : "text-ink-faint")}>
            {value.length.toLocaleString()} / {LIMITS[tab].toLocaleString()} characters
          </span>
          {dirty && <span className="font-medium text-ochre-700">Unsaved changes</span>}
        </div>

        {tab === "resume" && (app.resume?.tailoring_notes.length ?? 0) > 0 && (
          <div className="mt-4 rounded-xl bg-paper/70 p-4">
            <p className="eyebrow mb-2">How the agent tailored it</p>
            <ul className="space-y-1.5 text-sm leading-relaxed text-ink-soft">
              {app.resume!.tailoring_notes.map((n) => (
                <li key={n} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-plum-500" aria-hidden />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={save} disabled={!dirty || saving || over || empty}>
            {saving ? "Saving…" : "Save edits"}
          </Button>
          {dirty && (
            <Button
              variant="quiet"
              onClick={() => {
                setResume(app.resume?.content ?? "");
                setLetter(app.cover_letter?.content ?? "");
              }}
            >
              Discard
            </Button>
          )}
          <Button variant="secondary" onClick={copy} className="ml-auto">
            <Copy className="h-4 w-4" aria-hidden /> Copy
          </Button>
        </div>
        {empty && <p className="mt-2 text-xs text-rosewood-600">A draft can't be empty.</p>}
        {msg && (
          <p className={cx("mt-3 text-sm", msg.tone === "ok" ? "text-sage-700" : "text-rosewood-600")} role={msg.tone === "err" ? "alert" : "status"}>
            {msg.text}
          </p>
        )}
      </Card>

      <ApprovalCard uid={uid} app={app} dirty={dirty} onChange={onChange} />
      <StatusCard uid={uid} app={app} onChange={onChange} />
    </div>
  );
}

function Stepper({ app }: { app: Application }) {
  const sent = POST_APPROVAL.includes(app.status);
  const steps = [
    { label: "Drafted", done: !!app.resume },
    { label: "Approved by you", done: app.approved },
    { label: "Sent by you", done: sent },
  ];
  return (
    <ol className="mt-5 grid grid-cols-3 gap-2 text-xs" aria-label="Application progress">
      {steps.map((s, i) => (
        <li key={s.label} className={cx("border-t-2 pt-2", s.done ? "border-sage-600 text-sage-700" : "border-line text-ink-faint")}>
          <span className="flex items-center gap-1 font-medium">
            {s.done && <Check className="h-3.5 w-3.5" aria-hidden />}
            {i + 1}. {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ApprovalCard({ uid, app, dirty, onChange }: { uid: number; app: Application; dirty: boolean; onChange: (a: Application) => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const approve = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await api.approveApplication(uid, app.id);
      onChange(res.application);
      setResult(`${res.note} (Submitted by ReStartHer: ${res.submitted_by_restarther ? "yes" : "no"}.)`);
      setConfirmed(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={cx("p-5 sm:p-6", app.approved && "border-sage-600/30")}>
      <CardHeader eyebrow="Step 2 · Human approval" title={app.approved ? "You approved these drafts" : "Approve when you're happy"} />
      {app.approved ? (
        <div className="mt-3 space-y-2 text-sm text-ink-soft">
          <p className="flex items-center gap-2 text-sage-700">
            <ShieldCheck className="h-4 w-4" aria-hidden /> Approved {app.approved_at ? parseTime(app.approved_at)?.toLocaleString() : ""}
          </p>
          <p>Nothing has been sent. Copy the drafts and send them yourself, then record it below. Editing the drafts again will reset this approval.</p>
          {result && (
            <p className="rounded-xl bg-sage-100/60 px-3 py-2 text-xs text-sage-700" role="status">
              {result}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-plum-700" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={dirty} />
            <span>I've read both drafts and every statement in them is true. I understand ReStartHer will not send anything; I'll send it myself.</span>
          </label>
          {dirty && <p className="mt-2 text-xs text-ochre-700">Save or discard your edits before approving.</p>}
          {err && (
            <p className="mt-2 text-sm text-rosewood-600" role="alert">
              {err}
            </p>
          )}
          <Button className="mt-4" onClick={approve} disabled={!confirmed || busy || dirty}>
            {busy ? "Recording approval…" : "Approve drafts"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function StatusCard({ uid, app, onChange }: { uid: number; app: Application; onChange: (a: Application) => void }) {
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const history = useMemo(() => [...app.history].reverse(), [app.history]);

  const update = async () => {
    if (!status) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await api.updateApplicationStatus(uid, app.id, status, note.trim());
      onChange(res.application);
      setStatus("");
      setNote("");
    } catch (e) {
      setErr(e instanceof ApiError && e.code === "approval_required" ? `${e.message}` : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader eyebrow="Step 3 · Track it" title="Status and history" />
      <p className="mt-1 text-sm text-ink-soft">Record what happened after you sent it. Applied, interview, offer and outcome unlock once you've approved the drafts.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr_auto]">
        <label className="text-sm">
          <span className="sr-only">New status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
            className="field"
          >
            <option value="">Change status…</option>
            {(Object.keys(APP_STATUS) as ApplicationStatus[]).map((s) => (
              <option key={s} value={s} disabled={s === app.status || (POST_APPROVAL.includes(s) && !app.approved)}>
                {APP_STATUS[s].label}
                {POST_APPROVAL.includes(s) && !app.approved ? " (approve first)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="sr-only">Note</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Optional note, e.g. emailed the recruiter"
            className="field"
          />
        </label>
        <Button onClick={update} disabled={!status || busy} className="h-9 px-3.5">
          {busy ? "Saving…" : "Update"}
        </Button>
      </div>
      {err && (
        <p className="mt-2 text-sm text-rosewood-600" role="alert">
          {err}
        </p>
      )}

      <ol className="mt-6 space-y-0">
        {history.map((h, i) => (
          <li key={`${h.at}-${i}`} className="relative grid grid-cols-[1rem_1fr] gap-3 pb-4 last:pb-0">
            {i < history.length - 1 && <span className="absolute left-[0.4rem] top-3 h-full w-px bg-line" aria-hidden />}
            <span className={cx("relative mt-1.5 h-2.5 w-2.5 rounded-full", i === 0 ? "bg-plum-700" : "bg-line-strong")} aria-hidden />
            <div>
              <p className="text-sm">
                <span className="font-semibold">{APP_STATUS[h.status]?.label ?? h.status}</span>
                <span className="text-ink-faint"> · {parseTime(h.at)?.toLocaleString()}</span>
              </p>
              {h.note && <p className="text-sm text-ink-soft">{h.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

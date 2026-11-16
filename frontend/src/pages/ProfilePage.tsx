import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Briefcase, GraduationCap, Pencil, Quote } from "lucide-react";
import { api } from "@/api/client";
import type { Profile, WorkflowResult } from "@/api/types";
import { useSession } from "@/context/SessionContext";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/useApi";
import { timeAgo, years } from "@/lib/format";
import { buildProfileInput, formFromProfile, MISSING_LABEL, validateProfileForm, type FormErrors } from "@/lib/profile";
import { Button, ButtonLink, Card, CardHeader, EmptyNote, ErrorState, Pill, Skeleton, cx } from "@/components/ui/primitives";
import { ProfileFields } from "@/components/profile/ProfileFields";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { WorkflowOutcome } from "@/components/profile/WorkflowOutcome";

const SOURCE_LABEL: Record<string, string> = {
  resume: "your resume",
  onboarding: "your onboarding answers",
  "resume+onboarding": "your resume and onboarding answers",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { userId } = useSession();
  const uid = user?.id || userId || 1;
  const { data, error, loading, reload } = useApi((signal) => api.profile(uid, signal), [uid]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastRun, setLastRun] = useState<WorkflowResult | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (data) setProfile(data.profile);
  }, [data]);

  if (loading && !profile) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} title="Couldn't load your profile" />;

  if (!profile) {
    return (
      <div className="max-w-2xl animate-rise">
        <p className="eyebrow mb-3">Profile Intelligence Agent</p>
        <h1 className="page-title">No profile yet.</h1>
        <p className="mt-4 text-lg text-ink-soft">Upload a resume or answer a few questions and the agent will build your profile from what you share.</p>
        <Card className="mt-8 p-6">
          <ResumeUpload
            upload={async (file, onProgress) => {
              const res = await api.uploadResume(uid, file, undefined, onProgress);
              setProfile(res.profile);
              setLastRun(res.workflow);
            }}
          />
        </Card>
        <ButtonLink to="/onboarding" variant="quiet" className="mt-4 -ml-5">
          Or answer questions instead
        </ButtonLink>
      </div>
    );
  }

  const p = profile;

  return (
    <div className="animate-rise">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Profile Intelligence Agent · from {SOURCE_LABEL[p.source] ?? p.source}</p>
          <h1 className="mt-1 page-title">{p.full_name ?? "Your profile"}</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            {p.previous_role ?? "Previous role not found"}
            {p.target_role ? (
              <>
                {" "}
                → <span className="text-plum-700">{p.target_role}</span>
              </>
            ) : (
              " · no target role yet"
            )}
          </p>
        </div>
        {!editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" aria-hidden /> Correct or update
          </Button>
        )}
      </header>

      <p className="mt-3 text-xs text-ink-faint">
        {p.extraction_mode === "demo" ? "Extracted with the rule-based parser (local demo mode, no LLM)." : "Extracted with the LLM."} Updated {timeAgo(p.updated_at)}.
      </p>

      {lastRun && (
        <div className="mt-6">
          <WorkflowOutcome workflow={lastRun} />
        </div>
      )}

      {(p.missing_info.length > 0 || p.clarification_questions.length > 0) && !editing && (
        <Card className="mt-6 border-ochre-600/25 bg-ochre-100/30 p-5">
          <p className="text-sm font-semibold text-ochre-700">A few things the agent couldn't find</p>
          {p.missing_info.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.missing_info.map((m) => (
                <Pill key={m} tone="ochre">
                  {MISSING_LABEL[m] ?? m}
                </Pill>
              ))}
            </div>
          )}
          {p.clarification_questions.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
              {p.clarification_questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          )}
          <Button variant="secondary" className="mt-4" onClick={() => setEditing(true)}>
            Fill these in
          </Button>
        </Card>
      )}

      {editing && (
        <EditProfile
          uid={uid}
          profile={p}
          onCancel={() => setEditing(false)}
          onSaved={(next, wf) => {
            setProfile(next);
            setLastRun(wf);
            setEditing(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Card className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-4 sm:p-6">
            <Stat label="Experience" value={p.experience_years === null ? "–" : years(p.experience_years)} />
            <Stat label="Career break" value={p.career_break_years === null ? "–" : years(p.career_break_years)} sub={p.career_break_reason ?? undefined} />
            <Stat label="Domain" value={p.domain ?? "–"} />
            <Stat label="Field of study" value={p.education_field ?? "–"} />
          </Card>

          <Card className="p-6">
            <CardHeader eyebrow="Work experience" title={`${p.employment.length} role${p.employment.length === 1 ? "" : "s"} found`} />
            {p.employment.length === 0 ? (
              <div className="mt-4">
                <EmptyNote>No employment history was found. The backend doesn't support entering roles by hand yet; upload a resume that lists them.</EmptyNote>
              </div>
            ) : (
              <ol className="mt-5 space-y-5">
                {p.employment.map((e) => (
                  <li key={e.id} className="grid grid-cols-[2rem_1fr] gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lilac-100 text-plum-700">
                      <Briefcase className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug">
                        {e.title}
                        {e.company && <span className="font-normal text-ink-soft"> · {e.company}</span>}
                      </p>
                      <p className="text-xs text-ink-faint">
                        {[e.start, e.end].filter(Boolean).join(" – ") || "Dates not found"}
                        {e.years !== null && ` · ${years(e.years)}`}
                      </p>
                      {e.highlights.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink-soft">
                          {e.highlights.map((h) => (
                            <li key={h} className="flex gap-2">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" aria-hidden />
                              {h}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {p.career_break_years ? (
              <div className="mt-5 flex gap-3 rounded-xl border border-dashed border-line-strong bg-paper/60 px-4 py-3 text-sm text-ink-soft">
                <span className="font-semibold text-ink">Career break</span>
                <span>
                  {years(p.career_break_years)}
                  {p.career_break_reason && ` · ${p.career_break_reason}`}
                </span>
              </div>
            ) : null}
          </Card>

          <SkillsCard profile={p} />

          {p.projects.length > 0 && (
            <Card className="p-6">
              <CardHeader eyebrow="Projects" title="What you've built" />
              <ul className="mt-4 space-y-2 text-sm leading-relaxed">
                {p.projects.map((pr) => (
                  <li key={pr}>{pr}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="min-w-0 space-y-6">
          <Card className="p-5">
            <CardHeader eyebrow="Education" title={p.education.length ? "Qualifications" : "Not found"} />
            {p.education.length === 0 ? (
              <p className="mt-3 text-sm text-ink-faint">Add it with “Correct or update”.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {p.education.map((ed) => (
                  <li key={ed} className="flex gap-2.5 text-sm leading-snug">
                    <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" aria-hidden />
                    {ed}
                  </li>
                ))}
              </ul>
            )}
            {p.certifications.length > 0 && (
              <>
                <p className="eyebrow mb-2 mt-5">Certifications</p>
                <ul className="space-y-1 text-sm">
                  {p.certifications.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card className="p-5">
            <CardHeader eyebrow="Preferences" title="How you'd like to work" />
            <dl className="mt-3 space-y-3 text-sm">
              <Pref label="Arrangement" value={p.work_preferences.join(", ")} />
              <Pref label="Employment type" value={p.employment_types.join(", ")} />
              <Pref label="Location" value={p.location_preference} />
              <Pref label="Learning time" value={p.hours_per_day ? `${p.hours_per_day} h / day` : null} />
              <Pref label="Plan length" value={p.plan_days ? `${p.plan_days} days` : null} />
              <Pref label="Learns best with" value={p.learning_preferences.join(", ")} />
            </dl>
          </Card>

          <Card className="p-5">
            <CardHeader eyebrow="Resume" title="Upload a newer resume" />
            <p className="mt-2 text-sm text-ink-soft">The profile is rebuilt from the new file. Your roadmap progress is kept where possible.</p>
            <div className="mt-4">
              <ResumeUpload
                submitLabel="Upload and re-run"
                upload={async (file, onProgress) => {
                  const res = await api.uploadResume(uid, file, undefined, onProgress);
                  setProfile(res.profile);
                  setLastRun(res.workflow);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SkillsCard({ profile: p }: { profile: Profile }) {
  const [open, setOpen] = useState<string | null>(null);
  const evidence = open ? p.skill_evidence[open] : null;
  return (
    <Card className="p-6">
      <CardHeader eyebrow="Skills" title={`${p.skills.length} technical skills`} />
      {p.skills.length === 0 ? (
        <div className="mt-4">
          <EmptyNote>No technical skills found yet.</EmptyNote>
        </div>
      ) : (
        <>
          <p className="mt-1 text-xs text-ink-faint">Select a skill to see where in your resume it was found.</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {p.skills.map((s) => {
              const has = !!p.skill_evidence[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setOpen(open === s ? null : s)}
                  aria-pressed={open === s}
                  className={cx(
                    "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                    open === s ? "border-plum-700 bg-plum-700 text-white" : "border-line bg-white text-ink hover:border-plum-500",
                  )}
                >
                  {s}
                  {!has && <span className="sr-only"> (added manually)</span>}
                </button>
              );
            })}
          </div>
          {open && (
            <div className="mt-4 flex gap-2.5 rounded-xl bg-lilac-50 px-4 py-3 text-sm" aria-live="polite">
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-plum-500" aria-hidden />
              {evidence ? <span className="italic text-ink-soft">{evidence}</span> : <span className="text-ink-faint">No resume excerpt for {open}: it came from your own answers.</span>}
            </div>
          )}
        </>
      )}
      {(p.soft_skills.length > 0 || p.transferable_skills.length > 0) && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <TagList title="Soft skills" items={p.soft_skills} />
          <TagList title="Transferable from your break" items={p.transferable_skills} />
        </div>
      )}
    </Card>
  );
}

function EditProfile({ uid, profile, onCancel, onSaved }: { uid: number; profile: Profile; onCancel: () => void; onSaved: (p: Profile, wf: WorkflowResult) => void }) {
  const [form, setForm] = useState(() => formFromProfile(profile));
  const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validateProfileForm(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    const body = buildProfileInput(form, profile);
    if (Object.keys(body).length === 0) return setErr("Nothing has changed yet.");
    setErr(null);
    setBusy(true);
    try {
      const res = await api.updateProfile(uid, body);
      if (res.profile) onSaved(res.profile, res.workflow);
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-6 p-6">
      <form onSubmit={submit} noValidate>
        <CardHeader eyebrow="Correct your profile" title="Only fields you change are sent" />
        <p className="mt-1 text-sm text-ink-soft">Saving re-runs the comeback workflow so your skill gaps, roadmap and matches reflect the correction.</p>
        <div className="mt-6">
          <ProfileFields value={form} onChange={setForm} errors={errors} existingSkills={profile.skills} />
        </div>
        {err && (
          <p className="mt-5 text-sm text-rosewood-600" role="alert">
            {err}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving and re-planning…" : "Save changes"}
          </Button>
          <Button type="button" variant="quiet" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-[0.9375rem] font-semibold leading-snug [overflow-wrap:anywhere]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-faint">{sub}</p>}
    </div>
  );
}

function Pref({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={cx("text-right font-medium", !value && "font-normal text-ink-faint")}>{value || "Not set"}</dd>
    </div>
  );
}

function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-ink-faint">None found.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s) => (
            <Pill key={s} tone="lilac">
              {s}
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
}

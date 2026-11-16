import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { ArrowRight, FileText, ListChecks } from "lucide-react";
import { api, ApiError } from "@/api/client";
import type { ProfileWorkflowResponse, User } from "@/api/types";
import { useSession } from "@/context/SessionContext";
import { useAuth } from "@/context/AuthContext";
import { Button, ButtonLink, Card, cx } from "@/components/ui/primitives";
import { ProfileFields } from "@/components/profile/ProfileFields";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { WorkflowOutcome } from "@/components/profile/WorkflowOutcome";
import { buildProfileInput, formFromProfile, validateProfileForm, type FormErrors } from "@/lib/profile";

type Method = "resume" | "questions";

/** New comeback: create a user, then onboard from a resume upload or a short questionnaire. */
export default function OnboardingPage() {
  const { userId, setUserId } = useSession();
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUser] = useState<User | null>(() => {
    if (authUser) {
      return {
        id: authUser.id,
        name: authUser.name,
        is_demo: authUser.is_demo,
        created_at: "",
        has_profile: authUser.has_profile,
      };
    }
    return null;
  });
  const [startFresh, setStartFresh] = useState(false);
  const [name, setName] = useState(authUser?.name || "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [method, setMethod] = useState<Method>("resume");
  const [form, setForm] = useState(() => formFromProfile(null));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ProfileWorkflowResponse | null>(null);

  useEffect(() => {
    if (authUser && !user) {
      setUser({
        id: authUser.id,
        name: authUser.name,
        is_demo: authUser.is_demo,
        created_at: "",
        has_profile: authUser.has_profile,
      });
      setName(authUser.name);
      setForm((f) => ({ ...f, full_name: authUser.name }));
    }
  }, [authUser]);

  // If already onboarded, prompt gently
  if (authUser?.has_profile && !startFresh && !result) {
    return (
      <div className="max-w-2xl animate-rise">
        <p className="eyebrow mb-3">Onboarding Complete</p>
        <h1 className="page-title">Your career comeback track is active.</h1>
        <p className="mt-4 text-base text-ink-soft">
          Your profile, skill gap analysis, and tailored learning roadmap have been generated. You can continue learning or update your details anytime.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink to="/app">Open My Dashboard</ButtonLink>
          <ButtonLink to="/app/journey" variant="secondary">
            View Daily Tasks
          </ButtonLink>
          <Button variant="quiet" onClick={() => setStartFresh(true)}>
            Re-run Intake or Upload New Resume
          </Button>
        </div>
      </div>
    );
  }

  // Someone already has an active legacy session in this browser without auth.
  if (!authUser && userId && !user && !startFresh) {
    return (
      <div className="max-w-2xl animate-rise">
        <p className="eyebrow mb-3">Onboarding</p>
        <h1 className="page-title">You already have a comeback in progress.</h1>
        <p className="mt-4 text-lg text-ink-soft">Your plan, roadmap and practice are saved under this browser's session.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink to="/app">Continue my plan</ButtonLink>
          <ButtonLink to="/app/profile" variant="secondary">
            Update my profile or resume
          </ButtonLink>
          <Button variant="quiet" onClick={() => setStartFresh(true)}>
            Start a new comeback
          </Button>
        </div>
      </div>
    );
  }

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setNameError("Please tell us what to call you.");
    setNameError(null);
    setCreating(true);
    try {
      const u = await api.createUser(n);
      setUser(u);
      setUserId(u.id);
      setForm((f) => ({ ...f, full_name: n }));
    } catch (err) {
      setNameError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const submitQuestions = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const errs = validateProfileForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const body = buildProfileInput(form, null);
    if (!Object.keys(body).some((k) => k !== "full_name")) {
      setSubmitError("Add at least your previous role, a few skills or a target role so the agents have something to work with.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await api.onboarding(user.id, body);
      setResult(res);
      await refreshUser();
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const uploadResume = async (file: File, onProgress: (f: number) => void) => {
    if (!user) return;
    const errs = validateProfileForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) throw new Error("Please fix the highlighted fields first.");
    setSubmitError(null);
    const res = await api.uploadResume(user.id, file, buildProfileInput(form, null), onProgress);
    setResult(res);
    await refreshUser();
  };

  const pickRole = async (role: string) => {
    if (!user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.updateProfile(user.id, { target_role: role });
      setResult(res);
      await refreshUser();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't set the role.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-rise">
      <header>
        <p className="eyebrow">Onboarding · Profile Intelligence Agent</p>
        <h1 className="mt-1 page-title">Tell us where you left off.</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">The agents only use what you give them. Nothing is invented: if something is missing, the orchestrator will ask rather than guess.</p>
      </header>

      <ol className="mt-8 flex gap-2 text-xs font-medium text-ink-faint" aria-label="Progress">
        {["Your name", "Background", "Your plan"].map((s, i) => {
          const step = result ? 2 : user ? 1 : 0;
          return (
            <li key={s} className={cx("flex-1 border-t-2 pt-2", i <= step ? "border-plum-700 text-plum-800" : "border-line")} aria-current={i === step ? "step" : undefined}>
              {i + 1}. {s}
            </li>
          );
        })}
      </ol>

      {!user && (
        <Card className="mt-6 p-6">
          <form onSubmit={createUser} noValidate>
            <label htmlFor="ob-name" className="block text-sm font-medium">
              What should we call you?
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="ob-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                autoComplete="given-name"
                className="field"
                aria-invalid={!!nameError}
                aria-describedby={nameError ? "ob-name-err" : undefined}
              />
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Continue"} <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            {nameError && (
              <p id="ob-name-err" className="mt-2 text-sm text-rosewood-600" role="alert">
                {nameError}
              </p>
            )}
            <p className="mt-3 text-xs text-ink-faint">There's no login in this prototype: your session is remembered in this browser only.</p>
          </form>
        </Card>
      )}

      {user && !result && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2" role="tablist" aria-label="How to share your background">
            <MethodTab active={method === "resume"} onClick={() => setMethod("resume")} icon={<FileText className="h-5 w-5" aria-hidden />} title="Upload my resume" body="PDF or DOCX. The agent extracts roles, education, skills and your career gap." />
            <MethodTab active={method === "questions"} onClick={() => setMethod("questions")} icon={<ListChecks className="h-5 w-5" aria-hidden />} title="Answer a few questions" body="No resume handy? Type in your background instead." />
          </div>

          {method === "resume" ? (
            <Card className="space-y-8 p-6">
              <ProfileFields value={form} onChange={setForm} errors={errors} sections={["goal", "preferences"]} />
              <div>
                <p className="eyebrow mb-3">Your resume</p>
                <p className="mb-3 text-sm text-ink-soft">Anything you filled in above takes priority over what's read from the file.</p>
                <ResumeUpload upload={uploadResume} submitLabel="Upload and build my plan" />
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <form onSubmit={submitQuestions} noValidate className="space-y-8">
                <ProfileFields value={form} onChange={setForm} errors={errors} sections={["goal", "background", "preferences"]} />
                {submitError && (
                  <p className="text-sm text-rosewood-600" role="alert">
                    {submitError}
                  </p>
                )}
                <Button type="submit" disabled={submitting}>
                  {submitting ? "The agents are working…" : "Build my plan"}
                </Button>
              </form>
            </Card>
          )}
        </div>
      )}

      {user && result && (
        <div className="mt-6 space-y-5">
          <WorkflowOutcome workflow={result.workflow} onPickRole={submitting ? undefined : pickRole} />
          {submitError && (
            <p className="text-sm text-rosewood-600" role="alert">
              {submitError}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/app">
              Open my comeback dashboard <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink to="/app/profile" variant="secondary">
              Review what was extracted
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}

function MethodTab({ active, onClick, icon, title, body }: { active: boolean; onClick: () => void; icon: ReactNode; title: string; body: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cx("flex gap-3 rounded-xl border p-4 text-left transition", active ? "border-plum-700 bg-white shadow-lift" : "border-line bg-paper/60 hover:border-line-strong")}
    >
      <span className={cx("mt-0.5", active ? "text-plum-700" : "text-ink-faint")}>{icon}</span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-soft">{body}</span>
      </span>
    </button>
  );
}

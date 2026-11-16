import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Bot, Mic } from "lucide-react";
import { api, ApiError } from "@/api/client";
import type { AnswerFeedback, InterviewCompleteResponse, InterviewFeedback, InterviewSession, InterviewType, SkillsResponse } from "@/api/types";
import { useSession } from "@/context/SessionContext";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/useApi";
import { AgentMark } from "@/components/ui/AgentMark";
import { Button, ButtonLink, Card, ErrorState, Pill, Skeleton, Spinner, cx } from "@/components/ui/primitives";
import { FeedbackView } from "@/components/interview/FeedbackView";
import { SessionOutcome } from "@/components/interview/SessionOutcome";
import { InterviewHistory } from "@/components/interview/InterviewHistory";
import { JotformAgent } from "@/components/agents/JotformAgent";

const TYPES: { key: InterviewType; title: string; body: string }[] = [
  { key: "technical", title: "Technical", body: "Four questions on the skills your target role needs most." },
  { key: "hr", title: "HR", body: "Your career break, your story and your strengths – asked the way recruiters ask." },
  { key: "mixed", title: "Mixed", body: "Two HR and two technical questions, like a real first round." },
];

const MAX_ANSWER = 5000; // schemas.InterviewAnswer.answer max_length

interface Bundle {
  sessions: InterviewSession[];
  skills: SkillsResponse;
}

type Feedback = InterviewFeedback | AnswerFeedback;

export default function InterviewPage() {
  const { user } = useAuth();
  const { userId } = useSession();
  const uid = user?.id || userId || 1; // guarded by <RequireUser>
  const { data, error, loading, reload } = useApi<Bundle>(
    async (signal) => {
      const [s, skills] = await Promise.all([api.interviews(uid, signal), api.skills(uid, signal)]);
      return { sessions: s.sessions, skills };
    },
    [uid],
  );

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  useEffect(() => {
    if (data) setSessions(data.sessions);
  }, [data]);

  const [practiceMode, setPracticeMode] = useState<"ai_coach" | "rubric">("ai_coach");
  const [type, setType] = useState<InterviewType>("technical");
  const [starting, setStarting] = useState(false);
  const [active, setActive] = useState<InterviewSession | null>(null);
  const [idx, setIdx] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [outcome, setOutcome] = useState<InterviewCompleteResponse | null>(null);

  const refreshHistory = () =>
    api
      .interviews(uid)
      .then((r) => setSessions(r.sessions))
      .catch(() => undefined); // history is secondary; the main flow already surfaced any error

  const openSession = (s: InterviewSession) => {
    setActive(s);
    setOutcome(null);
    setActionError(null);
    setFeedback(Object.fromEntries(s.feedback.map((f) => [f.question_id, f])));
    setDrafts(Object.fromEntries(s.feedback.map((f) => [f.question_id, f.answer])));
    const firstOpen = s.questions.findIndex((q) => !s.feedback.some((f) => f.question_id === q.id));
    setIdx(firstOpen === -1 ? 0 : firstOpen);
    window.scrollTo({ top: 0 });
  };

  const start = async () => {
    setStarting(true);
    setActionError(null);
    try {
      const { session } = await api.startInterview(uid, type);
      openSession(session);
      refreshHistory();
    } catch (e) {
      setActionError(e as ApiError);
    } finally {
      setStarting(false);
    }
  };

  const submitAnswer = async () => {
    if (!active) return;
    const q = active.questions[idx];
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await api.answerInterview(uid, active.id, q.id, (drafts[q.id] ?? "").trim());
      setFeedback((f) => ({ ...f, [q.id]: res.feedback }));
      setActive((s) => (s ? { ...s, questions: s.questions.map((x) => (x.id === q.id ? { ...x, answered: true } : x)) } : s));
      refreshHistory();
    } catch (e) {
      setActionError(e as ApiError);
    } finally {
      setSubmitting(false);
    }
  };

  const finish = async () => {
    if (!active) return;
    setFinishing(true);
    setActionError(null);
    try {
      const res = await api.completeInterview(uid, active.id);
      setOutcome(res);
      setActive(null);
      refreshHistory();
      window.scrollTo({ top: 0 });
    } catch (e) {
      setActionError(e as ApiError);
    } finally {
      setFinishing(false);
    }
  };

  const reset = () => {
    setActive(null);
    setOutcome(null);
    setActionError(null);
    setFeedback({});
    setDrafts({});
  };

  if (error) return <ErrorState error={error} onRetry={reload} title="Interview practice could not be loaded" />;
  if (loading || !data) return <InterviewSkeleton />;

  const assessment = data.skills.assessment;
  const targetRole = assessment?.target_role ?? null;
  const focus = (assessment?.summary.priorities ?? []).slice(0, 4);
  const resumable = sessions.find((s) => s.status === "in_progress" && s.id !== active?.id);

  return (
    <div className="animate-rise">
      <header className="mb-8">
        <p className="eyebrow">Confidence & Interview Agent</p>
        <h1 className="mt-1 page-title">
          Practise out loud, <span className="text-plum-700">before</span> it counts.
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Answer in your own words. Each answer is scored on relevance, structure, clarity and communication – plus technical accuracy for technical questions. Weak topics feed back into your
          learning roadmap when you finish a session.
        </p>
      </header>

      <div className="mb-6 flex gap-3 border-b border-line pb-4">
        <button
          type="button"
          onClick={() => setPracticeMode("ai_coach")}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${practiceMode === "ai_coach"
              ? "bg-gradient-to-r from-jelly-strawberry to-jelly-purple text-white shadow-jelly"
              : "bg-paper-deep text-ink-muted hover:text-ink"
            }`}
        >
          <Bot className="h-4 w-4" /> AI Interview Coach Chatbot
        </button>
        <button
          type="button"
          onClick={() => setPracticeMode("rubric")}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${practiceMode === "rubric"
              ? "bg-gradient-to-r from-jelly-strawberry to-jelly-purple text-white shadow-jelly"
              : "bg-paper-deep text-ink-muted hover:text-ink"
            }`}
        >
          <Mic className="h-4 w-4" /> Structured Mock Questions
        </button>
      </div>

      {practiceMode === "ai_coach" ? (
        <div className="mb-10">
          <JotformAgent
            agentId="01a1de720200700080d531f4ede929161334"
            agentKey="interview_coach"
            agentName="ReStartHer Interview Coach"
            accentColor="#FF5C8A"
            description="Talk to your live AI Interview Coach for real-time conversational practice, behavioral answers, and technical mock interviews."
            height="720px"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0">
            {actionError && (
              <div className="mb-5">
                <ErrorState error={actionError} title={actionError.code === "profile_required" ? "Your profile is needed first" : "That didn't work"} />
                {actionError.code === "profile_required" && (
                  <ButtonLink to="/onboarding" variant="secondary" className="mt-3">
                    Add my background
                  </ButtonLink>
                )}
              </div>
            )}

            {outcome && <SessionOutcome res={outcome} onNew={reset} />}

            {!outcome && !active && (
              <Card className="p-6 sm:p-7">
                <p className="eyebrow">New session</p>
                <h2 className="mt-1 text-lg font-semibold">Choose the kind of interview</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Interview type">
                  {TYPES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      role="radio"
                      aria-checked={type === t.key}
                      onClick={() => setType(t.key)}
                      className={cx(
                        "rounded-xl border p-4 text-left transition",
                        type === t.key ? "border-plum-900 bg-lilac-100" : "border-line bg-white hover:border-line-strong",
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-semibold">{t.title}</span>
                        {type === t.key && <Check className="h-4 w-4 text-plum-800" aria-hidden />}
                      </span>
                      <span className="mt-1.5 block text-[0.82rem] leading-relaxed text-ink-soft">{t.body}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-paper px-4 py-3.5 text-sm text-ink-soft">
                  {targetRole ? (
                    <>
                      Practising for <span className="font-semibold text-ink">{targetRole}</span>.
                      {type !== "hr" && focus.length > 0 && (
                        <>
                          {" "}
                          Technical questions are chosen by the agent from your top skill gaps:{" "}
                          <span className="text-ink">{focus.join(", ")}</span>.
                        </>
                      )}
                    </>
                  ) : (
                    "Set a target role on your profile so technical questions can match it."
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Button onClick={start} disabled={starting}>
                    {starting ? "Preparing questions…" : "Start practice interview"}
                  </Button>
                  {resumable && (
                    <button type="button" onClick={() => openSession(resumable)} className="link-quiet text-sm text-ink-soft">
                      or continue your unfinished {resumable.interview_type} session
                    </button>
                  )}
                </div>
              </Card>
            )}

            {active && !outcome && (
              <ActiveSession
                session={active}
                idx={idx}
                setIdx={setIdx}
                draft={drafts[active.questions[idx].id] ?? ""}
                setDraft={(v) => setDrafts((d) => ({ ...d, [active.questions[idx].id]: v }))}
                feedback={feedback}
                submitting={submitting}
                finishing={finishing}
                onSubmit={submitAnswer}
                onFinish={finish}
                onLeave={reset}
              />
            )}
          </div>

          <aside className="min-w-0">
            <InterviewHistory sessions={sessions} activeId={active?.id ?? null} onResume={openSession} />
          </aside>
        </div>
      )}
    </div>
  );
}

interface ActiveProps {
  session: InterviewSession;
  idx: number;
  setIdx: (i: number) => void;
  draft: string;
  setDraft: (v: string) => void;
  feedback: Record<string, Feedback>;
  submitting: boolean;
  finishing: boolean;
  onSubmit: () => void;
  onFinish: () => void;
  onLeave: () => void;
}

function ActiveSession({ session, idx, setIdx, draft, setDraft, feedback, submitting, finishing, onSubmit, onFinish, onLeave }: ActiveProps) {
  const q = session.questions[idx];
  const fb = feedback[q.id];
  const answeredCount = session.questions.filter((x) => feedback[x.id]).length;
  const trimmed = draft.trim();
  const unchanged = fb !== undefined && trimmed === fb.answer;
  const last = idx === session.questions.length - 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onLeave} className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Leave (progress is saved)
        </button>
        <ol className="flex gap-1.5" aria-label="Questions">
          {session.questions.map((x, i) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => setIdx(i)}
                aria-current={i === idx ? "step" : undefined}
                aria-label={`Question ${i + 1}${feedback[x.id] ? ", answered" : ""}`}
                className={cx(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition",
                  i === idx ? "bg-plum-700 text-white" : feedback[x.id] ? "bg-sage-100 text-sage-700" : "border border-line-strong bg-white text-ink-soft",
                )}
              >
                {feedback[x.id] && i !== idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={q.type === "hr" ? "lilac" : "plum"}>{q.type === "hr" ? "HR" : "Technical"}</Pill>
          {q.skill && <Pill tone="neutral">{q.skill}</Pill>}
          <span className="ml-auto text-xs text-ink-faint">
            Question {idx + 1} of {session.questions.length}
          </span>
        </div>
        <h2 className="mt-4 text-xl font-semibold leading-snug text-ink">{q.question}</h2>

        <label htmlFor="answer" className="sr-only">
          Your answer
        </label>
        <textarea
          id="answer"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_ANSWER))}
          rows={7}
          placeholder="Write your answer as you would say it. Aim for 4–6 sentences with one concrete example."
          className="mt-5 w-full resize-y rounded-xl border border-line bg-paper/40 px-4 py-3 text-[0.95rem] leading-relaxed placeholder:text-ink-faint focus:border-plum-500 focus:bg-white focus:outline-none"
          disabled={submitting}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="num text-xs text-ink-faint">
            {draft.length}/{MAX_ANSWER}
            {fb && " · submitting again replaces the earlier evaluation"}
          </span>
          <Button onClick={onSubmit} disabled={submitting || trimmed.length < 2 || unchanged}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Evaluating…
              </>
            ) : fb ? (
              "Re-submit answer"
            ) : (
              "Submit for feedback"
            )}
          </Button>
        </div>
      </Card>

      {submitting && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-5 py-4" aria-live="polite">
          <AgentMark agent="confidence" size="sm" working />
          <Spinner label="The Confidence & Interview Agent is evaluating your answer…" />
        </div>
      )}

      {fb && !submitting && <FeedbackView feedback={fb} />}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIdx(idx - 1)} disabled={idx === 0}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Previous
          </Button>
          <Button variant="secondary" onClick={() => setIdx(idx + 1)} disabled={last}>
            Next <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-faint">
            {answeredCount} of {session.questions.length} answered
          </span>
          <Button onClick={onFinish} disabled={answeredCount === 0 || finishing || submitting}>
            {finishing ? "Sending to the orchestrator…" : "Finish session"}
          </Button>
        </div>
      </div>
      {answeredCount === 0 && <p className="text-right text-xs text-ink-faint">Answer at least one question to finish.</p>}
    </div>
  );
}

function InterviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading interview practice">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-4 h-12 w-[30rem] max-w-full" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_21rem]">
        <Skeleton className="h-80" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

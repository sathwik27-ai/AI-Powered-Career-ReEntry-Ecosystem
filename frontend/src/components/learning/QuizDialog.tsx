import { useEffect, useRef, useState } from "react";
import { Check, GitBranch, X } from "lucide-react";
import { api, ApiError } from "@/api/client";
import type { Quiz, QuizSubmissionResponse } from "@/api/types";
import { AgentMark } from "@/components/ui/AgentMark";
import { Button, ErrorState, Spinner, cx } from "@/components/ui/primitives";
import { round } from "@/lib/format";
import { scoreTone } from "@/lib/learning";

interface Props {
  userId: number;
  skill: string | null;
  onClose: () => void;
  /** Called after the backend has graded the quiz (the roadmap may have changed). */
  onSubmitted: (res: QuizSubmissionResponse) => void;
}

const SCORE_TEXT = { sage: "text-sage-700", plum: "text-plum-800", ochre: "text-ochre-700", rose: "text-rosewood-600" } as const;

export function QuizDialog({ userId, skill, onClose, onSubmitted }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<QuizSubmissionResponse | null>(null);
  const [attempt, setAttempt] = useState(0);

  // open/close the native dialog with the `skill` prop
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (skill && !d.open) d.showModal();
    if (!skill && d.open) d.close();
  }, [skill]);

  useEffect(() => {
    if (!skill) return;
    const ctrl = new AbortController();
    setQuiz(null);
    setLoadError(null);
    setAnswers({});
    setResult(null);
    setSubmitError(null);
    api
      .quiz(skill, ctrl.signal)
      .then(setQuiz)
      .catch((e: Error) => {
        if (e.name !== "AbortError") setLoadError(e as ApiError);
      });
    return () => ctrl.abort();
  }, [skill, attempt]);

  const answeredCount = Object.keys(answers).length;
  const total = quiz?.questions.length ?? 0;

  const submit = async () => {
    if (!skill) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.submitQuiz(userId, skill, answers);
      setResult(res);
      onSubmitted(res);
      ref.current?.querySelector("[data-scroll]")?.scrollTo({ top: 0 });
    } catch (e) {
      setSubmitError(e as ApiError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        if (submitting) e.preventDefault();
      }}
      className="m-auto w-[min(44rem,calc(100vw-1.5rem))] rounded-card border border-line bg-white p-0 text-ink shadow-pop backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
      aria-labelledby="quiz-title"
    >
      <div className="flex max-h-[min(88vh,52rem)] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5 sm:px-8">
          <div>
            <p className="eyebrow">{result ? "Your result" : "Skill assessment"}</p>
            <h2 id="quiz-title" className="mt-1 section-title">
              {skill}
            </h2>
          </div>
          <button type="button" onClick={() => ref.current?.close()} disabled={submitting} className="rounded-full p-2 text-ink-soft hover:bg-paper-deep" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div data-scroll className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {loadError && <ErrorState error={loadError} onRetry={() => setAttempt((a) => a + 1)} title="The assessment could not be loaded" />}
          {!loadError && !quiz && <Spinner label="Loading questions" />}

          {quiz && !result && (
            <>
              <p className="text-sm text-ink-soft">{quiz.note}</p>
              <ol className="mt-6 space-y-7">
                {quiz.questions.map((q, qi) => (
                  <li key={q.id}>
                    <fieldset>
                      <legend className="flex gap-3 text-[0.95rem] font-medium leading-snug">
                        <span className="num text-ink-faint">{qi + 1}.</span>
                        <span>
                          <InlineCode text={q.question} />
                        </span>
                      </legend>
                      <div className="mt-3 grid gap-2 pl-6">
                        {q.options.map((opt, oi) => {
                          const checked = answers[q.id] === oi;
                          return (
                            <label
                              key={oi}
                              className={cx(
                                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition",
                                checked ? "border-plum-700 bg-lilac-100 text-plum-950" : "border-line bg-white hover:border-line-strong",
                              )}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={checked}
                                onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                                className="h-4 w-4 accent-plum-700"
                              />
                              <InlineCode text={opt} />
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  </li>
                ))}
              </ol>
              {submitError && (
                <div className="mt-6">
                  <ErrorState error={submitError} title="Your answers could not be submitted" />
                </div>
              )}
            </>
          )}

          {result && <QuizResultView res={result} />}
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-line px-6 py-4 sm:px-8">
          {result ? (
            <>
              <p className="text-xs text-ink-faint">Your roadmap below has been refreshed.</p>
              <Button onClick={() => ref.current?.close()}>Back to my roadmap</Button>
            </>
          ) : (
            <>
              <p className="num text-xs text-ink-faint">{quiz ? `${answeredCount} of ${total} answered` : ""}</p>
              <Button onClick={submit} disabled={!quiz || answeredCount < total || submitting}>
                {submitting ? "Grading…" : "Submit answers"}
              </Button>
            </>
          )}
        </footer>
      </div>
    </dialog>
  );
}

function QuizResultView({ res }: { res: QuizSubmissionResponse }) {
  const { result, orchestration: orch } = res;
  const tone = scoreTone(result.percent);
  return (
    <div className="animate-rise">
      <div className="flex items-end gap-4">
        <span className={cx("num stat-value text-[3rem] leading-none", SCORE_TEXT[tone])}>{round(result.percent)}%</span>
        <p className="mb-2 text-sm text-ink-soft">
          {result.correct} of {result.total} correct · now your measured {result.skill} level
        </p>
      </div>

      <section className={cx("mt-6 rounded-xl p-5", orch.roadmap_changed ? "border border-plum-200 bg-plum-50" : "border border-line bg-white")}>
        <div className="flex items-center gap-2.5">
          <AgentMark agent="learning" size="sm" />
          <p className={cx("text-sm font-semibold", "text-ink")}>
            {orch.roadmap_changed ? "The Learning Agent adapted your roadmap" : "The Learning Agent kept your roadmap as it is"}
          </p>
        </div>
        {orch.adaptation ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {orch.adaptation.reason}. Roadmap is now v{orch.adaptation.roadmap_version}; tasks you had already completed were not changed.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {orch.adaptation.changes.map((c, i) => (
                <li key={i} className="flex gap-2.5">
                  <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-plum-700" aria-hidden />
                  <span>
                    <span className="font-medium text-plum-800">Day {c.day} · </span>
                    {c.type === "upgraded" ? `Replaced “${c.replaced}” with: ${c.title}` : c.title}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            The score was recorded and your skill level re-assessed. It fell in the range where no change to the plan was needed.
          </p>
        )}
        <p className={cx("mt-4 font-mono text-[0.7rem]", "text-ink-faint")}>run {orch.run_id}</p>
      </section>

      <h3 className="eyebrow mt-8">Review</h3>
      <ol className="mt-3 space-y-4">
        {result.answers.map((a, i) => (
          <li key={a.id} className="rounded-xl border border-line bg-white px-4 py-3.5">
            <div className="flex gap-3">
              <span
                className={cx(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  a.is_correct ? "bg-sage-100 text-sage-700" : "bg-rosewood-100 text-rosewood-600",
                )}
                aria-label={a.is_correct ? "Correct" : "Incorrect"}
              >
                {a.is_correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
              <div className="min-w-0 text-sm">
                <p className="font-medium leading-snug">
                  {i + 1}. <InlineCode text={a.question} />
                </p>
                <p className="mt-1.5 leading-relaxed text-ink-soft">{a.explanation}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Quiz text marks code with backticks; render those spans in mono. */
function InlineCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") ? (
          <code key={i} className="rounded bg-paper-deep px-1 py-px font-mono text-[0.85em]">
            {p.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

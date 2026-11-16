import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { InterviewSession } from "@/api/types";
import { Card, CardHeader, EmptyNote, Pill, cx } from "@/components/ui/primitives";
import { round, timeAgo } from "@/lib/format";
import { FeedbackView } from "./FeedbackView";

const TYPE_LABEL = { technical: "Technical", hr: "HR", mixed: "Mixed" } as const;

/** Past sessions from GET /users/{id}/interviews (newest first), each expandable to its stored feedback. */
export function InterviewHistory({ sessions, activeId, onResume }: { sessions: InterviewSession[]; activeId: number | null; onResume: (s: InterviewSession) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Card className="p-5">
      <CardHeader eyebrow="History" title="Previous practice" />
      {sessions.length === 0 ? (
        <div className="mt-4">
          <EmptyNote>No mock interviews yet. Your sessions and feedback will be kept here.</EmptyNote>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {sessions.map((s) => {
            const isOpen = open === s.id;
            return (
              <li key={s.id} className="py-3">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold">{TYPE_LABEL[s.interview_type]}</span>
                        {s.status === "in_progress" ? <Pill tone="lilac">in progress</Pill> : null}
                        {s.weak_topics.map((w) => (
                          <Pill key={w.skill} tone="ochre">
                            weak: {w.skill}
                          </Pill>
                        ))}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-faint">
                        {s.feedback.length}/{s.questions.length} answered · {timeAgo(s.created_at)}
                      </span>
                    </span>
                    <span className="num stat-value text-xl leading-none text-plum-800">{s.overall_score === null ? "–" : round(s.overall_score)}</span>
                    <ChevronDown className={cx("h-4 w-4 shrink-0 text-ink-faint transition-transform", isOpen && "rotate-180")} aria-hidden />
                  </button>
                </div>
                {s.status === "in_progress" && s.id !== activeId && (
                  <button type="button" onClick={() => onResume(s)} className="mt-2 text-xs font-semibold text-plum-700 hover:text-plum-900">
                    Continue this session
                  </button>
                )}
                {isOpen && (
                  <div className="mt-3 space-y-4">
                    {s.feedback.length === 0 ? (
                      <p className="text-xs text-ink-faint">No answers submitted in this session.</p>
                    ) : (
                      s.feedback.map((f) => (
                        <div key={f.id} className="rounded-xl border border-line bg-paper/50 p-4">
                          <p className="text-sm font-medium leading-snug">{f.question}</p>
                          <p className="mt-1.5 text-xs italic leading-relaxed text-ink-soft">“{f.answer}”</p>
                          <div className="mt-4">
                            <FeedbackView feedback={f} compact />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

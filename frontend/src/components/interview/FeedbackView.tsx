import { useState } from "react";
import { ChevronDown, Flag } from "lucide-react";
import type { AnswerFeedback, InterviewFeedback } from "@/api/types";
import { AgentMark } from "@/components/ui/AgentMark";
import { Meter, cx } from "@/components/ui/primitives";
import { humanize, round } from "@/lib/format";
import { scoreTone } from "@/lib/learning";

const SCORE_TEXT = { sage: "text-sage-700", plum: "text-plum-800", ochre: "text-ochre-700", rose: "text-rosewood-600" } as const;

function isAnswerFeedback(f: InterviewFeedback): f is AnswerFeedback {
  return "weak" in f;
}

/** The Confidence & Interview Agent's evaluation of one answer, exactly as returned by the backend. */
export function FeedbackView({ feedback: f, compact = false }: { feedback: InterviewFeedback | AnswerFeedback; compact?: boolean }) {
  const [showModel, setShowModel] = useState(false);
  const weights = isAnswerFeedback(f) ? f.criteria_weights : null;
  const weak = isAnswerFeedback(f) ? f.weak : null;
  const tone = scoreTone(f.overall);
  const criteria = Object.entries(f.scores).sort(([a], [b]) => (weights ? (weights[b] ?? 0) - (weights[a] ?? 0) : a.localeCompare(b)));

  return (
    <div className={cx("animate-rise", !compact && "rounded-xl border border-line bg-white p-5 sm:p-6")}>
      {!compact && (
        <div className="flex items-center gap-2.5">
          <AgentMark agent="confidence" size="sm" />
          <p className="text-sm">
            <span className="font-semibold">Confidence & Interview Agent</span> <span className="text-ink-soft">evaluated your answer</span>
          </p>
          {f.mode === "demo" && <span className="ml-auto text-xs text-ink-faint">rule-based demo evaluation</span>}
        </div>
      )}

      <div className={cx("grid gap-6 sm:grid-cols-[auto_1fr]", !compact && "mt-5")}>
        <div>
          <p className={cx("num stat-value text-[2.5rem] leading-none", SCORE_TEXT[tone])}>{round(f.overall)}</p>
          <p className="mt-1 text-xs text-ink-faint">overall / 100</p>
        </div>
        <ul className="space-y-2.5">
          {criteria.map(([k, v]) => (
            <li key={k}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-ink-soft">
                  <span className="capitalize">{humanize(k)}</span>
                  {weights?.[k] !== undefined && <span className="text-ink-faint"> · weight {weights[k]}</span>}
                </span>
                <span className="num text-ink-soft">{round(v)}</span>
              </div>
              <Meter value={v} tone={scoreTone(v) === "rose" ? "rose" : scoreTone(v) === "ochre" ? "ochre" : scoreTone(v) === "sage" ? "sage" : "plum"} label={humanize(k)} />
            </li>
          ))}
        </ul>
      </div>

      {weak && f.skill && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-ochre-100/60 px-4 py-3 text-sm text-ochre-700">
          <Flag className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            The orchestrator flagged <strong>{f.skill}</strong> as a weak topic. When you finish this session it will be sent to the Learning Agent, which can adapt your roadmap.
          </span>
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <List title="What worked" items={f.strengths} tone="sage" />
        <List title="What to improve" items={f.improvements} tone="ochre" />
      </div>

      {f.missing_points.length > 0 && (
        <div className="mt-5">
          <p className="eyebrow mb-2">Points a strong answer would cover</p>
          <div className="flex flex-wrap gap-1.5">
            {f.missing_points.map((p) => (
              <span key={p} className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-ink-soft">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {f.improved_answer && (
        <div className="mt-5 border-t border-line pt-4">
          <button type="button" onClick={() => setShowModel((s) => !s)} aria-expanded={showModel} className="flex items-center gap-1.5 text-sm font-semibold text-plum-700">
            <ChevronDown className={cx("h-4 w-4 transition-transform", showModel && "rotate-180")} aria-hidden />
            {showModel ? "Hide" : "Show"} a stronger version of your answer
          </button>
          {showModel && (
            <p className="mt-3 rounded-xl bg-lilac-50 px-4 py-3 text-sm leading-relaxed text-ink">
              {f.improved_answer}
              <span className="mt-2 block text-xs text-ink-faint">Built from your verified profile only. Use it as a guide, in your own words.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone: "sage" | "ochre" }) {
  return (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-ink-faint">Nothing noted.</p>
      ) : (
        <ul className="space-y-1.5 text-sm leading-relaxed">
          {items.map((s) => (
            <li key={s} className="flex gap-2">
              <span className={cx("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", tone === "sage" ? "bg-sage-600" : "bg-ochre-600")} aria-hidden />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

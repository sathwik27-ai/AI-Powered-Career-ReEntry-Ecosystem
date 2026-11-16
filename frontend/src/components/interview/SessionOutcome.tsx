import { ArrowRight, GitBranch } from "lucide-react";
import type { InterviewCompleteResponse } from "@/api/types";
import { AgentMark } from "@/components/ui/AgentMark";
import { ButtonLink, cx } from "@/components/ui/primitives";
import { round } from "@/lib/format";

/** What happened after "Finish session": the interview summary and the orchestrator's real decision. */
export function SessionOutcome({ res, onNew }: { res: InterviewCompleteResponse; onNew: () => void }) {
  const { session, orchestration: orch } = res;
  const summary = orch.interview_summary;
  const answered = session.feedback.length;

  return (
    <div className="animate-rise space-y-5">
      <section className="card p-6 sm:p-7">
        <p className="eyebrow">Session complete · {session.interview_type} interview</p>
        <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="num stat-value text-[2.75rem] leading-none text-plum-900">{round(session.overall_score)}</p>
            <p className="mt-1 text-xs text-ink-faint">
              overall · {answered} of {session.questions.length} questions answered
            </p>
          </div>
          {summary?.hr_score !== null && summary?.hr_score !== undefined && (
            <div>
              <p className="num stat-value text-2xl leading-none text-plum-800">{round(summary.hr_score)}</p>
              <p className="mt-1 text-xs text-ink-faint">HR answers</p>
            </div>
          )}
          {summary &&
            Object.entries(summary.skill_scores).map(([skill, s]) => (
              <div key={skill}>
                <p className="num stat-value text-2xl leading-none text-plum-800">{round(s)}</p>
                <p className="mt-1 text-xs text-ink-faint">{skill}</p>
              </div>
            ))}
        </div>
        {summary && summary.recommendations.length > 0 && (
          <ul className="mt-5 space-y-1 border-t border-line pt-4 text-sm text-ink-soft">
            {summary.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </section>

      <section className={cx("rounded-card p-6 sm:p-7", orch.roadmap_changed ? "border border-plum-200 bg-plum-50" : "border border-line bg-white")}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <AgentMark agent="confidence" size="sm" />
          <ArrowRight className={cx("h-3.5 w-3.5", "text-ink-faint")} aria-hidden />
          <AgentMark agent="orchestrator" size="sm" />
          <ArrowRight className={cx("h-3.5 w-3.5", "text-ink-faint")} aria-hidden />
          <AgentMark agent="learning" size="sm" />
        </div>
        <h2 className={cx("mt-4 text-xl font-semibold leading-snug", "text-ink")}>
          {orch.roadmap_changed ? "Your learning roadmap was adapted." : "Your roadmap didn't need to change."}
        </h2>

        {orch.adaptation ? (
          <>
            <p className="mt-2 leading-relaxed text-ink-soft">
              {orch.adaptation.reason}. Roadmap is now v{orch.adaptation.roadmap_version}; tasks you had already completed were not changed.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm">
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
            <ButtonLink to="/learning" variant="primary" className="mt-6">
              Open my learning roadmap <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </>
        ) : (
          <p className="mt-2 leading-relaxed text-ink-soft">
            {session.weak_topics.length === 0
              ? "No weak technical topics were found in this session, so the Learning Agent left your plan as it was. Your scores were still recorded."
              : "Your scores were recorded and the Learning Agent re-assessed your skills; no roadmap change was needed."}
          </p>
        )}
        <p className={cx("mt-5 font-mono text-[0.7rem]", "text-ink-faint")}>run {orch.run_id}</p>
      </section>

      <button type="button" onClick={onNew} className="link-quiet text-sm">
        Start another practice interview
      </button>
    </div>
  );
}

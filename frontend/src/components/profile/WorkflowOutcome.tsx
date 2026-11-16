import { Check, HelpCircle } from "lucide-react";
import type { WorkflowResult } from "@/api/types";
import { NODE_LABEL } from "@/lib/agents";

/** The real trace of a comeback-workflow run, plus any clarification the orchestrator asked for. */
export function WorkflowOutcome({ workflow, onPickRole }: { workflow: WorkflowResult; onPickRole?: (role: string) => void }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5" aria-live="polite">
      <p className="eyebrow">
        Career Orchestrator ran · <span className="font-mono normal-case tracking-normal">{workflow.run_id}</span>
      </p>
      <ol className="mt-3 space-y-2">
        {workflow.trace.map((node, i) => (
          <li key={`${node}-${i}`} className="flex items-center gap-3 text-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage-100 text-sage-700">
              <Check className="h-3 w-3" aria-hidden />
            </span>
            {NODE_LABEL[node] ?? node}
          </li>
        ))}
      </ol>
      {workflow.roadmap_kept && <p className="mt-3 text-xs text-ink-faint">Your existing roadmap and its progress were kept.</p>}

      {workflow.needs_clarification && (
        <div className="mt-4 rounded-xl bg-ochre-100/60 px-4 py-3 text-sm text-ochre-700">
          <p className="flex items-center gap-2 font-semibold">
            <HelpCircle className="h-4 w-4" aria-hidden /> The orchestrator stopped to ask before planning further
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {workflow.clarification_questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          {workflow.suggested_roles.length > 0 && (
            <div className="mt-3">
              <p className="text-xs">Roles that fit the skills found so far:</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {workflow.suggested_roles.map((r) =>
                  onPickRole ? (
                    <button key={r} type="button" onClick={() => onPickRole(r)} className="rounded-full border border-ochre-600/40 bg-white px-2.5 py-1 text-xs font-medium text-ochre-700 hover:border-ochre-700">
                      {r}
                    </button>
                  ) : (
                    <span key={r} className="rounded-full border border-ochre-600/40 bg-white px-2.5 py-1 text-xs">
                      {r}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

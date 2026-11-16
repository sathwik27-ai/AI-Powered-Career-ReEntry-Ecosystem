import type { AgentKey } from "@/api/types";
import { AGENT_LABEL, AGENT_MARK } from "@/lib/agents";
import { cx } from "./primitives";

export function AgentMark({ agent, size = "md", working = false }: { agent: AgentKey | string; size?: "sm" | "md"; working?: boolean }) {
  const mark = AGENT_MARK[agent as AgentKey] ?? { mono: "··", tint: "bg-paper-deep", ink: "text-ink-soft" };
  return (
    <span
      className={cx(
        "relative inline-flex shrink-0 select-none items-center justify-center rounded-lg font-semibold tracking-tight",
        size === "sm" ? "h-7 w-7 text-[0.62rem]" : "h-9 w-9 text-[0.7rem]",
        mark.tint,
        mark.ink,
      )}
      title={AGENT_LABEL[agent as AgentKey] ?? agent}
      aria-hidden
    >
      {mark.mono}
      {working && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulsedot rounded-full border-2 border-white bg-ochre-600" />}
    </span>
  );
}

import type { AgentKey } from "@/api/types";

/**
 * Short display labels for the agent keys the backend uses in logs and plans.
 * Full names and responsibilities come from GET /api/users/{id}/agents.
 */
export const AGENT_LABEL: Record<AgentKey, string> = {
  orchestrator: "Career Orchestrator",
  profile: "Profile Intelligence",
  skill_gap: "Skill Gap",
  learning: "Learning",
  confidence: "Confidence & Interview",
  opportunity: "Opportunity Discovery",
  application: "Resume & Application",
};

/** Two-letter monogram + tint per agent, used consistently everywhere. */
export const AGENT_MARK: Record<AgentKey, { mono: string; tint: string; ink: string }> = {
  orchestrator: { mono: "CO", tint: "bg-plum-900", ink: "text-white" },
  profile: { mono: "PI", tint: "bg-lilac-100", ink: "text-lilac-700" },
  skill_gap: { mono: "SG", tint: "bg-ochre-100", ink: "text-ochre-700" },
  learning: { mono: "LA", tint: "bg-plum-100", ink: "text-plum-800" },
  confidence: { mono: "CI", tint: "bg-lilac-200", ink: "text-lilac-700" },
  opportunity: { mono: "OD", tint: "bg-sage-100", ink: "text-sage-700" },
  application: { mono: "RA", tint: "bg-paper-deep", ink: "text-ink-soft" },
};

/** Workflow graph node → human wording, for showing a run's real trace. */
export const NODE_LABEL: Record<string, string> = {
  goal: "Set the comeback goal",
  profile: "Read the resume and build the profile",
  evaluate_profile: "Check the profile is complete",
  skill_gap: "Compare skills with the target role",
  learning: "Build the day-by-day roadmap",
  opportunity: "Match suitable opportunities",
  plan: "Update the Career Comeback Plan",
  receive: "Receive new evidence",
  analyze: "Analyse the result",
  evaluate: "Decide whether the roadmap should change",
  adapt: "Adapt the roadmap",
  reassess: "Re-assess skill levels",
  receive_selection: "Receive the chosen opportunity",
  application: "Draft resume and cover letter",
  review_gate: "Wait for human approval",
};

export function agentLabel(key: string | null | undefined): string {
  if (!key) return "";
  return AGENT_LABEL[key as AgentKey] ?? key;
}

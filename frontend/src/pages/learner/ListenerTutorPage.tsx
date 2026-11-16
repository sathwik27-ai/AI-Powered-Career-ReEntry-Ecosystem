import { JotformAgent } from "../../components/agents/JotformAgent";

export function ListenerTutorPage() {
  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow text-jelly-lime">Agent 3: Automated Teaching & Doubts</span>
        <h1 className="page-title mt-1">Tutor Coach AI Assistant</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Stuck on a concept or code snippet? Ask your dedicated Tutor Coach to explain concepts in simple terms, provide worked examples, and guide practice exercises.
        </p>
      </div>

      <JotformAgent
        agentId="01a1de4d9d9870008b817a17a82f4df6c01f"
        agentKey="tutor_coach"
        agentName="ReStartHer Tutor Coach"
        accentColor="#43D98C"
        description="Explains topics simply, answers questions, and guides your personalized learning journey."
        height="700px"
      />
    </div>
  );
}

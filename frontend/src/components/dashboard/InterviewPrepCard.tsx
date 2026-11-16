import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/primitives";
import { round } from "@/lib/format";

export function InterviewPrepCard({ tips, completed, latestScore }: { tips: string[]; completed: number; latestScore: number | null }) {
  return (
    <Card className="p-6">
      <CardHeader
        eyebrow="Confidence & Interview Agent"
        title="Interview preparation"
        action={
          <Link to="/interview" className="link-quiet shrink-0 text-xs text-ink-soft">
            Practise
          </Link>
        }
      />
      <div className="mt-4 flex gap-6 text-sm">
        <div>
          <p className="num stat-value text-2xl leading-none text-plum-800">{completed}</p>
          <p className="mt-1 text-xs text-ink-faint">mock interviews done</p>
        </div>
        <div>
          <p className="num stat-value text-2xl leading-none text-plum-800">{latestScore === null ? "–" : round(latestScore)}</p>
          <p className="mt-1 text-xs text-ink-faint">latest score</p>
        </div>
      </div>
      {tips.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

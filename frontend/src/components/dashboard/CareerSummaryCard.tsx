import { Link } from "react-router-dom";
import type { CareerSummary, Profile } from "@/api/types";
import { Card, EmptyNote, Pill } from "@/components/ui/primitives";
import { years } from "@/lib/format";

export function CareerSummaryCard({ summary, profile }: { summary: CareerSummary | null; profile: Profile | null }) {
  if (!summary || !profile) {
    return (
      <Card className="p-6">
        <p className="eyebrow mb-3">Career summary</p>
        <EmptyNote action={<Link className="link-quiet text-sm font-semibold text-plum-700" to="/onboarding">Add your background</Link>}>
          The Profile Intelligence Agent hasn't seen a resume or onboarding answers yet.
        </EmptyNote>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <p className="eyebrow">Career summary</p>
        <Link to="/profile" className="link-quiet text-xs text-ink-soft">
          Edit
        </Link>
      </div>

      <dl className="mt-4 space-y-4 text-sm">
        <div>
          <dt className="text-ink-faint">Before the break</dt>
          <dd className="mt-0.5 text-[0.95rem] font-semibold">
            {summary.previous_role ?? "Role not identified"}
            {summary.experience_years !== null && <span className="font-normal text-ink-soft"> · {years(summary.experience_years)}</span>}
          </dd>
        </div>
        {summary.career_break_years !== null && summary.career_break_years > 0 && (
          <div>
            <dt className="text-ink-faint">Career break</dt>
            <dd className="mt-0.5 text-[0.95rem]">
              {years(summary.career_break_years)}
              {profile.career_break_reason && <span className="text-ink-soft"> · {profile.career_break_reason}</span>}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-ink-faint">Aiming for</dt>
          <dd className="mt-0.5 text-[0.95rem] font-semibold text-plum-800">{summary.target_role ?? "Not chosen yet"}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Time available</dt>
          <dd className="mt-0.5">
            {summary.hours_per_day ? `${summary.hours_per_day} h a day` : "Not set"}
            {summary.work_preferences.length > 0 && <span className="text-ink-soft"> · {summary.work_preferences.join(" or ")}</span>}
            {summary.location_preference && <span className="text-ink-soft"> · {summary.location_preference}</span>}
          </dd>
        </div>
      </dl>

      {summary.skills.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-xs text-ink-faint">Skills found in your resume</p>
          <div className="flex flex-wrap gap-1.5">
            {summary.skills.map((s) => (
              <Pill key={s} tone="lilac" className="cursor-default">
                <span title={profile.skill_evidence[s] ? `Evidence: ${profile.skill_evidence[s]}` : undefined}>{s}</span>
              </Pill>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

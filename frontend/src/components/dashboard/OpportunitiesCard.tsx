import { Link } from "react-router-dom";
import type { PlanOpportunity } from "@/api/types";
import { Card, CardHeader, DemoListingTag, EmptyNote } from "@/components/ui/primitives";
import { round } from "@/lib/format";

export function OpportunitiesCard({ items }: { items: PlanOpportunity[] }) {
  const anyDemo = items.some((o) => o.is_demo);
  return (
    <Card className="flex flex-col p-6">
      <CardHeader
        eyebrow="Opportunity Discovery Agent"
        title="Suitable opportunities"
        action={
          <Link to="/opportunities" className="link-quiet shrink-0 text-xs text-ink-soft">
            See all
          </Link>
        }
      />
      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyNote>No matches yet. Matching runs after your skill-gap analysis.</EmptyNote>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {items.map((o) => (
            <li key={o.id} className="flex items-start gap-4 py-3.5 first:pt-1">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold leading-snug">{o.title}</p>
                  {o.is_demo && <DemoListingTag />}
                </div>
                <p className="mt-0.5 text-sm text-ink-soft">{o.employer_label}</p>
                <p className="mt-1 text-xs text-ink-faint">
                  {o.arrangement} · {o.employment_type}
                </p>
              </div>
              <div className="text-right">
                <p className="num stat-value text-xl leading-none text-plum-800">{round(o.match_score)}</p>
                <p className="mt-1 text-[0.7rem] text-ink-faint">{o.match_label}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {anyDemo && (
        <p className="mt-auto pt-4 text-xs leading-relaxed text-ink-faint">
          These are illustrative demo listings for showing how matching works. They are not live vacancies and have no application links.
        </p>
      )}
    </Card>
  );
}

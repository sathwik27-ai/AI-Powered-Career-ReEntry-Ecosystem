import { useState } from "react";
import { Bookmark, BookmarkCheck, ChevronDown, ExternalLink, FilePen } from "lucide-react";
import type { OpportunityMatch } from "@/api/types";
import { Button, DemoListingTag, Meter, Pill, cx } from "@/components/ui/primitives";
import { round, timeAgo } from "@/lib/format";
import { scoreTone } from "@/lib/learning";

/** Weights from backend/agents/opportunity_agent.py (documented in docs/methodology.md). */
const COMPONENTS: { key: keyof OpportunityMatch["components"]; label: string; weight: number }[] = [
  { key: "skills", label: "Skills", weight: 40 },
  { key: "experience", label: "Experience", weight: 20 },
  { key: "flexibility", label: "Flexibility", weight: 20 },
  { key: "location", label: "Location", weight: 10 },
  { key: "returnship", label: "Returnship support", weight: 10 },
];

const SCORE_TEXT = { sage: "text-sage-700", plum: "text-plum-800", ochre: "text-ochre-700", rose: "text-rosewood-600" } as const;

export function OpportunityCard({
  opp: o,
  onToggleSave,
  onDraft,
  saving,
  drafting,
}: {
  opp: OpportunityMatch;
  onToggleSave: () => void;
  onDraft: () => void;
  saving: boolean;
  drafting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const tone = scoreTone(o.match_score);
  return (
    <article className="card p-5 sm:p-6" aria-labelledby={`opp-${o.id}`}>
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {o.is_demo && <DemoListingTag />}
            {o.returnship_friendly && <Pill tone="sage">Returnship-friendly</Pill>}
            {o.flexible_hours && <Pill tone="lilac">Flexible hours</Pill>}
          </div>
          <h3 id={`opp-${o.id}`} className="mt-2 text-lg font-semibold leading-snug">
            {o.title}
          </h3>
          <p className="mt-0.5 text-sm text-ink-soft">
            {o.employer_label.replace(/^Illustrative\s+/i, "")} · {o.location} · {o.arrangement} · {o.employment_type}
          </p>
          <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Verified Returnship Pathway</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={cx("num stat-value text-[2rem] leading-none", SCORE_TEXT[tone])}>{round(o.match_score)}</p>
          <p className="mt-1 text-xs text-ink-faint">{o.match_label}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{o.description}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-1.5">Why it fits</p>
          {o.reasons.length === 0 ? (
            <p className="text-sm text-ink-faint">No specific reasons found.</p>
          ) : (
            <ul className="space-y-1 text-sm leading-relaxed">
              {o.reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-600" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="eyebrow mb-1.5">Worth knowing</p>
          {o.gaps.length === 0 && o.missing_skills.length === 0 ? (
            <p className="text-sm text-ink-faint">No gaps flagged.</p>
          ) : (
            <ul className="space-y-1 text-sm leading-relaxed">
              {o.gaps.map((g) => (
                <li key={g} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ochre-600" aria-hidden />
                  {g}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="eyebrow mb-1.5">Skill alignment</p>
        <div className="flex flex-wrap gap-1.5">
          {o.matched_skills.map((s) => (
            <SkillChip key={s} skill={s} kind="have" />
          ))}
          {o.in_progress_skills.map((s) => (
            <SkillChip key={s} skill={s} kind="learning" />
          ))}
          {o.missing_skills.map((s) => (
            <SkillChip key={s} skill={s} kind="missing" />
          ))}
          {o.matched_skills.length + o.in_progress_skills.length + o.missing_skills.length === 0 && <span className="text-sm text-ink-faint">No required skills listed.</span>}
        </div>
        <p className="mt-1.5 text-[0.7rem] text-ink-faint">
          <span className="text-sage-700">●</span> you have it · <span className="text-plum-600">●</span> on your roadmap · <span className="text-rosewood-600">●</span> not yet
        </p>
      </div>

      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-plum-700">
        <ChevronDown className={cx("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
        How the score is calculated
      </button>
      {open && (
        <div className="mt-3 rounded-xl bg-paper/70 p-4">
          <ul className="space-y-2.5">
            {COMPONENTS.map((c) => (
              <li key={c.key}>
                <div className="mb-1 flex justify-between text-xs text-ink-soft">
                  <span>
                    {c.label} <span className="text-ink-faint">· {c.weight}% of score</span>
                  </span>
                  <span className="num">{round(o.components[c.key])}</span>
                </div>
                <Meter value={o.components[c.key]} label={`${c.label} component`} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-faint">A compatibility indicator calculated by the Opportunity Agent, not an employer's assessment. A career break never lowers the experience component.</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Button onClick={onDraft} disabled={drafting} className="h-9 px-3.5">
          <FilePen className="h-4 w-4" aria-hidden /> {drafting ? "Drafting…" : "Draft application"}
        </Button>
        <Button variant="secondary" onClick={onToggleSave} disabled={saving} aria-pressed={o.saved} className="h-9 px-3.5">
          {o.saved ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
          {o.saved ? "Saved" : "Save"}
        </Button>
        {o.saved_at && <span className="text-xs text-ink-faint">saved {timeAgo(o.saved_at)}</span>}
        <div className="ml-auto flex items-center gap-2">
          <a
            href={`https://www.naukri.com/${encodeURIComponent(o.title.toLowerCase().replace(/\s+/g, "-"))}-jobs?k=${encodeURIComponent(o.title)}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 rounded-xl bg-paper-deep px-2.5 py-1 text-xs font-bold text-[#0066CC] hover:bg-paper"
          >
            Naukri <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          <a
            href="https://internshala.com/jobs/women-return-to-work-jobs/"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 rounded-xl bg-paper-deep px-2.5 py-1 text-xs font-bold text-[#16A34A] hover:bg-paper"
          >
            Internshala <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}

function SkillChip({ skill, kind }: { skill: string; kind: "have" | "learning" | "missing" }) {
  const cls = { have: "border-sage-600/30 bg-sage-100 text-sage-700", learning: "border-lilac-300 bg-lilac-50 text-plum-700", missing: "border-rosewood-600/25 bg-rosewood-100 text-rosewood-600" }[kind];
  const label = { have: "you have it", learning: "on your roadmap", missing: "not yet" }[kind];
  return (
    <span className={cx("rounded-md border px-2 py-0.5 text-xs font-medium", cls)} title={label}>
      {skill}
      <span className="sr-only"> ({label})</span>
    </span>
  );
}

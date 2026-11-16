import { useId, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { EMPLOYMENT_TYPES, WORK_ARRANGEMENTS } from "@/api/types";
import { cx } from "@/components/ui/primitives";
import { SUPPORTED_ROLES, type FormErrors, type ProfileFormState } from "@/lib/profile";

const input =
  "field";

/** Controlled fields for schemas.ProfileInput. Sections can be hidden for shorter forms. */
export function ProfileFields({
  value,
  onChange,
  errors,
  existingSkills,
  sections = ["background", "goal", "preferences"],
}: {
  value: ProfileFormState;
  onChange: Dispatch<SetStateAction<ProfileFormState>>;
  errors: FormErrors;
  existingSkills?: string[];
  sections?: ("background" | "goal" | "preferences")[];
}) {
  // Functional updates so quick successive changes never overwrite each other.
  const set = <K extends keyof ProfileFormState>(k: K, v: ProfileFormState[K]) => onChange((prev) => ({ ...prev, [k]: v }));
  const toggle = <K extends "work_preferences" | "employment_types">(k: K, item: string) =>
    onChange((prev) => {
      const list = prev[k] as string[];
      return { ...prev, [k]: list.includes(item) ? list.filter((x) => x !== item) : [...list, item] };
    });
  const roleList = useId();

  return (
    <div className="space-y-8">
      {sections.includes("goal") && (
        <Fieldset legend="Where you want to go">
          <Field label="Target role" error={errors.target_role} hint="Skill benchmarks exist for the roles in the list. Other titles are matched where possible, otherwise the orchestrator will ask you.">
            {(id) => (
              <>
                <input id={id} className={input} list={roleList} value={value.target_role} onChange={(e) => set("target_role", e.target.value)} placeholder="e.g. Backend Developer" maxLength={120} />
                <datalist id={roleList}>
                  {SUPPORTED_ROLES.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
        </Fieldset>
      )}

      {sections.includes("background") && (
        <Fieldset legend="Your background">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.full_name}>
              {(id) => <input id={id} className={input} value={value.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={120} autoComplete="name" />}
            </Field>
            <Field label="Previous role" error={errors.previous_role}>
              {(id) => <input id={id} className={input} value={value.previous_role} onChange={(e) => set("previous_role", e.target.value)} placeholder="e.g. Java Developer" maxLength={120} />}
            </Field>
            <Field label="Years of experience" error={errors.experience_years}>
              {(id) => <input id={id} className={input} type="number" min={0} max={50} step={0.5} inputMode="decimal" value={value.experience_years} onChange={(e) => set("experience_years", e.target.value)} />}
            </Field>
            <Field label="Career break (years)" error={errors.career_break_years}>
              {(id) => <input id={id} className={input} type="number" min={0} max={40} step={0.5} inputMode="decimal" value={value.career_break_years} onChange={(e) => set("career_break_years", e.target.value)} />}
            </Field>
          </div>
          <Field label="Reason for the break (optional)" error={errors.career_break_reason} hint="Only used to frame your story kindly. Never shared without your approval.">
            {(id) => <input id={id} className={input} value={value.career_break_reason} onChange={(e) => set("career_break_reason", e.target.value)} placeholder="e.g. Caregiving" maxLength={200} />}
          </Field>
          <Field label="Education" error={errors.education} hint="One qualification per line, up to 6. Replaces the list shown on your profile.">
            {(id) => <textarea id={id} className={cx(input, "min-h-[5.5rem]")} value={value.education} onChange={(e) => set("education", e.target.value)} placeholder="B.E. Computer Science, Anna University, 2017" />}
          </Field>
          <Field
            label={existingSkills?.length ? "Add skills" : "Skills"}
            error={errors.add_skills}
            hint={existingSkills?.length ? "Comma separated. New skills are added to the ones already on your profile; the backend doesn't support removing a skill yet." : "Comma separated, e.g. Java, SQL, Git"}
          >
            {(id) => <input id={id} className={input} value={value.add_skills} onChange={(e) => set("add_skills", e.target.value)} placeholder="Docker, REST APIs" />}
          </Field>
        </Fieldset>
      )}

      {sections.includes("preferences") && (
        <Fieldset legend="How you'd like to work">
          <ChipGroup label="Work arrangement" options={WORK_ARRANGEMENTS} selected={value.work_preferences} onToggle={(o) => toggle("work_preferences", o)} />
          <ChipGroup label="Employment type" options={EMPLOYMENT_TYPES} selected={value.employment_types} onToggle={(o) => toggle("employment_types", o)} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Preferred location" error={errors.location_preference}>
              {(id) => <input id={id} className={input} value={value.location_preference} onChange={(e) => set("location_preference", e.target.value)} placeholder="e.g. Bengaluru" maxLength={120} />}
            </Field>
            <Field label="Learning hours / day" error={errors.hours_per_day}>
              {(id) => <input id={id} className={input} type="number" min={0.5} max={8} step={0.5} inputMode="decimal" value={value.hours_per_day} onChange={(e) => set("hours_per_day", e.target.value)} />}
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Plan length</p>
              <div className="flex gap-2" role="radiogroup" aria-label="Plan length">
                {(["15", "30"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={value.plan_days === d}
                    onClick={() => onChange((prev) => ({ ...prev, plan_days: prev.plan_days === d ? "" : d }))}
                    className={cx("flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium", value.plan_days === d ? "border-plum-700 bg-plum-700 text-white" : "border-line-strong bg-white text-ink-soft hover:border-plum-500")}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Field label="Learning preferences" error={errors.learning_preferences} hint="Comma separated, e.g. videos, hands-on projects">
            {(id) => <input id={id} className={input} value={value.learning_preferences} onChange={(e) => set("learning_preferences", e.target.value)} />}
          </Field>
        </Fieldset>
      )}
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="eyebrow mb-1">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="mt-1 text-xs text-rosewood-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>
      )}
    </div>
  );
}

function ChipGroup<T extends string>({ label, options, selected, onToggle }: { label: string; options: T[]; selected: T[]; onToggle: (o: T) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o)}
              className={cx("rounded-md border px-3 py-1.5 text-sm", on ? "border-plum-700 bg-plum-700 text-white" : "border-line-strong bg-white text-ink-soft hover:border-plum-500")}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

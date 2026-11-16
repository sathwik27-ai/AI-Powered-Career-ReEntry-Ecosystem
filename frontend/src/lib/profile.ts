import type { EmploymentType, Profile, ProfileInput, WorkArrangement } from "@/api/types";

/** Target roles the Skill Gap Agent has benchmarks for (backend/knowledge/roles.py). Free text is resolved by alias. */
export const SUPPORTED_ROLES = [
  "Backend Developer",
  "Full Stack Developer",
  "Frontend Developer",
  "Data Analyst",
  "QA Engineer",
  "Cloud & DevOps Engineer",
  "Data Engineer",
  "AI / Machine Learning Engineer",
  "Cybersecurity Analyst",
  "Mobile App Developer",
  "Technical Product Manager",
  "UI/UX Designer",
];

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const RESUME_EXT = /\.(pdf|docx)$/i;

/** Mirrors the backend's checks so obvious mistakes are caught before uploading. The backend still validates content. */
export function validateResumeFile(file: File): string | null {
  if (!RESUME_EXT.test(file.name)) return "Please choose a PDF or DOCX file. Older .doc files and images aren't supported.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > RESUME_MAX_BYTES) return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`;
  return null;
}

export function fileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export interface ProfileFormState {
  full_name: string;
  previous_role: string;
  experience_years: string;
  career_break_years: string;
  career_break_reason: string;
  target_role: string;
  education: string; // one entry per line
  add_skills: string; // comma separated – skills merge on the backend, they can only be added
  work_preferences: WorkArrangement[];
  employment_types: EmploymentType[];
  location_preference: string;
  hours_per_day: string;
  plan_days: "" | "15" | "30";
  learning_preferences: string; // comma separated
}

const num = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function formFromProfile(p: Profile | null): ProfileFormState {
  return {
    full_name: p?.full_name ?? "",
    previous_role: p?.previous_role ?? "",
    experience_years: num(p?.experience_years),
    career_break_years: num(p?.career_break_years),
    career_break_reason: p?.career_break_reason ?? "",
    target_role: p?.target_role ?? "",
    education: (p?.education ?? []).join("\n"),
    add_skills: "",
    work_preferences: (p?.work_preferences ?? []) as WorkArrangement[],
    employment_types: (p?.employment_types ?? []) as EmploymentType[],
    location_preference: p?.location_preference ?? "",
    hours_per_day: num(p?.hours_per_day),
    plan_days: p?.plan_days === 15 || p?.plan_days === 30 ? (String(p.plan_days) as "15" | "30") : "",
    learning_preferences: (p?.learning_preferences ?? []).join(", "),
  };
}

const splitList = (s: string, sep: RegExp) =>
  s
    .split(sep)
    .map((x) => x.trim())
    .filter(Boolean);

export type FormErrors = Partial<Record<keyof ProfileFormState, string>>;

/** Client-side checks matching schemas.ProfileInput limits. */
export function validateProfileForm(f: ProfileFormState): FormErrors {
  const e: FormErrors = {};
  const range = (key: keyof ProfileFormState, v: string, min: number, max: number, label: string) => {
    if (v.trim() === "") return;
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max) e[key] = `${label} must be between ${min} and ${max}.`;
  };
  range("experience_years", f.experience_years, 0, 50, "Experience");
  range("career_break_years", f.career_break_years, 0, 40, "Career break");
  range("hours_per_day", f.hours_per_day, 0.5, 8, "Hours per day");
  if (splitList(f.education, /\n/).length > 6) e.education = "Up to 6 education entries.";
  const skills = splitList(f.add_skills, /,/);
  if (skills.some((s) => s.length > 80)) e.add_skills = "Each skill must be 80 characters or fewer.";
  if (skills.length > 60) e.add_skills = "Up to 60 skills at a time.";
  if (splitList(f.learning_preferences, /,/).length > 10) e.learning_preferences = "Up to 10 learning preferences.";
  if (f.full_name.length > 120) e.full_name = "Name is too long.";
  return e;
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Builds the ProfileInput body. With `base` (editing), only fields that changed are sent,
 * so untouched values the resume parser found are never overwritten.
 */
export function buildProfileInput(f: ProfileFormState, base: Profile | null): ProfileInput {
  const out: ProfileInput = {};
  const text = (key: "full_name" | "previous_role" | "career_break_reason" | "target_role" | "location_preference") => {
    const v = f[key].trim();
    if (v && v !== (base?.[key] ?? "")) out[key] = v;
  };
  text("full_name");
  text("previous_role");
  text("career_break_reason");
  text("target_role");
  text("location_preference");

  const number = (key: "experience_years" | "career_break_years" | "hours_per_day") => {
    if (f[key].trim() === "") return;
    const n = Number(f[key]);
    if (n !== (base?.[key] ?? null)) out[key] = n;
  };
  number("experience_years");
  number("career_break_years");
  number("hours_per_day");

  if (f.plan_days && Number(f.plan_days) !== base?.plan_days) out.plan_days = Number(f.plan_days) as 15 | 30;

  const edu = splitList(f.education, /\n/);
  if (edu.length && !sameList(edu, base?.education ?? [])) out.education = edu;

  const existing = new Set((base?.skills ?? []).map((s) => s.toLowerCase()));
  const newSkills = splitList(f.add_skills, /,/).filter((s) => !existing.has(s.toLowerCase()));
  if (newSkills.length) out.skills = newSkills;

  if (f.work_preferences.length && !sameList([...f.work_preferences].sort(), [...(base?.work_preferences ?? [])].sort())) out.work_preferences = f.work_preferences;
  if (f.employment_types.length && !sameList([...f.employment_types].sort(), [...(base?.employment_types ?? [])].sort())) out.employment_types = f.employment_types;

  const lp = splitList(f.learning_preferences, /,/);
  if (lp.length && !sameList(lp, base?.learning_preferences ?? [])) out.learning_preferences = lp;
  return out;
}

export const MISSING_LABEL: Record<string, string> = {
  target_role: "Target role",
  work_preferences: "Work preferences",
  employment_history: "Employment history",
  education: "Education",
  technical_skills: "Technical skills",
  career_break_years: "Length of career break",
};

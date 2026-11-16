import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  FileText,
  Bot,
  Columns,
  CheckCircle2,
  Upload,
  ArrowRight,
  Briefcase,
  Clock,
  BookOpen,
  UserCheck,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { JotformAgent } from "../../components/agents/JotformAgent";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const COMMON_SKILLS = [
  "Java", "Spring Boot", "REST APIs", "SQL", "Docker", "Kubernetes", "Linux", "Git", "Microservices",
  "JavaScript", "TypeScript", "React", "HTML", "CSS", "Python", "Excel", "Power BI", "Tableau",
  "Selenium", "Manual Testing", "Agile", "Statistics", "Data Visualization", "Cloud Deployment", "CI/CD",
  "Kafka", "Apache Spark", "Data Pipelines", "Machine Learning", "Generative AI", "Network Security",
  "Vulnerability Assessment", "Mobile Development", "Product Strategy", "Figma", "User Research"
];

const TARGET_ROLES = [
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
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

const BREAK_REASONS = [
  "Family caregiving & childcare",
  "Maternity leave extension",
  "Health or medical recovery",
  "Relocation / spouse transfer",
  "Higher education / certification",
  "Personal career sabbatical",
];

export function ListenerIntakePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"form" | "chat" | "both">("form");

  // Form State
  const [targetRole, setTargetRole] = useState("Backend Developer");
  const [previousRole, setPreviousRole] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">(3);
  const [careerBreakYears, setCareerBreakYears] = useState<number | "">(2);
  const [careerBreakReason, setCareerBreakReason] = useState(BREAK_REASONS[0]);
  const [skills, setSkills] = useState<string[]>(["Java", "SQL", "Git"]);
  const [customSkill, setCustomSkill] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [planDays, setPlanDays] = useState<15 | 30>(30);
  const [workPreferences, setWorkPreferences] = useState<string[]>(["Remote", "Hybrid"]);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>(["Full-time", "Returnship"]);
  const [locationPreference, setLocationPreference] = useState("Chennai");

  // State feedback
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);

  // Load existing profile if any
  useEffect(() => {
    api.listenerProfile()
      .then((data) => {
        if (data?.profile) {
          const p = data.profile;
          if (p.target_role) setTargetRole(p.target_role);
          if (p.previous_role) setPreviousRole(p.previous_role);
          if (p.experience_years !== undefined) setExperienceYears(p.experience_years);
          if (p.career_break_years !== undefined) setCareerBreakYears(p.career_break_years);
          if (p.career_break_reason) setCareerBreakReason(p.career_break_reason);
          if (p.hours_per_day) setHoursPerDay(p.hours_per_day);
          if (p.plan_days) setPlanDays(p.plan_days);
          if (p.location_preference) setLocationPreference(p.location_preference);
          if (p.work_preferences && p.work_preferences.length) setWorkPreferences(p.work_preferences);
          if (p.employment_types && p.employment_types.length) setEmploymentTypes(p.employment_types);
        }
        if (data?.skills && data.skills.length > 0) {
          setSkills(data.skills);
        }
      })
      .catch(() => { });
  }, []);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const s = customSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
      setCustomSkill("");
    }
  };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingResume(true);
    setErrorMsg(null);
    setResumeFilename(file.name);

    try {
      const res = await api.uploadResume(user.id, file, {
        target_role: targetRole,
        previous_role: previousRole || undefined,
        experience_years: experienceYears !== "" ? Number(experienceYears) : undefined,
        career_break_years: careerBreakYears !== "" ? Number(careerBreakYears) : undefined,
        career_break_reason: careerBreakReason,
        skills,
        hours_per_day: hoursPerDay,
        plan_days: planDays,
        location_preference: locationPreference,
        work_preferences: workPreferences as any,
        employment_types: employmentTypes as any,
      });

      await refreshUser();
      setSuccessMsg(`Resume "${file.name}" parsed! All 6 AI agents are now trained on your background. Loading your personalized dashboard...`);
      setTimeout(() => {
        navigate("/app");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to parse resume.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      target_role: targetRole,
      previous_role: previousRole || targetRole,
      experience_years: experienceYears !== "" ? Number(experienceYears) : 2,
      career_break_years: careerBreakYears !== "" ? Number(careerBreakYears) : 2,
      career_break_reason: careerBreakReason,
      skills,
      hours_per_day: hoursPerDay,
      plan_days: planDays,
      location_preference: locationPreference,
      work_preferences: workPreferences,
      employment_types: employmentTypes,
    };

    try {
      await api.updateListenerProfile(payload);
      await refreshUser();
      setSuccessMsg(`Profile saved! All 6 AI agents are now trained on your background. Your dynamic roadmap for ${targetRole} has been generated. Loading your personalized dashboard...`);
      setTimeout(() => {
        navigate("/app");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update profile and train agents.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow text-jelly-aqua">Agent 1: Intake & Background Intelligence</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-jelly-strawberry/30 bg-jelly-strawberry/10 px-2.5 py-0.5 text-[11px] font-bold text-jelly-strawberry">
              <CheckCircle2 className="h-3 w-3" />
              <span>Women in Tech Verified</span>
            </span>
          </div>
          <h1 className="page-title mt-1">Profile Intake & AI Agent Training</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Provide your career history, break timeframe, and target role. The AI agents will automatically summarize your profile, detect skill gaps, and generate your dynamic learning roadmap.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-2xl border border-line bg-surface p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${activeTab === "form"
              ? "bg-gradient-to-r from-jelly-aqua to-jelly-purple text-white shadow-xs"
              : "text-ink-soft hover:text-ink"
              }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Intake Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${activeTab === "chat"
              ? "bg-gradient-to-r from-jelly-aqua to-jelly-purple text-white shadow-xs"
              : "text-ink-soft hover:text-ink"
              }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>AI Chatbot</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("both")}
            className={`hidden lg:inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${activeTab === "both"
              ? "bg-gradient-to-r from-jelly-aqua to-jelly-purple text-white shadow-xs"
              : "text-ink-soft hover:text-ink"
              }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <Link
            to="/app/journey"
            className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-700"
          >
            View Dynamic Roadmap →
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <div className={`grid gap-6 ${activeTab === "both" ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}>
        {/* Form Column */}
        {(activeTab === "form" || activeTab === "both") && (
          <div className={`${activeTab === "both" ? "lg:col-span-6" : "max-w-4xl mx-auto w-full"}`}>
            <form onSubmit={handleSaveProfile} className="card p-6 sm:p-8 bg-surface border border-line shadow-jelly space-y-6">
              <div className="border-b border-line pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-ink">My Career Comeback Details</h2>
                  <p className="text-xs text-ink-soft">Enter your details to dynamically train the agents and personalize your path.</p>
                </div>
                <span className="rounded-full bg-jelly-aqua/15 text-jelly-aqua px-3 py-1 text-xs font-bold">
                  Dynamic Training
                </span>
              </div>

              {/* Resume Upload Shortcut */}
              <div className="rounded-2xl border-2 border-dashed border-line bg-paper-deep/50 p-4 hover:border-jelly-aqua transition-all">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-jelly-aqua/20 text-jelly-aqua">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-ink">Fast-Track: Upload Resume (PDF / DOCX)</h4>
                      <p className="text-[11px] text-ink-soft">
                        {resumeFilename ? `Uploaded: ${resumeFilename}` : "Extracts roles, past skills, education, and career break automatically."}
                      </p>
                    </div>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-surface border border-line px-3 py-1.5 text-xs font-bold text-ink shadow-xs hover:bg-paper-deep">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploadingResume ? "Parsing..." : "Upload File"}</span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleResumeFileChange}
                      disabled={uploadingResume}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Target Role & Previous Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    Target Role to Come Back To
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="field text-xs font-semibold"
                  >
                    {TARGET_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    Previous Role Before Break
                  </label>
                  <input
                    type="text"
                    value={previousRole}
                    onChange={(e) => setPreviousRole(e.target.value)}
                    placeholder="e.g. Software Engineer, QA Analyst"
                    className="field text-xs"
                  />
                </div>
              </div>

              {/* Experience Years & Break Years */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    Prior Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    step="0.5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value === "" ? "" : Number(e.target.value))}
                    className="field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    Career Break (Years)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="30"
                    step="0.5"
                    value={careerBreakYears}
                    onChange={(e) => setCareerBreakYears(e.target.value === "" ? "" : Number(e.target.value))}
                    className="field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    Break Reason
                  </label>
                  <select
                    value={careerBreakReason}
                    onChange={(e) => setCareerBreakReason(e.target.value)}
                    className="field text-xs font-semibold"
                  >
                    {BREAK_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Skills Selector */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  My Technical Skills & Background (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-paper-deep/50 border border-line">
                  {COMMON_SKILLS.map((sk) => {
                    const selected = skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleSkill(sk)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${selected
                          ? "bg-gradient-to-r from-jelly-aqua to-jelly-purple text-white shadow-xs"
                          : "bg-surface border border-line text-ink-soft hover:bg-white"
                          }`}
                      >
                        {selected ? `✓ ${sk}` : `+ ${sk}`}
                      </button>
                    );
                  })}
                </div>

                {/* Add custom skill input */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Add other skill (e.g. Kotlin, Redux, PostgreSQL)..."
                    className="field text-xs py-1.5 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="inline-flex items-center gap-1 rounded-xl bg-paper-deep px-3 py-2 text-xs font-bold text-ink hover:bg-jelly-aqua hover:text-white transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Work Preferences & Daily Commitment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    Daily Study Commitment (Hours/Day)
                  </label>
                  <select
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(Number(e.target.value))}
                    className="field text-xs font-semibold"
                  >
                    <option value={1}>1 hour / day (Gentle pace)</option>
                    <option value={2}>2 hours / day (Recommended)</option>
                    <option value={3}>3 hours / day (Accelerated)</option>
                    <option value={4}>4+ hours / day (Intensive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    Roadmap Duration
                  </label>
                  <select
                    value={planDays}
                    onChange={(e) => setPlanDays(Number(e.target.value) as 15 | 30)}
                    className="field text-xs font-semibold"
                  >
                    <option value={30}>30 Days (Comprehensive mastery)</option>
                    <option value={15}>15 Days (Express comeback track)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-ink-faint">
                  Saving automatically invokes the Career Orchestrator to generate your personalized learning tasks and job matches.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="jelly-btn inline-flex items-center gap-2 bg-gradient-to-r from-jelly-aqua via-jelly-purple to-jelly-strawberry px-6 py-3 text-xs font-extrabold text-white shadow-lift hover:opacity-95 disabled:opacity-50 shrink-0"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{submitting ? "Training AI Agents..." : "Save & Train All AI Agents"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Chatbot Column */}
        {(activeTab === "chat" || activeTab === "both") && (
          <div className={`${activeTab === "both" ? "lg:col-span-6" : "max-w-4xl mx-auto w-full"}`}>
            <JotformAgent
              agentId="01a1de02216070008ef9ea7886d80c2c3a1d"
              agentKey="profile_intake"
              agentName="ReStartHer Profile Intake"
              accentColor="#2FC9E3"
              description="Assists with onboarding, previous work experience, education, and career comeback goals."
              height="740px"
            />
          </div>
        )}
      </div>
    </div>
  );
}

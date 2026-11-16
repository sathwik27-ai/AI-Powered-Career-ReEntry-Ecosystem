import {
  Layers,
  Shield,
  UserCheck,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Lock,
} from "lucide-react";

export function AdminRolesPage() {
  const permissions = [
    {
      feature: "Learner Profile & Resume Parsing",
      description: "Upload resume, extract skills via AI, customize career goals",
      listener: true,
      trainer: true,
      admin: true,
    },
    {
      feature: "Personalized Roadmap & Lessons",
      description: "Auto-generated daily learning tasks and practice exercises",
      listener: true,
      trainer: true,
      admin: true,
    },
    {
      feature: "Skill Assessments & Quizzes",
      description: "Take deterministic quizzes to verify skill mastery",
      listener: true,
      trainer: true,
      admin: true,
    },
    {
      feature: "6 Jotform AI Agents Access",
      description: "Profile Intake, Tutor, Interview Coach, Job Scout, etc.",
      listener: true,
      trainer: true,
      admin: true,
    },
    {
      feature: "Job Matching & Search Links",
      description: "Explore returnships, view gap analysis, direct apply links",
      listener: true,
      trainer: true,
      admin: true,
    },
    {
      feature: "Application Drafting & Tailoring",
      description: "AI-tailored cover letter and resume drafts (never auto-submitted)",
      listener: true,
      trainer: true,
      admin: true,
    },
    {
      feature: "Assign Mentor Tasks",
      description: "Prescribe custom challenges or review milestone submissions",
      listener: false,
      trainer: true,
      admin: true,
    },
    {
      feature: "Learner Coaching Notes",
      description: "Keep private mentoring observations and flag intervention needs",
      listener: false,
      trainer: true,
      admin: true,
    },
    {
      feature: "Cohort Performance Reports",
      description: "Aggregated learner readiness distributions and pass rates",
      listener: false,
      trainer: true,
      admin: true,
    },
    {
      feature: "Learner-Trainer Reassignment",
      description: "Assign or balance caseloads across available mentors",
      listener: false,
      trainer: false,
      admin: true,
    },
    {
      feature: "Provision Mentor Accounts",
      description: "Create new trainer credentials and set caseload capacities",
      listener: false,
      trainer: false,
      admin: true,
    },
    {
      feature: "Database & Agent Health Monitoring",
      description: "Inspect Neon Postgres / SQLite connection and AI registry status",
      listener: false,
      trainer: false,
      admin: true,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-jelly-purple/10 px-3 py-1 text-xs font-bold text-jelly-purple mb-1">
          <Layers className="h-3.5 w-3.5" /> Security Governance
        </div>
        <h1 className="text-2xl font-extrabold text-ink">Roles &amp; Permissions Matrix</h1>
        <p className="text-xs text-ink-muted">
          Review access boundaries across Learners, Mentors, and Administrators to enforce data privacy and compliance.
        </p>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="jelly-card p-5 border-t-4 border-t-jelly-aqua">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-8 w-8 rounded-xl bg-jelly-aqua/10 text-jelly-aqua flex items-center justify-center font-bold">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-ink text-sm">Learner / Listener</h3>
              <span className="text-[10px] text-ink-faint font-semibold">Self-Directed Returnee</span>
            </div>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed mt-2">
            Can access personal roadmaps, interact with all 6 Jotform AI coaches, solve quizzes, and draft job applications. Strictly scoped to own profile and data.
          </p>
        </div>

        <div className="jelly-card p-5 border-t-4 border-t-jelly-purple">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-8 w-8 rounded-xl bg-jelly-purple/10 text-jelly-purple flex items-center justify-center font-bold">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-ink text-sm">Trainer / Mentor</h3>
              <span className="text-[10px] text-ink-faint font-semibold">Cohort Guide &amp; Coach</span>
            </div>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed mt-2">
            Oversees assigned learners, monitors quiz scores, assigns targeted learning interventions, writes mentorship notes, and accesses AI coaching tools.
          </p>
        </div>

        <div className="jelly-card p-5 border-t-4 border-t-jelly-strawberry">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-8 w-8 rounded-xl bg-jelly-strawberry/10 text-jelly-strawberry flex items-center justify-center font-bold">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-ink text-sm">Platform Admin</h3>
              <span className="text-[10px] text-ink-faint font-semibold">System Governance</span>
            </div>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed mt-2">
            Global access to all user cohorts, mentor onboarding, system telemetry, database health (Postgres/SQLite), and agent health configurations.
          </p>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="jelly-card p-6 overflow-hidden">
        <h2 className="text-base font-bold text-ink mb-1">Access Control Table</h2>
        <p className="text-xs text-ink-muted mb-6">
          Deterministic route-level authorization enforced via FastAPI dependencies (<code className="text-jelly-purple">require_listener</code>, <code className="text-jelly-purple">require_trainer</code>, <code className="text-jelly-purple">require_admin</code>).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-ink-faint uppercase font-bold text-[10px] tracking-wider">
                <th className="pb-3 w-2/5">Capability / Resource</th>
                <th className="pb-3 text-center">Learner</th>
                <th className="pb-3 text-center">Trainer</th>
                <th className="pb-3 text-center">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {permissions.map((p, idx) => (
                <tr key={idx} className="hover:bg-paper-deep/30 transition-colors">
                  <td className="py-3.5 pr-4">
                    <p className="font-bold text-ink">{p.feature}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">{p.description}</p>
                  </td>
                  <td className="py-3.5 text-center">
                    {p.listener ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-ink-faint/40 mx-auto" />
                    )}
                  </td>
                  <td className="py-3.5 text-center">
                    {p.trainer ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-ink-faint/40 mx-auto" />
                    )}
                  </td>
                  <td className="py-3.5 text-center">
                    {p.admin ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-ink-faint/40 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

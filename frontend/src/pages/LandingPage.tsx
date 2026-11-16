import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Bot,
  UserPlus,
  Target,
  BookOpen,
  Mic,
  Briefcase,
  FileText,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Star,
  Users,
  Compass,
  Clock,
  Award,
  Heart,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/theme/ThemeToggle";

const SIX_AGENTS = [
  {
    key: "profile_intake",
    name: "Profile Intake Agent",
    role: "Onboarding & Background",
    color: "#2FC9E3",
    icon: UserPlus,
    description:
      "Normalizes career breaks with zero penalty. Intelligently extracts prior skills, projects, and work history to train your AI coaching squad.",
  },
  {
    key: "skill_gap",
    name: "Skill Gap Explainer",
    role: "Market Benchmark Diagnostic",
    color: "#FF9A3D",
    icon: Target,
    description:
      "Compares your experience against 2026 industry benchmarks. Pinpoints exact framework shifts and priority competencies to refresh.",
  },
  {
    key: "tutor_coach",
    name: "Tutor Coach",
    role: "Micro-Learning & Doubts",
    color: "#43D98C",
    icon: BookOpen,
    description:
      "Delivers bite-sized daily lessons sized to your schedule. Explains modern concepts in simple terms with worked code examples.",
  },
  {
    key: "interview_coach",
    name: "Interview Coach",
    role: "Mock Prep & Confidence",
    color: "#FF5C8A",
    icon: Mic,
    description:
      "Runs supportive technical and behavioral mock interviews. Guides you to frame your career break with confidence using transparent rubrics.",
  },
  {
    key: "job_scout",
    name: "Job Scout",
    role: "Opportunity Intelligence",
    color: "#4D8DFF",
    icon: Briefcase,
    description:
      "Surfaces verified returnships and flexible tech openings. Generates compliant live search links for Naukri, Internshala, and LinkedIn.",
  },
  {
    key: "application_assistant",
    name: "Application Assistant",
    role: "Materials & Drafting",
    color: "#8E5CFF",
    icon: FileText,
    description:
      "Drafts tailored resume points, portfolio highlights, and cover letters. Never auto-submits—everything requires your human review.",
  },
];

const TRACKS = [
  { name: "Backend Developer", skills: "Java 21 · Spring Boot 3 · REST · SQL · Kafka · Docker", tag: "Engineering" },
  { name: "Full Stack Developer", skills: "React 18 · TypeScript · Node.js · Next.js · Prisma", tag: "Engineering" },
  { name: "Frontend Developer", skills: "React 19 · TypeScript · Tailwind CSS · Vite · Web Vitals", tag: "Web" },
  { name: "Data Analyst", skills: "Advanced SQL · Python Pandas · Power BI · Excel · Tableau", tag: "Data" },
  { name: "QA Automation / SDET", skills: "Playwright · Selenium 4 · TypeScript · Postman · CI/CD", tag: "Quality" },
  { name: "Cloud & DevOps Engineer", skills: "AWS · Docker · Kubernetes · GitHub Actions · Terraform", tag: "Cloud" },
  { name: "Data Engineer", skills: "Python · Spark · SQL · Kafka · Airflow · Snowflake", tag: "Data" },
  { name: "AI & ML Engineer", skills: "Python · PyTorch · Generative AI · LLMs · RAG · Vector DBs", tag: "AI / ML" },
  { name: "Cybersecurity Analyst", skills: "Network Security · OWASP Top 10 · Linux · IAM · SIEM", tag: "Security" },
  { name: "Mobile App Developer", skills: "React Native · Flutter · TypeScript · Mobile UI · APIs", tag: "Mobile" },
  { name: "Technical Product Manager", skills: "Product Strategy · Agile / Scrum · Jira · PRDs · Metrics", tag: "Product" },
  { name: "UI/UX Designer", skills: "Figma · Design Systems · User Research · Usability · HTML/CSS", tag: "Design" },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-200">
      {/* Top Navbar: Keep ONLY Sign In (Create Account is available on the Sign In page) */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 px-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-jelly-purple to-jelly-strawberry text-white shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-ink">
                ReStart<span className="text-jelly-strawberry">Her</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint -mt-1 hidden sm:block">
                AI Career Comeback Platform
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <a href="#agents" className="hidden text-xs font-bold text-ink-soft hover:text-ink sm:inline">
              Six AI Agents
            </a>
            <a href="#how" className="hidden text-xs font-bold text-ink-soft hover:text-ink sm:inline">
              How It Works
            </a>
            <a href="#tracks" className="hidden text-xs font-bold text-ink-soft hover:text-ink sm:inline">
              Role Tracks
            </a>

            <div className="h-4 w-px bg-line hidden sm:block" />

            <ThemeToggle />

            {/* Only Sign In button as requested */}
            <Link
              to={user ? "/app" : "/login"}
              className="jelly-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-jelly-purple to-jelly-strawberry px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:shadow-md transition-all"
            >
              <span>{user ? "Open Dashboard" : "Sign In"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:pb-24 lg:pt-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-jelly-purple/30 bg-jelly-purple/10 px-3.5 py-1.5 text-xs font-extrabold text-jelly-purple shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>National Career Comeback Initiative for Women in Tech</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-ink leading-[1.12]">
              Restart Your Tech Career With{" "}
              <span className="bg-gradient-to-r from-jelly-purple via-jelly-strawberry to-jelly-blueberry bg-clip-text text-transparent">
                Six Autonomous AI Agents
              </span>
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-ink-soft max-w-xl">
              A career break is not a step backward. ReStartHer analyzes where you left off, detects framework evolutions, designs daily adaptive micro-lessons sized to your hours, and matches you directly with verified returnships.
            </p>

            {/* Single Prominent Sign In Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to={user ? "/app" : "/login"}
                className="jelly-btn flex items-center justify-center gap-2 bg-gradient-to-r from-jelly-purple via-jelly-strawberry to-jelly-blueberry px-7 py-3.5 text-sm font-extrabold text-white shadow-lift hover:opacity-95 transition-all text-center"
              >
                <span>{user ? "Continue to Your Dashboard" : "Sign In to Get Started"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="text-xs text-ink-faint flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Free for learners · Create account & instant demo available on the sign-in page.</span>
            </p>

            {/* Trust Metrics Bar */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-line">
              <div>
                <div className="text-xl sm:text-2xl font-black text-ink">12 Tracks</div>
                <div className="text-[11px] font-semibold text-ink-soft">Industry Benchmarks</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-jelly-strawberry">6 Agents</div>
                <div className="text-[11px] font-semibold text-ink-soft">Autonomous Coaching</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600">100%</div>
                <div className="text-[11px] font-semibold text-ink-soft">Human-in-the-Loop Safe</div>
              </div>
            </div>
          </div>

          {/* Right Column: Inspiring Image Showing Women Career Regrowth */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Glow backdrop */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-jelly-purple/30 via-jelly-strawberry/20 to-jelly-aqua/30 blur-2xl opacity-70" />

              {/* Main Photo Card */}
              <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-2 shadow-jelly">
                <img
                  src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1000&q=80"
                  alt="Empowered woman software engineer in modern AI career re-entry ecosystem"
                  className="h-80 sm:h-96 w-full rounded-2xl object-cover object-top"
                />

                {/* Bottom Overlay Info Banner - Solid high-contrast text */}
                <div className="absolute bottom-4 inset-x-4 rounded-2xl bg-white/95 p-3.5 backdrop-blur-md border border-line shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-900">Priya Raman · Career Comeback Story</div>
                      <div className="text-[10px] font-semibold text-slate-600">3.5-Yr Break → Cloud Backend Returnship in 28 Days</div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                      ★ 96% Match
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge Top-Left: Career Break Reframed */}
              <div className="absolute -top-4 -left-4 hidden sm:flex items-center gap-2 rounded-2xl border border-line bg-white/95 px-3.5 py-2 shadow-card backdrop-blur-md z-10">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white font-black text-xs">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Career Break Normalizer</div>
                  <div className="text-[10px] font-bold text-emerald-700">Zero Penalty · Strength Framing</div>
                </div>
              </div>

              {/* Floating Badge Bottom-Right: AI Ecosystem Active */}
              <div className="absolute -bottom-4 -right-4 hidden sm:flex items-center gap-2 rounded-2xl border border-line bg-white/95 px-3.5 py-2 shadow-card backdrop-blur-md z-10">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-jelly-purple to-jelly-strawberry text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">AI Re-entry Ecosystem</div>
                  <div className="text-[10px] font-bold text-plum-600">6 Synchronized Coaching Agents</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Six Dedicated AI Agents Showcase */}
      <section id="agents" className="border-t border-line bg-surface/40 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eyebrow text-jelly-purple">Autonomous Multi-Agent Architecture</span>
            <h2 className="section-title mt-1 text-2xl sm:text-3xl">
              Six Specialized AI Agents Working For You
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Unlike generic chatbots, every ReStartHer agent owns a dedicated phase of your journey, sharing a unified memory context of your target role and skill gaps.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SIX_AGENTS.map((agent, idx) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.key}
                  className="card group relative flex flex-col justify-between overflow-hidden border border-line bg-surface p-6 shadow-jelly transition hover:shadow-lift hover:scale-[1.01]"
                  style={{ borderTop: `4px solid ${agent.color}` }}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-xs transition-transform group-hover:scale-110"
                        style={{ backgroundColor: agent.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-paper-deep px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink-soft">
                        Agent {idx + 1}
                      </span>
                    </div>

                    <h3 className="mt-4 text-base font-extrabold text-ink">{agent.name}</h3>
                    <div className="text-xs font-bold text-plum-600 dark:text-plum-400 mt-0.5">
                      {agent.role}
                    </div>
                    <p className="mt-2.5 text-xs text-ink-soft leading-relaxed">
                      {agent.description}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-line/60 pt-3 flex items-center justify-between text-xs font-bold">
                    <span style={{ color: agent.color }}>Interactive Chatbot Widget</span>
                    <ArrowRight className="h-3.5 w-3.5 text-ink-faint group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works in 3 Steps */}
      <section id="how" className="border-t border-line bg-paper px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eyebrow text-jelly-strawberry">The Comeback Method</span>
            <h2 className="section-title mt-1 text-2xl sm:text-3xl">
              How ReStartHer Relaunches Your Career
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              A transparent, self-adjusting feedback loop that moves from initial intake to verified returnship application.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="card p-6 bg-surface border border-line shadow-jelly">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-jelly-aqua/15 text-jelly-aqua font-black text-sm">
                01
              </div>
              <h3 className="mt-4 text-base font-extrabold text-ink">Intake & Diagnostic</h3>
              <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                Provide your prior role and break duration. The Skill Gap Explainer benchmarks your background against modern requirements and isolates focus skills.
              </p>
            </div>

            <div className="card p-6 bg-surface border border-line shadow-jelly">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-jelly-lime/15 text-jelly-lime font-black text-sm">
                02
              </div>
              <h3 className="mt-4 text-base font-extrabold text-ink">Adaptive Daily Learning</h3>
              <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                Follow dynamic day-by-day micro-tasks with worked code examples and verified video tutorials. Tutor Coach clears your doubts in plain language.
              </p>
            </div>

            <div className="card p-6 bg-surface border border-line shadow-jelly">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-jelly-blueberry/15 text-jelly-blueberry font-black text-sm">
                03
              </div>
              <h3 className="mt-4 text-base font-extrabold text-ink">Interview Prep & Job Scout</h3>
              <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                Practice realistic mock questions out loud with the Interview Coach. Scout returnships, review tailored resume drafts, and apply with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Women in Tech Empowerment & Solidarity Section */}
      <section className="border-t border-line bg-gradient-to-b from-paper to-surface px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Inspiring Image Showcasing Women Empowerment */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg">
                {/* Glow Backdrop */}
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-jelly-strawberry/25 via-jelly-purple/20 to-jelly-aqua/25 blur-2xl opacity-70" />

                {/* Main Empowerment Photo Card */}
                <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-2 shadow-jelly">
                  <img
                    src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80"
                    alt="Group of diverse women engineers and data scientists collaborating on modern tech architecture"
                    className="h-80 sm:h-96 w-full rounded-2xl object-cover object-center"
                  />

                  {/* High-Contrast Bottom Overlay Badge */}
                  <div className="absolute bottom-4 inset-x-4 rounded-2xl bg-white/95 p-3.5 backdrop-blur-md border border-line shadow-card">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-jelly-strawberry/15 text-jelly-strawberry shrink-0">
                        <Heart className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">Women Tech Leaders & Innovators</div>
                        <div className="text-[10px] font-semibold text-slate-700 leading-snug mt-0.5">
                          Bridging the gender gap in tech by converting caregiving sabbaticals into career leadership.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Empowerment Pillars & Statistics */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-jelly-strawberry/30 bg-jelly-strawberry/10 px-3.5 py-1.5 text-xs font-extrabold text-jelly-strawberry shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Empowering Women to Lead & Relaunch</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-ink leading-tight">
                Your Career Break Is Proof of{" "}
                <span className="bg-gradient-to-r from-jelly-strawberry via-jelly-purple to-jelly-blueberry bg-clip-text text-transparent">
                  Leadership, Not a Gap.
                </span>
              </h2>

              <p className="text-sm leading-relaxed text-ink-soft">
                Women bring indispensable architectural rigor, user empathy, and strategic focus to software engineering. Stepping away for childcare, family caregiving, health recovery, or relocation develops high-stakes prioritization, resilience, and calm leadership under pressure.
              </p>

              {/* 4 Empowerment Value Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                    <Award className="h-4 w-4 text-jelly-strawberry shrink-0" />
                    <span>Zero Apology Framing</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                    We train you to speak about your caregiving break with pride and dignity in technical interviews.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                    <Clock className="h-4 w-4 text-jelly-purple shrink-0" />
                    <span>Sized for Family Schedules</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                    Micro-learning modules sized into 30–45 minute daily blocks that fit around childcare routines.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                    <Users className="h-4 w-4 text-jelly-blueberry shrink-0" />
                    <span>Dedicated Returnships</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                    Direct access to corporate returnships from Amazon, Goldman Sachs, and Accellor built for returners.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Equal Pay Advocacy</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                    Protect your seniority and compensation—never accept entry-level junior demotions after a break.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Role Tracks */}
      <section id="tracks" className="border-t border-line bg-surface/60 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <span className="eyebrow text-jelly-blueberry">12 Comprehensive Tracks</span>
              <h2 className="section-title mt-1 text-2xl sm:text-3xl">
                Curated Career Comeback Tracks
              </h2>
            </div>
            <Link
              to={user ? "/app" : "/login"}
              className="text-xs font-bold text-plum-600 hover:underline"
            >
              Sign in to choose your track →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {TRACKS.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-line bg-surface p-4 shadow-xs hover:border-jelly-purple hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-black text-ink">{t.name}</span>
                    <span className="rounded-full bg-jelly-purple/10 px-2 py-0.5 text-[9px] font-extrabold text-jelly-purple">
                      {t.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-soft font-mono leading-relaxed">
                    {t.skills}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="border-t border-line bg-gradient-to-r from-jelly-purple/15 via-jelly-strawberry/10 to-jelly-blueberry/15 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-jelly-purple/20 px-3 py-1 text-xs font-bold text-jelly-purple">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ready To Take The First Step?</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-ink">
            Begin Your Career Comeback Today.
          </h2>

          <p className="text-sm text-ink-soft max-w-xl mx-auto">
            Sign in to start your personalized roadmap, chat with your 6 AI coaches, and explore vetted returnships.
          </p>

          <div className="pt-2">
            <Link
              to={user ? "/app" : "/login"}
              className="jelly-btn inline-flex items-center gap-2 bg-gradient-to-r from-jelly-purple via-jelly-strawberry to-jelly-blueberry px-8 py-3.5 text-sm font-extrabold text-white shadow-lift hover:opacity-95 transition"
            >
              <span>{user ? "Open Your Dashboard" : "Sign In to Your Career Comeback"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-surface px-4 py-8 text-center text-xs text-ink-faint sm:px-6">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-jelly-purple to-jelly-strawberry text-white text-xs font-bold">
              R
            </div>
            <span className="font-extrabold text-ink">ReStartHer</span>
            <span>· National Hackathon Prototype</span>
          </div>

          <div className="flex items-center gap-4 text-ink-soft">
            <Link to="/login" className="hover:underline font-bold">
              Sign In
            </Link>
            <span>·</span>
            <span>Human-in-the-Loop Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

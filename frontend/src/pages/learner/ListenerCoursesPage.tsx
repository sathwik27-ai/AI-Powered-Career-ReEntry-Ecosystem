import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle, Clock, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export function ListenerCoursesPage() {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id || 1;

  useEffect(() => {
    Promise.all([
      api.roadmap(userId).catch(() => null),
      api.listenerProfile().catch(() => null),
    ])
      .then(([rRes, pRes]) => {
        if (rRes?.roadmap) setRoadmap(rRes.roadmap);
        if (pRes) setProfile(pRes);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const targetRole = profile?.profile?.target_role || "Software Developer";
  const focusSkills: string[] = roadmap?.focus_skills || ["Core Fundamentals", "Frameworks", "Testing", "Deployment"];
  const tasks: any[] = roadmap?.tasks || [];

  // Dynamically compute modules from actual roadmap tasks and skills
  const modules = focusSkills.map((skill, idx) => {
    const skillTasks = tasks.filter((t) => t.skill.toLowerCase() === skill.toLowerCase());
    const total = skillTasks.length;
    const completed = skillTasks.filter((t) => t.completed).length;

    let daysLabel = `Module ${idx + 1}`;
    if (skillTasks.length > 0) {
      const days = skillTasks.map((t) => t.day);
      const minDay = Math.min(...days);
      const maxDay = Math.max(...days);
      daysLabel = minDay === maxDay ? `Day ${minDay}` : `Days ${minDay}–${maxDay}`;
    }

    const status =
      total > 0 && completed === total
        ? "completed"
        : completed > 0
        ? "in_progress"
        : "upcoming";

    // Build dynamic summary from actual task titles
    const sampleTopics = skillTasks.slice(0, 3).map((t) => t.title).join("; ");
    const summary =
      sampleTopics.length > 0
        ? `Hands-on practice covering: ${sampleTopics}.`
        : `Structured exercises, guided code examples, and mastery quizzes tailored for ${skill}.`;

    return {
      title: `${skill} Professional Comeback Module`,
      skill,
      days: daysLabel,
      summary,
      status,
      completed,
      total,
    };
  });

  const allVideos = [
    {
      title: "React JS Full Course 2024",
      channel: "freeCodeCamp",
      skill: "React",
      type: "YouTube Video",
      duration: "12 hours",
      url: "https://www.youtube.com/watch?v=bMknfKXIFA8",
      color: "#2FC9E3",
      desc: "Hooks, useState, useEffect, context API, component architecture, and routing.",
    },
    {
      title: "JavaScript Programming - Full Course",
      channel: "freeCodeCamp",
      skill: "JavaScript",
      type: "YouTube Video",
      duration: "7.5 hours",
      url: "https://www.youtube.com/watch?v=jS4aFq5-91M",
      color: "#FF9A3D",
      desc: "Modern ES6+ syntax, asynchronous JS, Promises, Fetch API, and DOM manipulation.",
    },
    {
      title: "TypeScript Course for Beginners",
      channel: "freeCodeCamp",
      skill: "TypeScript",
      type: "YouTube Video",
      duration: "2 hours",
      url: "https://www.youtube.com/watch?v=30LWjhZzg50",
      color: "#4D8DFF",
      desc: "Type annotations, interfaces, generics, type narrowing, and typing React components.",
    },
    {
      title: "Python for Beginners - Full Course",
      channel: "freeCodeCamp",
      skill: "Python",
      type: "YouTube Video",
      duration: "4.5 hours",
      url: "https://www.youtube.com/watch?v=eWRfhZUzrAc",
      color: "#43D98C",
      desc: "Python syntax, data structures, list comprehensions, modules, file handling, and pandas basics.",
    },
    {
      title: "SQL Tutorial - Full Database Course",
      channel: "freeCodeCamp",
      skill: "SQL",
      type: "YouTube Video",
      duration: "4 hours",
      url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
      color: "#2FC9E3",
      desc: "Relational database schema design, complex joins, subqueries, grouping, and indexing.",
    },
    {
      title: "Power BI Full Course",
      channel: "freeCodeCamp",
      skill: "Power BI",
      type: "YouTube Video",
      duration: "3.5 hours",
      url: "https://www.youtube.com/watch?v=3u7UDzEJu-8",
      color: "#FF9A3D",
      desc: "Data modeling, DAX formulas, interactive KPI visualizations, and business reporting dashboards.",
    },
    {
      title: "Selenium with Java Tutorial for Beginners",
      channel: "edureka!",
      skill: "Selenium",
      type: "YouTube Video",
      duration: "2.5 hours",
      url: "https://www.youtube.com/watch?v=mXZnnFv3n5I",
      color: "#FF5C8A",
      desc: "WebDriver setup, web element locators, TestNG assertions, and Page Object Model patterns.",
    },
    {
      title: "Manual Testing Full Course",
      channel: "Software Testing Material",
      skill: "Manual Testing",
      type: "YouTube Video",
      duration: "3 hours",
      url: "https://www.youtube.com/watch?v=jW9hQ1U1b6Y",
      color: "#8E5CFF",
      desc: "STLC, test case authoring, bug life cycle, boundary value analysis, and equivalence partitioning.",
    },
    {
      title: "Spring Boot 3 Full Course",
      channel: "freeCodeCamp",
      skill: "Spring Boot",
      type: "YouTube Video",
      duration: "4.5 hours",
      url: "https://www.youtube.com/watch?v=9SGDpanrc8U",
      color: "#FF5C8A",
      desc: "Complete guide covering REST APIs, Spring Data JPA, Spring Security, and Maven project setup.",
    },
    {
      title: "Java Programming Full Course",
      channel: "freeCodeCamp",
      skill: "Java",
      type: "YouTube Video",
      duration: "9.5 hours",
      url: "https://www.youtube.com/watch?v=A74TOX803D0",
      color: "#43D98C",
      desc: "Modern Java fundamentals: OOP, Streams API, Records, lambdas, generics, and concurrency.",
    },
    {
      title: "Docker Tutorial for Beginners",
      channel: "TechWorld with Nana",
      skill: "Docker",
      type: "YouTube Video",
      duration: "2.5 hours",
      url: "https://www.youtube.com/watch?v=3c-iBn73dDE",
      color: "#4D8DFF",
      desc: "Containers, Dockerfiles, Docker Compose, volume mounts, and network isolation explained clearly.",
    },
    {
      title: "REST API Concepts & Design",
      channel: "Traversy Media",
      skill: "REST APIs",
      type: "YouTube Video",
      duration: "45 mins",
      url: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
      color: "#8E5CFF",
      desc: "HTTP verbs, status codes, pagination, resource naming, and OpenAPI 3.0 specification.",
    },
  ];

  // Prioritize videos matching user's roadmap focus skills
  const sortedVideos = [...allVideos].sort((a, b) => {
    const aMatch = focusSkills.some((s) => s.toLowerCase() === a.skill.toLowerCase());
    const bMatch = focusSkills.some((s) => s.toLowerCase() === b.skill.toLowerCase());
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow text-jelly-lime">Curriculum & Modules</span>
          <h1 className="page-title mt-1">My Comeback Courses</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Structured modules dynamically generated for <strong className="text-ink">{targetRole}</strong>.
          </p>
        </div>

        <Link
          to="/app/intake"
          className="jelly-btn inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-ink hover:border-jelly-lime"
        >
          <Sparkles className="h-3.5 w-3.5 text-jelly-lime" />
          <span>Switch Target Role / Refine Track</span>
        </Link>
      </div>

      {modules.length === 0 ? (
        <div className="card p-12 text-center bg-surface border border-line shadow-jelly">
          <BookOpen className="mx-auto h-12 w-12 text-ink-faint" />
          <h3 className="mt-3 text-base font-extrabold text-ink">No Modules Generated Yet</h3>
          <p className="mt-1 text-xs text-ink-soft max-w-md mx-auto">
            Please complete your profile intake with your skills and target role so the AI agents can generate your customized modules.
          </p>
          <Link
            to="/app/intake"
            className="jelly-btn mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-jelly-lime to-jelly-aqua px-5 py-2.5 text-xs font-bold text-white shadow-lift"
          >
            <span>Complete Profile Intake</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {modules.map((mod) => (
            <div
              key={mod.title}
              className="card p-6 bg-surface border border-line shadow-jelly flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-paper-deep px-2.5 py-1 text-[11px] font-bold text-ink">
                    {mod.days}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      mod.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : mod.status === "in_progress"
                        ? "bg-jelly-purple/15 text-jelly-purple"
                        : "bg-paper-deep text-ink-faint"
                    }`}
                  >
                    {mod.status === "completed"
                      ? "Completed"
                      : mod.status === "in_progress"
                      ? "In Progress"
                      : "Upcoming"}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-extrabold text-ink">{mod.title}</h3>
                <p className="mt-1 text-xs font-bold text-plum-600">Focus Skill: {mod.skill}</p>
                <p className="mt-2 text-xs text-ink-soft leading-relaxed">{mod.summary}</p>
              </div>

              <div className="mt-6 border-t border-line pt-4 flex items-center justify-between">
                <span className="text-xs text-ink-faint">
                  {mod.total > 0 ? `${mod.completed} of ${mod.total} tasks completed` : "Paced for daily mastery"}
                </span>
                <Link
                  to="/app/journey"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-plum-600 hover:text-plum-800"
                >
                  <span>View Daily Tasks</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Curated Video Masterclasses & Official Documentation */}
      <div className="mt-10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="eyebrow text-jelly-strawberry">Video Tutorials & Official Guides</span>
            <h2 className="text-xl font-extrabold text-ink mt-0.5">Curated Learning Video Masterclasses</h2>
            <p className="text-xs text-ink-soft">
              Verified free tutorials and official documentation matched to your {targetRole} track.
            </p>
          </div>
          <Link
            to="/app/tutor"
            className="jelly-btn inline-flex items-center gap-2 bg-paper-deep px-4 py-2 text-xs font-bold text-ink hover:border-jelly-purple"
          >
            <Sparkles className="h-3.5 w-3.5 text-jelly-lime" />
            <span>Ask Tutor Coach AI</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedVideos.map((res) => {
            const isMatch = focusSkills.some((s) => s.toLowerCase() === res.skill.toLowerCase());
            return (
              <div
                key={res.title}
                className={`card p-5 bg-surface border shadow-jelly flex flex-col justify-between transition-all ${
                  isMatch ? "border-plum-500/40 shadow-card" : "border-line"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: res.color }}
                    >
                      {res.skill}
                    </span>
                    {isMatch && (
                      <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                        ★ On Your Roadmap
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-sm font-extrabold text-ink leading-snug">{res.title}</h3>
                  <p className="mt-1 text-[11px] font-semibold text-plum-600">{res.channel}</p>
                  <p className="mt-2 text-xs text-ink-soft leading-relaxed">{res.desc}</p>
                </div>

                <div className="mt-5 border-t border-line pt-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink-faint">{res.duration}</span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-paper-deep px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-jelly-purple hover:text-white"
                  >
                    <span>Watch Tutorial</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

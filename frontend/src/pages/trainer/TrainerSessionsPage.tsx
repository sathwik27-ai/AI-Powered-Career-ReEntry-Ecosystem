import { useState } from "react";
import { Calendar, Clock, Video, CheckCircle, User, Sparkles, ExternalLink } from "lucide-react";
import { VideoCallModal, SessionData } from "../../components/trainer/VideoCallModal";

export function TrainerSessionsPage() {
  const [activeCallSession, setActiveCallSession] = useState<SessionData | null>(null);

  const sessions: SessionData[] = [
    {
      id: 1,
      learner: "Priya Raman",
      targetRole: "Backend Developer",
      topic: "1-on-1 Code Review: Spring Boot REST Architecture",
      time: "Tomorrow, 4:00 PM IST",
      status: "confirmed",
      link: "https://meet.google.com/new",
    },
    {
      id: 2,
      learner: "Meena Swaminathan",
      targetRole: "Full Stack Developer",
      topic: "Career Break Narrative & Interview Dry Run",
      time: "Nov 18, 5:30 PM IST",
      status: "scheduled",
      link: "https://meet.google.com/new",
    },
    {
      id: 3,
      learner: "Anjali Verma",
      targetRole: "DevOps Engineer",
      topic: "Microservices & Docker Containerization Q&A",
      time: "Nov 20, 3:00 PM IST",
      status: "scheduled",
      link: "https://meet.google.com/new",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow text-jelly-lime">Mentorship Schedule</span>
          <h1 className="page-title mt-1">Upcoming Mentorship Sessions</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Scheduled 1-on-1 check-ins, technical mock reviews, and comeback support sessions.
          </p>
        </div>

        <button
          onClick={() => setActiveCallSession(sessions[0])}
          className="jelly-btn inline-flex items-center gap-2 bg-gradient-to-r from-jelly-lime to-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lift"
        >
          <Video className="h-4 w-4" />
          <span>Launch Next Session Room</span>
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="card flex flex-wrap items-center justify-between gap-4 p-5 bg-surface border border-line shadow-jelly"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-jelly-lime/15 text-emerald-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-plum-600">{s.learner}</span>
                  <span className="rounded-md bg-paper-deep px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                    {s.targetRole}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-ink mt-0.5">{s.topic}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{s.time}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveCallSession(s)}
                className="jelly-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-jelly-lime to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
              >
                <Video className="h-4 w-4" />
                <span>Join Video Call</span>
              </button>

              <a
                href={`https://meet.jit.si/ReStartHer-${s.id}-${encodeURIComponent(s.learner.replace(/\s+/g, ""))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-line bg-surface p-2 text-ink-soft hover:bg-paper-deep hover:text-ink transition"
                title="Open in external browser WebRTC tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive In-App Video Call Room Modal */}
      {activeCallSession && (
        <VideoCallModal
          session={activeCallSession}
          onClose={() => setActiveCallSession(null)}
        />
      )}
    </div>
  );
}

import { Calendar, Clock, Video, CheckCircle, User } from "lucide-react";

export function TrainerSessionsPage() {
  const sessions = [
    {
      id: 1,
      learner: "Priya Raman",
      topic: "1-on-1 Code Review: Spring Boot REST Architecture",
      time: "Tomorrow, 4:00 PM IST",
      status: "confirmed",
      link: "https://meet.google.com/demo-restarther-session",
    },
    {
      id: 2,
      learner: "Meena Swaminathan",
      topic: "Career Break Narrative & Interview Dry Run",
      time: "Nov 18, 5:30 PM IST",
      status: "scheduled",
      link: "https://meet.google.com/demo-restarther-session",
    },
    {
      id: 3,
      learner: "Anjali Verma",
      topic: "Microservices & Docker Containerization Q&A",
      time: "Nov 20, 3:00 PM IST",
      status: "scheduled",
      link: "https://meet.google.com/demo-restarther-session",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow text-jelly-lime">Mentorship Schedule</span>
        <h1 className="page-title mt-1">Upcoming Mentorship Sessions</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Scheduled 1-on-1 check-ins, technical mock reviews, and comeback support sessions.
        </p>
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
                <span className="text-xs font-bold text-plum-600">{s.learner}</span>
                <h3 className="text-base font-extrabold text-ink">{s.topic}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{s.time}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                className="jelly-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-jelly-lime to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
              >
                <Video className="h-4 w-4" />
                Join Video Call
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

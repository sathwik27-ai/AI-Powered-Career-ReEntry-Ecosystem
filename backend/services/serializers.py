"""Convert ORM objects into JSON-friendly dictionaries for the API."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from models import (
    AgentLog, Application, CareerHistoryEntry, CoverLetter, InterviewFeedback, InterviewSession,
    LearningRoadmap, LearningTask, Opportunity, Profile, QuizResult, ResumeDraft, SkillAssessment,
)


def iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


def profile_dict(p: Profile | None, skills: list[str], history: list[CareerHistoryEntry]) -> dict[str, Any] | None:
    if p is None:
        return None
    return {
        "full_name": p.full_name, "email": p.email, "phone": p.phone, "headline": p.headline,
        "previous_role": p.previous_role, "domain": p.domain, "education": p.education or [],
        "education_field": p.education_field, "experience_years": p.experience_years,
        "career_break_years": p.career_break_years, "career_break_reason": p.career_break_reason,
        "target_role": p.target_role, "skills": skills, "soft_skills": p.soft_skills or [],
        "transferable_skills": p.transferable_skills or [], "certifications": p.certifications or [],
        "projects": p.projects or [], "work_preferences": p.work_preferences or [],
        "employment_types": p.employment_types or [], "location_preference": p.location_preference,
        "hours_per_day": p.hours_per_day, "plan_days": p.plan_days,
        "learning_preferences": p.learning_preferences or [], "missing_info": p.missing_info or [],
        "clarification_questions": p.clarification_questions or [], "skill_evidence": p.skill_evidence or {},
        "source": p.source, "extraction_mode": p.extraction_mode, "updated_at": iso(p.updated_at),
        "employment": [history_dict(h) for h in history],
    }


def history_dict(h: CareerHistoryEntry) -> dict[str, Any]:
    return {"id": h.id, "title": h.title, "company": h.company, "start": h.start, "end": h.end, "years": h.years, "highlights": h.highlights or []}


def assessment_dict(a: SkillAssessment | None) -> dict[str, Any] | None:
    if a is None:
        return None
    return {
        "id": a.id, "version": a.version, "target_role": a.target_role, "readiness": a.readiness,
        "items": a.items, "summary": a.summary, "trigger": a.trigger, "created_at": iso(a.created_at),
    }


def task_dict(t: LearningTask) -> dict[str, Any]:
    return {
        "id": t.id, "day": t.day, "order": t.order, "skill": t.skill, "kind": t.kind, "title": t.title,
        "description": t.description, "minutes": t.minutes, "resource_title": t.resource_title,
        "resource_url": t.resource_url, "completed": t.completed, "completed_at": iso(t.completed_at),
        "added_by_adaptation": t.added_by_adaptation, "adaptation_note": t.adaptation_note,
    }


def roadmap_dict(r: LearningRoadmap | None) -> dict[str, Any] | None:
    if r is None:
        return None
    tasks = sorted(r.tasks, key=lambda t: (t.day, t.order))
    done = sum(1 for t in tasks if t.completed)
    pending_days = [t.day for t in tasks if not t.completed]
    return {
        "id": r.id, "version": r.version, "planned_days": r.planned_days, "total_days": r.total_days,
        "hours_per_day": r.hours_per_day, "focus_skills": r.focus_skills, "difficulty": r.difficulty,
        "changes": r.changes, "mini_project": r.mini_project, "created_at": iso(r.created_at),
        "updated_at": iso(r.updated_at), "tasks": [task_dict(t) for t in tasks],
        "progress": {"completed": done, "total": len(tasks), "percent": round(100 * done / len(tasks), 1) if tasks else 0},
        "current_day": min(pending_days) if pending_days else None,
    }


def quiz_dict(q: QuizResult) -> dict[str, Any]:
    return {"id": q.id, "skill": q.skill, "correct": q.correct, "total": q.total, "percent": q.percent, "answers": q.answers, "created_at": iso(q.created_at)}


def feedback_dict(f: InterviewFeedback) -> dict[str, Any]:
    return {
        "id": f.id, "question_id": f.question_id, "question": f.question, "question_type": f.question_type,
        "skill": f.skill, "answer": f.answer, "scores": f.scores, "overall": f.overall,
        "strengths": f.strengths, "improvements": f.improvements, "missing_points": f.missing_points,
        "improved_answer": f.improved_answer, "mode": f.mode, "created_at": iso(f.created_at),
    }


def session_dict(s: InterviewSession) -> dict[str, Any]:
    answered = {f.question_id for f in s.feedback}
    return {
        "id": s.id, "interview_type": s.interview_type, "status": s.status,
        "questions": [dict(q, answered=q["id"] in answered) for q in s.questions],
        "overall_score": s.overall_score, "weak_topics": s.weak_topics,
        "created_at": iso(s.created_at), "completed_at": iso(s.completed_at),
        "feedback": [feedback_dict(f) for f in s.feedback],
    }


def opportunity_dict(o: Opportunity) -> dict[str, Any]:
    return {
        "id": o.id, "slug": o.slug, "title": o.title, "employer_label": o.employer_label, "location": o.location,
        "arrangement": o.arrangement, "employment_type": o.employment_type, "flexible_hours": o.flexible_hours,
        "returnship_friendly": o.returnship_friendly, "role_family": o.role_family,
        "required_skills": o.required_skills, "nice_to_have": o.nice_to_have, "min_experience": o.min_experience,
        "description": o.description, "source": o.source, "source_url": o.source_url, "is_demo": o.is_demo,
    }


def application_dict(a: Application, resume: ResumeDraft | None, cover: CoverLetter | None) -> dict[str, Any]:
    return {
        "id": a.id, "status": a.status, "notes": a.notes, "approved": a.approved_at is not None,
        "approved_at": iso(a.approved_at), "history": a.history, "created_at": iso(a.created_at),
        "updated_at": iso(a.updated_at), "opportunity": opportunity_dict(a.opportunity),
        "resume": None if resume is None else {
            "id": resume.id, "content": resume.content, "tailoring_notes": resume.tailoring_notes,
            "edited_by_user": resume.edited_by_user, "mode": resume.mode, "updated_at": iso(resume.updated_at),
        },
        "cover_letter": None if cover is None else {
            "id": cover.id, "content": cover.content, "edited_by_user": cover.edited_by_user,
            "mode": cover.mode, "updated_at": iso(cover.updated_at),
        },
    }


def log_dict(l: AgentLog) -> dict[str, Any]:
    return {
        "id": l.id, "run_id": l.run_id, "workflow": l.workflow, "step": l.step, "agent": l.agent,
        "action": l.action, "input": l.input_summary, "output": l.output_summary, "decision": l.decision,
        "next_agent": l.next_agent, "roadmap_changed": l.roadmap_changed, "status": l.status,
        "mode": l.mode, "duration_ms": l.duration_ms, "created_at": iso(l.created_at),
    }

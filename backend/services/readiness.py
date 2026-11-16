"""Career readiness indicator.

A supportive progress indicator built from four transparent components – it is not a
measure of anyone's worth and not a prediction or guarantee of employment.

  profile completeness 15%  – share of key profile fields filled in
  skill readiness      35%  – Skill Gap Agent readiness (tier-weighted, see methodology)
  learning progress    25%  – completed / total roadmap tasks
  interview readiness  25%  – average score of the last (up to) 8 mock-interview answers
Components that have no data yet are excluded and the weights re-normalised.
"""
from __future__ import annotations

from typing import Any

PROFILE_FIELDS = {
    "full_name": "Name", "previous_role": "Previous role", "experience_years": "Experience",
    "target_role": "Target role", "skills": "Skills", "work_preferences": "Work preferences",
    "education": "Education", "hours_per_day": "Learning hours",
}
WEIGHTS = {"profile": 15, "skills": 35, "learning": 25, "interview": 25}
DISCLAIMER = "Supportive readiness indicator – not a measure of your worth or a guarantee of employment."


def profile_completeness(profile: dict[str, Any] | None) -> tuple[float, list[str]]:
    if not profile:
        return 0.0, list(PROFILE_FIELDS.values())
    missing = [label for key, label in PROFILE_FIELDS.items() if profile.get(key) in (None, "", [], 0)]
    pct = round(100 * (len(PROFILE_FIELDS) - len(missing)) / len(PROFILE_FIELDS), 1)
    return pct, missing


def compute_readiness(profile: dict | None, skill_readiness: float | None, tasks_done: int, tasks_total: int,
                      interview_scores: list[float]) -> dict[str, Any]:
    prof, missing = profile_completeness(profile)
    comps: dict[str, float | None] = {
        "profile": prof,
        "skills": skill_readiness,
        "learning": round(100 * tasks_done / tasks_total, 1) if tasks_total else None,
        "interview": round(sum(interview_scores[-8:]) / len(interview_scores[-8:]), 1) if interview_scores else None,
    }
    available = {k: v for k, v in comps.items() if v is not None}
    total_w = sum(WEIGHTS[k] for k in available)
    overall = round(sum(v * WEIGHTS[k] for k, v in available.items()) / total_w, 1) if total_w else 0.0
    return {
        "overall": overall, "overall_score": overall, "components": comps, "weights": WEIGHTS,
        "missing_profile_fields": missing, "disclaimer": DISCLAIMER,
    }


def compute_user_readiness(db: Any, user_id: int) -> dict[str, Any]:
    """Helper to compute readiness directly from database records for a given user."""
    from sqlalchemy import select, func
    from models import Profile, SkillAssessment, LearningRoadmap, LearningTask, InterviewFeedback

    prof = db.scalar(select(Profile).where(Profile.user_id == user_id))
    prof_dict = None
    if prof:
        prof_dict = {
            "full_name": prof.full_name,
            "previous_role": prof.previous_role,
            "experience_years": prof.experience_years,
            "target_role": prof.target_role,
            "skills": prof.soft_skills + prof.transferable_skills,
            "work_preferences": prof.work_preferences,
            "education": prof.education,
            "hours_per_day": prof.hours_per_day,
        }

    skill_assessment = db.scalar(
        select(SkillAssessment)
        .where(SkillAssessment.user_id == user_id)
        .order_by(SkillAssessment.version.desc())
    )
    skill_score = skill_assessment.readiness if skill_assessment else None

    roadmap = db.scalar(
        select(LearningRoadmap)
        .where(LearningRoadmap.user_id == user_id, LearningRoadmap.is_active.is_(True))
        .order_by(LearningRoadmap.version.desc())
    )
    done_count = 0
    total_count = 0
    if roadmap:
        total_count = db.scalar(
            select(func.count(LearningTask.id)).where(LearningTask.roadmap_id == roadmap.id)
        ) or 0
        done_count = db.scalar(
            select(func.count(LearningTask.id)).where(
                LearningTask.roadmap_id == roadmap.id, LearningTask.completed.is_(True)
            )
        ) or 0

    feedbacks = db.scalars(
        select(InterviewFeedback.overall)
        .join(InterviewFeedback.session)
        .where(InterviewFeedback.session.has(user_id=user_id))
    ).all()

    return compute_readiness(prof_dict, skill_score, done_count, total_count, list(feedbacks))


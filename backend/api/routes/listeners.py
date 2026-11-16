"""Listener (learner) endpoints: profile, progress, and personalized dashboard data."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from api.dependencies import db_session, require_listener
from models import (
    Application,
    AssignedTask,
    InterviewFeedback,
    InterviewSession,
    LearningRoadmap,
    LearningTask,
    Notification,
    Opportunity,
    Profile,
    QuizResult,
    SavedOpportunity,
    SkillAssessment,
    TrainerAssignment,
    User,
    UserSkill,
    utcnow,
)
from orchestrator.career_orchestrator import CareerOrchestrator
from schemas import ProfileInput
from services.readiness import compute_user_readiness

router = APIRouter(prefix="/listeners", tags=["listeners"])


@router.get("/me")
def get_listener_profile(
    current_user: User = Depends(require_listener),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Get the current listener's profile, readiness score, and mentor info."""
    profile = db.scalar(select(Profile).where(Profile.user_id == current_user.id))
    trainer = None
    if current_user.assigned_trainer_id:
        trainer_user = db.scalar(select(User).where(User.id == current_user.assigned_trainer_id))
        if trainer_user:
            trainer = {
                "id": trainer_user.id,
                "name": trainer_user.name,
                "email": trainer_user.email,
            }

    # Calculate current readiness score
    readiness_data = compute_user_readiness(db, current_user.id)

    # Active roadmap
    roadmap = db.scalar(
        select(LearningRoadmap)
        .where(LearningRoadmap.user_id == current_user.id, LearningRoadmap.is_active.is_(True))
        .order_by(LearningRoadmap.version.desc())
    )

    roadmap_summary = None
    if roadmap:
        total_tasks = db.scalar(
            select(func.count(LearningTask.id)).where(LearningTask.roadmap_id == roadmap.id)
        ) or 0
        completed_tasks = db.scalar(
            select(func.count(LearningTask.id)).where(
                LearningTask.roadmap_id == roadmap.id,
                LearningTask.completed.is_(True),
            )
        ) or 0
        roadmap_summary = {
            "id": roadmap.id,
            "version": roadmap.version,
            "total_days": roadmap.total_days,
            "focus_skills": roadmap.focus_skills,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "progress_percent": round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0,
        }

    # Mentor assigned tasks
    assigned_tasks = [
        {
            "id": at.id,
            "trainer_id": at.trainer_id,
            "trainer_name": db.scalar(select(User.name).where(User.id == at.trainer_id)) or "Mentor",
            "title": at.title,
            "description": at.description,
            "skill": at.skill,
            "due_date": at.due_date,
            "status": at.status,
            "feedback": at.feedback,
            "completed_at": at.completed_at.isoformat() if at.completed_at else None,
            "created_at": at.created_at.isoformat() if at.created_at else None,
        }
        for at in db.scalars(
            select(AssignedTask)
            .where(AssignedTask.listener_id == current_user.id)
            .order_by(AssignedTask.created_at.desc())
        ).all()
    ]

    # Query technical and transferable skills
    user_skills = [
        s.name for s in db.scalars(select(UserSkill).where(UserSkill.user_id == current_user.id)).all()
    ]
    if not user_skills and profile:
        user_skills = profile.soft_skills + profile.transferable_skills

    # Query latest skill assessment gaps
    assessment = db.scalar(
        select(SkillAssessment)
        .where(SkillAssessment.user_id == current_user.id)
        .order_by(SkillAssessment.version.desc())
    )
    gaps = []
    if assessment and assessment.items:
        gaps = [
            {
                "skill": it["skill"],
                "priority": it.get("priority", "medium"),
                "gap": it.get("gap", 0),
                "why": it.get("why", ""),
                "target": it.get("target", 80),
                "current": it.get("current", 0),
            }
            for it in assessment.items
            if it.get("priority") in ("high", "medium")
        ]

    # Dynamic Agent Training Summary
    target_role_str = profile.target_role if profile and profile.target_role else "Software Developer"
    break_years = profile.career_break_years if profile and profile.career_break_years is not None else 0
    break_reason = f" ({profile.career_break_reason})" if profile and profile.career_break_reason else ""
    skills_joined = ", ".join(user_skills[:6]) if user_skills else "General technical foundations"
    gaps_joined = ", ".join([g["skill"] for g in gaps[:5]]) if gaps else "Core curriculum modules"

    agent_summary = (
        f"Learner: {current_user.name} | Target Role: {target_role_str} | "
        f"Career Break: {break_years} yrs{break_reason} | "
        f"Core Skills: {skills_joined} | Priority Gaps: {gaps_joined}"
    )

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "is_woman_verified": getattr(current_user, "is_woman_verified", True),
        },
        "profile": {
            "full_name": profile.full_name if profile else current_user.name,
            "headline": profile.headline if profile else None,
            "target_role": target_role_str,
            "previous_role": profile.previous_role if profile else None,
            "experience_years": profile.experience_years if profile else None,
            "career_break_years": profile.career_break_years if profile else None,
            "career_break_reason": profile.career_break_reason if profile else None,
            "skills": user_skills,
            "education": profile.education if profile else [],
            "work_preferences": profile.work_preferences if profile else [],
            "employment_types": profile.employment_types if profile else [],
            "location_preference": profile.location_preference if profile else None,
            "hours_per_day": profile.hours_per_day if profile else 2.0,
            "plan_days": profile.plan_days if profile else 30,
        } if profile else None,
        "skills": user_skills,
        "gaps": gaps,
        "agent_summary": agent_summary,
        "readiness": readiness_data,
        "roadmap": roadmap_summary,
        "trainer": trainer,
        "assigned_tasks": assigned_tasks,
    }


@router.get("/tasks")
def get_listener_assigned_tasks(
    current_user: User = Depends(require_listener),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """List all mentor-assigned tasks for the current learner."""
    tasks = db.scalars(
        select(AssignedTask)
        .where(AssignedTask.listener_id == current_user.id)
        .order_by(AssignedTask.created_at.desc())
    ).all()

    items = []
    for at in tasks:
        trainer_name = db.scalar(select(User.name).where(User.id == at.trainer_id)) or "Mentor"
        items.append({
            "id": at.id,
            "trainer_id": at.trainer_id,
            "trainer_name": trainer_name,
            "title": at.title,
            "description": at.description,
            "skill": at.skill,
            "due_date": at.due_date,
            "status": at.status,
            "feedback": at.feedback,
            "completed_at": at.completed_at.isoformat() if at.completed_at else None,
            "created_at": at.created_at.isoformat() if at.created_at else None,
        })

    return {"tasks": items, "count": len(items)}


class TaskCompletionRequest(BaseModel):
    proof_notes: str = Field(min_length=2, max_length=1000)
    proof_url: str | None = Field(default=None, max_length=500)


@router.post("/tasks/{task_id}/complete")
def complete_listener_task_with_proof(
    task_id: int,
    body: TaskCompletionRequest,
    current_user: User = Depends(require_listener),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Submit proof of completion for a mentor-assigned task and mark complete."""
    task = db.scalar(
        select(AssignedTask).where(
            AssignedTask.id == task_id,
            AssignedTask.listener_id == current_user.id,
        )
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned task not found.")

    task.status = "completed"
    task.completed_at = utcnow()

    proof_text = body.proof_notes.strip()
    if body.proof_url and body.proof_url.strip():
        proof_text += f" (Link: {body.proof_url.strip()})"
    task.feedback = proof_text

    # Notify trainer if assigned
    if task.trainer_id:
        notif = Notification(
            user_id=task.trainer_id,
            title="Task Completed with Proof",
            message=f"{current_user.name} submitted proof and completed '{task.title}': {proof_text[:120]}",
            type="task",
            link=f"/trainer/listeners/{current_user.id}",
        )
        db.add(notif)

    db.commit()
    db.refresh(task)

    return {
        "status": "ok",
        "message": "Task marked as completed with submitted proof.",
        "task": {
            "id": task.id,
            "status": task.status,
            "feedback": task.feedback,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        },
    }


@router.put("/tasks/{task_id}/toggle")
def toggle_listener_task_status(
    task_id: int,
    current_user: User = Depends(require_listener),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Toggle a mentor-assigned task between pending and completed."""
    task = db.scalar(
        select(AssignedTask).where(
            AssignedTask.id == task_id,
            AssignedTask.listener_id == current_user.id,
        )
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned task not found.")

    if task.status == "completed":
        task.status = "pending"
        task.completed_at = None
    else:
        task.status = "completed"
        task.completed_at = utcnow()

    db.commit()
    db.refresh(task)

    return {
        "status": "ok",
        "task": {
            "id": task.id,
            "status": task.status,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        },
    }


@router.put("/me")
def update_listener_profile(
    body: ProfileInput,
    current_user: User = Depends(require_listener),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Update listener profile preferences and target role."""
    profile = db.scalar(select(Profile).where(Profile.user_id == current_user.id))
    if not profile:
        profile = Profile(user_id=current_user.id, full_name=current_user.name)
        db.add(profile)

    payload = body.manual()
    for k, v in payload.items():
        if hasattr(profile, k):
            setattr(profile, k, v)

    db.commit()
    db.refresh(profile)

    # Automatically re-train all 6 agents and regenerate dynamic roadmap & skill gaps
    workflow_summary = None
    if payload:
        try:
            orc = CareerOrchestrator(db, current_user.id)
            trigger_type = "onboarding" if not profile.target_role else "profile_edit"
            workflow_summary = orc.run_comeback_workflow(manual=payload, trigger=trigger_type)
        except Exception:
            pass

    return {
        "status": "ok",
        "message": "Profile updated and all AI agents trained on your background.",
        "target_role": profile.target_role,
        "workflow": workflow_summary,
    }


@router.get("/progress")
def get_listener_progress(
    current_user: User = Depends(require_listener),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Comprehensive progress metrics for analytics and charts."""
    # Quizzes
    quizzes = db.scalars(
        select(QuizResult).where(QuizResult.user_id == current_user.id).order_by(QuizResult.created_at.desc())
    ).all()

    # Interviews
    interviews = db.scalars(
        select(InterviewSession).where(InterviewSession.user_id == current_user.id).order_by(InterviewSession.created_at.desc())
    ).all()

    # Applications
    applications = db.scalars(
        select(Application).where(Application.user_id == current_user.id)
    ).all()

    # Saved Opportunities
    saved_count = db.scalar(
        select(func.count(SavedOpportunity.id)).where(SavedOpportunity.user_id == current_user.id)
    ) or 0

    # Tasks
    roadmap = db.scalar(
        select(LearningRoadmap)
        .where(LearningRoadmap.user_id == current_user.id, LearningRoadmap.is_active.is_(True))
        .order_by(LearningRoadmap.version.desc())
    )

    tasks_by_day: dict[int, list[dict[str, Any]]] = {}
    completed_count = 0
    total_count = 0
    if roadmap:
        tasks = db.scalars(
            select(LearningTask)
            .where(LearningTask.roadmap_id == roadmap.id)
            .order_by(LearningTask.day, LearningTask.order)
        ).all()
        total_count = len(tasks)
        for t in tasks:
            if t.completed:
                completed_count += 1
            tasks_by_day.setdefault(t.day, []).append({
                "id": t.id,
                "title": t.title,
                "skill": t.skill,
                "kind": t.kind,
                "completed": t.completed,
                "minutes": t.minutes,
            })

    readiness = compute_user_readiness(db, current_user.id)

    # Mentor assigned tasks metrics
    assigned_total = db.scalar(
        select(func.count(AssignedTask.id)).where(AssignedTask.listener_id == current_user.id)
    ) or 0
    assigned_completed = db.scalar(
        select(func.count(AssignedTask.id)).where(
            AssignedTask.listener_id == current_user.id,
            AssignedTask.status == "completed",
        )
    ) or 0

    return {
        "readiness": readiness,
        "assigned_tasks": {
            "total": assigned_total,
            "completed": assigned_completed,
            "percent": round((assigned_completed / assigned_total * 100), 1) if assigned_total > 0 else 0,
        },
        "tasks": {
            "total": total_count,
            "completed": completed_count,
            "percent": round((completed_count / total_count * 100), 1) if total_count > 0 else 0,
            "tasks_by_day": tasks_by_day,
        },
        "quizzes": [
            {
                "id": q.id,
                "skill": q.skill,
                "percent": q.percent,
                "correct": q.correct,
                "total": q.total,
                "date": q.created_at.isoformat() if q.created_at else None,
            }
            for q in quizzes
        ],
        "interviews": [
            {
                "id": i.id,
                "type": i.interview_type,
                "status": i.status,
                "overall_score": i.overall_score,
                "date": i.created_at.isoformat() if i.created_at else None,
            }
            for i in interviews
        ],
        "applications": {
            "saved_count": saved_count,
            "total_drafted": len(applications),
            "approved": len([a for a in applications if a.approved_at is not None]),
            "applied": len([a for a in applications if a.status == "applied"]),
        },
    }

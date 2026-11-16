"""Trainer workspace endpoints: managing assigned listeners, assigning tasks, and progress reports."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from api.dependencies import db_session, require_trainer
from models import (
    AssignedTask,
    InterviewSession,
    LearningRoadmap,
    LearningTask,
    Notification,
    Profile,
    QuizResult,
    SkillAssessment,
    TrainerAssignment,
    TrainerNote,
    TrainerProfile,
    User,
    UserSettings,
)
from schemas import AssignTaskRequest, TrainerCreateRequest, TrainerNoteRequest
from services.auth import hash_password
from services.readiness import compute_user_readiness

router = APIRouter(prefix="/trainers", tags=["trainers"])


@router.get("/me/listeners")
def get_assigned_listeners(
    current_user: User = Depends(require_trainer),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """List all listeners assigned to the currently logged in trainer."""
    if current_user.role == "admin":
        listeners = db.scalars(select(User).where(User.role == "listener")).all()
    else:
        listeners = db.scalars(
            select(User).where(User.assigned_trainer_id == current_user.id, User.role == "listener")
        ).all()

    items = []
    for l in listeners:
        profile = db.scalar(select(Profile).where(Profile.user_id == l.id))
        readiness = compute_user_readiness(db, l.id)

        roadmap = db.scalar(
            select(LearningRoadmap)
            .where(LearningRoadmap.user_id == l.id, LearningRoadmap.is_active.is_(True))
            .order_by(LearningRoadmap.version.desc())
        )
        total_tasks = 0
        completed_tasks = 0
        if roadmap:
            total_tasks = db.scalar(
                select(func.count(LearningTask.id)).where(LearningTask.roadmap_id == roadmap.id)
            ) or 0
            completed_tasks = db.scalar(
                select(func.count(LearningTask.id)).where(
                    LearningTask.roadmap_id == roadmap.id, LearningTask.completed.is_(True)
                )
            ) or 0

        # Check for flags / stuck alerts (e.g. low quiz score < 60)
        recent_low_quiz = db.scalar(
            select(QuizResult)
            .where(QuizResult.user_id == l.id, QuizResult.percent < 60)
            .order_by(QuizResult.created_at.desc())
        )
        flags = []
        if recent_low_quiz:
            flags.append(f"Needs help: scored {int(recent_low_quiz.percent)}% on {recent_low_quiz.skill}")
        if total_tasks > 0 and completed_tasks == 0:
            flags.append("Has not started roadmap yet")

        # Assigned mentor tasks metrics
        assigned_total = db.scalar(
            select(func.count(AssignedTask.id)).where(AssignedTask.listener_id == l.id)
        ) or 0
        assigned_completed = db.scalar(
            select(func.count(AssignedTask.id)).where(
                AssignedTask.listener_id == l.id,
                AssignedTask.status == "completed",
            )
        ) or 0

        items.append({
            "id": l.id,
            "name": l.name,
            "email": l.email,
            "target_role": profile.target_role if profile else "Backend Developer",
            "career_break_years": profile.career_break_years if profile else None,
            "readiness_score": readiness["overall_score"],
            "tasks_completed": completed_tasks,
            "tasks_total": total_tasks,
            "progress_percent": round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0,
            "assigned_tasks_total": assigned_total,
            "assigned_tasks_completed": assigned_completed,
            "flags": flags,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        })

    return {"listeners": items, "count": len(items)}


@router.get("/listeners/{listener_id}")
def get_listener_detail(
    listener_id: int,
    current_user: User = Depends(require_trainer),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Get deep detail of a specific assigned listener."""
    listener = db.scalar(select(User).where(User.id == listener_id, User.role == "listener"))
    if not listener:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listener not found.")

    if current_user.role != "admin" and listener.assigned_trainer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this listener.",
        )

    profile = db.scalar(select(Profile).where(Profile.user_id == listener.id))
    readiness = compute_user_readiness(db, listener.id)

    # Active roadmap and tasks
    roadmap = db.scalar(
        select(LearningRoadmap)
        .where(LearningRoadmap.user_id == listener.id, LearningRoadmap.is_active.is_(True))
        .order_by(LearningRoadmap.version.desc())
    )
    tasks = []
    if roadmap:
        tasks = [
            {
                "id": t.id,
                "day": t.day,
                "title": t.title,
                "skill": t.skill,
                "kind": t.kind,
                "completed": t.completed,
                "minutes": t.minutes,
                "added_by_adaptation": t.added_by_adaptation,
                "adaptation_note": t.adaptation_note,
            }
            for t in db.scalars(
                select(LearningTask).where(LearningTask.roadmap_id == roadmap.id).order_by(LearningTask.day, LearningTask.order)
            ).all()
        ]

    # Quizzes
    quizzes = [
        {
            "id": q.id,
            "skill": q.skill,
            "percent": q.percent,
            "correct": q.correct,
            "total": q.total,
            "date": q.created_at.isoformat() if q.created_at else None,
        }
        for q in db.scalars(
            select(QuizResult).where(QuizResult.user_id == listener.id).order_by(QuizResult.created_at.desc())
        ).all()
    ]

    # Interviews
    interviews = [
        {
            "id": i.id,
            "type": i.interview_type,
            "overall_score": i.overall_score,
            "status": i.status,
            "weak_topics": i.weak_topics,
            "date": i.created_at.isoformat() if i.created_at else None,
        }
        for i in db.scalars(
            select(InterviewSession).where(InterviewSession.user_id == listener.id).order_by(InterviewSession.created_at.desc())
        ).all()
    ]

    # Notes
    notes = [
        {
            "id": n.id,
            "content": n.content,
            "category": n.category,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in db.scalars(
            select(TrainerNote).where(TrainerNote.listener_id == listener.id).order_by(TrainerNote.created_at.desc())
        ).all()
    ]

    # Assigned Tasks
    assigned_tasks = [
        {
            "id": at.id,
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
            select(AssignedTask).where(AssignedTask.listener_id == listener.id).order_by(AssignedTask.created_at.desc())
        ).all()
    ]

    # Skill assessments / gaps
    assessment = db.scalar(
        select(SkillAssessment).where(SkillAssessment.user_id == listener.id).order_by(SkillAssessment.version.desc())
    )

    return {
        "listener": {
            "id": listener.id,
            "name": listener.name,
            "email": listener.email,
        },
        "profile": {
            "full_name": profile.full_name if profile else listener.name,
            "target_role": profile.target_role if profile else "Backend Developer",
            "previous_role": profile.previous_role if profile else None,
            "experience_years": profile.experience_years if profile else None,
            "career_break_years": profile.career_break_years if profile else None,
            "career_break_reason": profile.career_break_reason if profile else None,
            "skills": profile.soft_skills + profile.transferable_skills if profile else [],
            "education": profile.education if profile else [],
            "hours_per_day": profile.hours_per_day if profile else 2.0,
            "plan_days": profile.plan_days if profile else 30,
        } if profile else None,
        "readiness": readiness,
        "gaps": assessment.items if assessment else [],
        "tasks": tasks,
        "quizzes": quizzes,
        "interviews": interviews,
        "notes": notes,
        "assigned_tasks": assigned_tasks,
    }


@router.post("/listeners/{listener_id}/assign-task")
def assign_task(
    listener_id: int,
    body: AssignTaskRequest,
    current_user: User = Depends(require_trainer),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Assign an extra practice task or resource to a learner."""
    listener = db.scalar(select(User).where(User.id == listener_id, User.role == "listener"))
    if not listener:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listener not found.")

    if current_user.role != "admin" and listener.assigned_trainer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to assign tasks to this learner.")

    task = AssignedTask(
        trainer_id=current_user.id,
        listener_id=listener.id,
        title=body.title,
        description=body.description,
        skill=body.skill,
        due_date=body.due_date,
        status="pending",
    )
    db.add(task)

    # Also sync into active learning roadmap if one exists so it appears in daily tasks
    active_roadmap = db.scalar(
        select(LearningRoadmap)
        .where(LearningRoadmap.user_id == listener.id, LearningRoadmap.is_active.is_(True))
        .order_by(LearningRoadmap.version.desc())
    )
    if active_roadmap:
        existing_tasks = db.scalars(
            select(LearningTask).where(LearningTask.roadmap_id == active_roadmap.id)
        ).all()
        # Find next day or day 1
        target_day = 1
        if existing_tasks:
            uncompleted = [t for t in existing_tasks if not t.completed]
            target_day = uncompleted[0].day if uncompleted else existing_tasks[-1].day

        learning_task = LearningTask(
            roadmap_id=active_roadmap.id,
            day=target_day,
            order=len(existing_tasks) + 1,
            skill=body.skill,
            kind="practice",
            title=f"[Mentor Assigned] {body.title}",
            description=body.description,
            minutes=30,
            completed=False,
            added_by_adaptation=True,
            adaptation_note=f"Assigned by mentor {current_user.name}: {body.description}",
        )
        db.add(learning_task)

    # Notify listener
    db.add(Notification(
        user_id=listener.id,
        title=f"New Mentor Task: {body.title}",
        message=f"{current_user.name} assigned you a practice task on {body.skill}.",
        type="task",
        link="/app/journey"
    ))
    db.commit()
    db.refresh(task)

    return {"status": "ok", "message": "Task assigned successfully.", "task_id": task.id}


@router.post("/colleagues", status_code=status.HTTP_201_CREATED)
def create_trainer_colleague(
    body: TrainerCreateRequest,
    current_user: User = Depends(require_trainer),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Allow an authorized trainer or admin to add a mentor/trainer colleague."""
    existing = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")

    new_trainer = User(
        name=body.name.strip(),
        email=body.email.strip().lower(),
        hashed_password=hash_password(body.password),
        role="trainer",
        is_active=True,
        is_demo=False,
    )
    db.add(new_trainer)
    db.commit()
    db.refresh(new_trainer)

    profile = TrainerProfile(
        user_id=new_trainer.id,
        specialization=body.specialization or "Full Stack Career Mentorship",
        bio=body.bio,
        max_learners=body.max_learners,
    )
    db.add(profile)
    db.add(UserSettings(user_id=new_trainer.id, theme="light"))
    db.commit()

    return {"status": "ok", "message": "Trainer colleague account created successfully.", "user_id": new_trainer.id}


@router.post("/listeners/{listener_id}/notes")
def add_trainer_note(
    listener_id: int,
    body: TrainerNoteRequest,
    current_user: User = Depends(require_trainer),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Add a mentorship note for a learner."""
    listener = db.scalar(select(User).where(User.id == listener_id, User.role == "listener"))
    if not listener:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listener not found.")

    if current_user.role != "admin" and listener.assigned_trainer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    note = TrainerNote(
        trainer_id=current_user.id,
        listener_id=listener.id,
        content=body.content,
        category=body.category,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"status": "ok", "message": "Note added successfully.", "note_id": note.id}


@router.get("/stats")
def get_trainer_stats(
    current_user: User = Depends(require_trainer),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Cohort summary statistics for trainer dashboard."""
    if current_user.role == "admin":
        listeners = db.scalars(select(User).where(User.role == "listener")).all()
    else:
        listeners = db.scalars(
            select(User).where(User.assigned_trainer_id == current_user.id, User.role == "listener")
        ).all()

    total_learners = len(listeners)
    avg_readiness = 0.0
    stuck_count = 0
    completed_plans = 0

    if total_learners > 0:
        scores = []
        for l in listeners:
            r = compute_user_readiness(db, l.id)
            scores.append(r["overall_score"])
            # Check for low scores
            low = db.scalar(
                select(QuizResult).where(QuizResult.user_id == l.id, QuizResult.percent < 60)
            )
            if low:
                stuck_count += 1
        avg_readiness = round(sum(scores) / len(scores), 1)

    return {
        "assigned_learners_count": total_learners,
        "average_readiness": avg_readiness,
        "stuck_learners_count": stuck_count,
        "completed_plans_count": completed_plans,
    }

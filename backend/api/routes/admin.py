"""Administrative workspace endpoints: user management, cohort analytics, and system health."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from api.dependencies import db_session, require_admin
from config import settings
from models import (
    AgentLog,
    AgentRegistry,
    Application,
    AuditLog,
    LearningRoadmap,
    LearningTask,
    Opportunity,
    Profile,
    QuizResult,
    TrainerAssignment,
    TrainerProfile,
    User,
    UserSettings,
)
from schemas import AdminCreateRequest, AssignTrainerRequest, RoleUpdateRequest, TrainerCreateRequest
from services.auth import hash_password
from services.readiness import compute_user_readiness

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
def get_admin_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Platform KPI summary for executive administration."""
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_listeners = db.scalar(select(func.count(User.id)).where(User.role == "listener")) or 0
    total_trainers = db.scalar(select(func.count(User.id)).where(User.role == "trainer")) or 0
    active_users = db.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0

    total_tasks_completed = db.scalar(
        select(func.count(LearningTask.id)).where(LearningTask.completed.is_(True))
    ) or 0

    total_applications = db.scalar(select(func.count(Application.id))) or 0
    approved_applications = db.scalar(
        select(func.count(Application.id)).where(Application.approved_at.is_not(None))
    ) or 0

    # Calculate average readiness of all listeners
    listeners = db.scalars(select(User).where(User.role == "listener")).all()
    avg_readiness = 0.0
    if listeners:
        scores = [compute_user_readiness(db, l.id)["overall_score"] for l in listeners]
        avg_readiness = round(sum(scores) / len(scores), 1)

    # Recent platform logs
    recent_logs = [
        {
            "id": l.id,
            "agent": l.agent,
            "action": l.action,
            "decision": l.decision,
            "status": l.status,
            "timestamp": l.created_at.isoformat() if l.created_at else None,
        }
        for l in db.scalars(select(AgentLog).order_by(AgentLog.created_at.desc()).limit(8)).all()
    ]

    return {
        "kpis": {
            "total_users": total_users,
            "listeners": total_listeners,
            "trainers": total_trainers,
            "active_users": active_users,
            "tasks_completed": total_tasks_completed,
            "applications_drafted": total_applications,
            "applications_approved": approved_applications,
            "average_readiness": avg_readiness,
        },
        "recent_activity": recent_logs,
    }


@router.get("/users")
def get_users(
    role: str | None = Query(None, description="Filter by role: listener, trainer, admin"),
    search: str | None = Query(None, description="Search by name or email"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """List users with optional search and role filtering."""
    stmt = select(User).order_by(User.id.desc())
    if role:
        stmt = stmt.where(User.role == role)
    if search:
        search_pattern = f"%{search.strip()}%"
        stmt = stmt.where(User.name.ilike(search_pattern) | User.email.ilike(search_pattern))

    users = db.scalars(stmt).all()
    items = []
    for u in users:
        trainer_name = None
        if u.assigned_trainer_id:
            t = db.scalar(select(User).where(User.id == u.assigned_trainer_id))
            if t:
                trainer_name = t.name

        profile = db.scalar(select(Profile).where(Profile.user_id == u.id))
        readiness_score = None
        if u.role == "listener":
            readiness_score = compute_user_readiness(db, u.id)["overall_score"]

        items.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "is_demo": u.is_demo,
            "assigned_trainer_id": u.assigned_trainer_id,
            "assigned_trainer_name": trainer_name,
            "target_role": profile.target_role if profile else None,
            "readiness_score": readiness_score,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return {"users": items, "count": len(items)}


@router.post("/trainers", status_code=status.HTTP_201_CREATED)
def create_trainer(
    body: TrainerCreateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Provision a new mentor/trainer account."""
    existing = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")

    trainer = User(
        name=body.name,
        email=body.email.strip().lower(),
        hashed_password=hash_password(body.password),
        role="trainer",
        is_active=True,
        is_demo=False,
    )
    db.add(trainer)
    db.commit()
    db.refresh(trainer)

    profile = TrainerProfile(
        user_id=trainer.id,
        specialization=body.specialization,
        bio=body.bio,
        max_learners=body.max_learners,
    )
    db.add(profile)
    db.add(UserSettings(user_id=trainer.id, theme="light"))
    db.commit()

    return {"status": "ok", "message": "Trainer account created successfully.", "user_id": trainer.id}


@router.post("/admins", status_code=status.HTTP_201_CREATED)
def create_admin(
    body: AdminCreateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Provision a new administrator account from the Admin panel."""
    existing = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")

    admin = User(
        name=body.name.strip(),
        email=body.email.strip().lower(),
        hashed_password=hash_password(body.password),
        role="admin",
        is_active=True,
        is_demo=False,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    db.add(UserSettings(user_id=admin.id, theme="light"))
    db.commit()

    return {"status": "ok", "message": "Administrator account created successfully.", "user_id": admin.id}


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    body: RoleUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Change a user's role or toggle account activation."""
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active

    db.commit()
    return {"status": "ok", "message": "User updated successfully."}


@router.post("/assign")
def assign_listener_to_trainer(
    body: AssignTrainerRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Assign or re-assign a listener to a dedicated mentor."""
    listener = db.scalar(select(User).where(User.id == body.listener_id, User.role == "listener"))
    trainer = db.scalar(select(User).where(User.id == body.trainer_id, User.role == "trainer"))
    if not listener:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listener not found.")
    if not trainer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer not found.")

    listener.assigned_trainer_id = trainer.id
    db.add(TrainerAssignment(
        trainer_id=trainer.id,
        listener_id=listener.id,
        notes=body.notes,
    ))
    db.commit()
    return {"status": "ok", "message": f"Assigned {listener.name} to mentor {trainer.name}."}


@router.get("/analytics")
def get_analytics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Detailed analytics data for Recharts visualizations."""
    listeners = db.scalars(select(User).where(User.role == "listener")).all()

    # Readiness tiers distribution
    readiness_tiers = {"0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0}
    for l in listeners:
        score = compute_user_readiness(db, l.id)["overall_score"]
        if score <= 25:
            readiness_tiers["0-25%"] += 1
        elif score <= 50:
            readiness_tiers["26-50%"] += 1
        elif score <= 75:
            readiness_tiers["51-75%"] += 1
        else:
            readiness_tiers["76-100%"] += 1

    # Skill gaps across cohort
    skill_quiz_stats: dict[str, list[float]] = {}
    quizzes = db.scalars(select(QuizResult)).all()
    for q in quizzes:
        skill_quiz_stats.setdefault(q.skill, []).append(q.percent)

    cohort_skills = [
        {
            "skill": skill,
            "attempts": len(pcts),
            "avg_score": round(sum(pcts) / len(pcts), 1),
            "mastery_rate": round(len([p for p in pcts if p >= 70]) / len(pcts) * 100, 1),
        }
        for skill, pcts in skill_quiz_stats.items()
    ]

    return {
        "readiness_distribution": [
            {"tier": k, "count": v} for k, v in readiness_tiers.items()
        ],
        "cohort_skill_performance": cohort_skills,
    }


@router.get("/health")
def get_system_health(
    current_user: User = Depends(require_admin),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Inspect database connectivity, dialect, storage, and agent registry."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    dialect = db.bind.dialect.name if db.bind else "unknown"
    agent_count = db.scalar(select(func.count(AgentRegistry.id))) or 0

    return {
        "database": {
            "status": db_status,
            "dialect": dialect,
            "is_postgres": "postgres" in dialect,
            "storage_dir": str(settings.storage_dir),
        },
        "agents": {
            "registered_count": agent_count,
            "status": "healthy" if agent_count == 6 else "partial",
        },
        "environment": {
            "ai_mode": settings.ai_mode,
            "demo_mode": settings.demo_mode,
        },
    }

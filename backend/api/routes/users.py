"""Users, profile, onboarding, resume upload, comeback workflow, plan and dashboard."""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.dependencies import db_session, get_current_user, get_optional_user, get_orchestrator
from config import settings
from models import AgentLog, Application, InterviewSession, ResumeFile, User
from orchestrator.career_orchestrator import CareerOrchestrator
from schemas import ComebackRunRequest, ProfileInput, UserCreate, UserOut
from services.resume_parser import ResumeParseError, extract_text
from services.serializers import assessment_dict, iso, log_dict, profile_dict, roadmap_dict
from services.storage import UploadError, store_upload, validate_upload

router = APIRouter(prefix="/users", tags=["users & profile"])


# ------------------------------------------------------------------ helpers (also used by demo routes)
def user_out(user: User, has_profile: bool) -> UserOut:
    return UserOut(id=user.id, name=user.name, is_demo=user.is_demo, created_at=iso(user.created_at), has_profile=has_profile)


def full_profile(orc: CareerOrchestrator) -> dict | None:
    from models import CareerHistoryEntry

    history = orc.db.scalars(
        select(CareerHistoryEntry).where(CareerHistoryEntry.user_id == orc.user.id).order_by(CareerHistoryEntry.order)
    ).all()
    return profile_dict(orc.profile_model(), orc.skills("technical"), list(history))


def live_plan(orc: CareerOrchestrator) -> dict[str, Any]:
    """Stored plan (version + change log) with its data recomputed from current state."""
    stored = orc.plan_view()
    data = orc.build_plan_data()
    if stored is None:
        return {"version": 0, "goal": "Define your comeback goal", "data": data, "change_log": [], "updated_at": None}
    return {**stored, "data": data}


def process_resume(orc: CareerOrchestrator, filename: str | None, data: bytes, manual: dict | None, trigger: str = "resume_upload") -> dict[str, Any]:
    """Validate → extract text → store safely → record metadata → run the comeback workflow."""
    try:
        ext = validate_upload(filename, data)
    except UploadError as exc:
        code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE if "too large" in str(exc) else status.HTTP_400_BAD_REQUEST
        if "Unsupported file type" in str(exc):
            code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        raise HTTPException(status_code=code, detail=str(exc)) from exc
    try:
        text = extract_text(data, ext)
    except ResumeParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    path = store_upload(orc.user.id, ext, data)
    record = ResumeFile(
        user_id=orc.user.id, original_filename=(filename or "resume")[:255], stored_path=str(path),
        content_type=ext[1:], size_bytes=len(data), text_chars=len(text),
    )
    orc.db.add(record)
    orc.db.commit()
    workflow = orc.run_comeback_workflow(resume_text=text, manual=manual or None, trigger=trigger)
    return {
        "resume": {"id": record.id, "filename": record.original_filename, "type": record.content_type,
                   "size_bytes": record.size_bytes, "text_chars": record.text_chars, "uploaded_at": iso(record.uploaded_at)},
        "workflow": workflow,
        "profile": full_profile(orc),
    }


# ------------------------------------------------------------------ users
@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(db_session)) -> UserOut:
    user = User(name=body.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_out(user, False)


@router.get("/{user_id}", response_model=UserOut)
def get_user(orc: CareerOrchestrator = Depends(get_orchestrator)) -> UserOut:
    return user_out(orc.user, orc.profile_model() is not None)


# ------------------------------------------------------------------ profile
@router.get("/{user_id}/profile")
def get_profile(orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    return {"profile": full_profile(orc)}


@router.post("/{user_id}/onboarding")
def onboarding(
    user_id: int,
    body: ProfileInput,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Save onboarding answers and start the Career Comeback workflow (no resume required)."""
    target_uid = current_user.id if current_user and current_user.role != "admin" else user_id
    orc = CareerOrchestrator(db, target_uid)
    manual = body.manual()
    if not manual:
        raise HTTPException(status_code=422, detail="Please fill in at least one onboarding field.")
    workflow = orc.run_comeback_workflow(manual=manual, trigger="onboarding")
    return {"workflow": workflow, "profile": full_profile(orc)}


@router.put("/{user_id}/profile")
def update_profile(
    user_id: int,
    body: ProfileInput,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Apply edits (they override parsed values) and re-run the comeback workflow."""
    target_uid = current_user.id if current_user and current_user.role != "admin" else user_id
    orc = CareerOrchestrator(db, target_uid)
    manual = body.manual()
    if not manual:
        raise HTTPException(status_code=422, detail="No changes were provided.")
    if orc.profile_model() is None:
        raise HTTPException(status_code=409, detail="Create your profile through onboarding or a resume upload first.")
    workflow = orc.run_comeback_workflow(manual=manual, trigger="profile_edit")
    return {"workflow": workflow, "profile": full_profile(orc)}


@router.post("/{user_id}/resume")
async def upload_resume(
    user_id: int,
    file: UploadFile = File(..., description="PDF or DOCX resume"),
    onboarding: str | None = Form(default=None, description="Optional JSON object with onboarding fields"),
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    # Strictly enforce per-account isolation:
    # Authenticated user upload is ALWAYS restricted exclusively to that authenticated user's account!
    target_uid = current_user.id if current_user and current_user.role != "admin" else user_id
    if current_user and current_user.role == "trainer":
        raise HTTPException(status_code=400, detail="Trainer accounts cannot maintain a learner comeback resume.")
    orc = CareerOrchestrator(db, target_uid)

    max_bytes = int(settings.max_upload_mb * 1024 * 1024)
    data = await file.read(max_bytes + 1)  # never read more than the limit + 1 byte
    await file.close()
    manual: dict | None = None
    if onboarding:
        try:
            manual = ProfileInput.model_validate(json.loads(onboarding)).manual()
        except (json.JSONDecodeError, ValidationError) as exc:
            raise HTTPException(status_code=422, detail=f"Invalid onboarding data: {exc}") from exc
    return process_resume(orc, file.filename, data, manual)


# ------------------------------------------------------------------ comeback workflow & plan
@router.post("/{user_id}/comeback")
def run_comeback(body: ComebackRunRequest | None = None, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """Re-run the Career Comeback workflow from the stored profile."""
    if orc.profile_model() is None:
        raise HTTPException(status_code=409, detail="Complete onboarding or upload a resume first.")
    force = body.force_new_roadmap if body else False
    return orc.run_comeback_workflow(trigger="regenerate" if force else "refresh", force_new_roadmap=force)


@router.get("/{user_id}/plan")
def get_plan(orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """The Dynamic Career Comeback Plan (data recomputed live; version and change log from history)."""
    return live_plan(orc)


@router.get("/{user_id}/dashboard")
def dashboard(orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    db = orc.db
    apps = db.scalars(select(Application).where(Application.user_id == orc.user.id).order_by(Application.updated_at.desc())).all()
    sessions = db.scalars(select(InterviewSession).where(InterviewSession.user_id == orc.user.id).order_by(InterviewSession.id.desc())).all()
    logs = db.scalars(select(AgentLog).where(AgentLog.user_id == orc.user.id).order_by(AgentLog.id.desc()).limit(12)).all()
    app_counts: dict[str, int] = {}
    for a in apps:
        app_counts[a.status] = app_counts.get(a.status, 0) + 1
    return {
        "user": user_out(orc.user, orc.profile_model() is not None).model_dump(),
        "profile": full_profile(orc),
        "plan": live_plan(orc),
        "assessment": assessment_dict(orc.latest_assessment()),
        "roadmap": roadmap_dict(orc.active_roadmap()),
        "interviews": {
            "completed": sum(1 for s in sessions if s.status == "completed"),
            "latest_score": next((s.overall_score for s in sessions if s.overall_score is not None), None),
        },
        "applications": {"counts": app_counts, "items": [orc.application_view(a.id) for a in apps[:5]]},
        "recent_activity": [log_dict(l) for l in logs],
    }


# ------------------------------------------------------------------ account deletion
@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Permanently delete user account and cascade delete all associated records."""
    from models import (
        AgentLog,
        Application,
        AssignedTask,
        CareerHistoryEntry,
        CareerPlan,
        CoverLetter,
        InterviewFeedback,
        InterviewSession,
        LearningRoadmap,
        LearningTask,
        Notification,
        Profile,
        QuizResult,
        ResumeDraft,
        ResumeFile,
        SavedOpportunity,
        SkillAssessment,
        TrainerAssignment,
        TrainerNote,
        TrainerProfile,
        UserSettings,
        UserSkill,
    )

    uid = current_user.id

    # 1. Clear assigned_trainer_id references for learners assigned to this user if user is trainer
    db.query(User).filter(User.assigned_trainer_id == uid).update({"assigned_trainer_id": None})

    # 2. Delete tasks and trainer notes where user is listener or trainer
    db.query(AssignedTask).filter((AssignedTask.listener_id == uid) | (AssignedTask.trainer_id == uid)).delete()
    db.query(TrainerNote).filter((TrainerNote.listener_id == uid) | (TrainerNote.trainer_id == uid)).delete()
    db.query(TrainerAssignment).filter((TrainerAssignment.listener_id == uid) | (TrainerAssignment.trainer_id == uid)).delete()
    db.query(TrainerProfile).filter(TrainerProfile.user_id == uid).delete()

    # 3. Learning tasks & roadmaps
    roadmaps = db.scalars(select(LearningRoadmap).where(LearningRoadmap.user_id == uid)).all()
    for rm in roadmaps:
        db.query(LearningTask).filter(LearningTask.roadmap_id == rm.id).delete()
    db.query(LearningRoadmap).filter(LearningRoadmap.user_id == uid).delete()

    # 4. Interviews & feedback
    interviews = db.scalars(select(InterviewSession).where(InterviewSession.user_id == uid)).all()
    for iv in interviews:
        db.query(InterviewFeedback).filter(InterviewFeedback.session_id == iv.id).delete()
    db.query(InterviewSession).filter(InterviewSession.user_id == uid).delete()

    # 5. Applications & drafts
    db.query(ResumeDraft).filter(ResumeDraft.user_id == uid).delete()
    db.query(CoverLetter).filter(CoverLetter.user_id == uid).delete()
    db.query(Application).filter(Application.user_id == uid).delete()
    db.query(SavedOpportunity).filter(SavedOpportunity.user_id == uid).delete()

    # 6. Profile & user data
    db.query(UserSettings).filter(UserSettings.user_id == uid).delete()
    db.query(Notification).filter(Notification.user_id == uid).delete()
    db.query(QuizResult).filter(QuizResult.user_id == uid).delete()
    db.query(SkillAssessment).filter(SkillAssessment.user_id == uid).delete()
    db.query(ResumeFile).filter(ResumeFile.user_id == uid).delete()
    db.query(UserSkill).filter(UserSkill.user_id == uid).delete()
    db.query(CareerHistoryEntry).filter(CareerHistoryEntry.user_id == uid).delete()
    db.query(CareerPlan).filter(CareerPlan.user_id == uid).delete()
    db.query(AgentLog).filter(AgentLog.user_id == uid).delete()
    db.query(Profile).filter(Profile.user_id == uid).delete()

    # 7. Delete User
    db.delete(current_user)
    db.commit()

    return {"status": "ok", "message": "Account and all associated records have been permanently deleted."}

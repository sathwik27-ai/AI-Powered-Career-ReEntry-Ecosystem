"""Application drafts, human approval and status tracking.

ReStartHer never submits applications. "Approve" records the person's review; the
person sends the application themselves and may then mark it as applied.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select

from api.dependencies import get_orchestrator
from models import Application
from orchestrator.career_orchestrator import CareerOrchestrator
from schemas import ApplicationCreate, DraftUpdate, StatusUpdate

router = APIRouter(prefix="/users/{user_id}/applications", tags=["applications"])

APPROVAL_NOTE = "ReStartHer never submits applications automatically. Review, edit and approve your drafts, then send them yourself."


@router.post("", status_code=201)
def create_application(body: ApplicationCreate, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """Select an opportunity and let the Application Agent draft a tailored resume and cover letter."""
    result = orc.prepare_application(body.opportunity_id)
    return {**result, "note": APPROVAL_NOTE}


@router.get("")
def list_applications(orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    rows = orc.db.scalars(select(Application).where(Application.user_id == orc.user.id).order_by(Application.updated_at.desc())).all()
    return {"applications": [orc.application_view(a.id) for a in rows], "note": APPROVAL_NOTE}


@router.get("/{application_id}")
def get_application(application_id: int, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    return {"application": orc.application_view(application_id), "note": APPROVAL_NOTE}


@router.post("/{application_id}/regenerate")
def regenerate(application_id: int, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """Re-run the Application Agent (e.g. after completing more learning). Resets approval."""
    app = orc.application_view(application_id)
    return {**orc.prepare_application(app["opportunity"]["id"]), "note": APPROVAL_NOTE}


@router.put("/{application_id}/drafts")
def save_drafts(application_id: int, body: DraftUpdate, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """Save your edits. Editing an approved draft resets the approval."""
    return {"application": orc.save_drafts(application_id, body.resume, body.cover_letter)}


@router.post("/{application_id}/approve")
def approve(application_id: int, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """Record human approval. Nothing is submitted externally."""
    return {"application": orc.approve_application(application_id), "submitted_by_restarther": False, "note": APPROVAL_NOTE}


@router.patch("/{application_id}/status")
def update_status(application_id: int, body: StatusUpdate, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """Track progress. 'applied' and later statuses require prior approval."""
    return {"application": orc.update_application_status(application_id, body.status, body.note)}

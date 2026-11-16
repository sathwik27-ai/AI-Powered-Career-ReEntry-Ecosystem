"""Mock interviews (Confidence & Interview Agent)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from api.dependencies import get_orchestrator
from models import InterviewSession
from orchestrator.career_orchestrator import CareerOrchestrator
from schemas import InterviewAnswer, InterviewStart
from services.serializers import session_dict

router = APIRouter(prefix="/users/{user_id}/interviews", tags=["mock interviews"])


@router.post("", status_code=201)
def start_interview(body: InterviewStart, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    return {"session": orc.start_interview(body.interview_type)}


@router.get("")
def list_interviews(orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    rows = orc.db.scalars(select(InterviewSession).where(InterviewSession.user_id == orc.user.id).order_by(InterviewSession.id.desc())).all()
    return {"sessions": [session_dict(s) for s in rows]}


@router.get("/{session_id}")
def get_interview(session_id: int, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    s = orc.db.get(InterviewSession, session_id)
    if s is None or s.user_id != orc.user.id:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    return {"session": session_dict(s)}


@router.post("/{session_id}/answers")
def answer(session_id: int, body: InterviewAnswer, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """Evaluate one answer (scores, feedback, improved answer)."""
    return {"feedback": orc.answer_interview(session_id, body.question_id, body.answer)}


@router.post("/{session_id}/complete")
def complete(session_id: int, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """Finish the session; weak topics go to the orchestrator, which may ask the Learning Agent to adapt the roadmap."""
    return orc.complete_interview(session_id)

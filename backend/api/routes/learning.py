"""Skill-gap results, learning roadmap, task completion and quizzes."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from api.dependencies import get_orchestrator
from knowledge.quizzes import QUIZZES, public_quiz
from models import LearningTask, QuizResult
from orchestrator.career_orchestrator import CareerOrchestrator
from schemas import QuizOut, QuizSubmission, TaskUpdate
from services.serializers import assessment_dict, quiz_dict, roadmap_dict, task_dict

router = APIRouter(tags=["skills & learning"])


@router.get("/quizzes")
def list_quizzes() -> dict[str, Any]:
    return {"skills": [{"skill": s, "questions": len(q)} for s, q in QUIZZES.items()]}


@router.get("/quizzes/{skill}", response_model=QuizOut)
def get_quiz(skill: str) -> QuizOut:
    questions = public_quiz(skill)
    if not questions:
        raise HTTPException(status_code=404, detail=f"No assessment is available for {skill}.")
    return QuizOut(skill=skill, questions=questions, note="Your score is a measured result and replaces the estimated level for this skill.")


@router.get("/users/{user_id}/skills")
def get_skills(orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    return {"assessment": assessment_dict(orc.latest_assessment()), "measured_evidence": orc.measured_evidence()}


@router.get("/users/{user_id}/roadmap")
def get_roadmap(orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    return {"roadmap": roadmap_dict(orc.active_roadmap())}


@router.patch("/users/{user_id}/tasks/{task_id}")
def update_task(task_id: int, body: TaskUpdate, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """Mark a roadmap task complete/incomplete. Quiz tasks are completed by submitting the quiz."""
    roadmap = orc.active_roadmap()
    task = orc.db.get(LearningTask, task_id)
    if roadmap is None or task is None or task.roadmap_id != roadmap.id:
        raise HTTPException(status_code=404, detail="Task not found in your active roadmap.")
    if task.kind == "quiz" and body.completed:
        raise HTTPException(status_code=409, detail="Complete this task by taking the assessment.")
    task.completed = body.completed
    task.completed_at = datetime.now(timezone.utc) if body.completed else None
    orc.db.commit()
    orc.db.refresh(roadmap)
    rd = roadmap_dict(roadmap)
    return {"task": task_dict(task), "progress": rd["progress"], "current_day": rd["current_day"], "readiness": orc.readiness()}


@router.post("/users/{user_id}/quizzes/{skill}")
def submit_quiz(skill: str, body: QuizSubmission, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """Grade a quiz; the orchestrator forwards the score to the Learning Agent, which may adapt the roadmap."""
    if orc.profile_model() is None:
        raise HTTPException(status_code=409, detail="Complete your profile before taking assessments.")
    return orc.submit_quiz(skill, body.answers)


@router.get("/users/{user_id}/quiz-results")
def quiz_results(orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    rows = orc.db.scalars(select(QuizResult).where(QuizResult.user_id == orc.user.id).order_by(QuizResult.id.desc())).all()
    return {"results": [quiz_dict(r) for r in rows]}

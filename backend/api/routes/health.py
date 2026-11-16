from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from api.dependencies import db_session
from config import settings
from schemas import HealthResponse

router = APIRouter(tags=["health"])
VERSION = "1.0.0"


@router.get("/health", response_model=HealthResponse)
def health(db: Session = Depends(db_session)) -> HealthResponse:
    try:
        db.execute(text("SELECT 1"))
        database = "ok"
    except Exception:
        database = "error"
    return HealthResponse(
        status="ok" if database == "ok" else "degraded",
        service="ReStartHer API",
        version=VERSION,
        ai_mode=settings.ai_mode,
        ai_mode_description=(
            "Claude-assisted agents (ANTHROPIC_API_KEY configured)"
            if settings.ai_mode == "llm"
            else "Local demo mode: deterministic, rule-based agents (no API key required)"
        ),
        database=database,
    )

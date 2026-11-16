"""Demo helpers: load the fictional 'Priya' persona through the real pipeline."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from api.dependencies import db_session
from api.routes.users import process_resume, user_out
from config import settings
from models import User
from orchestrator.career_orchestrator import CareerOrchestrator

router = APIRouter(prefix="/demo", tags=["demo"])

SAMPLE_DIR = Path(__file__).resolve().parents[2] / "sample_data"
FILES = {"pdf": ("priya_resume.pdf", "application/pdf"),
         "docx": ("priya_resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}

# Onboarding answers for the fictional persona (from the project proposal).
PRIYA_ONBOARDING = {
    "target_role": "Backend Developer",
    "work_preferences": ["Remote", "Hybrid"],
    "employment_types": ["Full-time", "Returnship", "Part-time"],
    "hours_per_day": 2,
    "plan_days": 30,
    "location_preference": "Chennai",
    "learning_preferences": ["Hands-on exercises", "Official documentation"],
}


def _sample(fmt: str) -> Path:
    if fmt not in FILES:
        raise HTTPException(status_code=404, detail="Sample format must be 'pdf' or 'docx'.")
    path = SAMPLE_DIR / FILES[fmt][0]
    if not path.exists():
        raise HTTPException(status_code=404, detail="Sample resume not generated. Run: python scripts/generate_sample_resumes.py")
    return path


@router.get("/sample-resume/{fmt}")
def sample_resume(fmt: str) -> FileResponse:
    """Download the fictional sample resume (to try the upload flow yourself)."""
    path = _sample(fmt)
    return FileResponse(path, media_type=FILES[fmt][1], filename=FILES[fmt][0])


@router.post("/priya", status_code=201)
def load_priya(db: Session = Depends(db_session)) -> dict[str, Any]:
    """Create a fresh demo user and run her sample PDF resume through the real comeback workflow."""
    if not settings.demo_mode:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo persona generation is disabled when DEMO_MODE is false.",
        )
    path = _sample("pdf")
    user = User(name="Priya (demo)", is_demo=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    orc = CareerOrchestrator(db, user.id)
    result = process_resume(orc, path.name, path.read_bytes(), dict(PRIYA_ONBOARDING), trigger="demo_load")
    return {"user": user_out(user, True).model_dump(), **result,
            "note": "Priya is a fictional persona. All scores and opportunities are illustrative demo content."}


@router.post("/priya/reset")
def reset_priya(db: Session = Depends(db_session)) -> dict[str, Any]:
    """Restore the seeded Priya Raman (priya@restarther.org) back to her pristine demo profile."""
    if not settings.demo_mode:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo reset is disabled when DEMO_MODE is false.",
        )
    from services.seed import restore_demo_priya
    restore_demo_priya(db)
    return {"status": "ok", "message": "Priya Raman demo profile restored to pristine state."}

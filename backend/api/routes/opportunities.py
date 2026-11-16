"""Opportunity discovery and saved opportunities.

Every listing carries `is_demo`, `source` and a human-readable `listing_label`. Demo
listings are illustrative only: no real employer names and no application links.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select

from api.dependencies import get_orchestrator
from models import Opportunity, SavedOpportunity
from orchestrator.career_orchestrator import CareerOrchestrator
from schemas import EmploymentType, WorkArrangement
from services.serializers import iso

router = APIRouter(prefix="/users/{user_id}/opportunities", tags=["opportunities"])

DEMO_LABEL = "Illustrative demo listing – not a live vacancy"
VERIFIED_LABEL = "Verified listing – check the source link before applying"
DISCLAIMER = (
    "Opportunities marked as demo listings are illustrative examples created for this prototype. "
    "They are not real vacancies, and match scores are explainable compatibility indicators, not employer assessments."
)


def _label(item: dict) -> dict:
    item["listing_label"] = DEMO_LABEL if item.get("is_demo") else VERIFIED_LABEL
    if item.get("is_demo"):
        item["source_url"] = None  # never show an application link for illustrative data
    return item


@router.get("")
def list_opportunities(
    arrangement: WorkArrangement | None = Query(default=None),
    employment_type: EmploymentType | None = Query(default=None),
    location: str | None = Query(default=None, max_length=80),
    role: str | None = Query(default=None, max_length=80),
    returnship_only: bool = Query(default=False),
    orc: CareerOrchestrator = Depends(get_orchestrator),
) -> dict[str, Any]:
    if orc.profile_model() is None:
        raise HTTPException(status_code=409, detail="Complete your profile so the Opportunity Agent can match roles to you.")
    filters = {"arrangement": arrangement, "employment_type": employment_type, "location": location, "role": role, "returnship_only": returnship_only}
    results = orc.rank_opportunities(filters)
    saved = set(orc.db.scalars(select(SavedOpportunity.opportunity_id).where(SavedOpportunity.user_id == orc.user.id)).all())
    items = [_label({**r, "saved": r["id"] in saved}) for r in results]
    return {"disclaimer": DISCLAIMER, "count": len(items), "filters": {k: v for k, v in filters.items() if v}, "results": items}


@router.get("/saved")
def saved_opportunities(orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    rows = orc.db.scalars(select(SavedOpportunity).where(SavedOpportunity.user_id == orc.user.id).order_by(SavedOpportunity.id.desc())).all()
    ranked = {r["id"]: r for r in orc.rank_opportunities()}
    items = []
    for row in rows:
        if row.opportunity_id in ranked:
            items.append(_label({**ranked[row.opportunity_id], "saved": True, "saved_at": iso(row.created_at)}))
    return {"disclaimer": DISCLAIMER, "results": items}


@router.post("/{opportunity_id}/save", status_code=201)
def save_opportunity(opportunity_id: int, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    if orc.db.get(Opportunity, opportunity_id) is None:
        raise HTTPException(status_code=404, detail="Opportunity not found.")
    existing = orc.db.scalar(select(SavedOpportunity).where(SavedOpportunity.user_id == orc.user.id, SavedOpportunity.opportunity_id == opportunity_id))
    if existing is None:
        score = next((r["match_score"] for r in orc.rank_opportunities() if r["id"] == opportunity_id), 0.0)
        orc.db.add(SavedOpportunity(user_id=orc.user.id, opportunity_id=opportunity_id, match_score=score))
        orc.db.commit()
    return {"saved": True, "opportunity_id": opportunity_id}


@router.delete("/{opportunity_id}/save")
def unsave_opportunity(opportunity_id: int, orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    row = orc.db.scalar(select(SavedOpportunity).where(SavedOpportunity.user_id == orc.user.id, SavedOpportunity.opportunity_id == opportunity_id))
    if row is not None:
        orc.db.delete(row)
        orc.db.commit()
    return {"saved": False, "opportunity_id": opportunity_id}

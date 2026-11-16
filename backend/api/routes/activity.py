"""Agent catalogue, agent status and the orchestrator activity history."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from api.dependencies import db_session, get_orchestrator
from models import AgentLog, AgentRegistry
from orchestrator.career_orchestrator import CareerOrchestrator
from schemas import ActivityLogOut, AgentOut
from services.serializers import iso, log_dict
from sqlalchemy.orm import Session

router = APIRouter(tags=["agents & activity"])


@router.get("/agents")
def agent_catalog(db: Session = Depends(db_session)) -> dict[str, Any]:
    jotform_list = [
        AgentOut(
            key=a.key,
            name=a.name,
            description=a.description,
            role_summary=a.role_summary,
            jotform_id=a.jotform_id,
            accent_color=a.accent_color,
            icon=a.icon,
            category=a.category,
            status=a.status,
        ).model_dump()
        for a in db.scalars(select(AgentRegistry).order_by(AgentRegistry.id)).all()
    ]
    return {
        "agents": CareerOrchestrator.agent_catalog(),
        "jotform_agents": jotform_list,
    }


@router.get("/users/{user_id}/agents")
def agent_status(orc: CareerOrchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """Each agent's responsibilities plus its latest activity for this user."""
    db = orc.db
    agents = []
    for meta in CareerOrchestrator.agent_catalog():
        last = db.scalar(select(AgentLog).where(AgentLog.user_id == orc.user.id, AgentLog.agent == meta["key"]).order_by(AgentLog.id.desc()).limit(1))
        count = db.scalar(select(func.count(AgentLog.id)).where(AgentLog.user_id == orc.user.id, AgentLog.agent == meta["key"])) or 0
        agents.append({
            **meta,
            "status": "idle" if last is None else ("error" if last.status == "error" else "completed"),
            "executions": count,
            "last_action": last.action if last else None,
            "last_summary": (last.output_summary or {}).get("summary") if last else None,
            "last_run_at": iso(last.created_at) if last else None,
            "last_mode": last.mode if last else None,
        })
    return {"agents": agents, "workflows": orc.workflow_definitions()}


@router.get("/users/{user_id}/activity")
def activity(
    run_id: str | None = Query(default=None, max_length=40),
    workflow: str | None = Query(default=None, max_length=40),
    agent: str | None = Query(default=None, max_length=40),
    limit: int = Query(default=200, ge=1, le=1000),
    orc: CareerOrchestrator = Depends(get_orchestrator),
) -> dict[str, Any]:
    """Execution history, oldest step first within each run, newest runs first."""
    q = select(AgentLog).where(AgentLog.user_id == orc.user.id)
    if run_id:
        q = q.where(AgentLog.run_id == run_id)
    if workflow:
        q = q.where(AgentLog.workflow == workflow)
    if agent:
        q = q.where(AgentLog.agent == agent)
    rows = list(reversed(orc.db.scalars(q.order_by(AgentLog.id.desc()).limit(limit)).all()))
    runs: dict[str, dict] = {}
    for r in rows:
        run = runs.setdefault(r.run_id, {"run_id": r.run_id, "workflow": r.workflow, "started_at": iso(r.created_at), "steps": 0,
                                          "agents": [], "roadmap_changed": False, "errors": 0})
        run["steps"] += 1
        if r.agent not in run["agents"]:
            run["agents"].append(r.agent)
        run["roadmap_changed"] = run["roadmap_changed"] or r.roadmap_changed
        run["errors"] += int(r.status == "error")
    logs = [ActivityLogOut(**log_dict(r)).model_dump() for r in rows]
    return {"runs": list(reversed(list(runs.values()))), "logs": logs}

"""AI Agent Registry & interaction management."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.dependencies import db_session, get_optional_user
from models import AgentLog, AgentRegistry, User
from schemas import AgentOut

router = APIRouter(prefix="/agents", tags=["agents"])


class AgentActivityLog(BaseModel):
    agent_key: str
    action: str
    input_text: str | None = None
    output_text: str | None = None
    status: str = "success"


@router.get("/jotform", response_model=list[AgentOut])
@router.get("/registry", response_model=list[AgentOut])
def list_agents(db: Session = Depends(db_session)) -> list[AgentOut]:
    """List all registered AI Agents with their verified Jotform embed configuration."""
    agents = db.scalars(select(AgentRegistry).order_by(AgentRegistry.id)).all()
    return [
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
        )
        for a in agents
    ]


@router.get("/{key}", response_model=AgentOut)
def get_agent(key: str, db: Session = Depends(db_session)) -> AgentOut:
    """Get single AI Agent configuration by its key."""
    agent = db.scalar(select(AgentRegistry).where(AgentRegistry.key == key))
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    return AgentOut(
        key=agent.key,
        name=agent.name,
        description=agent.description,
        role_summary=agent.role_summary,
        jotform_id=agent.jotform_id,
        accent_color=agent.accent_color,
        icon=agent.icon,
        category=agent.category,
        status=agent.status,
    )


@router.get("/{key}/health")
def check_agent_health(key: str, db: Session = Depends(db_session)) -> dict[str, Any]:
    """Check health and embed readiness for a specific agent."""
    agent = db.scalar(select(AgentRegistry).where(AgentRegistry.key == key))
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    return {
        "key": agent.key,
        "name": agent.name,
        "jotform_id": agent.jotform_id,
        "embed_url": f"https://cdn.jotfor.ms/agent/embedjs/{agent.jotform_id}/embed.js",
        "direct_url": f"https://agent.jotform.com/{agent.jotform_id}",
        "status": "ready",
        "interactive": True,
    }


@router.post("/activity")
def record_agent_activity(
    body: AgentActivityLog,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(db_session),
) -> dict[str, str]:
    """Record a user interaction with an AI agent in the platform log."""
    user_id = current_user.id if current_user else 1
    log_entry = AgentLog(
        user_id=user_id,
        run_id=f"agent-{body.agent_key}",
        workflow="interactive_agent",
        step=1,
        agent=body.agent_key,
        action=body.action,
        input_summary={"text_sample": (body.input_text or "")[:200]},
        output_summary={"text_sample": (body.output_text or "")[:200]},
        decision=f"User engaged with {body.agent_key}",
        status=body.status,
        mode="jotform_agent",
    )
    db.add(log_entry)
    db.commit()
    return {"status": "ok", "message": "Interaction logged."}

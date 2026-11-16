"""Central Career Orchestrator for ReStartHer.

The orchestrator owns the overall career-comeback goal. It plans the work, delegates
to the six specialised agents, passes structured results between them, evaluates
their outputs, decides which agent acts next, persists state, and records every
step in the agent activity log (AgentLog).

Workflows (each is a StateGraph from orchestrator/graph.py):

  A. comeback   goal → profile → evaluate_profile ─┬─(continue)→ skill_gap ─┬─(ok)→ learning → opportunity → plan
                                                   └─(clarify)─────────────┴─────────────────────────────→ plan
  B. adaptive   receive → analyze → evaluate ─┬─(adapt)────→ adapt → reassess → opportunity → plan
                                              └─(no_change)──────→ reassess → opportunity → plan
  C. application receive_selection → application → review_gate → plan

Agents never touch the database; the orchestrator is the only component that
persists state, which keeps every hand-off explicit and auditable.
"""
from __future__ import annotations

import logging
import time
import uuid
from collections.abc import Callable
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from agents.application_agent import STATUSES, ResumeApplicationAgent
from agents.base import AgentResult
from agents.confidence_agent import ConfidenceInterviewAgent
from agents.learning_agent import STRONG, WEAK, MODERATE, LearningAgent
from agents.opportunity_agent import OpportunityDiscoveryAgent
from agents.profile_agent import ProfileIntelligenceAgent
from agents.skill_gap_agent import SkillGapAgent
from config import settings
from knowledge.interview_bank import ALL_QUESTIONS
from knowledge.quizzes import QUIZZES
from knowledge.roles import ROLES, resolve_role, suggest_roles
from models import (
    AgentLog, Application, CareerHistoryEntry, CareerPlan, CoverLetter, InterviewFeedback, InterviewSession,
    LearningRoadmap, LearningTask, Opportunity, Profile, QuizResult, ResumeDraft, SkillAssessment, User, UserSkill,
)
from orchestrator.graph import END, StateGraph
from services.readiness import compute_readiness
from services.serializers import (
    application_dict, assessment_dict, feedback_dict, opportunity_dict, roadmap_dict, session_dict, task_dict,
)

log = logging.getLogger("restarther.orchestrator")

ORCHESTRATOR_KEY = "orchestrator"

# One shared instance per agent (agents are stateless).
AGENTS = {
    "profile": ProfileIntelligenceAgent(),
    "skill_gap": SkillGapAgent(),
    "learning": LearningAgent(),
    "confidence": ConfidenceInterviewAgent(),
    "opportunity": OpportunityDiscoveryAgent(),
    "application": ResumeApplicationAgent(),
}

ORCHESTRATOR_META = {
    "key": ORCHESTRATOR_KEY,
    "name": "Career Orchestrator",
    "description": "Plans the comeback, delegates to the six agents, evaluates their outputs and adapts the plan.",
    "responsibilities": [
        "Understand the overall career comeback goal and create an execution plan",
        "Delegate tasks and pass structured results between agents",
        "Evaluate agent outputs and decide which agent acts next",
        "Trigger roadmap adaptation from quiz and interview evidence",
        "Maintain the Dynamic Career Comeback Plan and execution history",
    ],
    "inputs": ["User goal", "Agent outputs", "Assessment results"],
    "outputs": ["Execution decisions", "Dynamic Career Comeback Plan", "Activity log"],
}

# Statuses that represent the person having applied externally – only allowed after human approval.
POST_APPROVAL_STATUSES = {"applied", "interview", "offer", "rejected"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


class OrchestratorError(Exception):
    """Structured error raised to callers (the API layer maps `status` to an HTTP code)."""

    def __init__(self, code: str, message: str, status: int = 400, details: dict | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status
        self.details = details or {}


class CareerOrchestrator:
    def __init__(self, db: Session, user_id: int) -> None:
        self.db = db
        user = db.get(User, user_id)
        if user is None:
            raise OrchestratorError("user_not_found", f"User {user_id} does not exist.", 404)
        self.user = user
        self._run_id: str | None = None
        self._workflow: str = ""
        self._step = 0

    # ================================================================ state access
    def profile_model(self) -> Profile | None:
        return self.db.scalar(select(Profile).where(Profile.user_id == self.user.id))

    def employment(self) -> list[dict]:
        rows = self.db.scalars(
            select(CareerHistoryEntry).where(CareerHistoryEntry.user_id == self.user.id).order_by(CareerHistoryEntry.order)
        ).all()
        return [{"title": r.title, "company": r.company, "start": r.start, "end": r.end, "years": r.years, "highlights": r.highlights or []} for r in rows]

    def skills(self, kind: str = "technical") -> list[str]:
        return list(self.db.scalars(
            select(UserSkill.name).where(UserSkill.user_id == self.user.id, UserSkill.kind == kind).order_by(UserSkill.id)
        ).all())

    def profile_data(self) -> dict[str, Any] | None:
        """Profile in the dict shape every agent expects (skills = technical skills)."""
        p = self.profile_model()
        if p is None:
            return None
        return {
            "full_name": p.full_name, "email": p.email, "phone": p.phone, "headline": p.headline,
            "previous_role": p.previous_role, "domain": p.domain, "education": p.education or [],
            "education_field": p.education_field, "experience_years": p.experience_years,
            "career_break_years": p.career_break_years, "career_break_reason": p.career_break_reason,
            "target_role": p.target_role, "skills": self.skills("technical"), "soft_skills": p.soft_skills or [],
            "transferable_skills": p.transferable_skills or [], "certifications": p.certifications or [],
            "projects": p.projects or [], "work_preferences": p.work_preferences or [],
            "employment_types": p.employment_types or [], "location_preference": p.location_preference,
            "hours_per_day": p.hours_per_day, "plan_days": p.plan_days,
            "learning_preferences": p.learning_preferences or [],
        }

    def latest_assessment(self) -> SkillAssessment | None:
        return self.db.scalar(
            select(SkillAssessment).where(SkillAssessment.user_id == self.user.id).order_by(SkillAssessment.version.desc()).limit(1)
        )

    def active_roadmap(self) -> LearningRoadmap | None:
        return self.db.scalar(
            select(LearningRoadmap).where(LearningRoadmap.user_id == self.user.id, LearningRoadmap.is_active.is_(True))
            .order_by(LearningRoadmap.id.desc()).limit(1)
        )

    def roadmap_tasks(self, roadmap: LearningRoadmap | None = None) -> list[LearningTask]:
        roadmap = roadmap or self.active_roadmap()
        if roadmap is None:
            return []
        return sorted(roadmap.tasks, key=lambda t: (t.day, t.order))

    def measured_evidence(self) -> dict[str, dict]:
        """Measured skill evidence: latest quiz % and the average of the last 3 technical interview scores."""
        quiz: dict[str, float] = {}
        for q in self.db.scalars(select(QuizResult).where(QuizResult.user_id == self.user.id).order_by(QuizResult.id)).all():
            quiz[q.skill] = q.percent  # later results overwrite earlier ones
        interview: dict[str, list[float]] = {}
        rows = self.db.scalars(
            select(InterviewFeedback).join(InterviewSession)
            .where(InterviewSession.user_id == self.user.id, InterviewFeedback.skill.is_not(None))
            .order_by(InterviewFeedback.id)
        ).all()
        for f in rows:
            interview.setdefault(f.skill, []).append(f.overall)
        evidence: dict[str, dict] = {}
        for skill in set(quiz) | set(interview):
            parts, sources = [], []
            if skill in quiz:
                parts.append(quiz[skill]); sources.append("quiz")
            if skill in interview:
                last = interview[skill][-3:]
                parts.append(sum(last) / len(last)); sources.append("interview")
            evidence[skill] = {"score": round(sum(parts) / len(parts), 1), "source": " + ".join(sources)}
        return evidence

    def learning_credit(self) -> dict[str, float]:
        totals: dict[str, int] = {}
        done: dict[str, int] = {}
        for t in self.roadmap_tasks():
            totals[t.skill] = totals.get(t.skill, 0) + 1
            if t.completed:
                done[t.skill] = done.get(t.skill, 0) + 1
        return {s: done.get(s, 0) / n for s, n in totals.items() if n}

    def completed_learning(self) -> tuple[dict[str, int], list[str]]:
        counts: dict[str, int] = {}
        project_tasks = []
        roadmap = self.active_roadmap()
        for t in self.roadmap_tasks(roadmap):
            if t.kind == "project":
                project_tasks.append(t)
            elif t.completed:
                counts[t.skill] = counts.get(t.skill, 0) + 1
        projects: list[str] = []
        if roadmap and project_tasks and all(t.completed for t in project_tasks):
            title = (roadmap.mini_project or {}).get("title")
            if title:
                projects.append(f"{title} (portfolio mini-project)")
        return counts, projects

    def interview_scores(self) -> list[float]:
        return list(self.db.scalars(
            select(InterviewFeedback.overall).join(InterviewSession)
            .where(InterviewSession.user_id == self.user.id).order_by(InterviewFeedback.id)
        ).all())

    def opportunity_rows(self) -> list[dict]:
        return [opportunity_dict(o) for o in self.db.scalars(select(Opportunity).order_by(Opportunity.id)).all()]

    # ================================================================ logging
    def _start_run(self, workflow: str, run_id: str | None = None) -> str:
        self._workflow = workflow
        self._run_id = run_id or f"{workflow[:4]}-{uuid.uuid4().hex[:10]}"
        existing = self.db.scalar(select(func.max(AgentLog.step)).where(AgentLog.run_id == self._run_id))
        self._step = int(existing or 0)
        return self._run_id

    def _log(self, agent: str, action: str, *, input_summary: dict | None = None, output_summary: dict | None = None,
             decision: str | None = None, next_agent: str | None = None, roadmap_changed: bool = False,
             status: str = "success", mode: str = "demo", duration_ms: int = 0) -> AgentLog:
        if self._run_id is None:
            self._start_run("adhoc")
        self._step += 1
        entry = AgentLog(
            user_id=self.user.id, run_id=self._run_id, workflow=self._workflow, step=self._step, agent=agent,
            action=action, input_summary=input_summary or {}, output_summary=output_summary or {}, decision=decision,
            next_agent=next_agent, roadmap_changed=roadmap_changed, status=status, mode=mode, duration_ms=duration_ms,
        )
        self.db.add(entry)
        self.db.flush()
        return entry

    def _decide(self, decision: str, *, next_agent: str | None = None, action: str = "Decision",
                input_summary: dict | None = None, output_summary: dict | None = None, roadmap_changed: bool = False) -> None:
        self._log(ORCHESTRATOR_KEY, action, input_summary=input_summary, output_summary=output_summary,
                  decision=decision, next_agent=next_agent, roadmap_changed=roadmap_changed)

    def _execute(self, agent_key: str, action: str, fn: Callable[[dict], AgentResult], payload: dict,
                 *, next_agent: str | None = None, decision: str | None = None) -> AgentResult:
        """Run one agent call, time it and record it. Failures are logged and re-raised as OrchestratorError."""
        started = time.perf_counter()
        try:
            result = fn(payload)
        except Exception as exc:  # agent bug or bad input – record it, never crash silently
            elapsed = int((time.perf_counter() - started) * 1000)
            log.exception("Agent %s failed during %s", agent_key, action)
            self.db.rollback()
            self._log(agent_key, action, input_summary={"payload_keys": sorted(payload)},
                      output_summary={"error": f"{type(exc).__name__}: {exc}"}, status="error",
                      decision="Workflow stopped because the agent failed.", duration_ms=elapsed)
            self.db.commit()
            raise OrchestratorError("agent_failed", f"{AGENTS[agent_key].name} failed: {exc}", 500) from exc
        elapsed = int((time.perf_counter() - started) * 1000)
        self._log(agent_key, action, input_summary=result.log_input, output_summary={"summary": result.summary, **result.log_output},
                  decision=decision, next_agent=next_agent, mode=result.mode, duration_ms=elapsed)
        return result

    # ================================================================ persistence helpers
    def _persist_profile(self, out: dict, source: str) -> None:
        data: dict = out["profile"]
        p = self.profile_model()
        if p is None:
            p = Profile(user_id=self.user.id)
            self.db.add(p)
        simple = [
            "full_name", "email", "phone", "headline", "previous_role", "domain", "education", "education_field",
            "experience_years", "career_break_years", "career_break_reason", "target_role", "soft_skills",
            "transferable_skills", "certifications", "projects", "work_preferences", "employment_types",
            "location_preference", "learning_preferences",
        ]
        for field in simple:
            value = data.get(field)
            if isinstance(value, list):
                value = list(value)
            setattr(p, field, value)
        if data.get("hours_per_day") is not None:
            p.hours_per_day = float(data["hours_per_day"])
        if data.get("plan_days") is not None:
            p.plan_days = 15 if int(data["plan_days"]) <= 15 else 30
        p.missing_info = out.get("missing", [])
        p.clarification_questions = out.get("clarification_questions", [])
        if out.get("skill_evidence"):
            p.skill_evidence = out["skill_evidence"]
        p.source = source
        p.extraction_mode = out.get("_mode", "demo")
        if p.full_name and (not self.user.name or self.user.name == "New user"):
            self.user.name = p.full_name

        # Skills table: replace with the agent's merged view.
        for row in self.db.scalars(select(UserSkill).where(UserSkill.user_id == self.user.id)).all():
            self.db.delete(row)
        for s in data.get("skills", []):
            self.db.add(UserSkill(user_id=self.user.id, name=s, kind="technical", source=source))
        for s in data.get("soft_skills", []):
            self.db.add(UserSkill(user_id=self.user.id, name=s, kind="soft", source=source))

        employment = out.get("employment") or []
        if employment:
            for row in self.db.scalars(select(CareerHistoryEntry).where(CareerHistoryEntry.user_id == self.user.id)).all():
                self.db.delete(row)
            for i, e in enumerate(employment):
                self.db.add(CareerHistoryEntry(
                    user_id=self.user.id, title=e.get("title") or "Role", company=e.get("company"),
                    start=e.get("start"), end=e.get("end"), years=e.get("years"),
                    highlights=list(e.get("highlights") or []), order=i,
                ))
        self.db.flush()

    def _persist_assessment(self, out: dict, trigger: str) -> SkillAssessment:
        prev = self.latest_assessment()
        a = SkillAssessment(
            user_id=self.user.id, version=(prev.version + 1) if prev else 1, target_role=out["target_role"],
            readiness=out["readiness"], items=out["items"], trigger=trigger,
            summary={k: out.get(k) for k in ("priorities", "counts", "additional_strengths", "recommendations", "method")},
        )
        self.db.add(a)
        self.db.flush()
        return a

    def _persist_new_roadmap(self, out: dict, trigger: str) -> LearningRoadmap:
        for old in self.db.scalars(select(LearningRoadmap).where(LearningRoadmap.user_id == self.user.id, LearningRoadmap.is_active.is_(True))).all():
            old.is_active = False
        r = LearningRoadmap(
            user_id=self.user.id, version=1, planned_days=out["planned_days"], total_days=out["total_days"],
            hours_per_day=out["hours_per_day"], focus_skills=out["focus_skills"], difficulty=out["difficulty"],
            mini_project=out["mini_project"], is_active=True,
            changes=[{"version": 1, "at": _now().isoformat(), "trigger": trigger, "reason": f"Initial roadmap prioritising {', '.join(out['focus_skills'][:3])}.", "changes": []}],
        )
        self.db.add(r)
        self.db.flush()
        for t in out["tasks"]:
            self.db.add(LearningTask(roadmap_id=r.id, **{k: v for k, v in t.items() if k not in {"id", "completed"}}))
        self.db.flush()
        self.db.refresh(r)
        return r

    def _apply_adaptation(self, roadmap: LearningRoadmap, out: dict, trigger: str) -> None:
        """Sync the Learning Agent's revised task list into the DB. Completion state is never altered."""
        existing = {t.id: t for t in roadmap.tasks}
        for t in out["tasks"]:
            if t.get("id") and t["id"] in existing:
                row = existing[t["id"]]
                row.day, row.order, row.kind, row.title, row.description = t["day"], t["order"], t["kind"], t["title"], t["description"]
                row.added_by_adaptation = bool(t.get("added_by_adaptation"))
                row.adaptation_note = t.get("adaptation_note")
            elif not t.get("id"):
                self.db.add(LearningTask(roadmap_id=roadmap.id, **{k: v for k, v in t.items() if k not in {"id", "completed"}}))
        roadmap.version += 1
        roadmap.total_days = out["total_days"]
        roadmap.difficulty = out["difficulty"]
        roadmap.changes = list(roadmap.changes or []) + [{
            "version": roadmap.version, "at": _now().isoformat(), "trigger": trigger,
            "reason": out["reason"], "changes": out["changes"],
        }]
        self.db.flush()
        self.db.refresh(roadmap)

    # ================================================================ workflow A – comeback
    def _comeback_graph(self) -> StateGraph:
        g = StateGraph("comeback")
        g.add_node("goal", self._node_goal)
        g.add_node("profile", self._node_profile)
        g.add_node("evaluate_profile", self._node_evaluate_profile)
        g.add_node("skill_gap", self._node_skill_gap)
        g.add_node("learning", self._node_learning)
        g.add_node("opportunity", self._node_opportunity)
        g.add_node("plan", self._node_plan)
        g.set_entry_point("goal")
        g.add_edge("goal", "profile")
        g.add_edge("profile", "evaluate_profile")
        g.add_conditional_edges("evaluate_profile", lambda s: s["route"], {"continue": "skill_gap", "clarify": "plan"})
        g.add_conditional_edges("skill_gap", lambda s: s["route"], {"ok": "learning", "clarify": "plan"})
        g.add_edge("learning", "opportunity")
        g.add_edge("opportunity", "plan")
        g.add_edge("plan", END)
        return g

    def _node_goal(self, s: dict) -> dict:
        manual = s.get("manual") or {}
        target = manual.get("target_role") or (self.profile_data() or {}).get("target_role") or "a suitable role"
        steps = ["profile", "skill_gap", "learning", "opportunity", "plan"]
        self._decide(
            f"Goal: help {self.user.name} return to work as {target}. Execution plan: " + " → ".join(steps) + ".",
            next_agent="profile", action="Received career comeback goal and created execution plan",
            input_summary={"trigger": s["trigger"], "has_resume": bool(s.get("resume_text")), "onboarding_fields": sorted(k for k, v in manual.items() if v not in (None, "", []))},
            output_summary={"plan": steps},
        )
        return {}

    def _node_profile(self, s: dict) -> dict:
        existing = self.profile_data() or {}
        payload = {"resume_text": s.get("resume_text"), "manual": s.get("manual") or {}, "existing": existing, "existing_employment": self.employment()}
        result = self._execute("profile", "Extracted and structured the career profile", AGENTS["profile"].run, payload, next_agent=ORCHESTRATOR_KEY)
        out = dict(result.output, _mode=result.mode)
        self._persist_profile(out, out.get("source", "onboarding"))
        return {"profile_out": out}

    def _node_evaluate_profile(self, s: dict) -> dict:
        out = s["profile_out"]
        target = resolve_role(out["profile"].get("target_role"))
        if not target or target not in ROLES:
            # Intelligent fallback & skill-based suggestion so missing info doesn't block the comeback plan
            raw_skills = self.skills("technical") or out.get("profile", {}).get("skills", [])
            skills = [sk if isinstance(sk, str) else getattr(sk, "name", str(sk)) for sk in raw_skills]
            suggestions = suggest_roles(skills) if skills else []
            if suggestions and suggestions[0] in ROLES:
                target = suggestions[0]
            elif out.get("profile", {}).get("previous_role"):
                target = resolve_role(out["profile"]["previous_role"]) or "Full Stack Developer"
            else:
                target = "Full Stack Developer"

            out["profile"]["target_role"] = target
            prof_model = self.profile_model()
            if prof_model:
                prof_model.target_role = target
                if not prof_model.career_break_years:
                    prof_model.career_break_years = 2.0
                if not prof_model.career_break_reason:
                    prof_model.career_break_reason = "Career break for family care / skill transition"
                self.db.add(prof_model)
                self.db.flush()

        missing_other = [m for m in out.get("missing", []) if m != "target_role"]
        decision = f"Profile is verified and ready for roadmap generation (target track: {target})."
        if missing_other:
            decision += f" Minor gaps recorded for optional intake clarification: {', '.join(missing_other)}."
        decision += " Delegating to Skill Gap Agent."
        self._decide(decision, next_agent="skill_gap", action="Evaluated profile completeness",
                     input_summary={"missing": out.get("missing", [])}, output_summary={"route": "continue", "target_role": target})
        return {"route": "continue"}

    def _node_skill_gap(self, s: dict) -> dict:
        profile = self.profile_data()
        payload = {"profile": profile, "measured": self.measured_evidence(), "learning_credit": self.learning_credit()}
        result = self._execute("skill_gap", "Analysed skill gaps against the target role", AGENTS["skill_gap"].run, payload, next_agent=ORCHESTRATOR_KEY)
        out = result.output
        if out.get("error"):
            self._decide(out["message"], action="Reviewed skill-gap output", output_summary={"route": "clarify"})
            return {"route": "clarify", "needs_clarification": True}
        assessment = self._persist_assessment(out, s["trigger"])
        top = out["priorities"][:3]
        self._decide(
            f"Top priority gap is {top[0] if top else 'none'}; forwarding the prioritised gap report to the Learning Agent"
            + (f" so it schedules {top[0]} first." if top else "."),
            next_agent="learning", action="Reviewed skill-gap report",
            input_summary={"readiness": out["readiness"]}, output_summary={"top_priorities": top, "assessment_version": assessment.version},
        )
        return {"route": "ok", "assessment": out}

    def _node_learning(self, s: dict) -> dict:
        roadmap = self.active_roadmap()
        progress = sum(1 for t in roadmap.tasks if t.completed) if roadmap else 0
        if roadmap and progress and not s.get("force_new_roadmap"):
            self._decide(
                f"Kept the existing roadmap (v{roadmap.version}) because {progress} task(s) are already completed; "
                "progress is preserved and future changes will come from assessment-driven adaptation.",
                next_agent="opportunity", action="Decided whether to regenerate the roadmap",
                output_summary={"roadmap_id": roadmap.id, "completed_tasks": progress},
            )
            return {"roadmap_kept": True}
        profile = self.profile_data()
        payload = {"assessment": s["assessment"], "days": profile.get("plan_days") or 30, "hours_per_day": profile.get("hours_per_day") or 2}
        result = self._execute("learning", "Generated personalised learning roadmap", AGENTS["learning"].generate, payload, next_agent=ORCHESTRATOR_KEY)
        roadmap = self._persist_new_roadmap(result.output, s["trigger"])
        self._decide(
            f"Roadmap ready ({roadmap.total_days} days, {roadmap.hours_per_day:g} h/day, focus: {', '.join(roadmap.focus_skills[:3])}). "
            "Asking the Opportunity Agent to match roles using profile, preferences and skills being learned.",
            next_agent="opportunity", action="Accepted roadmap", roadmap_changed=True,
            output_summary={"roadmap_id": roadmap.id, "first_focus": roadmap.focus_skills[:1]},
        )
        return {"roadmap_kept": False}

    def _node_opportunity(self, s: dict) -> dict:
        roadmap = self.active_roadmap()
        payload = {"profile": self.profile_data(), "opportunities": self.opportunity_rows(),
                   "learning_skills": roadmap.focus_skills if roadmap else [], "filters": {}}
        result = self._execute("opportunity", "Matched and ranked opportunities", AGENTS["opportunity"].run, payload, next_agent=ORCHESTRATOR_KEY)
        top = [r for r in result.output["results"] if r["role_fit"]][:3]
        self._decide(
            f"Shortlisted {len(top)} best-fit opportunities for the comeback plan (illustrative demo listings unless marked verified).",
            next_agent=ORCHESTRATOR_KEY, action="Reviewed opportunity matches",
            output_summary={"top": [{"id": r["id"], "title": r["title"], "score": r["match_score"]} for r in top]},
        )
        return {"top_opportunities": top}

    def _node_plan(self, s: dict) -> dict:
        if s.get("needs_clarification"):
            reason = "Waiting for clarification (target role) before analysing skills."
        elif s.get("plan_reason"):
            reason = s["plan_reason"]
        else:
            reason = f"Plan generated after {s.get('trigger', 'update')}."
        plan = self._update_plan(trigger=s.get("trigger", "update"), reason=reason)
        self._decide(
            f"Dynamic Career Comeback Plan updated to v{plan['version']}. Next recommended action: {plan['data']['next_action']['title']}.",
            action="Updated Dynamic Career Comeback Plan",
            output_summary={"plan_version": plan["version"], "readiness": plan["data"]["readiness"]["overall"], "next_action": plan["data"]["next_action"]["title"]},
        )
        return {"plan": plan}

    def run_comeback_workflow(self, *, resume_text: str | None = None, manual: dict | None = None,
                              trigger: str = "onboarding", force_new_roadmap: bool = False) -> dict[str, Any]:
        """Workflow A. Returns a structured summary of the run."""
        if not resume_text and not manual and self.profile_model() is None:
            raise OrchestratorError("no_input", "Provide a resume or onboarding information to start.", 422)
        run_id = self._start_run("comeback")
        state = {"trigger": trigger, "resume_text": resume_text, "manual": manual or {}, "force_new_roadmap": force_new_roadmap}
        try:
            state = self._comeback_graph().invoke(state)
            self.db.commit()
        except OrchestratorError:
            raise
        except Exception as exc:
            self.db.rollback()
            log.exception("Comeback workflow failed")
            raise OrchestratorError("workflow_failed", f"Career comeback workflow failed: {exc}", 500) from exc
        return {
            "run_id": run_id, "trace": state["trace"],
            "needs_clarification": bool(state.get("needs_clarification")),
            "clarification_questions": (state.get("profile_out") or {}).get("clarification_questions", []),
            "suggested_roles": (state.get("profile_out") or {}).get("suggested_roles", []),
            "roadmap_kept": state.get("roadmap_kept"),
            "plan": state.get("plan"),
        }

    # ================================================================ workflow B – adaptive
    def _adaptive_graph(self) -> StateGraph:
        g = StateGraph("adaptive")
        g.add_node("receive", self._node_receive)
        g.add_node("analyze", self._node_analyze)
        g.add_node("evaluate", self._node_evaluate)
        g.add_node("adapt", self._node_adapt)
        g.add_node("reassess", self._node_reassess)
        g.add_node("opportunity", self._node_opportunity)
        g.add_node("plan", self._node_plan)
        g.set_entry_point("receive")
        g.add_edge("receive", "analyze")
        g.add_edge("analyze", "evaluate")
        g.add_conditional_edges("evaluate", lambda s: s["route"], {"adapt": "adapt", "no_change": "reassess"})
        g.add_edge("adapt", "reassess")
        g.add_edge("reassess", "opportunity")
        g.add_edge("opportunity", "plan")
        g.add_edge("plan", END)
        return g

    def _node_receive(self, s: dict) -> dict:
        nxt = "confidence" if s["source"] == "interview" else ORCHESTRATOR_KEY
        self._decide(
            f"Received {s['source']} results; routing them to the "
            + ("Confidence Agent for a session summary." if s["source"] == "interview" else "evaluation step."),
            next_agent=nxt, action=f"Received {s['source']} assessment results",
            input_summary={k: v for k, v in s.get("context", {}).items() if k != "feedback"},
        )
        return {}

    def _node_analyze(self, s: dict) -> dict:
        if s["source"] == "interview":
            result = self._execute("confidence", "Summarised interview session and identified weak topics",
                                   AGENTS["confidence"].summarize, s["context"]["feedback"], next_agent=ORCHESTRATOR_KEY)
            out = result.output
            session = self.db.get(InterviewSession, s["context"]["session_id"])
            if session is not None:
                session.overall_score = out["overall"]
                session.weak_topics = out["weak_topics"]
            return {"signals": out["signals"], "interview_summary": out}
        return {"signals": s.get("signals", [])}

    def _node_evaluate(self, s: dict) -> dict:
        signals = s["signals"]
        weak = [x for x in signals if x["score"] < WEAK]
        moderate = [x for x in signals if WEAK <= x["score"] < MODERATE]
        strong = [x for x in signals if x["score"] >= STRONG]
        roadmap = self.active_roadmap()
        actionable = weak + moderate + strong
        if not roadmap or not actionable:
            why = "no active roadmap exists yet" if not roadmap else "all scores are within the expected range (80–84%)"
            self._decide(f"No roadmap change needed because {why}. Refreshing the skill assessment with the new evidence.",
                         next_agent="skill_gap", action="Evaluated assessment evidence",
                         input_summary={"signals": [{"skill": x["skill"], "score": x["score"]} for x in signals]}, output_summary={"route": "no_change"})
            return {"route": "no_change", "plan_reason": f"New {s['source']} evidence recorded; roadmap unchanged."}
        parts = []
        if weak:
            parts.append("weak: " + ", ".join(f"{x['skill']} {x['score']:.0f}%" for x in weak))
        if moderate:
            parts.append("close to target: " + ", ".join(f"{x['skill']} {x['score']:.0f}%" for x in moderate))
        if strong:
            parts.append("ahead: " + ", ".join(f"{x['skill']} {x['score']:.0f}%" for x in strong))
        self._decide(
            f"Assessment shows {'; '.join(parts)}. Requesting the Learning Agent to adapt the remaining roadmap (completed tasks are preserved).",
            next_agent="learning", action="Evaluated assessment evidence",
            input_summary={"signals": [{"skill": x["skill"], "score": x["score"]} for x in signals]},
            output_summary={"route": "adapt", "weak_skills": [x["skill"] for x in weak]},
        )
        return {"route": "adapt", "actionable": actionable}

    def _node_adapt(self, s: dict) -> dict:
        roadmap = self.active_roadmap()
        tasks = [task_dict(t) for t in self.roadmap_tasks(roadmap)]
        completed_before = {t["id"] for t in tasks if t["completed"]}
        payload = {"tasks": tasks, "signals": s["actionable"], "hours_per_day": roadmap.hours_per_day,
                   "total_days": roadmap.total_days, "difficulty": roadmap.difficulty}
        result = self._execute("learning", "Adapted the learning roadmap from assessment feedback", AGENTS["learning"].adapt, payload, next_agent=ORCHESTRATOR_KEY)
        out = result.output
        if out["changed"]:
            self._apply_adaptation(roadmap, out, trigger=s["source"])
        still_completed = {t.id for t in roadmap.tasks if t.completed}
        preserved = completed_before <= still_completed
        self._decide(
            (f"Roadmap updated to v{roadmap.version}: {out['reason']}." if out["changed"] else out["reason"])
            + (" All previously completed tasks were preserved." if preserved else " WARNING: completion state mismatch detected."),
            next_agent="skill_gap", action="Reviewed roadmap adaptation", roadmap_changed=out["changed"],
            output_summary={"roadmap_version": roadmap.version, "changes": out["changes"][:8], "completed_preserved": preserved},
        )
        return {"roadmap_changed": out["changed"], "adaptation": {"reason": out["reason"], "changes": out["changes"], "roadmap_version": roadmap.version},
                "plan_reason": f"Roadmap adapted after {s['source']}: {out['reason']}"}

    def _node_reassess(self, s: dict) -> dict:
        profile = self.profile_data()
        if not profile or not resolve_role(profile.get("target_role")):
            self._decide("Skipped re-assessment: no supported target role yet.", action="Skipped skill re-assessment")
            return {}
        payload = {"profile": profile, "measured": self.measured_evidence(), "learning_credit": self.learning_credit()}
        result = self._execute("skill_gap", "Re-assessed skills with measured evidence", AGENTS["skill_gap"].run, payload, next_agent=ORCHESTRATOR_KEY)
        if not result.output.get("error"):
            self._persist_assessment(result.output, f"{s['source']}_feedback")
        return {"assessment": result.output}

    def run_adaptive_workflow(self, *, source: str, signals: list[dict] | None = None, context: dict | None = None) -> dict[str, Any]:
        """Workflow B. `source` is "quiz" or "interview"."""
        if source not in {"quiz", "interview"}:
            raise OrchestratorError("invalid_source", "Assessment source must be 'quiz' or 'interview'.", 422)
        run_id = self._start_run("adaptive")
        state = {"trigger": f"{source}_feedback", "source": source, "signals": signals or [], "context": context or {}}
        try:
            state = self._adaptive_graph().invoke(state)
            self.db.commit()
        except OrchestratorError:
            raise
        except Exception as exc:
            self.db.rollback()
            log.exception("Adaptive workflow failed")
            raise OrchestratorError("workflow_failed", f"Adaptive learning workflow failed: {exc}", 500) from exc
        return {
            "run_id": run_id, "trace": state["trace"], "signals": state.get("signals", []),
            "roadmap_changed": bool(state.get("roadmap_changed")), "adaptation": state.get("adaptation"),
            "interview_summary": state.get("interview_summary"), "plan": state.get("plan"),
        }

    # ---------------------------------------------------------------- quiz entry point
    def submit_quiz(self, skill: str, answers: dict[str, int]) -> dict[str, Any]:
        bank = QUIZZES.get(skill)
        if not bank:
            raise OrchestratorError("quiz_not_found", f"No assessment is available for {skill}.", 404)
        graded, correct = [], 0
        for q in bank:
            selected = answers.get(q["id"])
            ok = selected == q["answer"]
            correct += int(ok)
            graded.append({"id": q["id"], "question": q["question"], "selected": selected, "correct_index": q["answer"], "is_correct": ok, "explanation": q["explanation"]})
        percent = round(100 * correct / len(bank), 1)
        result = QuizResult(user_id=self.user.id, skill=skill, correct=correct, total=len(bank), percent=percent, answers=graded)
        self.db.add(result)
        # Mark the earliest pending quiz task for this skill as done.
        for t in self.roadmap_tasks():
            if t.skill == skill and t.kind == "quiz" and not t.completed:
                t.completed, t.completed_at = True, _now()
                break
        self.db.flush()
        self._start_run("quiz")
        self._decide(f"Graded the {skill} assessment with the answer-key tool: {correct}/{len(bank)} ({percent:.0f}%). Forwarding the score to the adaptive learning workflow.",
                     next_agent="learning", action=f"Graded {skill} assessment", output_summary={"skill": skill, "percent": percent})
        self.db.commit()
        outcome = self.run_adaptive_workflow(source="quiz", signals=[{"skill": skill, "score": percent, "source": "quiz"}],
                                             context={"quiz_result_id": result.id, "skill": skill})
        return {"result": {"id": result.id, "skill": skill, "correct": correct, "total": len(bank), "percent": percent, "answers": graded}, "orchestration": outcome}

    # ---------------------------------------------------------------- interview entry points
    def start_interview(self, interview_type: str = "mixed") -> dict[str, Any]:
        if interview_type not in {"technical", "hr", "mixed"}:
            raise OrchestratorError("invalid_type", "Interview type must be technical, hr or mixed.", 422)
        profile = self.profile_data()
        if profile is None:
            raise OrchestratorError("profile_required", "Complete your profile before starting a mock interview.", 409)
        a = self.latest_assessment()
        priorities = (a.summary or {}).get("priorities", []) if a else []
        session = InterviewSession(user_id=self.user.id, interview_type=interview_type, questions=[])
        self.db.add(session)
        self.db.flush()
        self._start_run("interview", run_id=f"int-{session.id}")
        result = self._execute("confidence", f"Prepared a {interview_type} mock interview", AGENTS["confidence"].create_session,
                               {"interview_type": interview_type, "profile": profile, "priorities": priorities, "count": 4})
        if not result.output["questions"]:
            self.db.rollback()
            raise OrchestratorError("no_questions", "No interview questions are available for this profile yet.", 409)
        session.questions = result.output["questions"]
        self.db.commit()
        self.db.refresh(session)
        return session_dict(session)

    def _session(self, session_id: int) -> InterviewSession:
        s = self.db.get(InterviewSession, session_id)
        if s is None or s.user_id != self.user.id:
            raise OrchestratorError("session_not_found", "Interview session not found.", 404)
        return s

    def answer_interview(self, session_id: int, question_id: str, answer: str) -> dict[str, Any]:
        session = self._session(session_id)
        if session.status != "in_progress":
            raise OrchestratorError("session_completed", "This interview session is already completed.", 409)
        if question_id not in {q["id"] for q in session.questions} or question_id not in ALL_QUESTIONS:
            raise OrchestratorError("question_not_found", "That question is not part of this session.", 404)
        if len(answer.strip()) < 2:
            raise OrchestratorError("empty_answer", "Please write an answer before submitting.", 422)
        roadmap = self.active_roadmap()
        self._start_run("interview", run_id=f"int-{session.id}")
        result = self._execute("confidence", "Evaluated interview answer", AGENTS["confidence"].evaluate,
                               {"question": ALL_QUESTIONS[question_id], "answer": answer, "profile": self.profile_data() or {},
                                "focus_skills": roadmap.focus_skills if roadmap else []}, next_agent=ORCHESTRATOR_KEY)
        out = result.output
        for old in [f for f in session.feedback if f.question_id == question_id]:
            self.db.delete(old)  # re-answering replaces the earlier attempt
        fb = InterviewFeedback(
            session_id=session.id, question_id=question_id, question=out["question"], question_type=out["question_type"],
            skill=out["skill"], answer=answer, scores=out["scores"], overall=out["overall"], strengths=out["strengths"],
            improvements=out["improvements"], missing_points=out["missing_points"], improved_answer=out["improved_answer"], mode=result.mode,
        )
        self.db.add(fb)
        if out["weak"]:
            self._decide(f"Weak topic detected ({out['skill']}, {out['overall']:.0f}/100). It will be sent to the Learning Agent when the session is completed.",
                         next_agent="learning", action="Flagged weak interview topic", output_summary={"skill": out["skill"], "overall": out["overall"]})
        self.db.commit()
        self.db.refresh(fb)
        return {**feedback_dict(fb), "weak": out["weak"], "criteria_weights": out["criteria_weights"]}

    def complete_interview(self, session_id: int) -> dict[str, Any]:
        session = self._session(session_id)
        if session.status == "completed":
            raise OrchestratorError("session_completed", "This interview session is already completed.", 409)
        if not session.feedback:
            raise OrchestratorError("no_answers", "Answer at least one question before completing the session.", 422)
        feedback = [{"overall": f.overall, "skill": f.skill, "missing_points": f.missing_points or []} for f in session.feedback]
        session.status, session.completed_at = "completed", _now()
        self.db.commit()
        outcome = self.run_adaptive_workflow(source="interview", context={"session_id": session.id, "feedback": feedback})
        self.db.refresh(session)
        return {"session": session_dict(session), "orchestration": outcome}

    # ================================================================ workflow C – application
    def _application_graph(self) -> StateGraph:
        g = StateGraph("application")
        g.add_node("receive_selection", self._node_receive_selection)
        g.add_node("application", self._node_application)
        g.add_node("review_gate", self._node_review_gate)
        g.add_node("plan", self._node_plan)
        g.set_entry_point("receive_selection")
        g.add_edge("receive_selection", "application")
        g.add_edge("application", "review_gate")
        g.add_edge("review_gate", "plan")
        g.add_edge("plan", END)
        return g

    def _node_receive_selection(self, s: dict) -> dict:
        app: Application = s["application"]
        self._decide(f"User selected '{app.opportunity.title}'. Passing verified profile data and completed learning to the Application Agent.",
                     next_agent="application", action="Received selected opportunity",
                     input_summary={"opportunity_id": app.opportunity_id, "is_demo": app.opportunity.is_demo})
        return {}

    def _node_application(self, s: dict) -> dict:
        app: Application = s["application"]
        learned, projects = self.completed_learning()
        payload = {"profile": self.profile_data(), "employment": self.employment(), "opportunity": opportunity_dict(app.opportunity),
                   "completed_learning": learned, "completed_projects": projects}
        result = self._execute("application", "Generated tailored resume and cover letter", AGENTS["application"].run, payload, next_agent=ORCHESTRATOR_KEY)
        out = result.output
        resume = self.db.scalar(select(ResumeDraft).where(ResumeDraft.application_id == app.id))
        cover = self.db.scalar(select(CoverLetter).where(CoverLetter.application_id == app.id))
        if resume is None:
            resume = ResumeDraft(user_id=self.user.id, application_id=app.id, content="")
            self.db.add(resume)
        if cover is None:
            cover = CoverLetter(user_id=self.user.id, application_id=app.id, content="")
            self.db.add(cover)
        resume.content, resume.tailoring_notes, resume.mode, resume.edited_by_user = out["resume"], out["tailoring_notes"], result.mode, False
        cover.content, cover.mode, cover.edited_by_user = out["cover_letter"], result.mode, False
        return {"draft": out}

    def _node_review_gate(self, s: dict) -> dict:
        app: Application = s["application"]
        app.approved_at = None  # new content always needs fresh human approval
        self._set_status(app, "drafted", "Drafts generated by the Application Agent")
        self._decide("Drafts saved with status 'drafted'. Human review and approval are required; ReStartHer never submits applications automatically.",
                     action="Applied human-approval gate", output_summary={"application_id": app.id, "status": app.status, "requires_human_approval": True})
        return {"plan_reason": f"Application drafts prepared for '{app.opportunity.title}' – awaiting your review."}

    def _set_status(self, app: Application, status: str, note: str) -> None:
        app.status = status
        app.history = list(app.history or []) + [{"status": status, "at": _now().isoformat(), "note": note}]

    def _application(self, application_id: int) -> Application:
        app = self.db.get(Application, application_id)
        if app is None or app.user_id != self.user.id:
            raise OrchestratorError("application_not_found", "Application not found.", 404)
        return app

    def track_opportunity(self, opportunity_id: int) -> Application:
        """Create (or return) the application record for a selected opportunity."""
        opp = self.db.get(Opportunity, opportunity_id)
        if opp is None:
            raise OrchestratorError("opportunity_not_found", "Opportunity not found.", 404)
        app = self.db.scalar(select(Application).where(Application.user_id == self.user.id, Application.opportunity_id == opportunity_id))
        if app is None:
            app = Application(user_id=self.user.id, opportunity_id=opportunity_id, status="saved",
                              history=[{"status": "saved", "at": _now().isoformat(), "note": "Opportunity selected"}])
            self.db.add(app)
            self.db.flush()
        return app

    def prepare_application(self, opportunity_id: int) -> dict[str, Any]:
        """Workflow C. Generates drafts; never submits anything."""
        if self.profile_model() is None:
            raise OrchestratorError("profile_required", "Complete your profile before preparing applications.", 409)
        app = self.track_opportunity(opportunity_id)
        run_id = self._start_run("application")
        try:
            state = self._application_graph().invoke({"trigger": "application", "application": app})
            self.db.commit()
        except OrchestratorError:
            raise
        except Exception as exc:
            self.db.rollback()
            log.exception("Application workflow failed")
            raise OrchestratorError("workflow_failed", f"Application workflow failed: {exc}", 500) from exc
        return {"run_id": run_id, "trace": state["trace"], "application": self.application_view(app.id), "plan": state.get("plan")}

    def application_view(self, application_id: int) -> dict[str, Any]:
        app = self._application(application_id)
        resume = self.db.scalar(select(ResumeDraft).where(ResumeDraft.application_id == app.id))
        cover = self.db.scalar(select(CoverLetter).where(CoverLetter.application_id == app.id))
        return application_dict(app, resume, cover)

    def save_drafts(self, application_id: int, resume: str | None = None, cover_letter: str | None = None) -> dict[str, Any]:
        """Save user edits. Editing invalidates any earlier approval."""
        app = self._application(application_id)
        r = self.db.scalar(select(ResumeDraft).where(ResumeDraft.application_id == app.id))
        c = self.db.scalar(select(CoverLetter).where(CoverLetter.application_id == app.id))
        if r is None or c is None:
            raise OrchestratorError("no_drafts", "Generate drafts before editing them.", 409)
        if resume is not None:
            r.content, r.edited_by_user = resume, True
        if cover_letter is not None:
            c.content, c.edited_by_user = cover_letter, True
        if app.approved_at is not None:
            app.approved_at = None
            self._set_status(app, "drafted", "Edited after approval – approval reset")
        self.db.commit()
        return self.application_view(app.id)

    def approve_application(self, application_id: int) -> dict[str, Any]:
        """Record the person's explicit approval. This does NOT submit anything externally."""
        app = self._application(application_id)
        if self.db.scalar(select(ResumeDraft).where(ResumeDraft.application_id == app.id)) is None:
            raise OrchestratorError("no_drafts", "Generate and review drafts before approving.", 409)
        app.approved_at = _now()
        self._set_status(app, "ready_for_review", "Approved by the user – ready to send manually")
        self._start_run("application")
        self._decide("Human approval recorded. The drafts are ready for the user to send themselves; nothing was submitted by ReStartHer.",
                     action="Recorded human approval", output_summary={"application_id": app.id})
        self.db.commit()
        self._update_plan(trigger="application_approved", reason=f"Application for '{app.opportunity.title}' approved by you.")
        self.db.commit()
        return self.application_view(app.id)

    def update_application_status(self, application_id: int, status: str, note: str = "") -> dict[str, Any]:
        app = self._application(application_id)
        if status not in STATUSES:
            raise OrchestratorError("invalid_status", f"Status must be one of: {', '.join(STATUSES)}.", 422)
        if status in POST_APPROVAL_STATUSES and app.approved_at is None:
            raise OrchestratorError("approval_required", "Please review and approve the drafts before marking this application as applied.", 409)
        self._set_status(app, status, note or "Updated by the user")
        self.db.commit()
        self._update_plan(trigger="application_status", reason=f"Application '{app.opportunity.title}' moved to {status}.")
        self.db.commit()
        return self.application_view(app.id)

    # ================================================================ plan, readiness, next action
    def readiness(self) -> dict[str, Any]:
        a = self.latest_assessment()
        tasks = self.roadmap_tasks()
        return compute_readiness(self.profile_data(), a.readiness if a else None,
                                 sum(1 for t in tasks if t.completed), len(tasks), self.interview_scores())

    def rank_opportunities(self, filters: dict | None = None) -> list[dict]:
        profile = self.profile_data()
        if profile is None:
            return []
        roadmap = self.active_roadmap()
        out = AGENTS["opportunity"].run({"profile": profile, "opportunities": self.opportunity_rows(),
                                         "learning_skills": roadmap.focus_skills if roadmap else [], "filters": filters or {}})
        return out.output["results"]

    def next_action(self) -> dict[str, Any]:
        profile = self.profile_data()
        if profile is None:
            return {"title": "Upload your resume or complete onboarding", "description": "The Profile Agent needs your background to start.", "agent": "profile", "route": "/onboarding"}
        if not resolve_role(profile.get("target_role")):
            return {"title": "Choose your target role", "description": "The Skill Gap Agent needs a target role to compare your skills against.", "agent": "profile", "route": "/profile"}
        a = self.latest_assessment()
        if a is None:
            return {"title": "Run your skill-gap analysis", "description": "See which skills to refresh first.", "agent": "skill_gap", "route": "/skills"}
        roadmap = self.active_roadmap()
        if roadmap is None:
            return {"title": "Generate your learning roadmap", "description": "Turn your skill gaps into a daily plan.", "agent": "learning", "route": "/learning"}
        tasks = self.roadmap_tasks(roadmap)
        pending = [t for t in tasks if not t.completed]
        adapted = [t for t in pending if t.added_by_adaptation]
        if adapted:
            t = adapted[0]
            return {"title": f"Complete: {t.title}", "description": t.adaptation_note or "Added by the Learning Agent after your latest assessment.", "agent": "learning", "route": "/learning"}
        priorities = (a.summary or {}).get("priorities", [])
        quizzed = {q for q in self.db.scalars(select(QuizResult.skill).where(QuizResult.user_id == self.user.id)).all()}
        top_quiz = next((s for s in priorities[:2] if s in QUIZZES and s not in quizzed), None)
        if top_quiz:
            return {"title": f"Complete the {top_quiz} assessment", "description": f"Your Learning Agent recommends this because {top_quiz} is a top priority for {a.target_role} roles; your score will personalise the roadmap.", "agent": "learning", "route": "/learning"}
        has_interview = self.db.scalar(select(func.count(InterviewSession.id)).where(InterviewSession.user_id == self.user.id, InterviewSession.status == "completed"))
        if not has_interview:
            return {"title": "Practise a mock interview", "description": "The Confidence Agent will give judgement-free feedback and update your plan.", "agent": "confidence", "route": "/interview"}
        apps = self.db.scalars(select(Application).where(Application.user_id == self.user.id)).all()
        awaiting = [x for x in apps if x.status == "drafted" and x.approved_at is None]
        if awaiting:
            return {"title": "Review and approve your application draft", "description": f"Your draft for '{awaiting[0].opportunity.title}' is waiting for your review.", "agent": "application", "route": "/applications"}
        if pending:
            t = pending[0]
            return {"title": f"Continue Day {t.day}: {t.title}", "description": f"{t.minutes} min · {t.skill}", "agent": "learning", "route": "/learning"}
        if not apps:
            return {"title": "Explore matched opportunities", "description": "The Opportunity Agent has ranked roles that fit your skills and preferences.", "agent": "opportunity", "route": "/opportunities"}
        return {"title": "Keep your momentum", "description": "Track your applications and keep practising interviews.", "agent": "orchestrator", "route": "/dashboard"}

    def _interview_recommendations(self) -> list[str]:
        last = self.db.scalar(select(InterviewSession).where(InterviewSession.user_id == self.user.id, InterviewSession.status == "completed").order_by(InterviewSession.id.desc()).limit(1))
        if last is None:
            return ["Start with a mixed mock interview to practise your career-break answer and one technical topic."]
        recs = [f"Revise {w['skill']}" + (f": {', '.join(w.get('missing_points', [])[:2])}" if w.get("missing_points") else "") for w in (last.weak_topics or [])]
        hr = [f.overall for f in last.feedback if not f.skill]
        if hr and sum(hr) / len(hr) < 65:
            recs.append("Practise HR answers aloud with the STAR structure; keep the career-break answer brief and forward-looking.")
        if not recs:
            recs.append(f"Great progress (last session {last.overall_score or 0:.0f}/100). Try a technical session on your next priority skill.")
        return recs

    def build_plan_data(self) -> dict[str, Any]:
        profile = self.profile_data()
        a = self.latest_assessment()
        roadmap = self.active_roadmap()
        rd = roadmap_dict(roadmap) if roadmap else None
        upcoming = []
        if rd and rd["current_day"]:
            upcoming = [t for t in rd["tasks"] if not t["completed"] and t["day"] < rd["current_day"] + 3][:9]
        gaps = []
        if a:
            gaps = sorted([i for i in a.items if i.get("priority_rank")], key=lambda i: i["priority_rank"])[:5]
        opps = [r for r in self.rank_opportunities() if r["role_fit"]][:3] if profile else []
        return {
            "career_summary": None if profile is None else {
                "name": profile.get("full_name") or self.user.name, "previous_role": profile.get("previous_role"),
                "experience_years": profile.get("experience_years"), "career_break_years": profile.get("career_break_years"),
                "target_role": profile.get("target_role"), "skills": profile.get("skills", []),
                "transferable_skills": profile.get("transferable_skills", []), "work_preferences": profile.get("work_preferences", []),
                "hours_per_day": profile.get("hours_per_day"), "location_preference": profile.get("location_preference"),
            },
            "priority_gaps": [{"skill": g["skill"], "status": g["status"], "current_level": g["current_level"], "target_level": g["target_level"],
                               "priority": g["priority"], "measured": g["measured"], "why": g["why"]} for g in gaps],
            "learning_roadmap": None if rd is None else {
                "roadmap_id": rd["id"], "version": rd["version"], "planned_days": rd["planned_days"], "total_days": rd["total_days"],
                "hours_per_day": rd["hours_per_day"], "focus_skills": rd["focus_skills"], "progress": rd["progress"],
                "current_day": rd["current_day"], "upcoming_tasks": upcoming, "last_change": (rd["changes"] or [None])[-1],
            },
            "interview_preparation": self._interview_recommendations() if profile else [],
            "suitable_opportunities": [{"id": o["id"], "title": o["title"], "employer_label": o["employer_label"], "arrangement": o["arrangement"],
                                        "employment_type": o["employment_type"], "match_score": o["match_score"], "match_label": o["match_label"],
                                        "is_demo": o["is_demo"]} for o in opps],
            "readiness": self.readiness(),
            "next_action": self.next_action(),
            "ai_mode": settings.ai_mode,
        }

    def _update_plan(self, *, trigger: str, reason: str) -> dict[str, Any]:
        plan = self.db.scalar(select(CareerPlan).where(CareerPlan.user_id == self.user.id))
        data = self.build_plan_data()
        profile = data["career_summary"]
        goal = f"Return to work as {profile['target_role']}" if profile and profile.get("target_role") else "Define your comeback goal"
        if plan is None:
            plan = CareerPlan(user_id=self.user.id, version=1, goal=goal, data=data,
                              change_log=[{"version": 1, "at": _now().isoformat(), "trigger": trigger, "reason": reason}])
            self.db.add(plan)
        else:
            plan.version += 1
            plan.goal, plan.data = goal, data
            plan.change_log = list(plan.change_log or []) + [{"version": plan.version, "at": _now().isoformat(), "trigger": trigger, "reason": reason}]
        self.db.flush()
        return self.plan_view(plan)

    def plan_view(self, plan: CareerPlan | None = None) -> dict[str, Any] | None:
        plan = plan or self.db.scalar(select(CareerPlan).where(CareerPlan.user_id == self.user.id))
        if plan is None:
            return None
        return {"version": plan.version, "goal": plan.goal, "data": plan.data, "change_log": plan.change_log,
                "updated_at": plan.updated_at.isoformat() if plan.updated_at else None}

    # ================================================================ introspection
    def workflow_definitions(self) -> list[dict[str, Any]]:
        return [self._comeback_graph().describe(), self._adaptive_graph().describe(), self._application_graph().describe()]

    @staticmethod
    def agent_catalog() -> list[dict[str, Any]]:
        return [ORCHESTRATOR_META] + [type(a).meta() for a in AGENTS.values()]


def assessment_view(a: SkillAssessment | None) -> dict | None:
    """Convenience re-export for callers that need the latest assessment dict."""
    return assessment_dict(a)


__all__ = ["CareerOrchestrator", "OrchestratorError", "AGENTS", "ORCHESTRATOR_META", "assessment_view"]

"""Agent 2 – Skill Gap Analysis Agent.

Compares the profile with the target role's requirement profile and produces a
prioritised gap report for the Learning Agent.

Proficiency levels (0–100) come from a documented, deterministic method – never
from an unsupported LLM guess:

  1. Measured evidence wins. If the person has taken a ReStartHer quiz for the skill
     (or answered technical interview questions on it), the level is the measured
     score (average of quiz % and interview technical score when both exist).
  2. Otherwise, for skills found in the resume/onboarding (rule-based estimate):
        base   = 60 + 4 × min(experience_years, 8)          (max 92)
        decay  = min(35, career_break_years × rate)         rate: fast 7, moderate 4, stable 2 per year
        level  = base − decay
     Decay only estimates which tools changed most while the person was away; it
     says nothing about ability.
  3. Skills not yet in the profile start at 0, plus a learning credit of up to 30
     points proportional to completed roadmap tasks for that skill.

Status: strong (level ≥ target), outdated (known, fast-evolving, break ≥ 2 years,
below target), needs_revision (known, below target), developing (new but learning
credit > 0), missing.

Priority: core-tier gaps first, then important, then nice; within a tier, larger
gaps first. Readiness = Σ min(level, target)·w / Σ target·w with tier weights 3/2/1.
"""
from __future__ import annotations

from typing import Any

from agents.base import AgentResult, BaseAgent
from knowledge.roles import ROLES, TIER_ORDER, TIER_WEIGHT, resolve_role
from knowledge.skills import MAX_DECAY, VOLATILITY_DECAY_PER_YEAR, volatility

PRIORITY_LABEL = {"core": "High", "important": "Medium", "nice": "Low"}


class SkillGapAgent(BaseAgent):
    key = "skill_gap"
    name = "Skill Gap Analysis Agent"
    description = "Compares existing skills with target-role requirements and prioritises what to learn first."
    responsibilities = [
        "Compare profile skills with target-role requirements",
        "Classify strong, outdated, needs-revision, developing and missing skills",
        "Explain why each gap matters and prioritise core gaps first",
        "Use measured quiz/interview evidence whenever available",
        "Produce a readiness assessment for the Learning Agent",
    ]
    inputs = ["Structured profile", "Quiz & interview evidence", "Learning progress"]
    outputs = ["Prioritised skill-gap report", "Skill readiness"]

    def run(self, payload: dict[str, Any]) -> AgentResult:
        profile: dict[str, Any] = payload["profile"]
        measured: dict[str, dict] = payload.get("measured") or {}
        learning_credit: dict[str, float] = payload.get("learning_credit") or {}

        role = resolve_role(profile.get("target_role"))
        if not role:
            return AgentResult(
                output={"error": "target_role_unknown", "message": "A supported target role is needed before analysing skill gaps."},
                summary="Cannot analyse gaps: target role missing or unsupported.",
                log_input={"target_role": profile.get("target_role")},
                log_output={"error": "target_role_unknown"},
            )

        owned = {s.lower(): s for s in profile.get("skills", [])}
        exp = float(profile.get("experience_years") or 0)
        brk = float(profile.get("career_break_years") or 0)
        base = min(92.0, 60.0 + 4.0 * min(exp, 8.0))

        items: list[dict[str, Any]] = []
        for req in ROLES[role]["requirements"]:
            skill, tier, target = req["skill"], req["tier"], req["target"]
            known = skill.lower() in owned
            vol = volatility(skill)
            m = measured.get(skill)
            credit = round(30 * min(1.0, learning_credit.get(skill, 0.0)), 1)
            if m is not None:
                level = float(m["score"])
                basis = f"Measured: {m['source']} score {m['score']:.0f}%"
                is_measured = True
            elif known:
                decay = min(MAX_DECAY, brk * VOLATILITY_DECAY_PER_YEAR[vol])
                level = base - decay + credit
                basis = (
                    f"Estimated from {exp:g} yrs experience"
                    + (f", refreshed for a {brk:g}-year break ({vol}-evolving skill)" if decay else "")
                    + (f", +{credit:g} learning credit" if credit else "")
                )
                is_measured = False
            else:
                level = credit
                basis = "Not in profile yet" + (f"; +{credit:g} learning credit" if credit else "")
                is_measured = False
            level = round(max(0.0, min(100.0, level)), 1)
            gap = round(max(0.0, target - level), 1)

            if level >= target:
                status = "strong"
            elif known and vol == "fast" and brk >= 2 and not is_measured:
                status = "outdated"
            elif known or is_measured:
                status = "needs_revision"
            elif level > 0:
                status = "developing"
            else:
                status = "missing"

            items.append({
                "skill": skill, "tier": tier, "target_level": target, "current_level": level, "gap": gap,
                "status": status, "measured": is_measured, "basis": basis, "why": req["why"],
                "in_profile": known, "volatility": vol, "priority": None, "priority_rank": None,
            })

        gaps = [i for i in items if i["status"] != "strong"]
        gaps.sort(key=lambda i: (TIER_ORDER[i["tier"]], -i["gap"]))
        for rank, item in enumerate(gaps, start=1):
            item["priority_rank"] = rank
            item["priority"] = PRIORITY_LABEL[item["tier"]]

        total_w = sum(TIER_WEIGHT[i["tier"]] * i["target_level"] for i in items)
        got_w = sum(TIER_WEIGHT[i["tier"]] * min(i["current_level"], i["target_level"]) for i in items)
        readiness = round(100 * got_w / total_w, 1) if total_w else 0.0

        required = {i["skill"].lower() for i in items}
        extra_strengths = [s for s in profile.get("skills", []) if s.lower() not in required]

        recommendations: list[str] = []
        for item in gaps[:4]:
            if item["status"] == "outdated":
                recommendations.append(f"Refresh {item['skill']} first – you already know it, and the current version changed while you were away.")
            elif item["status"] == "missing":
                recommendations.append(f"Learn {item['skill']} fundamentals – {item['why']}")
            else:
                recommendations.append(f"Strengthen {item['skill']} from {item['current_level']:.0f} to {item['target_level']} – {item['why']}")
        if extra_strengths:
            recommendations.append(f"Highlight your additional strengths ({', '.join(extra_strengths[:4])}) as transferable skills.")

        counts = {s: sum(1 for i in items if i["status"] == s) for s in ["strong", "outdated", "needs_revision", "developing", "missing"]}
        top = [i["skill"] for i in gaps[:3]]
        summary = (
            f"{role}: readiness {readiness:.0f}%. Top priorities: {', '.join(top) or 'none – all targets met'}. "
            f"{counts['outdated']} outdated, {counts['missing']} missing, {counts['strong']} strong."
        )
        return AgentResult(
            output={
                "target_role": role,
                "items": items,
                "readiness": readiness,
                "priorities": [i["skill"] for i in gaps],
                "counts": counts,
                "additional_strengths": extra_strengths,
                "recommendations": recommendations,
                "method": "Rule-based estimate replaced by measured quiz/interview scores when available. See docs/methodology.md.",
            },
            summary=summary,
            log_input={
                "target_role": role, "skills": profile.get("skills", []),
                "experience_years": exp, "career_break_years": brk,
                "measured_skills": sorted(measured),
            },
            log_output={"readiness": readiness, "top_priorities": top, "counts": counts},
        )

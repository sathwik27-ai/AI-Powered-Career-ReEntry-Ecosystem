"""Agent 1 – Profile Intelligence Agent.

Builds a structured professional profile from a resume and/or onboarding answers.
Rules:
  * never invent information – only report what the resume or the person stated;
  * user-entered values override parsed values;
  * missing information produces clarification questions instead of assumptions;
  * career breaks are recorded neutrally and never lower professional value.
"""
from __future__ import annotations

import re
from typing import Any

from agents.base import AgentResult, BaseAgent
from knowledge.roles import ROLES, resolve_role, suggest_roles
from knowledge.skills import CROSS_ROLE_TECHNICAL, SKILLS, SOFT_SKILLS, canonical
from services.ai_provider import get_provider
from services.resume_parser import parse_resume

PROFILE_FIELDS = [
    "full_name", "email", "phone", "previous_role", "domain", "education", "education_field",
    "experience_years", "career_break_years", "career_break_reason", "target_role", "soft_skills",
    "transferable_skills", "certifications", "projects", "work_preferences", "employment_types",
    "location_preference", "hours_per_day", "plan_days", "learning_preferences",
]

LLM_SCHEMA = {
    "type": "object",
    "properties": {
        "full_name": {"type": ["string", "null"]},
        "previous_role": {"type": ["string", "null"]},
        "technical_skills": {"type": "array", "items": {"type": "string"}},
        "soft_skills": {"type": "array", "items": {"type": "string"}},
        "projects": {"type": "array", "items": {"type": "string"}},
        "certifications": {"type": "array", "items": {"type": "string"}},
        "education": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["full_name", "previous_role", "technical_skills", "soft_skills", "projects", "certifications", "education"],
    "additionalProperties": False,
}


def _blank(value: Any) -> bool:
    return value is None or value == "" or value == [] or value == {}


class ProfileIntelligenceAgent(BaseAgent):
    key = "profile"
    name = "Profile Intelligence Agent"
    description = "Understands the returning professional's previous career, skills and goals."
    responsibilities = [
        "Extract text from PDF/DOCX resumes",
        "Identify roles, experience, education, projects, certifications and career break",
        "Identify technical, soft and transferable skills",
        "Merge onboarding answers (user input always wins)",
        "Ask clarification questions when important information is missing",
    ]
    inputs = ["Resume text", "Onboarding answers", "Existing profile"]
    outputs = ["Structured career profile", "Missing information", "Clarification questions"]

    def _llm_enrich(self, text: str, parsed: dict) -> tuple[dict, bool]:
        provider = get_provider()
        if not provider.available:
            return parsed, False
        result = provider.structured(
            system=(
                "You extract facts from resumes. Only return information explicitly present in the text. "
                "Never infer or invent skills, employers, degrees or achievements."
            ),
            prompt=f"Extract the requested fields from this resume:\n\n{text[:15000]}",
            schema=LLM_SCHEMA,
            max_tokens=3000,
        )
        if not result:
            return parsed, False
        lower = text.lower()
        enriched = dict(parsed)
        # Hallucination guard: keep only skills that literally appear in the resume text.
        extra = [canonical(s) for s in result.get("technical_skills", []) if s and s.lower() in lower]
        enriched["skills"] = list(dict.fromkeys(parsed.get("skills", []) + extra))
        extra_soft = [canonical(s) for s in result.get("soft_skills", []) if s and s.lower() in lower]
        enriched["soft_skills"] = list(dict.fromkeys(parsed.get("soft_skills", []) + extra_soft))
        for field in ("full_name", "previous_role"):
            if _blank(enriched.get(field)) and result.get(field) and result[field].lower() in lower:
                enriched[field] = result[field]
        for field in ("projects", "certifications", "education"):
            if _blank(enriched.get(field)):
                enriched[field] = [x for x in result.get(field, []) if x][:6]
        return enriched, True

    def run(self, payload: dict[str, Any]) -> AgentResult:
        text: str | None = payload.get("resume_text")
        manual: dict[str, Any] = payload.get("manual") or {}
        existing: dict[str, Any] = payload.get("existing") or {}

        parsed: dict[str, Any] = parse_resume(text) if text else {}
        used_llm = False
        if text:
            parsed, used_llm = self._llm_enrich(text, parsed)

        profile: dict[str, Any] = {}
        for field in PROFILE_FIELDS:
            value = existing.get(field)
            if not _blank(parsed.get(field)):
                value = parsed[field]
            if not _blank(manual.get(field)):
                value = manual[field]
            profile[field] = value

        # Skills: union of everything the person has (resume + manual + existing).
        manual_skills = [canonical(s) for s in manual.get("skills", []) if str(s).strip()]
        skills = list(dict.fromkeys(list(existing.get("skills", [])) + parsed.get("skills", []) + manual_skills))
        technical = [s for s in skills if s not in SOFT_SKILLS]
        soft_from_manual = [s for s in manual_skills if s in SOFT_SKILLS]
        profile["skills"] = technical
        profile["soft_skills"] = list(dict.fromkeys((profile.get("soft_skills") or []) + soft_from_manual))
        profile["transferable_skills"] = list(
            dict.fromkeys(profile["soft_skills"] + [s for s in technical if s in CROSS_ROLE_TECHNICAL])
        )

        target = resolve_role(profile.get("target_role")) or (profile.get("target_role") or None)
        profile["target_role"] = target
        if not profile.get("domain") and target in ROLES:
            profile["domain"] = ROLES[target]["domain"]

        employment = parsed.get("employment") or payload.get("existing_employment") or []
        if manual.get("previous_role") and not employment and manual.get("experience_years"):
            employment = [{
                "title": manual["previous_role"], "company": None, "start": None, "end": None,
                "years": float(manual["experience_years"]), "highlights": [],
            }]

        # Missing information & clarification questions (never assume).
        missing: list[str] = []
        questions: list[str] = []
        suggestions = suggest_roles(technical)
        if not target or target not in ROLES:
            missing.append("target_role")
            if profile.get("previous_role") and suggestions:
                top = ", ".join(technical[:3]) or "your skills"
                alt = suggestions[1] if len(suggestions) > 1 else "a related role"
                questions.append(
                    f"You previously worked as a {profile['previous_role']} with {top}. "
                    f"Would you like to return to {suggestions[0]} or explore {alt}?"
                )
            else:
                questions.append("Which role would you like to return to? (e.g. Backend Developer, Data Analyst)")
        if _blank(profile.get("work_preferences")):
            missing.append("work_preferences")
            questions.append("Which working arrangements suit you best – remote, hybrid, on-site, part-time or flexible hours?")
        if _blank(employment) and _blank(profile.get("experience_years")):
            missing.append("employment_history")
            questions.append("We couldn't find dates for your previous roles. Could you add your last job title and years of experience?")
        if _blank(profile.get("education")):
            missing.append("education")
            questions.append("Could you add your highest qualification? (Optional, but it helps tailor your resume.)")
        if not technical:
            missing.append("technical_skills")
            questions.append("Which tools or technologies did you use in your previous roles?")
        if profile.get("career_break_years") is None:
            missing.append("career_break_years")
            questions.append("How long has your career break been? This is optional and only used to plan refresher topics.")

        years = profile.get("experience_years")
        headline_parts = [p for p in [profile.get("previous_role"), f"{years:g} years experience" if years else None] if p]
        profile["headline"] = " · ".join(headline_parts) or None

        source = "resume+onboarding" if text and manual else ("resume" if text else "onboarding")
        mode = "llm" if used_llm else "demo"
        found = len(technical)
        summary = (
            f"Built profile from {source}: {profile.get('previous_role') or 'role not found'}, "
            f"{years if years is not None else '?'} yrs experience, {found} technical skills, "
            f"{len(missing)} item(s) need clarification."
        )
        return AgentResult(
            output={
                "profile": profile,
                "employment": employment,
                "skill_evidence": parsed.get("skill_evidence", {}),
                "career_break_note": parsed.get("career_break_note"),
                "missing": missing,
                "clarification_questions": questions,
                "suggested_roles": suggestions,
                "source": source,
            },
            summary=summary,
            mode=mode,
            log_input={
                "resume_chars": len(text) if text else 0,
                "onboarding_fields": sorted(k for k, v in manual.items() if not _blank(v)),
            },
            log_output={
                "previous_role": profile.get("previous_role"),
                "experience_years": years,
                "career_break_years": profile.get("career_break_years"),
                "skills": technical,
                "target_role": target,
                "work_preferences": profile.get("work_preferences"),
                "transferable_skills": profile["transferable_skills"],
                "missing": missing,
            },
        )


_ALL_SKILL_NAMES = set(SKILLS) | set(SOFT_SKILLS)


def is_known_skill(name: str) -> bool:
    return name in _ALL_SKILL_NAMES or bool(re.match(r"^[\w .+#/-]{1,40}$", name))

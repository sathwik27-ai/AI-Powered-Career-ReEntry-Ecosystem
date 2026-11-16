"""Agent 5 – Opportunity Discovery Agent.

Explainable weighted match score (0–100), documented in docs/methodology.md:
  skills       40%  required skills owned (1.0), being learned on the roadmap (0.5);
                    nice-to-have skills add up to 10% of this component
  experience   20%  min(1, previous experience / required experience) – a career
                    break never reduces this component
  flexibility  20%  arrangement matches preference (1.0); hybrid when remote preferred
                    (0.5); flexible hours add 0.2 (capped at 1.0)
  location     10%  remote (1.0); preferred city (1.0); otherwise 0.4
  returnship   10%  returnship-friendly employer (1.0) otherwise 0.5
This is an illustrative compatibility indicator, not an employer assessment.
"""
from __future__ import annotations

from typing import Any

from agents.base import AgentResult, BaseAgent
from knowledge.roles import resolve_role

WEIGHTS = {"skills": 40, "experience": 20, "flexibility": 20, "location": 10, "returnship": 10}


class OpportunityDiscoveryAgent(BaseAgent):
    key = "opportunity"
    name = "Opportunity Discovery Agent"
    description = "Finds and explains flexible, returnship-friendly opportunities that fit the person."
    responsibilities = [
        "Match opportunities against skills, experience and preferences",
        "Support remote, hybrid, part-time, contract, freelance and returnship roles",
        "Explain every match score and list missing qualifications",
        "Prioritise returnship-friendly opportunities",
        "Clearly label illustrative demo listings",
    ]
    inputs = ["Profile", "Skills being learned", "Opportunity listings", "Filters"]
    outputs = ["Ranked, explained matches"]

    def score(self, opp: dict, profile: dict, learning: set[str]) -> dict[str, Any]:
        owned = {s.lower() for s in profile.get("skills", [])}
        learning_l = {s.lower() for s in learning}
        req = opp["required_skills"]
        matched = [s for s in req if s.lower() in owned]
        in_progress = [s for s in req if s.lower() not in owned and s.lower() in learning_l]
        missing = [s for s in req if s.lower() not in owned and s.lower() not in learning_l]
        skill_c = (len(matched) + 0.5 * len(in_progress)) / len(req) if req else 1.0
        nice = opp.get("nice_to_have", [])
        nice_owned = [s for s in nice if s.lower() in owned]
        if nice:
            skill_c = min(1.0, skill_c * 0.9 + 0.1 * len(nice_owned) / len(nice))

        exp = float(profile.get("experience_years") or 0)
        need = float(opp.get("min_experience") or 0)
        exp_c = 1.0 if need <= 0 else min(1.0, exp / need)

        prefs = {p.lower() for p in profile.get("work_preferences", [])}
        types = {t.lower() for t in profile.get("employment_types", [])}
        arr = opp["arrangement"].lower()
        if not prefs or arr in prefs:
            flex_c = 1.0
        elif arr == "hybrid" and "remote" in prefs:
            flex_c = 0.5
        else:
            flex_c = 0.2
        if opp.get("flexible_hours"):
            flex_c = min(1.0, flex_c + 0.2)
        if types and opp["employment_type"].lower() in types:
            flex_c = min(1.0, flex_c + 0.1)

        loc_pref = (profile.get("location_preference") or "").lower()
        if arr == "remote":
            loc_c = 1.0
        elif loc_pref and loc_pref.split(",")[0].strip() in opp["location"].lower():
            loc_c = 1.0
        elif not loc_pref:
            loc_c = 0.7
        else:
            loc_c = 0.4
        ret_c = 1.0 if opp.get("returnship_friendly") else 0.5

        comps = {"skills": skill_c, "experience": exp_c, "flexibility": flex_c, "location": loc_c, "returnship": ret_c}
        total = round(sum(comps[k] * w for k, w in WEIGHTS.items()), 1)
        label = "Strong match" if total >= 75 else "Good match" if total >= 60 else "Partial match"

        reasons = []
        if matched:
            reasons.append(f"You already have {len(matched)}/{len(req)} required skills: {', '.join(matched)}.")
        if in_progress:
            reasons.append(f"Your roadmap is building {', '.join(in_progress)}.")
        if exp_c >= 1 and need:
            reasons.append(f"Your {exp:g} years of experience meets the {need:g}+ years requested.")
        if arr in prefs:
            reasons.append(f"{opp['arrangement']} matches your work preference.")
        if opp.get("flexible_hours"):
            reasons.append("Offers flexible hours.")
        if opp.get("returnship_friendly"):
            reasons.append("Returnship-friendly: designed for professionals returning after a break.")
        gaps = []
        if missing:
            gaps.append(f"Missing required skills: {', '.join(missing)}.")
        if exp_c < 1:
            gaps.append(f"Asks for {need:g}+ years of experience (you have {exp:g}).")
        if flex_c < 0.5:
            gaps.append(f"{opp['arrangement']} may not fit your preferred arrangement.")

        return {
            "match_score": total, "match_label": label,
            "components": {k: round(v * 100) for k, v in comps.items()},
            "matched_skills": matched, "in_progress_skills": in_progress, "missing_skills": missing,
            "reasons": reasons, "gaps": gaps,
        }

    def run(self, payload: dict[str, Any]) -> AgentResult:
        profile: dict = payload["profile"]
        opportunities: list[dict] = payload["opportunities"]
        learning: set[str] = set(payload.get("learning_skills") or [])
        f: dict = payload.get("filters") or {}
        target_family = resolve_role(profile.get("target_role"))

        results = []
        for opp in opportunities:
            if f.get("arrangement") and opp["arrangement"].lower() != f["arrangement"].lower():
                continue
            if f.get("employment_type") and opp["employment_type"].lower() != f["employment_type"].lower():
                continue
            if f.get("returnship_only") and not opp.get("returnship_friendly"):
                continue
            if f.get("location") and f["location"].lower() not in opp["location"].lower():
                continue
            if f.get("role") and f["role"].lower() not in (opp["title"] + " " + opp["role_family"]).lower():
                continue
            scored = self.score(opp, profile, learning)
            role_fit = target_family is None or opp["role_family"] == target_family
            results.append({**opp, **scored, "role_fit": role_fit})

        results.sort(key=lambda r: (not r["role_fit"], not r.get("returnship_friendly"), -r["match_score"]))
        results.sort(key=lambda r: (not r["role_fit"], -r["match_score"]))
        top = results[:3]
        summary = f"Ranked {len(results)} opportunities; top: " + ", ".join(f"{r['title']} ({r['match_score']:.0f})" for r in top) if top else "No opportunities match the filters."
        return AgentResult(
            output={"results": results, "weights": WEIGHTS},
            summary=summary,
            log_input={"target_role": profile.get("target_role"), "preferences": profile.get("work_preferences"), "filters": {k: v for k, v in f.items() if v}},
            log_output={"count": len(results), "top": [{"title": r["title"], "score": r["match_score"]} for r in top]},
        )

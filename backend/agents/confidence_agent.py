"""Agent 4 – Confidence & Interview Agent.

Runs text-based mock interviews (technical, HR or mixed) personalised to the target
role and current skill priorities, evaluates each answer and reports weak topics to
the Career Orchestrator.

Deterministic rubric (demo mode), each criterion 0–100:
  relevance          – share of the question's key points covered (25 + 75·coverage)
  technical_accuracy – share of technical key concepts covered (technical questions)
  structure          – length in a useful range, multiple sentences, linking words / STAR cues
  clarity            – average sentence length 8–25 words, few filler words
  communication      – confident, active phrasing; penalises hedging and apologising
Overall = weighted mean (technical: accuracy 35, relevance 25, structure 15, clarity 15,
communication 10; HR: relevance 30, structure 25, clarity 20, communication 25).
With an API key configured, Claude scores against the same rubric instead.
"""
from __future__ import annotations

import re
from typing import Any

from agents.base import AgentResult, BaseAgent
from knowledge.interview_bank import HR, TECHNICAL
from services.ai_provider import get_provider

WEIGHTS = {
    "technical": {"technical_accuracy": 35, "relevance": 25, "structure": 15, "clarity": 15, "communication": 10},
    "hr": {"relevance": 30, "structure": 25, "clarity": 20, "communication": 25},
}
FILLERS = [r"\bum+\b", r"\buh+\b", r"\blike\b,", r"\bbasically\b", r"\byou know\b", r"\bkind of\b", r"\bsort of\b", r"\bactually\b"]
HEDGES = [r"\bi think maybe\b", r"\bnot sure\b", r"\bi guess\b", r"\bprobably\b", r"\bmaybe\b", r"\bi don'?t know\b", r"\bkind of\b"]
APOLOGETIC = [r"\bsorry\b", r"just a housewife", r"only a (?:mother|mom|housewife)", r"gap is a (?:weakness|problem)", r"long gap", r"wasted", r"i know it'?s been (?:too )?long"]
ACTIVE = r"\bi\s+(?:built|led|designed|implemented|delivered|improved|created|managed|developed|owned|optimi[sz]ed|mentored|automated|migrated|refactored|wrote)\b"
CONNECTORS = [r"\bfirst(?:ly)?\b", r"\bthen\b", r"\bfinally\b", r"\bfor example\b", r"\bbecause\b", r"\bas a result\b", r"\btherefore\b", r"\bin addition\b", r"\bfor instance\b", r"\bwhich means\b", r"\bso that\b"]

LLM_SCHEMA = {
    "type": "object",
    "properties": {
        "relevance": {"type": "number"}, "clarity": {"type": "number"}, "structure": {"type": "number"},
        "technical_accuracy": {"type": "number"}, "communication": {"type": "number"},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "improvements": {"type": "array", "items": {"type": "string"}},
        "missing_points": {"type": "array", "items": {"type": "string"}},
        "improved_answer": {"type": "string"},
    },
    "required": ["relevance", "clarity", "structure", "technical_accuracy", "communication", "strengths", "improvements", "missing_points", "improved_answer"],
    "additionalProperties": False,
}


def _count(patterns: list[str], text: str) -> int:
    return sum(len(re.findall(p, text)) for p in patterns)


def _clamp(v: float) -> float:
    return round(max(0.0, min(100.0, v)), 1)


class ConfidenceInterviewAgent(BaseAgent):
    key = "confidence"
    name = "Confidence & Interview Agent"
    description = "Rebuilds confidence through personalised mock interviews and constructive feedback."
    responsibilities = [
        "Select technical and HR questions from the target role and skill priorities",
        "Evaluate relevance, clarity, structure, technical accuracy and communication",
        "Give constructive, judgement-free feedback and an improved answer",
        "Track interview practice progress",
        "Report weak topics to the Career Orchestrator",
    ]
    inputs = ["Target role", "Skill priorities", "Profile", "Text answers"]
    outputs = ["Interview questions", "Scores & feedback", "Weak topics"]

    # ----------------------------------------------------------- question selection
    def create_session(self, payload: dict[str, Any]) -> AgentResult:
        itype = payload.get("interview_type", "mixed")
        profile = payload.get("profile") or {}
        priorities: list[str] = payload.get("priorities") or []
        count = int(payload.get("count", 4))
        skills = profile.get("skills", [])

        order = list(dict.fromkeys(priorities + skills))
        technical: list[dict] = []
        used: set[str] = set()
        while len(technical) < count:
            added = False
            for skill in order:
                q = next((q for q in TECHNICAL if q["skill"] == skill and q["id"] not in used), None)
                if q:
                    technical.append(q); used.add(q["id"]); added = True
                    if len(technical) >= count:
                        break
            if not added:
                break
        hr_order = ["hr-break", "hr-intro", "hr-strength", "hr-updated", "hr-flex"]
        hr = [next(q for q in HR if q["id"] == i) for i in hr_order]
        if not profile.get("career_break_years"):
            hr = [q for q in hr if q["id"] != "hr-break"]

        if itype == "technical":
            chosen = technical[:count]
        elif itype == "hr":
            chosen = hr[:count]
        else:
            chosen = [hr[0]] + technical[:2] + [hr[1]]
        questions = [{"id": q["id"], "question": q["question"], "type": "technical" if q in TECHNICAL else "hr", "skill": q["skill"]} for q in chosen]
        return AgentResult(
            output={"questions": questions},
            summary=f"Prepared a {itype} interview with {len(questions)} questions focused on {', '.join(dict.fromkeys(q['skill'] for q in questions if q['skill'])) or 'HR topics'}.",
            log_input={"interview_type": itype, "priorities": priorities[:5]},
            log_output={"questions": [q["id"] for q in questions]},
        )

    # ------------------------------------------------------------------ evaluation
    def _rules(self, q: dict, answer: str) -> dict[str, Any]:
        text = answer.strip()
        low = text.lower()
        words = re.findall(r"[\w#+/.'-]+", text)
        wc = len(words)
        sentences = [s for s in re.split(r"[.!?]+(?:\s+|$)", text) if len(s.split()) >= 3]
        sc = max(1, len(sentences))
        qtype = "technical" if q.get("skill") else "hr"

        covered = [k for k in q["key_points"] if any(re.search(p, low) for p in k["patterns"])]
        coverage = len(covered) / len(q["key_points"]) if q["key_points"] else 0
        missing = [k["label"] for k in q["key_points"] if k not in covered]
        short = wc < 15

        relevance = (25 + 75 * coverage) * (0.5 if short else 1)
        accuracy = 100 * coverage
        structure = 30 + (30 if 50 <= wc <= 260 else 15 if wc >= 25 else 0)
        structure += 20 if sc >= 3 else 10 if sc == 2 else 0
        conn = _count(CONNECTORS, low)
        structure += 20 if conn >= 2 else 10 if conn == 1 else 0
        if qtype == "hr" and re.search(ACTIVE, low):
            structure += 5
        avg = wc / sc
        clarity = 100 if 8 <= avg <= 25 else 75 if 5 <= avg <= 35 else 50
        clarity -= 8 * _count(FILLERS, low)
        if short:
            clarity = min(clarity, 50)
        hedges = _count(HEDGES, low)
        apologies = _count(APOLOGETIC, low)
        actives = len(re.findall(ACTIVE, low))
        communication = 70 - 10 * hedges - 15 * apologies + min(30, 8 * actives)
        if short:
            communication = min(communication, 45)

        scores = {"relevance": _clamp(relevance), "structure": _clamp(structure), "clarity": _clamp(clarity), "communication": _clamp(communication)}
        if qtype == "technical":
            scores["technical_accuracy"] = _clamp(accuracy)

        strengths, improvements = [], []
        if coverage >= 0.75:
            strengths.append("You covered the key points interviewers listen for.")
        elif covered:
            strengths.append(f"Good start – you addressed: {', '.join(k['label'] for k in covered[:3])}.")
        if scores["structure"] >= 70:
            strengths.append("Your answer is well structured and easy to follow.")
        if actives:
            strengths.append("You used confident, active language about your own contributions.")
        if missing:
            improvements.append(f"Also mention: {', '.join(missing[:3])}.")
        if short:
            improvements.append("Expand your answer to 4–6 sentences with a concrete example.")
        elif wc > 300:
            improvements.append("Keep it concise – aim for about one to two minutes when spoken.")
        if conn == 0 and not short:
            improvements.append("Use linking phrases such as 'for example' or 'as a result' to guide the listener.")
        if hedges:
            improvements.append("Replace hedging phrases ('maybe', 'I guess') with direct statements.")
        if apologies:
            improvements.append("There is no need to apologise for a career break – present it factually and move on to what you bring.")
        if qtype == "hr" and not actives:
            improvements.append("Describe your own actions with 'I designed…', 'I led…' to show ownership.")
        if not strengths:
            strengths.append("You attempted the question – practising out loud is how confidence grows.")
        return {"scores": scores, "strengths": strengths, "improvements": improvements, "missing_points": missing, "type": qtype, "word_count": wc}

    def _personalised_model_answer(self, q: dict, profile: dict, focus: list[str]) -> str:
        if q.get("model_answer"):
            return q["model_answer"]
        prev = profile.get("previous_role") or "professional"
        exp = profile.get("experience_years")
        exp_txt = f"{exp:g} years" if exp else "several years"
        skills = ", ".join(profile.get("skills", [])[:4]) or "my core skills"
        target = profile.get("target_role") or "this role"
        focus_txt = ", ".join(focus[:3]) or "the latest tools in my field"
        reason = profile.get("career_break_reason")
        if q["id"] == "hr-break":
            reason_txt = f" for {reason}" if reason else ""
            return (
                f"I worked as a {prev} for {exp_txt}, delivering with {skills}. I then took a planned career break{reason_txt}. "
                f"To prepare for my return I have been following a structured learning plan focused on {focus_txt}, with hands-on exercises and a portfolio project. "
                f"I'm now ready to return as a {target}: I bring {exp_txt} of delivery experience together with refreshed, current skills, and I'm excited to contribute to your team."
            )
        if q["id"] == "hr-intro":
            return (
                f"I'm a {prev} with {exp_txt} of experience building software with {skills}. "
                f"Recently I've been strengthening {focus_txt} through a structured plan and a hands-on project. "
                f"I'm looking for a {target} role where I can combine that experience with modern practices and keep growing with a strong team."
            )
        if q["id"] == "hr-updated":
            return (
                f"I follow a structured plan: official documentation and free courses for concepts, then hands-on exercises. Right now I'm focusing on {focus_txt}. "
                "I also build small projects, read release notes for the tools I use, and take short self-assessments to check my progress."
            )
        return "Structure your answer with a clear opening, one concrete example and a short conclusion linking back to the role."

    def evaluate(self, payload: dict[str, Any]) -> AgentResult:
        q: dict = payload["question"]
        answer: str = payload["answer"]
        profile: dict = payload.get("profile") or {}
        focus: list[str] = payload.get("focus_skills") or []
        qtype = "technical" if q.get("skill") else "hr"

        result = self._rules(q, answer)
        mode = "demo"
        provider = get_provider()
        if provider.available:
            llm = provider.structured(
                system=(
                    "You are a supportive interview coach for professionals returning after a career break. "
                    "Score the answer 0-100 on each criterion. Never judge the person for taking a career break. "
                    "For HR questions set technical_accuracy to 0. The improved answer must only use facts from the profile provided."
                ),
                prompt=(
                    f"Question ({qtype}): {q['question']}\nKey points a strong answer covers: {[k['label'] for k in q['key_points']]}\n"
                    f"Candidate profile (verified facts): {{'previous_role': {profile.get('previous_role')!r}, 'experience_years': {profile.get('experience_years')!r}, "
                    f"'skills': {profile.get('skills', [])!r}, 'target_role': {profile.get('target_role')!r}}}\n\nAnswer:\n{answer}"
                ),
                schema=LLM_SCHEMA,
                max_tokens=2500,
            )
            if llm:
                mode = "llm"
                scores = {k: _clamp(float(llm[k])) for k in ("relevance", "clarity", "structure", "communication")}
                if qtype == "technical":
                    scores["technical_accuracy"] = _clamp(float(llm["technical_accuracy"]))
                result.update({"scores": scores, "strengths": llm["strengths"][:4], "improvements": llm["improvements"][:5], "missing_points": llm["missing_points"][:5]})
                result["llm_improved_answer"] = llm["improved_answer"]

        weights = WEIGHTS[qtype]
        overall = round(sum(result["scores"][k] * w for k, w in weights.items()) / sum(weights.values()), 1)
        improved = result.pop("llm_improved_answer", None) or self._personalised_model_answer(q, profile, focus)
        weak = qtype == "technical" and (overall < 60 or result["scores"].get("technical_accuracy", 100) < 50)
        output = {
            "question_id": q["id"], "question": q["question"], "question_type": qtype, "skill": q.get("skill"),
            "scores": result["scores"], "overall": overall, "strengths": result["strengths"],
            "improvements": result["improvements"], "missing_points": result["missing_points"],
            "improved_answer": improved, "weak": weak,
            "criteria_weights": weights,
        }
        return AgentResult(
            output=output,
            summary=f"Scored answer to '{q['id']}' at {overall:.0f}/100" + (f" – weak topic detected: {q['skill']}" if weak else ""),
            mode=mode,
            log_input={"question_id": q["id"], "skill": q.get("skill"), "answer_words": result.get("word_count")},
            log_output={"overall": overall, "scores": result["scores"], "weak_topic": q.get("skill") if weak else None, "missing_points": result["missing_points"][:3]},
        )

    # ----------------------------------------------------------------- summarise
    def summarize(self, feedback: list[dict]) -> AgentResult:
        if not feedback:
            return AgentResult(output={"overall": None, "skill_scores": {}, "weak_topics": [], "signals": []}, summary="No answers to summarise.")
        overall = round(sum(f["overall"] for f in feedback) / len(feedback), 1)
        per_skill: dict[str, list[dict]] = {}
        for f in feedback:
            if f.get("skill"):
                per_skill.setdefault(f["skill"], []).append(f)
        signals, weak = [], []
        for skill, fs in per_skill.items():
            score = round(sum(x["overall"] for x in fs) / len(fs), 1)
            missing = list(dict.fromkeys(p for x in fs for p in x.get("missing_points", [])))
            signals.append({"skill": skill, "score": score, "source": "interview", "missing_points": missing})
            if score < 60:
                weak.append({"skill": skill, "score": score, "missing_points": missing[:3]})
        hr = [f for f in feedback if not f.get("skill")]
        hr_score = round(sum(f["overall"] for f in hr) / len(hr), 1) if hr else None
        recs = []
        for w in weak:
            recs.append(f"Revise {w['skill']}: {', '.join(w['missing_points'][:2]) or 'core concepts'}.")
        if hr_score is not None and hr_score < 65:
            recs.append("Practise HR answers out loud using the STAR structure; keep the career-break answer brief and forward-looking.")
        summary = f"Interview overall {overall:.0f}/100; weak topics: {', '.join(w['skill'] for w in weak) or 'none'}."
        return AgentResult(
            output={"overall": overall, "hr_score": hr_score, "skill_scores": {s["skill"]: s["score"] for s in signals},
                    "weak_topics": weak, "signals": signals, "recommendations": recs},
            summary=summary,
            log_input={"answers": len(feedback)},
            log_output={"overall": overall, "weak_topics": weak, "hr_score": hr_score},
        )

"""Agent 6 – Resume & Application Agent.

Generates ATS-friendly resumes and cover letters tailored to a selected opportunity
using ONLY verified profile data (resume/onboarding) and learning the person has
actually completed in ReStartHer. It never invents employers, degrees,
certifications, achievements or experience, presents career breaks neutrally, and
never submits anything – a human must approve every draft.
"""
from __future__ import annotations

from typing import Any

from agents.base import AgentResult, BaseAgent
from services.ai_provider import get_provider

STATUSES = ["saved", "drafted", "ready_for_review", "applied", "interview", "rejected", "offer"]

COVER_SCHEMA = {
    "type": "object",
    "properties": {"cover_letter": {"type": "string"}},
    "required": ["cover_letter"],
    "additionalProperties": False,
}


class ResumeApplicationAgent(BaseAgent):
    key = "application"
    name = "Resume & Application Agent"
    description = "Prepares tailored, truthful application drafts and tracks applications with human approval."
    responsibilities = [
        "Generate ATS-friendly resumes from verified profile data only",
        "Tailor skills ordering and summary to the selected job",
        "Write customised cover letters highlighting transferable skills",
        "Present career breaks neutrally",
        "Track application status; require human approval before applying",
    ]
    inputs = ["Verified profile", "Career history", "Completed learning", "Selected opportunity"]
    outputs = ["Tailored resume draft", "Cover letter draft", "Tailoring notes"]

    def run(self, payload: dict[str, Any]) -> AgentResult:
        profile: dict = payload["profile"]
        history: list[dict] = payload.get("employment") or []
        opp: dict = payload["opportunity"]
        learned: dict[str, int] = payload.get("completed_learning") or {}  # skill -> completed tasks
        projects_done: list[str] = payload.get("completed_projects") or []

        owned = list(profile.get("skills", []))
        owned_l = {s.lower() for s in owned}
        req = opp.get("required_skills", []) + opp.get("nice_to_have", [])
        matched = [s for s in req if s.lower() in owned_l]
        others = [s for s in owned if s not in matched]
        ordered_skills = matched + others
        not_claimed = [s for s in opp.get("required_skills", []) if s.lower() not in owned_l]

        name = profile.get("full_name") or "Your Name"
        contact = " | ".join(x for x in [profile.get("email"), profile.get("phone"), profile.get("location_preference")] if x)
        exp = profile.get("experience_years")
        prev = profile.get("previous_role")
        target = opp["title"].split("–")[0].split("(")[0].strip()

        lines: list[str] = [name.upper()]
        if contact:
            lines.append(contact)
        lines.append("")
        lines.append("PROFESSIONAL SUMMARY")
        summary_bits = []
        if prev and exp:
            summary_bits.append(f"{prev} with {exp:g} years of professional experience")
        elif prev:
            summary_bits.append(f"Experienced {prev}")
        if matched:
            summary_bits.append(f"skilled in {', '.join(matched[:5])}")
        summary = (", ".join(summary_bits) + ".") if summary_bits else "Experienced professional returning to work."
        recent = [s for s, n in learned.items() if n > 0]
        if recent:
            summary += f" Recently completed structured, hands-on upskilling in {', '.join(recent[:4])}."
        summary += f" Seeking a {target} role."
        lines.append(summary)
        lines.append("")
        lines.append("KEY SKILLS")
        lines.append(" • ".join(ordered_skills) if ordered_skills else "(add your skills to your profile)")
        transferable = [s for s in profile.get("transferable_skills", []) if s not in ordered_skills]
        if transferable:
            lines.append("Transferable strengths: " + ", ".join(transferable))
        lines.append("")
        lines.append("PROFESSIONAL EXPERIENCE")
        if history:
            for e in history:
                when = " – ".join(x for x in [e.get("start"), e.get("end")] if x)
                header = " | ".join(x for x in [e.get("title"), e.get("company"), when] if x)
                lines.append(header)
                for h in e.get("highlights", [])[:4]:
                    lines.append(f"  • {h}")
        else:
            lines.append("(add your previous roles to your profile)")
        brk = profile.get("career_break_years")
        if brk and brk >= 0.3:
            lines.append("")
            lines.append("CAREER BREAK")
            reason = profile.get("career_break_reason")
            line = f"Planned career break ({brk:g} years)" + (f" – {reason}" if reason else "") + "."
            if recent:
                line += f" Returned to structured learning: {', '.join(recent[:4])}."
            lines.append(line)
        if recent or projects_done:
            lines.append("")
            lines.append("RECENT LEARNING & PROJECTS")
            for s in recent[:6]:
                lines.append(f"  • {s} – {learned[s]} completed learning task{'s' if learned[s] != 1 else ''} (ReStartHer roadmap)")
            for p in projects_done[:3]:
                lines.append(f"  • {p}")
        if profile.get("projects"):
            lines.append("")
            lines.append("PROJECTS")
            for p in profile["projects"][:4]:
                lines.append(f"  • {p}")
        if profile.get("education"):
            lines.append("")
            lines.append("EDUCATION")
            for ed in profile["education"][:3]:
                lines.append(ed)
        if profile.get("certifications"):
            lines.append("")
            lines.append("CERTIFICATIONS")
            for c in profile["certifications"][:5]:
                lines.append(f"  • {c}")
        resume_text = "\n".join(lines).strip() + "\n"

        notes = [f"Skills matching this job listed first: {', '.join(matched) or 'none'}."]
        if not_claimed:
            notes.append(f"Not included because they are not in your verified profile: {', '.join(not_claimed)}. Add them only once you can honestly claim them.")
        notes.append("Career break presented factually and neutrally, followed by recent learning.")
        notes.append("Every statement comes from your resume, onboarding answers or completed ReStartHer tasks – please review before use.")

        # ---- cover letter
        employer = opp.get("employer_label", "the hiring team")
        cover_lines = [
            "Dear Hiring Team,",
            "",
            f"I am writing to apply for the {opp['title']} position{' (' + employer + ')' if employer else ''}."
            + (f" I bring {exp:g} years of experience as a {prev}" if exp and prev else "")
            + (f", with hands-on skills in {', '.join(matched[:4])}." if matched else "."),
            "",
        ]
        if brk and brk >= 0.3:
            cover_lines.append(
                "After a planned career break, I have returned with renewed focus"
                + (f", completing structured, practical learning in {', '.join(recent[:3])}" if recent else "")
                + ". I am ready to contribute from day one and to keep learning with your team."
            )
            cover_lines.append("")
        strengths = profile.get("transferable_skills", [])[:3]
        if strengths:
            cover_lines.append(f"Colleagues have relied on my {', '.join(s.lower() for s in strengths)}, which I would bring to this role.")
            cover_lines.append("")
        if opp.get("returnship_friendly"):
            cover_lines.append("I am particularly drawn to this opportunity's support for returning professionals.")
            cover_lines.append("")
        cover_lines += ["Thank you for considering my application. I would welcome the opportunity to discuss how I can contribute.", "", "Kind regards,", name]
        cover = "\n".join(cover_lines)

        mode = "demo"
        provider = get_provider()
        if provider.available:
            llm = provider.structured(
                system=(
                    "You polish cover letters for professionals returning after a career break. Improve tone and flow only. "
                    "Do not add any facts, employers, numbers, achievements or skills that are not in the draft. Keep the career break neutral."
                ),
                prompt=f"Job: {opp['title']}\n\nDraft cover letter:\n{cover}",
                schema=COVER_SCHEMA,
                max_tokens=2000,
            )
            if llm and llm.get("cover_letter"):
                cover = llm["cover_letter"]
                mode = "llm"

        return AgentResult(
            output={"resume": resume_text, "cover_letter": cover, "tailoring_notes": notes, "matched_skills": matched, "not_claimed": not_claimed},
            summary=f"Drafted tailored resume and cover letter for '{opp['title']}' ({len(matched)} matching skills highlighted). Awaiting human review.",
            mode=mode,
            log_input={"opportunity": opp["title"], "verified_skills": owned, "completed_learning": learned},
            log_output={"matched_skills": matched, "not_claimed": not_claimed, "requires_human_approval": True},
        )

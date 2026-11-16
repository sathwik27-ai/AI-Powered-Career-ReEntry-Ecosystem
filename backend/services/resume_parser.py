"""Resume text extraction (PDF via PyMuPDF, DOCX via python-docx) and rule-based parsing.

The parser only reports information that is present in the document. Anything it
cannot find is listed in `missing` so the Profile Agent can ask for clarification
instead of guessing.
"""
from __future__ import annotations

import io
import re
from datetime import date

from knowledge.roles import resolve_role
from knowledge.skills import CROSS_ROLE_TECHNICAL, SKILLS, SOFT_SKILLS


class ResumeParseError(ValueError):
    pass


def extract_text(data: bytes, ext: str) -> str:
    try:
        if ext == ".pdf":
            import pymupdf

            with pymupdf.open(stream=data, filetype="pdf") as doc:
                text = "\n".join(page.get_text() for page in doc)
        elif ext == ".docx":
            import docx

            document = docx.Document(io.BytesIO(data))
            parts = [p.text for p in document.paragraphs]
            for table in document.tables:
                for row in table.rows:
                    parts.append(" | ".join(cell.text for cell in row.cells))
            text = "\n".join(parts)
        else:
            raise ResumeParseError("Unsupported file type.")
    except ResumeParseError:
        raise
    except Exception as exc:
        raise ResumeParseError("The document could not be read. It may be corrupted or password-protected.") from exc
    text = text.replace(" ", " ").strip()
    if len(text) < 40:
        raise ResumeParseError(
            "Very little text could be extracted. If this is a scanned resume, please upload a text-based PDF or DOCX."
        )
    return text


MONTHS = {m: i + 1 for i, m in enumerate(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}
_MONTH = r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?"
_DATE = rf"(?:{_MONTH}\s+\d{{4}}|\d{{1,2}}/\d{{4}}|\d{{4}})"
RANGE_RE = re.compile(
    rf"(?P<start>{_DATE})\s*(?:-|–|—|to)\s*(?P<end>{_DATE}|present|current|now|till date)",
    re.IGNORECASE,
)
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"(?:\+?\d[\d\s-]{8,}\d)")

HEADINGS = {
    "summary": ["summary", "professional summary", "profile", "about me", "profile summary"],
    "objective": ["objective", "career objective", "career goal", "career goals"],
    "experience": ["experience", "work experience", "professional experience", "employment history", "employment", "work history"],
    "education": ["education", "academic background", "qualifications", "academic qualifications"],
    "skills": ["skills", "technical skills", "core skills", "key skills", "technologies", "skills & tools"],
    "projects": ["projects", "key projects", "selected projects"],
    "certifications": ["certifications", "certificates", "licenses & certifications", "licenses and certifications"],
    "career_break": ["career break", "career gap", "career pause"],
}
_HEADING_LOOKUP = {alias: key for key, aliases in HEADINGS.items() for alias in aliases}

DEGREE_RE = re.compile(r"\b(b\.?\s?e\b|b\.?\s?tech|bachelor|master|m\.?\s?tech|m\.?\s?sc|b\.?\s?sc|mca|bca|mba|ph\.?\s?d|diploma)", re.IGNORECASE)
FIELDS = ["Computer Science", "Information Technology", "Electronics", "Electrical", "Mechanical", "Mathematics", "Statistics", "Commerce", "Business Administration", "Data Science"]
BREAK_REASONS = ["maternity", "caregiving", "childcare", "child care", "family", "relocation", "health", "parental"]


def _heading_of(line: str) -> str | None:
    clean = re.sub(r"[:\-–|]+$", "", line.strip()).strip().lower()
    if len(clean) > 40:
        return None
    return _HEADING_LOOKUP.get(clean)


def _parse_date(value: str) -> tuple[int, int] | None:
    v = value.strip().lower()
    if v in {"present", "current", "now", "till date"}:
        today = date.today()
        return today.year, today.month
    m = re.match(r"([a-z]+)\.?\s+(\d{4})", v)
    if m:
        return int(m.group(2)), MONTHS.get(m.group(1)[:3], 1)
    m = re.match(r"(\d{1,2})/(\d{4})", v)
    if m:
        return int(m.group(2)), max(1, min(12, int(m.group(1))))
    m = re.match(r"(\d{4})", v)
    if m:
        return int(m.group(1)), 1
    return None


def _years_between(a: tuple[int, int], b: tuple[int, int]) -> float:
    return max(0.0, round(((b[0] - a[0]) * 12 + (b[1] - a[1])) / 12, 1))


def _split_sections(lines: list[str]) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {"header": []}
    current = "header"
    for line in lines:
        heading = _heading_of(line)
        if heading:
            current = heading
            sections.setdefault(current, [])
            continue
        sections.setdefault(current, []).append(line)
    return sections


def _strip_bullet(line: str) -> str:
    return re.sub(r"^[\s•\-\*–·●▪]+", "", line).strip()


def find_skills(text: str) -> tuple[list[str], dict[str, str]]:
    found: list[str] = []
    evidence: dict[str, str] = {}
    for canon, meta in SKILLS.items():
        for pattern in meta["aliases"]:
            m = re.search(pattern, text, flags=re.IGNORECASE)
            if m:
                found.append(canon)
                start = max(0, m.start() - 40)
                snippet = text[start : m.end() + 40].replace("\n", " ").strip()
                evidence[canon] = f"…{snippet}…"
                break
    return found, evidence


def find_soft_skills(text: str) -> list[str]:
    return [name for name, pats in SOFT_SKILLS.items() if any(re.search(p, text, re.IGNORECASE) for p in pats)]


def _parse_employment(lines: list[str]) -> tuple[list[dict], str | None]:
    entries: list[dict] = []
    break_note: str | None = None
    prev_text = ""
    current: dict | None = None
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        m = RANGE_RE.search(line)
        if m:
            header = (line[: m.start()] + " " + line[m.end() :]).strip(" |,–-—()\t")
            if not header and prev_text:
                header = prev_text
            if "career break" in header.lower() or "career gap" in header.lower():
                break_note = header
                current = None
                continue
            parts = [p.strip() for p in re.split(r"\s*\|\s*|\s+at\s+|\s*,\s*|\s+[–—-]\s+", header) if p.strip()]
            title = parts[0] if parts else "Role"
            company = parts[1] if len(parts) > 1 else None
            start, end = _parse_date(m.group("start")), _parse_date(m.group("end"))
            years = _years_between(start, end) if start and end else None
            current = {
                "title": title[:160], "company": company[:160] if company else None,
                "start": m.group("start"), "end": m.group("end"),
                "start_ym": start, "end_ym": end,
                "is_current": m.group("end").lower() in {"present", "current", "now", "till date"},
                "years": years, "highlights": [],
            }
            entries.append(current)
        else:
            text = _strip_bullet(line)
            if current is not None and raw.lstrip()[:1] in "•-*–·●▪" and text:
                current["highlights"].append(text)
            elif current is not None and text and len(text) > 25:
                current["highlights"].append(text)
            prev_text = text
    return entries, break_note


def parse_resume(text: str) -> dict:
    lines = [l for l in text.splitlines()]
    non_empty = [l.strip() for l in lines if l.strip()]
    sections = _split_sections(lines)

    # Name: first short line made of words that isn't a heading or contact line.
    name = None
    for line in non_empty[:5]:
        if EMAIL_RE.search(line) or any(ch.isdigit() for ch in line) or _heading_of(line):
            continue
        tokens = line.replace(".", " ").split()
        if 1 < len(tokens) <= 4 and all(t.isalpha() for t in tokens):
            name = line.strip()
            break

    email = (EMAIL_RE.search(text) or [None])[0] if EMAIL_RE.search(text) else None
    phone_m = PHONE_RE.search(text)
    phone = phone_m.group(0).strip() if phone_m else None

    employment, break_note = _parse_employment(sections.get("experience", []))
    experience_years = round(sum(e["years"] or 0 for e in employment), 1) if employment else None

    career_break_years = None
    if employment and not any(e["is_current"] for e in employment):
        last_end = max((e["end_ym"] for e in employment if e["end_ym"]), default=None)
        if last_end:
            today = date.today()
            gap = _years_between(last_end, (today.year, today.month))
            career_break_years = gap if gap >= 0.3 else 0.0
    elif employment:
        career_break_years = 0.0

    # Career-break reason: only what the person wrote.
    break_lines = [_strip_bullet(l) for l in sections.get("career_break", []) if l.strip()]
    break_text = " ".join(break_lines) or break_note or ""
    reason = None
    if break_text:
        found = [r for r in BREAK_REASONS if r in break_text.lower()]
        reason = ", ".join(dict.fromkeys(found)) if found else None

    education_lines = [_strip_bullet(l) for l in sections.get("education", []) if l.strip()]
    if not education_lines:
        education_lines = [l for l in non_empty if DEGREE_RE.search(l)][:3]
    education_field = next((f for f in FIELDS if re.search(f, text, re.IGNORECASE)), None)

    skills, evidence = find_skills(text)
    soft = find_soft_skills(text)
    transferable = soft + [s for s in skills if s in CROSS_ROLE_TECHNICAL]

    projects = [_strip_bullet(l) for l in sections.get("projects", []) if _strip_bullet(l)][:6]
    certifications = [_strip_bullet(l) for l in sections.get("certifications", []) if _strip_bullet(l)][:6]
    summary = " ".join(_strip_bullet(l) for l in sections.get("summary", []) if l.strip())[:600] or None

    objective_text = " ".join(sections.get("objective", [])) + " " + break_text
    target_role = resolve_role(objective_text) if objective_text.strip() else None

    previous_role = employment[0]["title"] if employment else None
    if employment:
        latest = max(employment, key=lambda e: e["end_ym"] or (0, 0))
        previous_role = latest["title"]

    domain = None
    if previous_role:
        pr = previous_role.lower()
        if any(k in pr for k in ["developer", "engineer", "programmer", "architect"]):
            domain = "Software Engineering"
        elif "analyst" in pr:
            domain = "Data & Analytics"
        elif any(k in pr for k in ["test", "qa", "quality"]):
            domain = "Quality Assurance"
        elif "design" in pr:
            domain = "Design"

    missing = []
    if not name:
        missing.append("full_name")
    if not employment:
        missing.append("employment_history")
    if not education_lines:
        missing.append("education")
    if not skills:
        missing.append("technical_skills")
    if not target_role:
        missing.append("target_role")

    return {
        "full_name": name,
        "email": email,
        "phone": phone,
        "summary": summary,
        "previous_role": previous_role,
        "domain": domain,
        "employment": [
            {k: v for k, v in e.items() if k not in {"start_ym", "end_ym", "is_current"}} for e in employment
        ],
        "experience_years": experience_years,
        "career_break_years": career_break_years,
        "career_break_reason": reason,
        "career_break_note": break_text or None,
        "education": education_lines[:4],
        "education_field": education_field,
        "skills": skills,
        "skill_evidence": evidence,
        "soft_skills": soft,
        "transferable_skills": list(dict.fromkeys(transferable)),
        "projects": projects,
        "certifications": certifications,
        "target_role": target_role,
        "missing": missing,
    }

"""Skill taxonomy: canonical names, resume aliases and how quickly each skill evolves.

`volatility` drives the documented recency-decay rule used by the Skill Gap Agent:
fast-evolving skills (frameworks, tooling) need more refreshing after a break than
stable fundamentals (SQL, Git). It never reduces the value of past experience; it
only estimates what is worth revising first.
"""
from __future__ import annotations

import re

# canonical name -> metadata
SKILLS: dict[str, dict] = {
    "Java": {"aliases": [r"\bjava\b(?!\s*script)", r"\bj2ee\b", r"\bjdk\b"], "volatility": "moderate", "category": "Language"},
    "Python": {"aliases": [r"\bpython\b"], "volatility": "moderate", "category": "Language"},
    "JavaScript": {"aliases": [r"javascript", r"\bjs\b", r"\bes6\b"], "volatility": "fast", "category": "Language"},
    "TypeScript": {"aliases": [r"typescript"], "volatility": "fast", "category": "Language"},
    "SQL": {"aliases": [r"\bsql\b", r"mysql", r"postgres(?:ql)?", r"oracle\s*db", r"pl/sql", r"sql server"], "volatility": "stable", "category": "Data"},
    "Spring Boot": {"aliases": [r"spring\s*boot", r"spring framework", r"spring mvc", r"spring data"], "volatility": "fast", "category": "Framework"},
    "REST APIs": {"aliases": [r"\brestful\b", r"\brest\s*(?:api|apis|services|web services|endpoints)", r"web services", r"\bapi development\b"], "volatility": "moderate", "category": "Backend"},
    "Microservices": {"aliases": [r"micro-?services"], "volatility": "fast", "category": "Architecture"},
    "Docker": {"aliases": [r"\bdocker\b", r"containeri[sz]ation"], "volatility": "fast", "category": "DevOps"},
    "Kubernetes": {"aliases": [r"kubernetes", r"\bk8s\b"], "volatility": "fast", "category": "DevOps"},
    "Cloud Deployment": {"aliases": [r"\baws\b", r"\bazure\b", r"\bgcp\b", r"google cloud", r"cloud deployment"], "volatility": "fast", "category": "Cloud"},
    "CI/CD": {"aliases": [r"ci/cd", r"jenkins", r"github actions", r"gitlab ci", r"continuous integration"], "volatility": "fast", "category": "DevOps"},
    "Git": {"aliases": [r"\bgit\b", r"github", r"gitlab", r"bitbucket"], "volatility": "stable", "category": "Tooling"},
    "Unit Testing": {"aliases": [r"junit", r"unit test(?:ing|s)?", r"pytest", r"testng", r"mockito", r"\btdd\b"], "volatility": "moderate", "category": "Quality"},
    "HTML": {"aliases": [r"\bhtml5?\b"], "volatility": "stable", "category": "Frontend"},
    "CSS": {"aliases": [r"\bcss3?\b", r"tailwind", r"bootstrap"], "volatility": "moderate", "category": "Frontend"},
    "React": {"aliases": [r"\breact(?:\.js|js)?\b"], "volatility": "fast", "category": "Frontend"},
    "Excel": {"aliases": [r"\bexcel\b", r"spreadsheets?"], "volatility": "stable", "category": "Data"},
    "Power BI": {"aliases": [r"power\s*bi"], "volatility": "fast", "category": "Data"},
    "Tableau": {"aliases": [r"tableau"], "volatility": "moderate", "category": "Data"},
    "Statistics": {"aliases": [r"statistic(?:s|al)"], "volatility": "stable", "category": "Data"},
    "Data Visualization": {"aliases": [r"data visuali[sz]ation", r"\bdashboards?\b"], "volatility": "moderate", "category": "Data"},
    "Selenium": {"aliases": [r"selenium"], "volatility": "moderate", "category": "Quality"},
    "Manual Testing": {"aliases": [r"manual testing", r"\btest cases?\b", r"regression testing"], "volatility": "stable", "category": "Quality"},
    "Agile": {"aliases": [r"\bagile\b", r"\bscrum\b", r"\bkanban\b"], "volatility": "stable", "category": "Process"},
    "Linux": {"aliases": [r"\blinux\b", r"\bunix\b", r"\bbash\b", r"\bshell script"], "volatility": "stable", "category": "Infrastructure"},
    "Terraform": {"aliases": [r"terraform", r"\biac\b", r"infrastructure as code"], "volatility": "fast", "category": "DevOps"},
    "Kafka": {"aliases": [r"kafka", r"event-driven", r"message broker", r"rabbitmq"], "volatility": "moderate", "category": "Architecture"},
    "Apache Spark": {"aliases": [r"spark", r"pyspark", r"big data", r"hadoop"], "volatility": "moderate", "category": "Data"},
    "Data Pipelines": {"aliases": [r"etl", r"data pipeline", r"data pipelines", r"airflow", r"data engineering"], "volatility": "moderate", "category": "Data"},
    "Machine Learning": {"aliases": [r"machine learning", r"\bml\b", r"scikit-learn", r"tensorflow", r"pytorch"], "volatility": "fast", "category": "AI"},
    "Generative AI": {"aliases": [r"generative ai", r"\bllm\b", r"prompt engineering", r"langchain", r"\brag\b", r"openai", r"claude", r"transformers"], "volatility": "fast", "category": "AI"},
    "Network Security": {"aliases": [r"network security", r"firewall", r"siem", r"soc", r"owasp", r"cybersecurity", r"infosec"], "volatility": "moderate", "category": "Security"},
    "Vulnerability Assessment": {"aliases": [r"vulnerability", r"penetration testing", r"security audit"], "volatility": "moderate", "category": "Security"},
    "Mobile Development": {"aliases": [r"react native", r"flutter", r"mobile app", r"android", r"ios", r"dart"], "volatility": "fast", "category": "Mobile"},
    "Product Strategy": {"aliases": [r"product strategy", r"product roadmap", r"user stories", r"jira", r"product management"], "volatility": "stable", "category": "Product"},
    "Figma": {"aliases": [r"figma", r"wireframing", r"prototyping", r"ui/ux", r"design systems"], "volatility": "moderate", "category": "Design"},
    "User Research": {"aliases": [r"user research", r"usability testing", r"persona", r"user journey"], "volatility": "stable", "category": "Design"},
}

SOFT_SKILLS: dict[str, list[str]] = {
    "Communication": [r"communicat"],
    "Problem Solving": [r"problem[- ]solving", r"troubleshoot", r"debugg"],
    "Teamwork": [r"team\s*work", r"collaborat", r"cross-functional"],
    "Leadership": [r"\bled\b", r"leadership", r"team lead"],
    "Mentoring": [r"mentor"],
    "Time Management": [r"time management", r"\bdeadlines?\b", r"prioriti[sz]"],
    "Stakeholder Management": [r"stakeholder", r"client[- ]facing", r"requirements? gathering"],
    "Adaptability": [r"adaptab", r"fast learner", r"quick learner"],
}

# Skills that carry across many roles; used to describe transferable strengths.
CROSS_ROLE_TECHNICAL = {"SQL", "Git", "Python", "Excel", "Agile", "REST APIs", "Unit Testing"}

VOLATILITY_DECAY_PER_YEAR = {"fast": 7.0, "moderate": 4.0, "stable": 2.0}
MAX_DECAY = 35.0


def volatility(skill: str) -> str:
    return SKILLS.get(skill, {}).get("volatility", "moderate")


def canonical(name: str) -> str:
    """Map free-text skill names (e.g. from onboarding) to canonical names where possible."""
    clean = name.strip()
    if not clean:
        return clean
    for canon in list(SKILLS) + list(SOFT_SKILLS):
        if canon.lower() == clean.lower():
            return canon
    for canon, meta in SKILLS.items():
        for pattern in meta["aliases"]:
            m = re.search(pattern, clean, flags=re.IGNORECASE)
            if m and len(m.group(0)) >= len(clean) * 0.6:
                return canon
    return clean[:1].upper() + clean[1:]

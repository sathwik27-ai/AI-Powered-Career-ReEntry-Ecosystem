"""Seed reference data (opportunities, Jotform agents, and users)."""
from __future__ import annotations

import json
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from knowledge.opportunities import DEMO_OPPORTUNITIES
from models import (
    AgentRegistry,
    AssignedTask,
    CareerHistoryEntry,
    Notification,
    Opportunity,
    Profile,
    TrainerAssignment,
    TrainerNote,
    TrainerProfile,
    User,
    UserSettings,
    UserSkill,
)
from services.auth import hash_password

log = logging.getLogger("restarther.seed")

REQUIRED_FIELDS = {
    "slug", "title", "employer_label", "location", "arrangement",
    "employment_type", "role_family", "required_skills", "source_url"
}

JOTFORM_AGENTS = [
    {
        "key": "profile_intake",
        "name": "ReStartHer Profile Intake",
        "description": "Welcomes new learners, collects their professional background, previous work experience, education, skills, interests and career goals to guide them through onboarding.",
        "role_summary": "Onboarding & Background Intake Assistant",
        "jotform_id": "01a1de02216070008ef9ea7886d80c2c3a1d",
        "accent_color": "#2FC9E3",  # aqua
        "icon": "UserPlus",
        "category": "Onboarding",
        "status": "active",
    },
    {
        "key": "skill_gap",
        "name": "ReStartHer Skill Gap Explainer",
        "description": "Compares previous background against target role benchmarks, explains identified skill gaps in simple terms, and recommends focus areas for highest comeback impact.",
        "role_summary": "Skill Gap Analysis & Benchmark Explainer",
        "jotform_id": "01a1de36f0e8700086166b4a851c6cc3ee54",
        "accent_color": "#FF9A3D",  # tangerine
        "icon": "Target",
        "category": "Analysis",
        "status": "active",
    },
    {
        "key": "tutor_coach",
        "name": "ReStartHer Tutor Coach",
        "description": "Personalized AI tutor that explains learning topics in plain language, answers doubts, provides worked examples, and supports practice exercises.",
        "role_summary": "Personalized Learning & Doubt Solver",
        "jotform_id": "01a1de4d9d9870008b817a17a82f4df6c01f",
        "accent_color": "#43D98C",  # lime
        "icon": "BookOpen",
        "category": "Learning",
        "status": "active",
    },
    {
        "key": "interview_coach",
        "name": "ReStartHer Interview Coach",
        "description": "Runs supportive technical and HR mock interview sessions, asks realistic role questions, guides career-break answers positively, and scores responses against clear rubrics.",
        "role_summary": "Mock Interview & Confidence Coach",
        "jotform_id": "01a1de720200700080d531f4ede929161334",
        "accent_color": "#FF5C8A",  # strawberry
        "icon": "Mic",
        "category": "Interview Prep",
        "status": "active",
    },
    {
        "key": "job_scout",
        "name": "ReStartHer Job Scout",
        "description": "Explains recommended job opportunities and returnships, clarifies skill matches and missing requirements, prioritizes postings, and provides direct search links.",
        "role_summary": "Opportunity Prioritization & Job Search Guide",
        "jotform_id": "01a1de9d73187000802c8a3d7e9646b202f9",
        "accent_color": "#4D8DFF",  # blueberry
        "icon": "Briefcase",
        "category": "Career & Jobs",
        "status": "active",
    },
    {
        "key": "application_assistant",
        "name": "ReStartHer Application Assistant",
        "description": "Drafts tailored resume summaries, persuasive cover letters, and interview prep notes grounded strictly in learner facts. Requires human approval before applying.",
        "role_summary": "Tailored Application Materials & Draft Assistant",
        "jotform_id": "01a1dea7df10700086de70a71d70390e6a24",
        "accent_color": "#8E5CFF",  # grape
        "icon": "FileText",
        "category": "Applications",
        "status": "active",
    },
]


def _upsert_opportunity(db: Session, data: dict, source: str) -> None:
    existing = db.scalar(select(Opportunity).where(Opportunity.slug == data["slug"]))
    payload = {
        "title": data["title"], "employer_label": data["employer_label"], "location": data["location"],
        "arrangement": data["arrangement"], "employment_type": data["employment_type"],
        "flexible_hours": bool(data.get("flexible_hours", False)),
        "returnship_friendly": bool(data.get("returnship_friendly", False)),
        "role_family": data["role_family"], "required_skills": list(data.get("required_skills", [])),
        "nice_to_have": list(data.get("nice_to_have", [])), "min_experience": float(data.get("min_experience", 0)),
        "description": data.get("description", ""), "source": source,
        "source_url": data.get("source_url"), "is_demo": source == "demo",
    }
    if existing:
        for k, v in payload.items():
            setattr(existing, k, v)
    else:
        db.add(Opportunity(slug=data["slug"], **payload))


def seed_opportunities(db: Session) -> None:
    for item in DEMO_OPPORTUNITIES:
        _upsert_opportunity(db, item, "demo")

    verified_file = settings.storage_dir / "verified_opportunities.json"
    if verified_file.exists():
        try:
            items = json.loads(verified_file.read_text(encoding="utf-8"))
            for item in items:
                missing = REQUIRED_FIELDS - item.keys()
                if missing:
                    log.warning("Skipping verified opportunity %s: missing %s", item.get("slug"), missing)
                    continue
                _upsert_opportunity(db, item, "verified")
        except (json.JSONDecodeError, OSError, TypeError) as exc:
            log.error("Could not load verified opportunities: %s", exc)
    db.commit()


def seed_agents(db: Session) -> None:
    for a in JOTFORM_AGENTS:
        existing = db.scalar(select(AgentRegistry).where(AgentRegistry.key == a["key"]))
        if existing:
            for k, v in a.items():
                setattr(existing, k, v)
        else:
            db.add(AgentRegistry(**a))
    db.commit()


def seed_users_and_demo(db: Session) -> None:
    """Seed initial Admin, Demo Trainer, and Demo Learner (Priya) idempotently."""
    # 1. Admin
    admin_email = settings.admin_email
    admin = db.scalar(select(User).where(User.email == admin_email))
    if not admin:
        admin = User(
            name="Platform Administrator",
            email=admin_email,
            hashed_password=hash_password(settings.admin_password),
            role="admin",
            is_active=True,
            is_demo=False,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        db.add(UserSettings(user_id=admin.id, theme="light"))
        db.commit()

    # 2. Demo Trainer
    trainer_email = "trainer@restarther.org"
    trainer = db.scalar(select(User).where(User.email == trainer_email))
    if not trainer:
        trainer = User(
            name="Ananya Sharma (Senior Mentor)",
            email=trainer_email,
            hashed_password=hash_password("TrainerSecure123!"),
            role="trainer",
            is_active=True,
            is_demo=True,
        )
        db.add(trainer)
        db.commit()
        db.refresh(trainer)
        db.add(TrainerProfile(
            user_id=trainer.id,
            specialization="Full Stack & Java Backend Mentorship",
            bio="Lead software engineer and returnship career coach with 12+ years experience mentoring women returning to tech.",
            max_learners=25
        ))
        db.add(UserSettings(user_id=trainer.id, theme="light"))
        db.commit()

    # 3. Demo Listener (Priya Raman)
    priya_email = "priya@restarther.org"
    priya = db.scalar(select(User).where(User.email == priya_email))
    if not priya:
        priya = User(
            name="Priya Raman",
            email=priya_email,
            hashed_password=hash_password("PriyaSecure123!"),
            role="listener",
            is_active=True,
            is_demo=True,
            assigned_trainer_id=trainer.id,
        )
        db.add(priya)
        db.commit()
        db.refresh(priya)

        db.add(UserSettings(user_id=priya.id, theme="light"))
        db.add(TrainerAssignment(
            trainer_id=trainer.id,
            listener_id=priya.id,
            notes="Assigned to Ananya Sharma for Java Backend comeback track."
        ))

        # Direct profile seed for instant demo access without blocking on heavy PDF pipeline
        profile = db.scalar(select(Profile).where(Profile.user_id == priya.id))
        if not profile:
            profile = Profile(
                user_id=priya.id,
                full_name="Priya Raman",
                email=priya_email,
                headline="Java Backend Developer returning after 3-year career break",
                previous_role="Backend Developer",
                target_role="Backend Developer",
                experience_years=4.5,
                career_break_years=3.0,
                career_break_reason="Family caregiving break",
                soft_skills=["Communication", "Team Collaboration", "Problem Solving"],
                transferable_skills=["Agile", "System Design", "Code Review"],
                education=["B.Tech Computer Science"],
                work_preferences=["Remote", "Hybrid"],
                employment_types=["Full-time", "Returnship"],
                location_preference="Chennai",
                hours_per_day=2.0,
                plan_days=30,
                learning_preferences=["Hands-on exercises", "Video tutorials", "Official documentation"],
            )
            db.add(profile)

        # Seed initial trainer note and assigned task for Priya
        db.add(TrainerNote(
            trainer_id=trainer.id,
            listener_id=priya.id,
            content="Priya has strong core Java and SQL fundamentals from prior 4.5 years experience. Recommended focusing on modern Spring Boot REST APIs and Docker containerization.",
            category="guidance"
        ))
        db.add(AssignedTask(
            trainer_id=trainer.id,
            listener_id=priya.id,
            title="Modern Spring Boot Microservices Quickstart",
            description="Complete the Spring Boot practice module and review modern dependency injection patterns.",
            skill="Spring Boot",
            due_date="Day 5",
            status="pending"
        ))
        db.add(Notification(
            user_id=priya.id,
            title="Welcome to ReStartHer!",
            message="Your comeback roadmap has been generated. Explore your personalized lessons and meet your AI Agents.",
            type="info",
            link="/app/journey"
        ))
        db.add(Notification(
            user_id=priya.id,
            title="Trainer Assigned",
            message="Ananya Sharma has been assigned as your dedicated mentor.",
            type="info",
            link="/app/dashboard"
        ))
        db.commit()

    # Always ensure Demo Priya is completely restored and clean
    restore_demo_priya(db)


def restore_demo_priya(db: Session) -> User | None:
    """Ensure Demo Priya (priya@restarther.org) always has her pristine Priya Raman Java Backend comeback profile."""
    # 1. Clean up Trainer (user 2): trainers should never have candidate profiles
    trainer = db.scalar(select(User).where(User.email == "trainer@restarther.org"))
    if trainer:
        db.query(Profile).filter(Profile.user_id == trainer.id).delete()
        db.query(CareerHistoryEntry).filter(CareerHistoryEntry.user_id == trainer.id).delete()
        db.query(UserSkill).filter(UserSkill.user_id == trainer.id).delete()
        db.commit()

    # 2. Find Priya
    priya_email = "priya@restarther.org"
    priya = db.scalar(select(User).where(User.email == priya_email))
    if not priya:
        return None

    priya.name = "Priya Raman"
    priya.role = "listener"
    priya.is_demo = True
    if trainer:
        priya.assigned_trainer_id = trainer.id
    db.add(priya)
    db.commit()

    # 3. Clean up existing skills and career history for Priya so nothing from other accounts is mixed
    db.query(UserSkill).filter(UserSkill.user_id == priya.id).delete()
    db.query(CareerHistoryEntry).filter(CareerHistoryEntry.user_id == priya.id).delete()

    # 4. Insert pristine skills for Priya
    priya_skills = ["Java", "Spring Boot", "REST APIs", "SQL", "Unit Testing", "Git", "Docker", "Microservices"]
    for s in priya_skills:
        db.add(UserSkill(user_id=priya.id, name=s, kind="technical", source="demo_seed"))
    for s in ["Communication", "Team Collaboration", "Problem Solving"]:
        db.add(UserSkill(user_id=priya.id, name=s, kind="soft", source="demo_seed"))

    # 5. Insert pristine career history for Priya
    db.add(CareerHistoryEntry(
        user_id=priya.id,
        title="Java Backend Developer",
        company="TechSolutions Pvt Ltd",
        years=4.5,
        start="2016-01",
        end="2020-06",
        highlights=["Developed microservices with Spring Boot and PostgreSQL", "Built RESTful APIs serving 50k+ daily requests", "Automated JUnit test suites with 85% coverage"],
        order=0,
    ))

    # 6. Reset or update Priya's profile
    profile = db.scalar(select(Profile).where(Profile.user_id == priya.id))
    if not profile:
        profile = Profile(user_id=priya.id)
        db.add(profile)

    profile.full_name = "Priya Raman"
    profile.email = priya_email
    profile.headline = "Java Backend Developer returning after 3-year career break"
    profile.previous_role = "Java Backend Developer"
    profile.target_role = "Backend Developer"
    profile.experience_years = 4.5
    profile.career_break_years = 3.0
    profile.career_break_reason = "Family caregiving break"
    profile.education = ["B.Tech Computer Science"]
    profile.soft_skills = ["Communication", "Team Collaboration", "Problem Solving"]
    profile.transferable_skills = ["Agile", "System Design", "Code Review"]
    profile.work_preferences = ["Remote", "Hybrid"]
    profile.employment_types = ["Full-time", "Returnship"]
    profile.location_preference = "Chennai"
    profile.hours_per_day = 2.0
    profile.plan_days = 30
    profile.learning_preferences = ["Hands-on exercises", "Video tutorials", "Official documentation"]
    profile.missing_info = []
    profile.clarification_questions = []
    profile.source = "demo_seed"

    db.commit()
    return priya

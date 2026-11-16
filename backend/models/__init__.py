"""SQLAlchemy ORM models for ReStartHer."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(200), unique=True, index=True, nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(30), default="listener")  # listener | trainer | admin
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    assigned_trainer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_woman_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    profile: Mapped["Profile | None"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    headline: Mapped[str | None] = mapped_column(String(200), nullable=True)
    previous_role: Mapped[str | None] = mapped_column(String(120), nullable=True)
    domain: Mapped[str | None] = mapped_column(String(120), nullable=True)
    education: Mapped[list[str]] = mapped_column(JSON, default=list)
    education_field: Mapped[str | None] = mapped_column(String(120), nullable=True)
    experience_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    career_break_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    career_break_reason: Mapped[str | None] = mapped_column(String(300), nullable=True)
    target_role: Mapped[str | None] = mapped_column(String(120), nullable=True)
    soft_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    transferable_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    certifications: Mapped[list[str]] = mapped_column(JSON, default=list)
    projects: Mapped[list[str]] = mapped_column(JSON, default=list)
    work_preferences: Mapped[list[str]] = mapped_column(JSON, default=list)
    employment_types: Mapped[list[str]] = mapped_column(JSON, default=list)
    location_preference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    hours_per_day: Mapped[float] = mapped_column(Float, default=2.0)
    plan_days: Mapped[int] = mapped_column(Integer, default=30)
    learning_preferences: Mapped[list[str]] = mapped_column(JSON, default=list)
    missing_info: Mapped[list[str]] = mapped_column(JSON, default=list)
    clarification_questions: Mapped[list[str]] = mapped_column(JSON, default=list)
    skill_evidence: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    source: Mapped[str] = mapped_column(String(30), default="manual")
    extraction_mode: Mapped[str] = mapped_column(String(20), default="demo")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped[User] = relationship(back_populates="profile")


class CareerHistoryEntry(Base):
    __tablename__ = "career_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(160))
    company: Mapped[str | None] = mapped_column(String(160), nullable=True)
    start: Mapped[str | None] = mapped_column(String(30), nullable=True)
    end: Mapped[str | None] = mapped_column(String(30), nullable=True)
    years: Mapped[float | None] = mapped_column(Float, nullable=True)
    highlights: Mapped[list[str]] = mapped_column(JSON, default=list)
    order: Mapped[int] = mapped_column(Integer, default=0)


class UserSkill(Base):
    __tablename__ = "user_skills"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    kind: Mapped[str] = mapped_column(String(20), default="technical")  # technical | soft
    source: Mapped[str] = mapped_column(String(20), default="resume")  # resume | manual


class ResumeFile(Base):
    __tablename__ = "resume_files"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    stored_path: Mapped[str] = mapped_column(String(500))
    content_type: Mapped[str] = mapped_column(String(20))
    size_bytes: Mapped[int] = mapped_column(Integer)
    text_chars: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SkillAssessment(Base):
    __tablename__ = "skill_assessments"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    target_role: Mapped[str] = mapped_column(String(120))
    readiness: Mapped[float] = mapped_column(Float, default=0)
    items: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    summary: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    trigger: Mapped[str] = mapped_column(String(60), default="initial")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    planned_days: Mapped[int] = mapped_column(Integer, default=30)
    total_days: Mapped[int] = mapped_column(Integer, default=30)
    hours_per_day: Mapped[float] = mapped_column(Float, default=2.0)
    focus_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    difficulty: Mapped[dict[str, str]] = mapped_column(JSON, default=dict)
    changes: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    mini_project: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    tasks: Mapped[list["LearningTask"]] = relationship(
        back_populates="roadmap", cascade="all, delete-orphan", order_by="(LearningTask.day, LearningTask.order)"
    )


class LearningTask(Base):
    __tablename__ = "learning_tasks"
    id: Mapped[int] = mapped_column(primary_key=True)
    roadmap_id: Mapped[int] = mapped_column(ForeignKey("learning_roadmaps.id", ondelete="CASCADE"), index=True)
    day: Mapped[int] = mapped_column(Integer)
    order: Mapped[int] = mapped_column(Integer, default=0)
    skill: Mapped[str] = mapped_column(String(80))
    kind: Mapped[str] = mapped_column(String(20))  # learn|practice|quiz|project|revision|challenge|reflect
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    minutes: Mapped[int] = mapped_column(Integer, default=30)
    resource_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resource_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    added_by_adaptation: Mapped[bool] = mapped_column(Boolean, default=False)
    adaptation_note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    roadmap: Mapped[LearningRoadmap] = relationship(back_populates="tasks")


class QuizResult(Base):
    __tablename__ = "quiz_results"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    skill: Mapped[str] = mapped_column(String(80))
    correct: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    percent: Mapped[float] = mapped_column(Float)
    answers: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    interview_type: Mapped[str] = mapped_column(String(20))  # technical | hr | mixed
    status: Mapped[str] = mapped_column(String(20), default="in_progress")  # in_progress | completed
    questions: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    weak_topics: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    feedback: Mapped[list["InterviewFeedback"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="InterviewFeedback.id"
    )


class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True)
    question_id: Mapped[str] = mapped_column(String(40))
    question: Mapped[str] = mapped_column(Text)
    question_type: Mapped[str] = mapped_column(String(20))
    skill: Mapped[str | None] = mapped_column(String(80), nullable=True)
    answer: Mapped[str] = mapped_column(Text)
    scores: Mapped[dict[str, float]] = mapped_column(JSON, default=dict)
    overall: Mapped[float] = mapped_column(Float)
    strengths: Mapped[list[str]] = mapped_column(JSON, default=list)
    improvements: Mapped[list[str]] = mapped_column(JSON, default=list)
    missing_points: Mapped[list[str]] = mapped_column(JSON, default=list)
    improved_answer: Mapped[str] = mapped_column(Text, default="")
    mode: Mapped[str] = mapped_column(String(20), default="demo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    session: Mapped[InterviewSession] = relationship(back_populates="feedback")


class Opportunity(Base):
    __tablename__ = "opportunities"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    title: Mapped[str] = mapped_column(String(160))
    employer_label: Mapped[str] = mapped_column(String(160))
    location: Mapped[str] = mapped_column(String(120))
    arrangement: Mapped[str] = mapped_column(String(30))  # Remote | Hybrid | On-site
    employment_type: Mapped[str] = mapped_column(String(30))  # Full-time | Part-time | Contract | Freelance | Returnship
    flexible_hours: Mapped[bool] = mapped_column(Boolean, default=False)
    returnship_friendly: Mapped[bool] = mapped_column(Boolean, default=False)
    role_family: Mapped[str] = mapped_column(String(120))
    required_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    nice_to_have: Mapped[list[str]] = mapped_column(JSON, default=list)
    min_experience: Mapped[float] = mapped_column(Float, default=0)
    description: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(30), default="demo")  # demo | verified
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)


class SavedOpportunity(Base):
    __tablename__ = "saved_opportunities"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    opportunity_id: Mapped[int] = mapped_column(ForeignKey("opportunities.id", ondelete="CASCADE"))
    match_score: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Application(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    opportunity_id: Mapped[int] = mapped_column(ForeignKey("opportunities.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(30), default="saved")
    notes: Mapped[str] = mapped_column(Text, default="")
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    history: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    opportunity: Mapped[Opportunity] = relationship()


class ResumeDraft(Base):
    __tablename__ = "resume_drafts"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    content: Mapped[str] = mapped_column(Text)
    tailoring_notes: Mapped[list[str]] = mapped_column(JSON, default=list)
    edited_by_user: Mapped[bool] = mapped_column(Boolean, default=False)
    mode: Mapped[str] = mapped_column(String(20), default="demo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class CoverLetter(Base):
    __tablename__ = "cover_letters"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    content: Mapped[str] = mapped_column(Text)
    edited_by_user: Mapped[bool] = mapped_column(Boolean, default=False)
    mode: Mapped[str] = mapped_column(String(20), default="demo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class AgentLog(Base):
    __tablename__ = "agent_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    run_id: Mapped[str] = mapped_column(String(40), index=True)
    workflow: Mapped[str] = mapped_column(String(60))
    step: Mapped[int] = mapped_column(Integer)
    agent: Mapped[str] = mapped_column(String(40))
    action: Mapped[str] = mapped_column(String(200))
    input_summary: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    output_summary: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    decision: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_agent: Mapped[str | None] = mapped_column(String(40), nullable=True)
    roadmap_changed: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="success")
    mode: Mapped[str] = mapped_column(String(20), default="demo")
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class CareerPlan(Base):
    __tablename__ = "career_plans"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    goal: Mapped[str] = mapped_column(String(300), default="")
    data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    change_log: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class TrainerProfile(Base):
    __tablename__ = "trainer_profiles"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    specialization: Mapped[str | None] = mapped_column(String(120), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_learners: Mapped[int] = mapped_column(Integer, default=20)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class TrainerAssignment(Base):
    __tablename__ = "trainer_assignments"
    id: Mapped[int] = mapped_column(primary_key=True)
    trainer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    listener_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class AssignedTask(Base):
    __tablename__ = "assigned_tasks"
    id: Mapped[int] = mapped_column(primary_key=True)
    trainer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    listener_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    skill: Mapped[str] = mapped_column(String(80))
    due_date: Mapped[str | None] = mapped_column(String(30), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending")  # pending | in_progress | completed
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class TrainerNote(Base):
    __tablename__ = "trainer_notes"
    id: Mapped[int] = mapped_column(primary_key=True)
    trainer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    listener_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    content: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), default="general")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(50), default="info")  # info | alert | task | interview | job
    link: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AgentRegistry(Base):
    __tablename__ = "agent_registry"
    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    role_summary: Mapped[str] = mapped_column(String(255))
    jotform_id: Mapped[str] = mapped_column(String(100))
    accent_color: Mapped[str] = mapped_column(String(30))
    icon: Mapped[str] = mapped_column(String(50))
    category: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    action: Mapped[str] = mapped_column(String(100))
    resource: Mapped[str] = mapped_column(String(100))
    details: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class UserSettings(Base):
    __tablename__ = "user_settings"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    theme: Mapped[str] = mapped_column(String(20), default="light")
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    job_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


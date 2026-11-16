"""Pydantic request/response schemas for the ReStartHer API.

Request bodies are strictly validated. Large nested responses that come straight from
the orchestrator (plans, roadmaps, workflow results) are typed as structured dicts so
the API never drifts from the orchestrator's actual return format.
"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

WorkArrangement = Literal["Remote", "Hybrid", "On-site", "Part-time", "Flexible hours"]
EmploymentType = Literal["Full-time", "Part-time", "Contract", "Freelance", "Returnship"]
ApplicationStatus = Literal["saved", "drafted", "ready_for_review", "applied", "interview", "rejected", "offer"]
InterviewType = Literal["technical", "hr", "mixed"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


# ------------------------------------------------------------------ common
class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = {}


class ErrorResponse(BaseModel):
    error: ErrorBody


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    service: str
    version: str
    ai_mode: Literal["llm", "demo"]
    ai_mode_description: str
    database: Literal["ok", "error"]


# ------------------------------------------------------------------ users / profile
class UserCreate(StrictModel):
    name: str = Field(min_length=1, max_length=120)


class UserOut(BaseModel):
    id: int
    name: str
    is_demo: bool
    created_at: str | None
    has_profile: bool


class ProfileInput(StrictModel):
    """Onboarding answers / profile edits. Every field is optional; supplied values override parsed resume values."""

    full_name: str | None = Field(default=None, max_length=120)
    previous_role: str | None = Field(default=None, max_length=120)
    experience_years: float | None = Field(default=None, ge=0, le=50)
    career_break_years: float | None = Field(default=None, ge=0, le=40)
    career_break_reason: str | None = Field(default=None, max_length=300)
    target_role: str | None = Field(default=None, max_length=120)
    skills: list[str] = Field(default_factory=list, max_length=60)
    education: list[str] = Field(default_factory=list, max_length=6)
    work_preferences: list[WorkArrangement] = Field(default_factory=list)
    employment_types: list[EmploymentType] = Field(default_factory=list)
    location_preference: str | None = Field(default=None, max_length=120)
    hours_per_day: float | None = Field(default=None, ge=0.5, le=8)
    plan_days: Literal[15, 30] | None = None
    learning_preferences: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("skills", "education", "learning_preferences")
    @classmethod
    def _clean_list(cls, v: list[str]) -> list[str]:
        out = []
        for item in v:
            item = item.strip()
            if not item:
                continue
            if len(item) > 80:
                raise ValueError("Each item must be 80 characters or fewer.")
            out.append(item)
        return list(dict.fromkeys(out))

    def manual(self) -> dict[str, Any]:
        """Only the values the person actually supplied (the Profile Agent's `manual` input)."""
        return {k: v for k, v in self.model_dump().items() if v not in (None, "", [])}


class ComebackRunRequest(StrictModel):
    force_new_roadmap: bool = Field(default=False, description="Regenerate the roadmap even if progress exists.")


# ------------------------------------------------------------------ learning
class TaskUpdate(StrictModel):
    completed: bool


class QuizSubmission(StrictModel):
    answers: dict[str, int] = Field(description="Map of question id → selected option index (0-based).")

    @field_validator("answers")
    @classmethod
    def _check(cls, v: dict[str, int]) -> dict[str, int]:
        if not v:
            raise ValueError("Answer at least one question.")
        if any(i < 0 or i > 9 for i in v.values()):
            raise ValueError("Option indexes must be between 0 and 9.")
        return v


class QuizQuestionOut(BaseModel):
    id: str
    question: str
    options: list[str]


class QuizOut(BaseModel):
    skill: str
    questions: list[QuizQuestionOut]
    note: str


# ------------------------------------------------------------------ interviews
class InterviewStart(StrictModel):
    interview_type: InterviewType = "mixed"


class InterviewAnswer(StrictModel):
    question_id: str = Field(min_length=1, max_length=40)
    answer: str = Field(min_length=2, max_length=5000)


# ------------------------------------------------------------------ applications
class ApplicationCreate(StrictModel):
    opportunity_id: int = Field(gt=0)


class DraftUpdate(StrictModel):
    resume: str | None = Field(default=None, max_length=20000)
    cover_letter: str | None = Field(default=None, max_length=10000)


class StatusUpdate(StrictModel):
    status: ApplicationStatus
    note: str = Field(default="", max_length=500)


# ------------------------------------------------------------------ activity
class ActivityLogOut(BaseModel):
    id: int
    run_id: str
    workflow: str
    step: int
    agent: str
    action: str
    input: dict[str, Any]
    output: dict[str, Any]
    decision: str | None
    next_agent: str | None
    roadmap_changed: bool
    status: str
    mode: str
    duration_ms: int
    created_at: str | None


# ------------------------------------------------------------------ auth & administration
class RegisterRequest(StrictModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=6, max_length=120)
    confirm_password: str | None = None
    terms_accepted: bool = Field(default=True)
    is_woman_confirm: bool = Field(default=True)

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email format.")
        return v


class LoginRequest(StrictModel):
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=1, max_length=120)


class UserAuthOut(BaseModel):
    id: int
    name: str
    email: str | None
    role: str
    is_demo: bool
    has_profile: bool
    is_woman_verified: bool = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserAuthOut
    redirect: str


class ForgotPasswordRequest(StrictModel):
    email: str = Field(min_length=5, max_length=200)


class ResetPasswordRequest(StrictModel):
    token: str
    new_password: str = Field(min_length=6, max_length=120)


class AdminCreateRequest(StrictModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=6, max_length=120)


class TrainerCreateRequest(StrictModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=6, max_length=120)
    specialization: str | None = Field(default=None, max_length=120)
    bio: str | None = None
    max_learners: int = Field(default=20, ge=1, le=100)


class AssignTaskRequest(StrictModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(default="")
    skill: str = Field(min_length=1, max_length=80)
    due_date: str | None = Field(default=None, max_length=30)


class TrainerNoteRequest(StrictModel):
    content: str = Field(min_length=1, max_length=5000)
    category: str = Field(default="general", max_length=50)


class AssignTrainerRequest(StrictModel):
    trainer_id: int = Field(gt=0)
    listener_id: int = Field(gt=0)
    notes: str | None = None


class RoleUpdateRequest(StrictModel):
    role: Literal["listener", "trainer", "admin"] | None = None
    is_active: bool | None = None


class AgentOut(BaseModel):
    key: str
    name: str
    description: str
    role_summary: str
    jotform_id: str
    accent_color: str
    icon: str
    category: str
    status: str


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    link: str | None
    is_read: bool
    created_at: str | None


class UserSettingsUpdate(StrictModel):
    theme: Literal["light", "dark", "system"] | None = None
    email_notifications: bool | None = None
    job_alerts: bool | None = None


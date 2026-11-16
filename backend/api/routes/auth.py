"""Authentication router: register, login, current user, and password recovery."""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.dependencies import db_session, get_current_user
from config import settings
from models import Profile, User, UserSettings
from schemas import AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, UserAuthOut
from services.auth import create_access_token, decode_access_token, hash_password, verify_password

log = logging.getLogger("restarther.auth")
router = APIRouter(prefix="/auth", tags=["auth"])


def _user_auth_out(user: User, has_profile: bool) -> UserAuthOut:
    return UserAuthOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        is_demo=user.is_demo,
        has_profile=has_profile,
        is_woman_verified=getattr(user, "is_woman_verified", True),
    )


def _role_redirect(role: str) -> str:
    if role == "admin":
        return "/admin"
    elif role == "trainer":
        return "/trainer"
    return "/app"


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(db_session)) -> AuthResponse:
    """Register a new listener account."""
    if not body.is_woman_confirm:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ReStartHer is exclusively dedicated to women returning to work. Verification confirmation is required.",
        )

    if body.confirm_password and body.password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Passwords do not match.",
        )

    existing = db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please sign in.",
        )

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role="listener",
        is_active=True,
        is_woman_verified=True,
        is_demo=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default settings if not exists
    if not db.scalar(select(UserSettings).where(UserSettings.user_id == user.id)):
        db.add(UserSettings(user_id=user.id, theme="light"))
        db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=_user_auth_out(user, False),
        redirect=_role_redirect(user.role),
    )


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(db_session)) -> AuthResponse:
    """Authenticate user with email and password and return a JWT access token."""
    email_clean = body.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email_clean))
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact an administrator.",
        )

    has_prof = db.scalar(select(Profile).where(Profile.user_id == user.id)) is not None
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=_user_auth_out(user, has_prof),
        redirect=_role_redirect(user.role),
    )


@router.post("/logout")
def logout() -> dict[str, str]:
    """Client-side token invalidation confirmation."""
    return {"status": "ok", "message": "Successfully logged out."}


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(db_session)) -> dict[str, Any]:
    """Return the profile and role details of the currently authenticated user."""
    profile = db.scalar(select(Profile).where(Profile.user_id == current_user.id))
    has_profile = profile is not None

    data: dict[str, Any] = {
        "user": _user_auth_out(current_user, has_profile).model_dump(),
        "has_profile": has_profile,
    }

    if profile:
        data["profile"] = {
            "target_role": profile.target_role,
            "previous_role": profile.previous_role,
            "experience_years": profile.experience_years,
            "career_break_years": profile.career_break_years,
            "hours_per_day": profile.hours_per_day,
            "plan_days": profile.plan_days,
            "location_preference": profile.location_preference,
            "work_preferences": profile.work_preferences,
        }

    # If listener has assigned trainer, fetch trainer info
    if current_user.assigned_trainer_id:
        trainer = db.scalar(select(User).where(User.id == current_user.assigned_trainer_id))
        if trainer:
            data["trainer"] = {
                "id": trainer.id,
                "name": trainer.name,
                "email": trainer.email,
            }

    return data


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(db_session)) -> dict[str, str]:
    """Generate a password recovery token (for demo/prototype, returns token in response)."""
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if not user:
        # Prevent email enumeration: return standard message
        return {
            "status": "ok",
            "message": "If an account with that email exists, password reset instructions have been sent.",
        }

    reset_token = create_access_token({"sub": str(user.id), "purpose": "reset_password"})
    response = {
        "status": "ok",
        "message": "If an account with that email exists, password reset instructions have been sent.",
    }
    # Only expose the reset token in the response when DEMO_MODE is active (for automated local test suites)
    if settings.demo_mode:
        response["reset_token"] = reset_token
    return response


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(db_session)) -> dict[str, str]:
    """Reset password using a valid reset token."""
    payload = decode_access_token(body.token)
    if not payload or payload.get("purpose") != "reset_password":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

    user_id = payload.get("sub")
    try:
        uid = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user subject.")

    user = db.scalar(select(User).where(User.id == uid))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"status": "ok", "message": "Password updated successfully. You can now log in."}

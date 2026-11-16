"""User settings endpoints: theme and notification preferences."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.dependencies import db_session, get_current_user
from models import User, UserSettings
from schemas import UserSettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Get current user settings."""
    settings_obj = db.scalar(select(UserSettings).where(UserSettings.user_id == current_user.id))
    if not settings_obj:
        settings_obj = UserSettings(user_id=current_user.id, theme="light")
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)

    return {
        "theme": settings_obj.theme,
        "email_notifications": settings_obj.email_notifications,
        "job_alerts": settings_obj.job_alerts,
    }


@router.put("")
def update_user_settings(
    body: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> dict[str, Any]:
    """Update current user settings."""
    settings_obj = db.scalar(select(UserSettings).where(UserSettings.user_id == current_user.id))
    if not settings_obj:
        settings_obj = UserSettings(user_id=current_user.id)
        db.add(settings_obj)

    if body.theme is not None:
        settings_obj.theme = body.theme
    if body.email_notifications is not None:
        settings_obj.email_notifications = body.email_notifications
    if body.job_alerts is not None:
        settings_obj.job_alerts = body.job_alerts

    db.commit()
    db.refresh(settings_obj)
    return {
        "status": "ok",
        "message": "Settings updated.",
        "settings": {
            "theme": settings_obj.theme,
            "email_notifications": settings_obj.email_notifications,
            "job_alerts": settings_obj.job_alerts,
        },
    }

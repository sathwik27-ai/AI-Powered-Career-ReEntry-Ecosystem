"""Notification center endpoints."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.dependencies import db_session, get_current_user
from models import Notification, User
from schemas import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> list[NotificationOut]:
    """Retrieve notifications for the current user."""
    notifications = db.scalars(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
    ).all()

    return [
        NotificationOut(
            id=n.id,
            title=n.title,
            message=n.message,
            type=n.type,
            link=n.link,
            is_read=n.is_read,
            created_at=n.created_at.isoformat() if n.created_at else None,
        )
        for n in notifications
    ]


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> dict[str, str]:
    """Mark a specific notification as read."""
    n = db.scalar(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    n.is_read = True
    db.commit()
    return {"status": "ok", "message": "Notification marked as read."}


@router.post("/mark-all-read")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> dict[str, str]:
    """Mark all notifications for the user as read."""
    notifications = db.scalars(
        select(Notification).where(Notification.user_id == current_user.id, Notification.is_read.is_(False))
    ).all()
    for n in notifications:
        n.is_read = True
    db.commit()
    return {"status": "ok", "message": f"{len(notifications)} notifications marked as read."}

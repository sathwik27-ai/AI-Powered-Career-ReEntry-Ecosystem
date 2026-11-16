"""Shared FastAPI dependencies for DB sessions, authentication, and role authorization."""
from __future__ import annotations

from collections.abc import Iterator
from typing import Callable

from fastapi import Depends, HTTPException, Path, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.session import get_db
from models import User
from orchestrator.career_orchestrator import CareerOrchestrator
from services.auth import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def db_session() -> Iterator[Session]:
    yield from get_db()


def get_optional_user(token: str | None = Depends(oauth2_scheme), db: Session = Depends(db_session)) -> User | None:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        return None
    return db.scalar(select(User).where(User.id == uid, User.is_active.is_(True)))


def get_current_user(token: str | None = Depends(oauth2_scheme), db: Session = Depends(db_session)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: missing subject.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID in token.")

    user = db.scalar(select(User).where(User.id == uid))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")
    return user


def require_role(allowed_roles: list[str]) -> Callable[[User], User]:
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: this endpoint requires one of [{', '.join(allowed_roles)}] privileges.",
            )
        return current_user
    return role_checker


require_listener = require_role(["listener", "admin"])
require_trainer = require_role(["trainer", "admin"])
require_admin = require_role(["admin"])


def get_orchestrator(user_id: int = Path(gt=0), db: Session = Depends(db_session)) -> CareerOrchestrator:
    # Preserves 100% backwards compatibility with existing routes and test fixtures
    return CareerOrchestrator(db, user_id)

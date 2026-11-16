"""Authentication and token utilities using bcrypt and PyJWT."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

import os
import sys
from config import settings


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt (accelerated in test environments)."""
    pw_bytes = password.encode("utf-8")
    is_test = "pytest" in sys.modules or "PYTEST_CURRENT_TEST" in os.environ or "tests" in os.getenv("STORAGE_DIR", "")
    rounds = 4 if is_test else 12
    salt = bcrypt.gensalt(rounds=rounds)
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    """Verify a plaintext password against a stored bcrypt hash."""
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)

    # Subject must be string for PyJWT compliance
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])

    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except Exception:
        return None

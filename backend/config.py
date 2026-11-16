"""Application configuration loaded from environment variables.

All secrets (e.g. ANTHROPIC_API_KEY) stay on the backend. Nothing here is
ever sent to the frontend except the derived, non-secret `ai_mode`.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

# Load .env from repo root first, then backend/.
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR / ".env")


class Settings:
    def __init__(self) -> None:
        storage = BASE_DIR / "storage"
        self.storage_dir = Path(os.getenv("STORAGE_DIR", storage))
        default_db = f"sqlite:///{(self.storage_dir / 'restarther.db').as_posix()}"
        raw_db_url = os.getenv("DATABASE_URL", default_db)
        if raw_db_url.startswith("postgres://"):
            raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
        elif raw_db_url.startswith("sqlite:///") and not raw_db_url.startswith("sqlite:////") and ":memory:" not in raw_db_url:
            raw_path = raw_db_url[len("sqlite:///"):]
            p = Path(raw_path)
            if not p.is_absolute():
                if raw_path.startswith("backend/"):
                    resolved = (BASE_DIR.parent / raw_path).resolve()
                else:
                    resolved = (BASE_DIR / raw_path).resolve()
                raw_db_url = f"sqlite:///{resolved.as_posix()}"
        self.database_url: str = raw_db_url
        self.secret_key: str = os.getenv("SECRET_KEY", "restarther-super-secret-jwt-key-2026-production")
        self.jwt_algorithm: str = "HS256"
        self.access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
        self.admin_email: str = os.getenv("ADMIN_EMAIL", "admin@restarther.org").strip()
        self.admin_password: str = os.getenv("ADMIN_PASSWORD", "AdminSecure123!").strip()
        self.demo_mode: bool = os.getenv("DEMO_MODE", "true").strip().lower() in ("true", "1", "yes")
        self.upload_dir = Path(os.getenv("UPLOAD_DIR", self.storage_dir / "uploads"))
        self.max_upload_mb: float = float(os.getenv("MAX_UPLOAD_MB", "5"))
        self.anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "").strip()
        self.anthropic_model: str = os.getenv("ANTHROPIC_MODEL", "claude-opus-5-5").strip()
        # "auto" = use Claude when a key is configured, otherwise local demo mode.
        # "demo" = always use deterministic local agents (useful for judging offline).
        self.ai_mode_setting: str = os.getenv("AI_MODE", "auto").strip().lower()
        self.cors_origins: list[str] = [
            o.strip()
            for o in os.getenv(
                "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
            ).split(",")
            if o.strip()
        ]

    @property
    def llm_enabled(self) -> bool:
        return bool(self.anthropic_api_key) and self.ai_mode_setting != "demo"

    @property
    def ai_mode(self) -> str:
        return "llm" if self.llm_enabled else "demo"


settings = Settings()

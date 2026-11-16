"""Application configuration loaded from environment variables.

All secrets (e.g. ANTHROPIC_API_KEY, SECRET_KEY, DATABASE_URL) stay on the backend.
Nothing here is ever sent to the frontend except the derived, non-secret `ai_mode`.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

log = logging.getLogger("restarther.config")
BASE_DIR = Path(__file__).resolve().parent

# Load .env from repo root first, then backend/.
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR / ".env")

INSECURE_DEFAULT_SECRETS = {
    "restarther-super-secret-jwt-key-2026-production",
    "restarther-super-secret-jwt-key-2026-production-deploy",
    "change-me",
    "secret",
    "password",
}


class Settings:
    def __init__(self) -> None:
        storage = BASE_DIR / "storage"
        self.storage_dir = Path(os.getenv("STORAGE_DIR", storage))

        # Deployment environment detection
        raw_env = os.getenv("ENVIRONMENT", "").strip().lower()
        is_render = bool(os.getenv("RENDER"))
        self.is_production: bool = is_render or raw_env in ("production", "prod")

        # Database Configuration (Neon PostgreSQL with SQLite local fallback)
        default_db = f"sqlite:///{(self.storage_dir / 'restarther.db').as_posix()}"
        raw_db_url = os.getenv("DATABASE_URL", "").strip()

        # Fall back to SQLite for local development if DATABASE_URL is unset or contains unconfigured placeholder
        if not raw_db_url or any(placeholder in raw_db_url for placeholder in ("YOUR_NEON_PASSWORD", "YOUR_PASSWORD", "<password>", "PASSWORD_HERE")):
            if self.is_production and raw_db_url:
                raise ValueError("DATABASE_URL in production contains an unconfigured placeholder password. Please provide valid Neon PostgreSQL credentials.")
            raw_db_url = default_db

        # PostgreSQL URI normalization:
        # Neon / Render / Heroku supply postgres://, postgresql://, postgresql+psycopg://, or postgresql+psycopg2://.
        # We explicitly normalize all PostgreSQL URLs to use the psycopg2 driver (psycopg2-binary).
        if raw_db_url.startswith("postgres://"):
            raw_db_url = "postgresql+psycopg2://" + raw_db_url[len("postgres://"):]
        elif raw_db_url.startswith("postgresql+psycopg://"):
            raw_db_url = "postgresql+psycopg2://" + raw_db_url[len("postgresql+psycopg://"):]
        elif raw_db_url.startswith("postgresql://"):
            raw_db_url = "postgresql+psycopg2://" + raw_db_url[len("postgresql://"):]
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

        # Security & JWT Configuration
        raw_secret = os.getenv("SECRET_KEY", "").strip()
        if self.is_production and (not raw_secret or raw_secret in INSECURE_DEFAULT_SECRETS):
            raise ValueError(
                "CRITICAL SECURITY CONFIGURATION: In production (Render/cloud), SECRET_KEY must be set "
                "to a strong, unique secret via environment variables. Do not use default or placeholder keys."
            )
        self.secret_key: str = raw_secret or "restarther-dev-local-secret-key-only"
        self.jwt_algorithm: str = "HS256"
        self.access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

        # Demo Mode (defaults to false in production unless explicitly enabled; defaults to true in local development)
        demo_env = os.getenv("DEMO_MODE")
        if demo_env is not None:
            self.demo_mode: bool = demo_env.strip().lower() in ("true", "1", "yes")
        else:
            self.demo_mode: bool = not self.is_production

        # Admin User Provisioning
        self.admin_email: str = (os.getenv("ADMIN_EMAIL") or "admin@restarther.org").strip().lower()
        env_admin_pwd = os.getenv("ADMIN_PASSWORD")
        clean_admin_pwd = env_admin_pwd.strip().strip("'\"") if env_admin_pwd else ""

        if self.is_production and not self.demo_mode:
            if not clean_admin_pwd or clean_admin_pwd in ("AdminSecure123!", "admin", "password", "changeme"):
                raise ValueError(
                    "CRITICAL SECURITY CONFIGURATION: In production mode (DEMO_MODE=false), "
                    "ADMIN_PASSWORD must be explicitly configured via Render environment variables. "
                    "Do not use default or placeholder passwords."
                )
            self.admin_password: str = clean_admin_pwd
        else:
            # When DEMO_MODE=true or in local development:
            # Use configured ADMIN_PASSWORD if provided; otherwise use standard demo password
            if clean_admin_pwd and clean_admin_pwd != "AdminSecure123!":
                self.admin_password = clean_admin_pwd
            else:
                self.admin_password = "AdminSecure123!"

        # Storage & Upload Limits
        self.upload_dir = Path(os.getenv("UPLOAD_DIR", self.storage_dir / "uploads"))
        self.max_upload_mb: float = float(os.getenv("MAX_UPLOAD_MB", "5"))

        # AI & LLM Provider Configuration
        self.anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "").strip()
        self.anthropic_model: str = os.getenv("ANTHROPIC_MODEL", "claude-opus-5-5").strip()
        # "auto" = use Claude when a key is configured, otherwise local demo mode.
        # "demo" = always use deterministic local agents (useful for judging offline).
        self.ai_mode_setting: str = os.getenv("AI_MODE", "auto").strip().lower()

        # CORS Configuration
        default_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "https://restarther.app",
        ]
        cors_env = os.getenv("CORS_ORIGINS", "").strip()
        if cors_env:
            self.cors_origins: list[str] = [
                o.strip() for o in cors_env.replace(";", ",").split(",") if o.strip()
            ]
        else:
            self.cors_origins = default_origins

        # Support Vercel preview deployments dynamically via regex (e.g. https://*-sathwik27-ai.vercel.app)
        self.cors_origin_regex: str | None = os.getenv(
            "CORS_ORIGIN_REGEX",
            r"^https://.*\.vercel\.app$"
        )

    @property
    def llm_enabled(self) -> bool:
        return bool(self.anthropic_api_key) and self.ai_mode_setting != "demo"

    @property
    def ai_mode(self) -> str:
        return "llm" if self.llm_enabled else "demo"


settings = Settings()

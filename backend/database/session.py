"""Database engine and session setup.

Supports Neon Serverless PostgreSQL with connection pooling and SQLite as local fallback.
Models use portable SQLAlchemy types.
"""
from __future__ import annotations

import logging
import os
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import settings

log = logging.getLogger("restarther.database")


class Base(DeclarativeBase):
    pass


def get_sanitized_db_url() -> str:
    """Return the database URL with secret credentials masked for safe logging."""
    try:
        url = make_url(settings.database_url)
        return url.render_as_string(hide_password=True)
    except Exception:
        return "<sanitized database url>"


_is_sqlite = settings.database_url.startswith("sqlite")
if _is_sqlite and ":memory:" not in settings.database_url:
    settings.storage_dir.mkdir(parents=True, exist_ok=True)

engine_kwargs: dict = {
    "future": True,
}

if _is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Neon Serverless PostgreSQL connection pooling resilience
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = int(os.getenv("DB_POOL_SIZE", "5"))
    engine_kwargs["max_overflow"] = int(os.getenv("DB_MAX_OVERFLOW", "10"))

    # Ensure SSL is enforced for cloud PostgreSQL connections
    if "sslmode" not in settings.database_url and "localhost" not in settings.database_url and "127.0.0.1" not in settings.database_url:
        engine_kwargs["connect_args"] = {"sslmode": "require"}

try:
    engine = create_engine(
        settings.database_url,
        **engine_kwargs,
    )
except Exception as exc:
    log.error("Failed to create database engine for %s: %s", get_sanitized_db_url(), exc)
    raise

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def _auto_migrate_sqlite() -> None:
    """Safely migrate missing columns on existing SQLite tables."""
    if not _is_sqlite:
        return
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            cursor = conn.execute(text("PRAGMA table_info(users)"))
            cols = [row[1] for row in cursor.fetchall()]
            if cols:
                for col_name, col_type in [
                    ("email", "VARCHAR"),
                    ("hashed_password", "VARCHAR"),
                    ("role", "VARCHAR DEFAULT 'listener'"),
                    ("is_active", "BOOLEAN DEFAULT 1"),
                    ("phone", "VARCHAR"),
                    ("assigned_trainer_id", "INTEGER"),
                    ("is_woman_verified", "BOOLEAN DEFAULT 1"),
                ]:
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                conn.commit()
    except Exception as exc:
        log.warning("SQLite auto-migration warning: %s", exc)


def init_db() -> None:
    """Create all tables and seed reference data (idempotent)."""
    import models  # noqa: F401  (registers models on Base.metadata)
    from services.seed import seed_agents, seed_opportunities, seed_users_and_demo

    log.info("Initializing database: %s", get_sanitized_db_url())
    try:
        Base.metadata.create_all(bind=engine)
        _auto_migrate_sqlite()
        with SessionLocal() as db:
            seed_opportunities(db)
            seed_agents(db)
            seed_users_and_demo(db)
        log.info("Database initialized successfully.")
    except Exception as exc:
        log.error("Database initialization failed for %s: %s", get_sanitized_db_url(), exc)
        raise


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""Database engine/session setup.

SQLite is used for the local-first prototype. Swapping to PostgreSQL/Supabase
only requires changing DATABASE_URL (models use portable SQLAlchemy types).
"""
from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import settings


class Base(DeclarativeBase):
    pass


_is_sqlite = settings.database_url.startswith("sqlite")
if _is_sqlite and ":memory:" not in settings.database_url:
    settings.storage_dir.mkdir(parents=True, exist_ok=True)

engine_kwargs = {
    "future": True,
}
if _is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Neon Serverless PostgreSQL connection pooling resilience
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(
    settings.database_url,
    **engine_kwargs,
)
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
    except Exception:
        pass


def init_db() -> None:
    """Create all tables and seed reference data (idempotent)."""
    import models  # noqa: F401  (registers models on Base.metadata)
    from services.seed import seed_agents, seed_opportunities, seed_users_and_demo

    Base.metadata.create_all(bind=engine)
    _auto_migrate_sqlite()
    with SessionLocal() as db:
        seed_opportunities(db)
        seed_agents(db)
        seed_users_and_demo(db)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

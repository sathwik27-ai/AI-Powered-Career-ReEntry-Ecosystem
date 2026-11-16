"""Shared pytest fixtures.

Safety: the environment is pointed at a fresh temporary directory BEFORE any backend
module is imported, and the session aborts if the resolved DATABASE_URL is not inside
that directory. The developer's real database (backend/storage/restarther.db) and
uploads are never opened, modified or deleted.
"""
from __future__ import annotations

import os
import shutil
import sys
import tempfile
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
TMP = Path(tempfile.mkdtemp(prefix="restarther-tests-"))
os.environ["STORAGE_DIR"] = str(TMP)
os.environ["DATABASE_URL"] = f"sqlite:///{(TMP / 'test.db').as_posix()}"
os.environ["UPLOAD_DIR"] = str(TMP / "uploads")
os.environ["AI_MODE"] = "demo"
os.environ["ANTHROPIC_API_KEY"] = ""
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from config import settings  # noqa: E402

if not settings.database_url.endswith(f"{TMP.as_posix()}/test.db"):
    pytest.exit(f"Refusing to run: DATABASE_URL resolved to {settings.database_url!r}, not the temporary test database.", returncode=2)
# A local backend/.env could set AI_MODE/key with override=True; force deterministic demo mode.
settings.ai_mode_setting = "demo"
settings.anthropic_api_key = ""

import services.ai_provider as ai_provider  # noqa: E402
from database.session import Base, SessionLocal, engine  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402
from services.seed import seed_agents, seed_opportunities, seed_users_and_demo  # noqa: E402

SAMPLE_DIR = BACKEND / "sample_data"


def pytest_sessionfinish(session, exitstatus):  # noqa: ARG001
    engine.dispose()
    shutil.rmtree(TMP, ignore_errors=True)


@pytest.fixture(autouse=True)
def fresh_database():
    """Every test starts from an empty schema plus seeded reference opportunities, agents, and default users."""
    ai_provider._provider = None
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_opportunities(db)
        seed_agents(db)
        seed_users_and_demo(db)
    shutil.rmtree(settings.upload_dir, ignore_errors=True)
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db():
    with SessionLocal() as s:
        yield s


@pytest.fixture
def sample_pdf() -> bytes:
    return (SAMPLE_DIR / "priya_resume.pdf").read_bytes()


@pytest.fixture
def sample_docx() -> bytes:
    return (SAMPLE_DIR / "priya_resume.docx").read_bytes()


@pytest.fixture
def new_user(client) -> int:
    r = client.post("/api/users", json={"name": "Test User"})
    assert r.status_code == 201
    return r.json()["id"]


@pytest.fixture
def priya(client) -> dict:
    """Fictional demo persona loaded through the real PDF → comeback pipeline."""
    r = client.post("/api/demo/priya")
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture
def priya_id(priya) -> int:
    return priya["user"]["id"]


ONBOARDING = {
    "target_role": "Backend Developer",
    "work_preferences": ["Remote", "Hybrid"],
    "hours_per_day": 2,
    "plan_days": 30,
    "location_preference": "Chennai",
}


def roadmap(client, uid: int) -> dict:
    r = client.get(f"/api/users/{uid}/roadmap")
    assert r.status_code == 200
    return r.json()["roadmap"]


def complete_day(client, uid: int, day: int) -> list[int]:
    """Complete every non-quiz task on a given day; returns completed task ids."""
    ids = []
    for t in roadmap(client, uid)["tasks"]:
        if t["day"] == day and t["kind"] != "quiz":
            r = client.patch(f"/api/users/{uid}/tasks/{t['id']}", json={"completed": True})
            assert r.status_code == 200, r.text
            ids.append(t["id"])
    return ids

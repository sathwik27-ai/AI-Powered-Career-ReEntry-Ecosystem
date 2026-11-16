"""ReStartHer FastAPI application.

Run from backend/:  uvicorn main:app --reload --port 8000
API docs:           http://localhost:8000/docs
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.errors import register_error_handlers
from api.routes import (
    activity,
    admin,
    agents,
    applications,
    auth,
    demo,
    health,
    interviews,
    learning,
    listeners,
    notifications,
    opportunities,
    settings as settings_router,
    trainers,
    users,
)
from config import settings
from database.session import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("restarther")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    log.info("ReStartHer API started in %s mode", settings.ai_mode)  # never log the key itself
    yield


app = FastAPI(
    title="ReStartHer API",
    description="Agentic AI career re-entry ecosystem: six specialised agents coordinated by a Career Orchestrator.",
    version=health.VERSION,
    lifespan=lifespan,
)

cors_kwargs: dict = {
    "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "allow_headers": ["*"],
    "allow_credentials": True,
}
if "*" in settings.cors_origins:
    cors_kwargs["allow_origins"] = ["*"]
    cors_kwargs["allow_credentials"] = False
else:
    cors_kwargs["allow_origins"] = settings.cors_origins
    if getattr(settings, "cors_origin_regex", None):
        cors_kwargs["allow_origin_regex"] = settings.cors_origin_regex

app.add_middleware(
    CORSMiddleware,
    **cors_kwargs,
)

register_error_handlers(app)

for module in (
    health,
    auth,
    users,
    listeners,
    trainers,
    admin,
    learning,
    interviews,
    opportunities,
    applications,
    agents,
    activity,
    notifications,
    settings_router,
    demo,
):
    app.include_router(module.router, prefix="/api")


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"service": "ReStartHer API", "docs": "/docs", "health": "/api/health"}

"""Consistent JSON error responses: {"error": {"code", "message", "details"}}."""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from orchestrator.career_orchestrator import OrchestratorError

log = logging.getLogger("restarther.api")


def _body(code: str, message: str, details: dict | None = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details or {}}}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(OrchestratorError)
    async def orchestrator_error(_: Request, exc: OrchestratorError) -> JSONResponse:
        return JSONResponse(status_code=exc.status, content=_body(exc.code, exc.message, exc.details))

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = {400: "bad_request", 404: "not_found", 405: "method_not_allowed", 409: "conflict", 413: "file_too_large", 415: "unsupported_media_type"}.get(exc.status_code, "http_error")
        return JSONResponse(status_code=exc.status_code, content=_body(code, str(exc.detail)))

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        fields = [
            {"field": ".".join(str(p) for p in e.get("loc", []) if p != "body"), "message": e.get("msg", "Invalid value")}
            for e in exc.errors()
        ]
        message = fields[0]["message"] if len(fields) == 1 else "Some fields are invalid."
        return JSONResponse(status_code=422, content=_body("validation_error", message, {"fields": fields}))

    @app.exception_handler(Exception)
    async def unhandled(_: Request, exc: Exception) -> JSONResponse:
        log.exception("Unhandled error: %s", exc)
        return JSONResponse(status_code=500, content=_body("internal_error", "Something went wrong on our side. Please try again."))

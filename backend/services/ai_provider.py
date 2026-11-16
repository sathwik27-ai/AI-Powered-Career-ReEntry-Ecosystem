"""Interchangeable AI provider layer.

- When ANTHROPIC_API_KEY is configured (and AI_MODE != "demo"), agents may call
  Claude for structured JSON outputs.
- Otherwise every agent uses its deterministic local implementation and labels its
  output mode as "demo". Nothing ever pretends a deterministic result came from an LLM.
- Any provider error is logged and the caller falls back to the deterministic path,
  so a missing/invalid key or network outage never crashes the app.
"""
from __future__ import annotations

import json
import logging
from typing import Any

from config import settings

log = logging.getLogger("restarther.ai")


class AIProvider:
    name = "none"

    @property
    def available(self) -> bool:
        return False

    def structured(self, system: str, prompt: str, schema: dict[str, Any], max_tokens: int = 4000) -> dict[str, Any] | None:
        return None


class AnthropicProvider(AIProvider):
    name = "anthropic"

    def __init__(self, api_key: str, model: str) -> None:
        self.model = model
        self._client = None
        try:
            import anthropic

            self._client = anthropic.Anthropic(api_key=api_key, timeout=60.0, max_retries=1)
        except Exception as exc:  # pragma: no cover - depends on environment
            log.error("Anthropic SDK unavailable, falling back to demo mode: %s", exc)

    @property
    def available(self) -> bool:
        return self._client is not None

    def structured(self, system: str, prompt: str, schema: dict[str, Any], max_tokens: int = 4000) -> dict[str, Any] | None:
        if not self._client:
            return None
        try:
            response = self._client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": prompt}],
                output_config={"effort": "low", "format": {"type": "json_schema", "schema": schema}},
            )
            if getattr(response, "stop_reason", None) == "refusal":
                log.warning("Claude declined the request; using deterministic fallback")
                return None
            text = next((b.text for b in response.content if getattr(b, "type", "") == "text"), None)
            return json.loads(text) if text else None
        except Exception as exc:
            log.warning("Claude call failed (%s); using deterministic fallback", type(exc).__name__)
            return None


_provider: AIProvider | None = None


def get_provider() -> AIProvider:
    global _provider
    if _provider is None:
        if settings.llm_enabled:
            _provider = AnthropicProvider(settings.anthropic_api_key, settings.anthropic_model)
        else:
            _provider = AIProvider()
    return _provider

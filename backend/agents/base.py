"""Common agent interface.

Agents are pure decision-making units: they receive a structured payload, produce
structured output, and never touch the database directly. Persistence, routing and
logging are the Career Orchestrator's responsibility. This keeps each agent
independently testable and makes every hand-off explicit and loggable.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentResult:
    output: dict[str, Any]
    summary: str
    mode: str = "demo"  # "demo" (deterministic local logic) or "llm" (Claude-assisted)
    log_input: dict[str, Any] = field(default_factory=dict)
    log_output: dict[str, Any] = field(default_factory=dict)


class BaseAgent:
    key: str = "base"
    name: str = "Base Agent"
    description: str = ""
    responsibilities: list[str] = []
    inputs: list[str] = []
    outputs: list[str] = []

    @classmethod
    def meta(cls) -> dict[str, Any]:
        return {
            "key": cls.key,
            "name": cls.name,
            "description": cls.description,
            "responsibilities": cls.responsibilities,
            "inputs": cls.inputs,
            "outputs": cls.outputs,
        }

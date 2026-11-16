"""A small, dependency-free state-graph engine (LangGraph-style).

Why not LangGraph directly? LangGraph was evaluated first. On the development
machine its dependency chain (langsmith -> xxhash native DLL) was blocked by
Windows Application Control, which would make the prototype fragile for judges and
teammates. This engine keeps the same programming model – named nodes that update
a shared state, plain and conditional edges, an END sentinel – so the workflow
definitions in career_orchestrator.py map 1:1 onto `langgraph.graph.StateGraph`.
"""
from __future__ import annotations

from collections.abc import Callable
from typing import Any

END = "__end__"

State = dict[str, Any]
NodeFn = Callable[[State], State | None]
Router = Callable[[State], str]


class GraphError(RuntimeError):
    pass


class StateGraph:
    def __init__(self, name: str) -> None:
        self.name = name
        self.nodes: dict[str, NodeFn] = {}
        self.edges: dict[str, str] = {}
        self.conditional: dict[str, tuple[Router, dict[str, str]]] = {}
        self.entry: str | None = None

    def add_node(self, name: str, fn: NodeFn) -> "StateGraph":
        self.nodes[name] = fn
        return self

    def set_entry_point(self, name: str) -> "StateGraph":
        self.entry = name
        return self

    def add_edge(self, source: str, target: str) -> "StateGraph":
        self.edges[source] = target
        return self

    def add_conditional_edges(self, source: str, router: Router, mapping: dict[str, str]) -> "StateGraph":
        self.conditional[source] = (router, mapping)
        return self

    def describe(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "entry": self.entry,
            "nodes": list(self.nodes),
            "edges": [{"from": s, "to": t} for s, t in self.edges.items()],
            "conditional_edges": [
                {"from": s, "routes": mapping} for s, (_, mapping) in self.conditional.items()
            ],
        }

    def invoke(self, state: State, max_steps: int = 50) -> State:
        if not self.entry:
            raise GraphError(f"Graph {self.name} has no entry point")
        current = self.entry
        state.setdefault("trace", [])
        for _ in range(max_steps):
            if current == END:
                return state
            fn = self.nodes.get(current)
            if fn is None:
                raise GraphError(f"Unknown node '{current}' in graph {self.name}")
            update = fn(state)
            if update:
                state.update(update)
            state["trace"].append(current)
            if current in self.conditional:
                router, mapping = self.conditional[current]
                route = router(state)
                if route not in mapping:
                    raise GraphError(f"Router for '{current}' returned unknown route '{route}'")
                current = mapping[route]
            else:
                current = self.edges.get(current, END)
        raise GraphError(f"Graph {self.name} exceeded {max_steps} steps")

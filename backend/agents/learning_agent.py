"""Agent 3 – Personalised Learning Agent.

generate(): builds a 15- or 30-day roadmap from the prioritised gap report and the
person's available hours per day.
adapt(): revises the remaining roadmap when the orchestrator forwards assessment
signals (quiz or interview scores):
  * score < 60  → insert 1 revision day (2 days if < 40) at the next upcoming day and
                  shift later days, so daily time stays within the person's hours;
                  ends with a re-assessment.
  * 60 ≤ s < 80 → add one extra practice task on the next upcoming day.
  * score ≥ 85  → upgrade the next learn task for that skill to an advanced challenge.
"""
from __future__ import annotations

import math
from typing import Any

from agents.base import AgentResult, BaseAgent
from knowledge.quizzes import QUIZZES
from knowledge.resources import MINI_PROJECTS, curriculum
from knowledge.roles import TIER_WEIGHT

WEAK, MODERATE, STRONG = 60, 80, 85


def _split_minutes(total: int, parts: list[float]) -> list[int]:
    raw = [max(10, int(round(total * p / 5.0)) * 5) for p in parts]
    diff = total - sum(raw)
    raw[0] = max(10, raw[0] + diff)
    return raw


class LearningAgent(BaseAgent):
    key = "learning"
    name = "Personalised Learning Agent"
    description = "Builds and continuously adapts the career comeback learning roadmap."
    responsibilities = [
        "Generate 15/30-day roadmaps prioritised by skill gaps",
        "Fit daily tasks to available hours",
        "Recommend free resources, exercises, quizzes and a mini-project",
        "Track completion and progress",
        "Add revision when scores are low; raise difficulty when scores are high",
    ]
    inputs = ["Skill-gap report", "Available hours/day", "Plan length", "Assessment signals"]
    outputs = ["Learning roadmap", "Roadmap revisions with reasons"]

    # ------------------------------------------------------------------ generate
    def generate(self, payload: dict[str, Any]) -> AgentResult:
        items: list[dict] = payload["assessment"]["items"]
        role: str = payload["assessment"]["target_role"]
        days: int = 15 if int(payload.get("days", 30)) <= 15 else 30
        hours: float = max(0.5, min(8.0, float(payload.get("hours_per_day", 2))))
        minutes_per_day = int(hours * 60)

        gaps = sorted([i for i in items if i["status"] != "strong"], key=lambda i: i["priority_rank"] or 99)
        max_skills = 6 if days == 30 else 4
        focus = gaps[:max_skills]
        advanced_mode = False
        if not focus:  # everything at target: deepen the top core skills instead
            advanced_mode = True
            focus = [dict(i, gap=10) for i in items if i["tier"] == "core"][:3]

        project_days = 3 if days == 30 else 2
        available = days - project_days
        weights = [max(1.0, i["gap"]) * TIER_WEIGHT[i["tier"]] for i in focus]
        alloc = [max(2, math.floor(available * w / sum(weights))) for w in weights]
        while sum(alloc) > available:
            idx = max(range(len(alloc)), key=lambda k: alloc[k])
            if alloc[idx] <= 2:
                alloc.pop(); focus.pop(); weights.pop()
                continue
            alloc[idx] -= 1
        k = 0
        while sum(alloc) < available:
            alloc[k % len(alloc)] += 1
            k += 1

        tasks: list[dict] = []
        difficulty: dict[str, str] = {}
        day = 1
        for item, n_days in zip(focus, alloc):
            skill = item["skill"]
            cur = curriculum(skill)
            topics, exercises, resources = cur["topics"], cur["exercises"], cur["resources"]
            if advanced_mode:
                difficulty[skill] = "advanced"
            elif item["status"] in ("missing", "developing"):
                difficulty[skill] = "foundation"
            else:
                difficulty[skill] = "refresher"
            for d in range(n_days):
                last = d == n_days - 1
                topic = topics[d % len(topics)]
                exercise = exercises[d % len(exercises)] if exercises else f"Hands-on practice: {topic}"
                res = resources[d % len(resources)] if resources else (None, None)
                if minutes_per_day >= 60:
                    m_learn, m_prac, m_close = _split_minutes(minutes_per_day, [0.45, 0.4, 0.15])
                else:
                    m_learn, m_close = _split_minutes(minutes_per_day, [0.7, 0.3])
                    m_prac = 0
                order = 0
                tasks.append(self._task(day, order, skill, "learn", topic,
                    f"Study: {topic}. Take short notes in your own words.", m_learn, res))
                order += 1
                if m_prac:
                    tasks.append(self._task(day, order, skill, "practice", exercise,
                        f"Coding exercise: {exercise}.", m_prac, (None, None)))
                    order += 1
                if last and skill in QUIZZES:
                    tasks.append(self._task(day, order, skill, "quiz", f"Take the {skill} assessment",
                        f"A short {len(QUIZZES[skill])}-question quiz. Your score updates your skill level and may adapt this plan.", m_close, (None, None)))
                else:
                    tasks.append(self._task(day, order, skill, "reflect", f"Recap: {skill} day {d + 1}",
                        "Write three bullet points on what you learned and one question to explore tomorrow.", m_close, (None, None)))
                day += 1

        project = MINI_PROJECTS.get(role, {"title": "Portfolio mini-project", "description": "Apply your new skills in a small project."})
        project_steps = [
            ("Design & set up", "Plan the features, create the repository and scaffold the project."),
            ("Build core features", "Implement the main features using the skills from your roadmap."),
            ("Test, document & present", "Add tests, write a README and practise explaining your design decisions."),
        ][-project_days:] if project_days == 2 else [
            ("Design & set up", "Plan the features, create the repository and scaffold the project."),
            ("Build core features", "Implement the main features using the skills from your roadmap."),
            ("Test, document & present", "Add tests, write a README and practise explaining your design decisions."),
        ]
        for title, desc in project_steps:
            tasks.append(self._task(day, 0, "Mini-project", "project", f"{project['title']}: {title}",
                f"{desc} {project['description']}", minutes_per_day, (None, None)))
            day += 1

        focus_names = [i["skill"] for i in focus]
        summary = f"Created a {days}-day roadmap ({hours:g} h/day) prioritising {', '.join(focus_names[:3])}" + (
            f" and {len(focus_names) - 3} more" if len(focus_names) > 3 else "") + "."
        return AgentResult(
            output={
                "planned_days": days, "total_days": days, "hours_per_day": hours,
                "focus_skills": focus_names, "difficulty": difficulty, "tasks": tasks,
                "mini_project": project, "allocation": dict(zip(focus_names, alloc)),
            },
            summary=summary,
            log_input={"priorities": [i["skill"] for i in gaps], "days": days, "hours_per_day": hours},
            log_output={"focus_skills": focus_names, "days_per_skill": dict(zip(focus_names, alloc)), "task_count": len(tasks)},
        )

    @staticmethod
    def _task(day: int, order: int, skill: str, kind: str, title: str, description: str, minutes: int,
              resource: tuple[str | None, str | None], note: str | None = None) -> dict:
        return {
            "id": None, "day": day, "order": order, "skill": skill, "kind": kind, "title": title,
            "description": description, "minutes": int(minutes), "resource_title": resource[0],
            "resource_url": resource[1], "completed": False, "added_by_adaptation": note is not None,
            "adaptation_note": note,
        }

    # --------------------------------------------------------------------- adapt
    def adapt(self, payload: dict[str, Any]) -> AgentResult:
        tasks: list[dict] = [dict(t) for t in payload["tasks"]]
        signals: list[dict] = payload["signals"]
        hours: float = float(payload.get("hours_per_day", 2))
        total_days: int = int(payload.get("total_days", 30))
        difficulty: dict[str, str] = dict(payload.get("difficulty") or {})
        minutes_per_day = int(hours * 60)

        pending_days = [t["day"] for t in tasks if not t["completed"]]
        current_day = min(pending_days) if pending_days else total_days + 1
        changes: list[dict] = []
        reasons: list[str] = []

        for sig in signals:
            skill, score, source = sig["skill"], float(sig["score"]), sig.get("source", "assessment")
            focus_points = sig.get("missing_points") or []
            cur = curriculum(skill)
            if score < WEAK:
                n = 2 if score < 40 else 1
                # Insert after any day already in progress so completed work is never moved.
                started = any(t["completed"] for t in tasks if t["day"] == current_day)
                insert_at = current_day + 1 if started else current_day
                for t in tasks:
                    if t["day"] >= insert_at:
                        t["day"] += n
                note = f"Added because your {source} score in {skill} was {score:.0f}% (below {WEAK}%)."
                focus_txt = f" – focus on {', '.join(focus_points[:2])}" if focus_points else ""
                for d in range(n):
                    day = insert_at + d
                    res = cur["resources"][d % len(cur["resources"])] if cur["resources"] else (None, None)
                    topic = cur["topics"][d % len(cur["topics"])]
                    ex = cur["exercises"][d % len(cur["exercises"])] if cur["exercises"] else f"Practice {skill}"
                    split = _split_minutes(minutes_per_day, [0.45, 0.4, 0.15]) if minutes_per_day >= 60 else _split_minutes(minutes_per_day, [0.7, 0.3]) + [0]
                    new = [
                        self._task(day, 0, skill, "revision", f"Revision: {topic}{focus_txt}",
                                   f"Revisit {topic} with the official guide. Concentrate on the concepts you found difficult.", split[0], res, note),
                    ]
                    if split[1] and (d < n - 1 or skill not in QUIZZES):
                        new.append(self._task(day, 1, skill, "practice", f"Guided practice: {ex}",
                                              f"Extra hands-on practice: {ex}.", split[1] + split[2], (None, None), note))
                    if d == n - 1:
                        if skill in QUIZZES:
                            new.append(self._task(day, 1, skill, "practice", f"Guided practice: {ex}",
                                                  f"Extra hands-on practice: {ex}.", split[1], (None, None), note))
                            new.append(self._task(day, 2, skill, "quiz", f"Re-take the {skill} assessment",
                                                  "Check your progress after revision. A higher score updates your skill level.", max(10, split[2] or 15), (None, None), note))
                    tasks.extend(new)
                    for t in new:
                        changes.append({"type": "added", "day": day, "title": t["title"], "skill": skill, "kind": t["kind"]})
                total_days += n
                difficulty[skill] = "reinforce"
                reasons.append(f"{skill} {source} score {score:.0f}% → added {n} revision day{'s' if n > 1 else ''} (plan extended to {total_days} days to respect {hours:g} h/day)")
            elif score < MODERATE:
                target_day = current_day
                note = f"Extra practice added: your {source} score in {skill} was {score:.0f}%, close to the target."
                ex = cur["exercises"][0] if cur["exercises"] else f"Practice {skill}"
                order = 1 + max([t["order"] for t in tasks if t["day"] == target_day], default=0)
                t = self._task(target_day, order, skill, "practice", f"Extra practice: {ex}", f"Short extra exercise: {ex}.", 20, (None, None), note)
                tasks.append(t)
                changes.append({"type": "added", "day": target_day, "title": t["title"], "skill": skill, "kind": "practice"})
                reasons.append(f"{skill} {source} score {score:.0f}% → added an extra practice task")
            elif score >= STRONG:
                note = f"Difficulty increased: your {source} score in {skill} was {score:.0f}%."
                upcoming = [t for t in tasks if t["skill"] == skill and not t["completed"] and t["kind"] in ("learn", "practice") and t["day"] >= current_day]
                if upcoming:
                    t = sorted(upcoming, key=lambda x: (x["day"], x["order"]))[0]
                    old = t["title"]
                    t.update({"kind": "challenge", "title": f"Challenge: {cur['challenge']}",
                              "description": f"Advanced task replacing '{old}' because you are ahead on {skill}.",
                              "added_by_adaptation": True, "adaptation_note": note})
                    changes.append({"type": "upgraded", "day": t["day"], "title": t["title"], "skill": skill, "kind": "challenge", "replaced": old})
                else:
                    order = 1 + max([x["order"] for x in tasks if x["day"] == current_day], default=0)
                    t = self._task(current_day, order, skill, "challenge", f"Challenge: {cur['challenge']}", "Optional stretch task.", 30, (None, None), note)
                    tasks.append(t)
                    changes.append({"type": "added", "day": current_day, "title": t["title"], "skill": skill, "kind": "challenge"})
                difficulty[skill] = "advanced"
                reasons.append(f"{skill} {source} score {score:.0f}% → raised difficulty")

        changed = bool(changes)
        tasks.sort(key=lambda t: (t["day"], t["order"]))
        reason = "; ".join(reasons) if reasons else "No change needed – scores are within the expected range."
        return AgentResult(
            output={"tasks": tasks, "changes": changes, "changed": changed, "total_days": total_days,
                    "difficulty": difficulty, "reason": reason, "current_day": current_day},
            summary=("Roadmap adapted: " + reason) if changed else reason,
            log_input={"signals": [{"skill": s["skill"], "score": s["score"], "source": s.get("source")} for s in signals], "current_day": current_day},
            log_output={"changed": changed, "changes": changes[:8], "total_days": total_days},
        )

from knowledge.quizzes import QUIZZES

from conftest import complete_day, roadmap


def _answers(skill: str, correct: int) -> dict[str, int]:
    """Answer the first `correct` questions right and the rest wrong."""
    out = {}
    for i, q in enumerate(QUIZZES[skill]):
        out[q["id"]] = q["answer"] if i < correct else (q["answer"] + 1) % len(q["options"])
    return out


def test_low_quiz_score_adds_revision_and_preserves_completed_tasks(client, priya_id):
    before = roadmap(client, priya_id)
    done = complete_day(client, priya_id, 1)
    r = client.post(f"/api/users/{priya_id}/quizzes/Spring Boot", json={"answers": _answers("Spring Boot", 1)})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["result"]["percent"] == 20.0 and body["result"]["correct"] == 1
    orch = body["orchestration"]
    assert orch["trace"] == ["receive", "analyze", "evaluate", "adapt", "reassess", "opportunity", "plan"]
    assert orch["roadmap_changed"] is True
    assert "Spring Boot quiz score 20%" in orch["adaptation"]["reason"]

    after = roadmap(client, priya_id)
    assert after["version"] == before["version"] + 1
    assert after["total_days"] == 32  # <40% → 2 revision days, plan extended rather than overloading days
    completed_now = {t["id"] for t in after["tasks"] if t["completed"]}
    assert set(done) <= completed_now
    added = [t for t in after["tasks"] if t["added_by_adaptation"]]
    assert added and all(t["skill"] == "Spring Boot" for t in added)
    assert all("20%" in t["adaptation_note"] for t in added)
    assert min(t["day"] for t in added) == 2  # inserted at the next upcoming day, not before completed work
    assert any(t["kind"] == "quiz" and t["title"].startswith("Re-take") for t in added)
    # why the roadmap changed is recorded on the roadmap and on the plan
    assert after["changes"][-1]["trigger"] == "quiz" and after["changes"][-1]["changes"]
    plan = client.get(f"/api/users/{priya_id}/plan").json()
    assert "Roadmap adapted after quiz" in plan["change_log"][-1]["reason"]
    assert plan["data"]["next_action"]["title"].startswith("Complete: Revision")


def test_quiz_score_replaces_estimate_with_measured_level(client, priya_id):
    client.post(f"/api/users/{priya_id}/quizzes/SQL", json={"answers": _answers("SQL", 2)})
    skills = client.get(f"/api/users/{priya_id}/skills").json()
    sql = next(i for i in skills["assessment"]["items"] if i["skill"] == "SQL")
    assert sql["measured"] is True and sql["current_level"] == 40.0
    assert skills["measured_evidence"]["SQL"] == {"score": 40.0, "source": "quiz"}


def test_score_in_80_to_84_band_leaves_roadmap_unchanged(client, priya_id):
    before = roadmap(client, priya_id)
    r = client.post(f"/api/users/{priya_id}/quizzes/Java", json={"answers": _answers("Java", 4)})
    assert r.json()["result"]["percent"] == 80.0
    orch = r.json()["orchestration"]
    assert orch["roadmap_changed"] is False
    assert "adapt" not in orch["trace"] and "reassess" in orch["trace"]
    after = roadmap(client, priya_id)
    assert after["version"] == before["version"] and after["total_days"] == before["total_days"]


def test_moderate_score_adds_extra_practice_without_extending(client, priya_id):
    before = roadmap(client, priya_id)
    r = client.post(f"/api/users/{priya_id}/quizzes/Java", json={"answers": _answers("Java", 3)})
    assert r.json()["result"]["percent"] == 60.0
    assert r.json()["orchestration"]["roadmap_changed"] is True
    after = roadmap(client, priya_id)
    assert after["total_days"] == before["total_days"]
    extra = [t for t in after["tasks"] if t["added_by_adaptation"] and t["skill"] == "Java"]
    assert len(extra) == 1 and extra[0]["kind"] == "practice"


def test_perfect_score_raises_difficulty(client, priya_id):
    r = client.post(f"/api/users/{priya_id}/quizzes/REST APIs", json={"answers": _answers("REST APIs", 5)})
    assert r.json()["result"]["percent"] == 100.0
    assert r.json()["orchestration"]["roadmap_changed"] is True
    rm = roadmap(client, priya_id)
    assert rm["difficulty"]["REST APIs"] == "advanced"
    assert any(t["kind"] == "challenge" and t["skill"] == "REST APIs" for t in rm["tasks"])
    assert rm["total_days"] == 30


def test_quiz_marks_pending_quiz_task_complete(client, priya_id):
    client.post(f"/api/users/{priya_id}/quizzes/Spring Boot", json={"answers": _answers("Spring Boot", 4)})
    quiz_tasks = [t for t in roadmap(client, priya_id)["tasks"] if t["kind"] == "quiz" and t["skill"] == "Spring Boot" and not t["added_by_adaptation"]]
    assert quiz_tasks[0]["completed"] is True


def test_quiz_errors(client, priya_id, new_user):
    assert client.post(f"/api/users/{priya_id}/quizzes/Cobol", json={"answers": {"x": 1}}).status_code == 404
    assert client.post(f"/api/users/{priya_id}/quizzes/SQL", json={"answers": {}}).status_code == 422
    assert client.post(f"/api/users/{priya_id}/quizzes/SQL", json={"answers": {"s1": -1}}).status_code == 422
    assert client.post(f"/api/users/{new_user}/quizzes/SQL", json={"answers": {"s1": 1}}).status_code == 409  # no profile yet


def test_quiz_results_history(client, priya_id):
    client.post(f"/api/users/{priya_id}/quizzes/SQL", json={"answers": _answers("SQL", 5)})
    results = client.get(f"/api/users/{priya_id}/quiz-results").json()["results"]
    assert len(results) == 1 and results[0]["percent"] == 100.0
    assert all("explanation" in a for a in results[0]["answers"])

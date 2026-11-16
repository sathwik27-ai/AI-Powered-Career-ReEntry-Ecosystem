from collections import defaultdict

from conftest import roadmap


def test_skill_gap_prioritises_outdated_spring_boot(client, priya_id):
    a = client.get(f"/api/users/{priya_id}/skills").json()["assessment"]
    assert a["target_role"] == "Backend Developer"
    assert a["summary"]["priorities"][0] == "Spring Boot"
    items = {i["skill"]: i for i in a["items"]}
    sb = items["Spring Boot"]
    assert sb["status"] == "outdated" and sb["in_profile"] is True and sb["measured"] is False
    assert sb["current_level"] < sb["target_level"]
    assert items["Docker"]["status"] == "missing" and items["Docker"]["current_level"] == 0
    # core gaps are ranked before important/nice ones
    ranks = sorted((i for i in a["items"] if i["priority_rank"]), key=lambda i: i["priority_rank"])
    tiers = [i["tier"] for i in ranks]
    order = {"core": 0, "important": 1, "nice": 2}
    assert tiers == sorted(tiers, key=order.get)
    assert 0 < a["readiness"] < 100


def test_roadmap_prioritises_spring_boot_and_fits_daily_hours(client, priya_id):
    rm = roadmap(client, priya_id)
    assert rm["planned_days"] == rm["total_days"] == 30
    assert rm["focus_skills"][0] == "Spring Boot"
    day1 = [t for t in rm["tasks"] if t["day"] == 1]
    assert all(t["skill"] == "Spring Boot" for t in day1)
    minutes = defaultdict(int)
    for t in rm["tasks"]:
        minutes[t["day"]] += t["minutes"]
    assert max(minutes.values()) <= 120  # 2 hours/day
    assert set(minutes) == set(range(1, 31))
    kinds = {t["kind"] for t in rm["tasks"]}
    assert {"learn", "practice", "quiz", "project"} <= kinds
    assert any(t["resource_url"] and t["resource_url"].startswith("https://") for t in rm["tasks"])
    assert rm["progress"] == {"completed": 0, "total": len(rm["tasks"]), "percent": 0}


def test_fifteen_day_plan(client, new_user):
    body = {"target_role": "Backend Developer", "previous_role": "Developer", "experience_years": 4, "skills": ["Java", "SQL"],
            "work_preferences": ["Remote"], "hours_per_day": 1, "plan_days": 15}
    assert client.post(f"/api/users/{new_user}/onboarding", json=body).status_code == 200
    rm = roadmap(client, new_user)
    assert rm["total_days"] == 15 and rm["hours_per_day"] == 1
    assert max(t["day"] for t in rm["tasks"]) == 15


def test_task_completion_updates_progress_and_readiness(client, priya_id):
    rm = roadmap(client, priya_id)
    task = next(t for t in rm["tasks"] if t["kind"] == "learn")
    r = client.patch(f"/api/users/{priya_id}/tasks/{task['id']}", json={"completed": True})
    assert r.status_code == 200
    body = r.json()
    assert body["task"]["completed"] is True and body["task"]["completed_at"]
    assert body["progress"]["completed"] == 1
    assert body["readiness"]["components"]["learning"] > 0
    r = client.patch(f"/api/users/{priya_id}/tasks/{task['id']}", json={"completed": False})
    assert r.json()["task"]["completed"] is False and r.json()["progress"]["completed"] == 0


def test_quiz_task_cannot_be_ticked_manually(client, priya_id):
    quiz = next(t for t in roadmap(client, priya_id)["tasks"] if t["kind"] == "quiz")
    assert client.patch(f"/api/users/{priya_id}/tasks/{quiz['id']}", json={"completed": True}).status_code == 409


def test_cannot_modify_another_users_task(client, priya_id, new_user):
    task = roadmap(client, priya_id)["tasks"][0]
    r = client.patch(f"/api/users/{new_user}/tasks/{task['id']}", json={"completed": True})
    assert r.status_code == 404
    assert roadmap(client, priya_id)["tasks"][0]["completed"] is False


def test_task_update_validation(client, priya_id):
    task = roadmap(client, priya_id)["tasks"][0]
    assert client.patch(f"/api/users/{priya_id}/tasks/{task['id']}", json={}).status_code == 422
    assert client.patch(f"/api/users/{priya_id}/tasks/999999", json={"completed": True}).status_code == 404


def test_quiz_bank_never_leaks_answer_key(client):
    r = client.get("/api/quizzes/Spring Boot")
    assert r.status_code == 200
    for q in r.json()["questions"]:
        assert set(q) == {"id", "question", "options"}
    assert client.get("/api/quizzes/Cobol").status_code == 404
    listing = client.get("/api/quizzes").json()["skills"]
    assert any(s["skill"] == "Spring Boot" for s in listing)

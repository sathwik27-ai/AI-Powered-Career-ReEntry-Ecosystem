from conftest import complete_day, roadmap


def test_demo_priya_runs_full_comeback_pipeline(priya):
    wf = priya["workflow"]
    assert wf["trace"] == ["goal", "profile", "evaluate_profile", "skill_gap", "learning", "opportunity", "plan"]
    assert wf["needs_clarification"] is False
    assert priya["user"]["is_demo"] is True
    assert "fictional" in priya["note"].lower()


def test_plan_contains_all_required_sections(client, priya_id):
    plan = client.get(f"/api/users/{priya_id}/plan").json()
    data = plan["data"]
    for key in ["career_summary", "priority_gaps", "learning_roadmap", "interview_preparation", "suitable_opportunities", "readiness", "next_action"]:
        assert data[key], key
    s = data["career_summary"]
    assert s["previous_role"] == "Software Developer" and s["target_role"] == "Backend Developer"
    assert s["experience_years"] == 5.0 and s["career_break_years"] >= 4
    assert s["work_preferences"] == ["Remote", "Hybrid"] and s["hours_per_day"] == 2
    assert data["priority_gaps"][0]["skill"] == "Spring Boot"
    assert all(o["is_demo"] for o in data["suitable_opportunities"])
    assert plan["version"] >= 1 and plan["change_log"]


def test_readiness_is_supportive_indicator(client, priya_id):
    r = client.get(f"/api/users/{priya_id}/plan").json()["data"]["readiness"]
    assert 0 <= r["overall"] <= 100
    assert "not a measure of your worth" in r["disclaimer"]
    assert r["components"]["interview"] is None  # no interview yet → excluded, not zero
    assert r["components"]["profile"] == 100.0


def test_first_next_action_is_spring_boot_assessment(client, priya_id):
    na = client.get(f"/api/users/{priya_id}/plan").json()["data"]["next_action"]
    assert na["title"] == "Complete the Spring Boot assessment"
    assert na["route"] == "/learning"


def test_rerun_keeps_roadmap_when_progress_exists(client, priya_id):
    first = roadmap(client, priya_id)
    done = complete_day(client, priya_id, 1)
    r = client.post(f"/api/users/{priya_id}/comeback", json={})
    assert r.status_code == 200
    assert r.json()["roadmap_kept"] is True
    after = roadmap(client, priya_id)
    assert after["id"] == first["id"]
    assert {t["id"] for t in after["tasks"] if t["completed"]} == set(done)


def test_forced_regeneration_creates_new_roadmap(client, priya_id):
    first = roadmap(client, priya_id)
    complete_day(client, priya_id, 1)
    r = client.post(f"/api/users/{priya_id}/comeback", json={"force_new_roadmap": True})
    assert r.status_code == 200 and r.json()["roadmap_kept"] is False
    assert roadmap(client, priya_id)["id"] != first["id"]


def test_comeback_requires_profile(client, new_user):
    assert client.post(f"/api/users/{new_user}/comeback", json={}).status_code == 409


def test_dashboard_aggregates_state(client, priya_id):
    d = client.get(f"/api/users/{priya_id}/dashboard").json()
    assert d["user"]["has_profile"] is True
    assert d["profile"]["full_name"] == "Priya Raman"
    assert d["assessment"]["target_role"] == "Backend Developer"
    assert d["roadmap"]["total_days"] == 30
    assert d["interviews"]["completed"] == 0
    assert d["recent_activity"]

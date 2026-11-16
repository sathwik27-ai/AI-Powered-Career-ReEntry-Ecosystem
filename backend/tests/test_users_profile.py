import pytest

from conftest import ONBOARDING


def test_create_and_get_user(client):
    r = client.post("/api/users", json={"name": "Asha"})
    assert r.status_code == 201
    user = r.json()
    assert user["name"] == "Asha" and user["has_profile"] is False and user["is_demo"] is False
    r = client.get(f"/api/users/{user['id']}")
    assert r.status_code == 200 and r.json()["id"] == user["id"]


def test_unknown_user_returns_404_everywhere(client):
    for path in ["", "/profile", "/plan", "/roadmap", "/skills", "/dashboard", "/activity", "/agents", "/applications"]:
        r = client.get(f"/api/users/9999{path}")
        assert r.status_code == 404, path
        assert r.json()["error"]["code"] == "user_not_found"


@pytest.mark.parametrize("body", [{"name": ""}, {"name": "x" * 121}, {}, {"name": "A", "role": "admin"}])
def test_create_user_validation(client, body):
    r = client.post("/api/users", json=body)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "validation_error"


@pytest.mark.parametrize("field,value", [
    ("hours_per_day", 0), ("hours_per_day", 12), ("plan_days", 20),
    ("work_preferences", ["Moon base"]), ("experience_years", -1), ("unknown_field", "x"),
])
def test_onboarding_validation(client, new_user, field, value):
    r = client.post(f"/api/users/{new_user}/onboarding", json={**ONBOARDING, field: value})
    assert r.status_code == 422


def test_empty_onboarding_rejected(client, new_user):
    r = client.post(f"/api/users/{new_user}/onboarding", json={})
    assert r.status_code == 422


def test_onboarding_without_resume_runs_comeback_workflow(client, new_user):
    body = {**ONBOARDING, "full_name": "Meera K", "previous_role": "Java Developer", "experience_years": 6,
            "career_break_years": 3, "skills": ["Java", "Spring Boot", "SQL"]}
    r = client.post(f"/api/users/{new_user}/onboarding", json=body)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["workflow"]["trace"] == ["goal", "profile", "evaluate_profile", "skill_gap", "learning", "opportunity", "plan"]
    profile = data["profile"]
    assert profile["previous_role"] == "Java Developer"
    assert set(["Java", "Spring Boot", "SQL"]) <= set(profile["skills"])
    assert profile["source"] == "onboarding"
    assert client.get(f"/api/users/{new_user}").json()["has_profile"] is True


def test_missing_target_role_asks_for_clarification_instead_of_guessing(client, new_user):
    r = client.post(f"/api/users/{new_user}/onboarding", json={"previous_role": "Software Developer", "skills": ["Java", "SQL"], "experience_years": 5})
    assert r.status_code == 200
    wf = r.json()["workflow"]
    assert wf["needs_clarification"] is True
    assert "skill_gap" not in wf["trace"] and "learning" not in wf["trace"]
    assert any("Software Developer" in q for q in wf["clarification_questions"])
    assert client.get(f"/api/users/{new_user}/skills").json()["assessment"] is None
    assert client.get(f"/api/users/{new_user}/roadmap").json()["roadmap"] is None
    plan = client.get(f"/api/users/{new_user}/plan").json()
    assert plan["data"]["next_action"]["title"] == "Choose your target role"


def test_profile_edit_requires_existing_profile(client, new_user):
    r = client.put(f"/api/users/{new_user}/profile", json={"target_role": "Data Analyst"})
    assert r.status_code == 409


def test_profile_edit_overrides_values_and_reruns(client, priya_id):
    r = client.put(f"/api/users/{priya_id}/profile", json={"location_preference": "Bengaluru", "hours_per_day": 3})
    assert r.status_code == 200
    profile = r.json()["profile"]
    assert profile["location_preference"] == "Bengaluru"
    assert profile["hours_per_day"] == 3
    # user-entered values win, resume-derived values are kept
    assert profile["previous_role"] == "Software Developer"


def test_profile_edit_with_no_changes_rejected(client, priya_id):
    assert client.put(f"/api/users/{priya_id}/profile", json={}).status_code == 422

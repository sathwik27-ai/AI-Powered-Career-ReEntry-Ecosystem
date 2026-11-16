import pytest


def _top_backend(client, uid):
    results = client.get(f"/api/users/{uid}/opportunities").json()["results"]
    return next(r for r in results if r["slug"] == "demo-backend-hybrid-health")  # requires Docker + Microservices


def _create(client, uid, oid):
    r = client.post(f"/api/users/{uid}/applications", json={"opportunity_id": oid})
    assert r.status_code == 201, r.text
    return r.json()


def test_draft_generation_requires_human_review(client, priya_id):
    opp = _top_backend(client, priya_id)
    out = _create(client, priya_id, opp["id"])
    app = out["application"]
    assert out["trace"] == ["receive_selection", "application", "review_gate", "plan"]
    assert app["status"] == "drafted" and app["approved"] is False and app["approved_at"] is None
    assert "never submits applications automatically" in out["note"]
    assert app["resume"]["content"] and app["cover_letter"]["content"]
    assert app["opportunity"]["is_demo"] is True


def test_resume_uses_only_verified_information(client, priya_id):
    app = _create(client, priya_id, _top_backend(client, priya_id)["id"])["application"]
    resume = app["resume"]["content"]
    assert "PRIYA RAMAN" in resume
    assert "Illustrative IT Services Company" in resume and "Illustrative Product Company" in resume
    assert "B.E. Computer Science" in resume
    skills_line = resume.split("KEY SKILLS\n", 1)[1].split("\n", 1)[0]
    for not_owned in ["Docker", "Microservices", "Kubernetes"]:
        assert not_owned not in skills_line
    notes = " ".join(app["resume"]["tailoring_notes"])
    assert "Docker" in notes and "not in your verified profile" in notes
    # career break presented neutrally
    assert "CAREER BREAK" in resume and "Planned career break" in resume
    for negative in ["gap", "unemployed", "weakness"]:
        assert negative not in resume.lower().split("career break", 1)[1].split("\n\n", 1)[0]


def test_completed_learning_appears_only_after_completion(client, priya_id):
    oid = _top_backend(client, priya_id)["id"]
    first = _create(client, priya_id, oid)["application"]["resume"]["content"]
    assert "RECENT LEARNING" not in first
    rm = client.get(f"/api/users/{priya_id}/roadmap").json()["roadmap"]
    t = next(t for t in rm["tasks"] if t["skill"] == "Spring Boot" and t["kind"] == "learn")
    client.patch(f"/api/users/{priya_id}/tasks/{t['id']}", json={"completed": True})
    again = _create(client, priya_id, oid)["application"]["resume"]["content"]
    assert "RECENT LEARNING" in again and "Spring Boot – 1 completed learning task" in again


def test_cannot_mark_applied_without_approval(client, priya_id):
    app = _create(client, priya_id, _top_backend(client, priya_id)["id"])["application"]
    for status in ["applied", "interview", "offer", "rejected"]:
        r = client.patch(f"/api/users/{priya_id}/applications/{app['id']}/status", json={"status": status})
        assert r.status_code == 409
        assert r.json()["error"]["code"] == "approval_required"
    assert client.get(f"/api/users/{priya_id}/applications/{app['id']}").json()["application"]["status"] == "drafted"


def test_edit_approve_and_track(client, priya_id):
    app = _create(client, priya_id, _top_backend(client, priya_id)["id"])["application"]
    aid = app["id"]
    edited = app["cover_letter"]["content"] + "\nEdited by me."
    r = client.put(f"/api/users/{priya_id}/applications/{aid}/drafts", json={"cover_letter": edited})
    assert r.status_code == 200
    a = r.json()["application"]
    assert a["cover_letter"]["content"] == edited and a["cover_letter"]["edited_by_user"] is True
    assert a["resume"]["edited_by_user"] is False

    r = client.post(f"/api/users/{priya_id}/applications/{aid}/approve")
    assert r.status_code == 200
    body = r.json()
    assert body["application"]["approved"] is True
    assert body["submitted_by_restarther"] is False

    r = client.patch(f"/api/users/{priya_id}/applications/{aid}/status", json={"status": "applied", "note": "Sent via email"})
    assert r.status_code == 200
    hist = r.json()["application"]["history"]
    assert [h["status"] for h in hist] == ["saved", "drafted", "ready_for_review", "applied"]
    assert hist[-1]["note"] == "Sent via email"


def test_editing_after_approval_resets_approval(client, priya_id):
    aid = _create(client, priya_id, _top_backend(client, priya_id)["id"])["application"]["id"]
    client.post(f"/api/users/{priya_id}/applications/{aid}/approve")
    a = client.put(f"/api/users/{priya_id}/applications/{aid}/drafts", json={"resume": "Changed resume"}).json()["application"]
    assert a["approved"] is False and a["status"] == "drafted"
    assert client.patch(f"/api/users/{priya_id}/applications/{aid}/status", json={"status": "applied"}).status_code == 409


def test_regenerating_resets_approval(client, priya_id):
    aid = _create(client, priya_id, _top_backend(client, priya_id)["id"])["application"]["id"]
    client.post(f"/api/users/{priya_id}/applications/{aid}/approve")
    r = client.post(f"/api/users/{priya_id}/applications/{aid}/regenerate")
    assert r.status_code == 200
    assert r.json()["application"]["approved"] is False


def test_no_endpoint_submits_externally(client):
    paths = client.get("/openapi.json").json()["paths"]
    assert not any("submit" in p.lower() or "send" in p.lower() for p in paths)


@pytest.mark.parametrize("body,status", [({"opportunity_id": 99999}, 404), ({"opportunity_id": 0}, 422), ({}, 422)])
def test_create_application_errors(client, priya_id, body, status):
    assert client.post(f"/api/users/{priya_id}/applications", json=body).status_code == status


def test_application_requires_profile(client, new_user, priya_id):
    oid = _top_backend(client, priya_id)["id"]
    assert client.post(f"/api/users/{new_user}/applications", json={"opportunity_id": oid}).status_code == 409


def test_status_validation_and_unknown_application(client, priya_id):
    aid = _create(client, priya_id, _top_backend(client, priya_id)["id"])["application"]["id"]
    assert client.patch(f"/api/users/{priya_id}/applications/{aid}/status", json={"status": "hired"}).status_code == 422
    assert client.get(f"/api/users/{priya_id}/applications/99999").status_code == 404
    assert client.post(f"/api/users/{priya_id}/applications/99999/approve").status_code == 404


def test_cannot_touch_another_users_application(client, priya_id):
    other = client.post("/api/demo/priya").json()["user"]["id"]
    aid = _create(client, priya_id, _top_backend(client, priya_id)["id"])["application"]["id"]
    assert client.get(f"/api/users/{other}/applications/{aid}").status_code == 404
    assert client.post(f"/api/users/{other}/applications/{aid}/approve").status_code == 404
    assert client.put(f"/api/users/{other}/applications/{aid}/drafts", json={"resume": "hijack"}).status_code == 404
    assert client.patch(f"/api/users/{other}/applications/{aid}/status", json={"status": "saved"}).status_code == 404
    assert client.get(f"/api/users/{other}/applications").json()["applications"] == []


def test_one_application_per_opportunity(client, priya_id):
    oid = _top_backend(client, priya_id)["id"]
    a1 = _create(client, priya_id, oid)["application"]["id"]
    a2 = _create(client, priya_id, oid)["application"]["id"]
    assert a1 == a2
    assert len(client.get(f"/api/users/{priya_id}/applications").json()["applications"]) == 1

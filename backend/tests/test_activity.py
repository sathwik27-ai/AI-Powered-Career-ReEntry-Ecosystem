from orchestrator.career_orchestrator import AGENTS

LOG_FIELDS = {"id", "run_id", "workflow", "step", "agent", "action", "input", "output", "decision", "next_agent",
              "roadmap_changed", "status", "mode", "duration_ms", "created_at"}


def test_comeback_run_is_fully_logged(client, priya):
    run_id = priya["workflow"]["run_id"]
    data = client.get(f"/api/users/{priya['user']['id']}/activity", params={"run_id": run_id}).json()
    logs = data["logs"]
    assert all(set(l) == LOG_FIELDS for l in logs)
    assert [l["step"] for l in logs] == list(range(1, len(logs) + 1))
    agents = [l["agent"] for l in logs]
    for a in ["orchestrator", "profile", "skill_gap", "learning", "opportunity"]:
        assert a in agents
    assert agents.index("profile") < agents.index("skill_gap") < agents.index("learning") < agents.index("opportunity")
    assert all(l["status"] == "success" and l["mode"] == "demo" for l in logs)
    profile_log = next(l for l in logs if l["agent"] == "profile")
    assert profile_log["output"]["previous_role"] == "Software Developer" and profile_log["output"]["summary"]
    assert profile_log["input"]["resume_chars"] > 0
    decisions = [l for l in logs if l["agent"] == "orchestrator"]
    assert all(l["decision"] for l in decisions)
    assert any("Spring Boot" in l["decision"] and l["next_agent"] == "learning" for l in decisions)
    run = data["runs"][0]
    assert run["run_id"] == run_id and run["workflow"] == "comeback" and run["errors"] == 0 and run["roadmap_changed"] is True


def test_activity_filters(client, priya_id):
    by_agent = client.get(f"/api/users/{priya_id}/activity", params={"agent": "profile"}).json()["logs"]
    assert by_agent and all(l["agent"] == "profile" for l in by_agent)
    by_wf = client.get(f"/api/users/{priya_id}/activity", params={"workflow": "comeback"}).json()["logs"]
    assert by_wf and all(l["workflow"] == "comeback" for l in by_wf)
    assert len(client.get(f"/api/users/{priya_id}/activity", params={"limit": 2}).json()["logs"]) == 2
    assert client.get(f"/api/users/{priya_id}/activity", params={"limit": 0}).status_code == 422


def test_activity_is_private_per_user(client, priya_id, new_user):
    assert client.get(f"/api/users/{new_user}/activity").json() == {"runs": [], "logs": []}


def test_agent_status_and_workflows(client, priya_id, new_user):
    data = client.get(f"/api/users/{priya_id}/agents").json()
    by_key = {a["key"]: a for a in data["agents"]}
    assert set(by_key) == {"orchestrator", "profile", "skill_gap", "learning", "confidence", "opportunity", "application"}
    assert by_key["profile"]["status"] == "completed" and by_key["profile"]["executions"] == 1
    assert by_key["confidence"]["status"] == "idle" and by_key["application"]["status"] == "idle"
    assert all(a["responsibilities"] for a in data["agents"])
    names = [w["name"] for w in data["workflows"]]
    assert names == ["comeback", "adaptive", "application"]
    adaptive = data["workflows"][1]
    assert {"from": "evaluate", "routes": {"adapt": "adapt", "no_change": "reassess"}} in adaptive["conditional_edges"]
    fresh = client.get(f"/api/users/{new_user}/agents").json()
    assert all(a["status"] == "idle" for a in fresh["agents"])
    assert len(client.get("/api/agents").json()["agents"]) == 7


def test_agent_failure_is_recorded_not_hidden(client, priya_id, monkeypatch):
    def boom(_payload):
        raise RuntimeError("simulated failure")

    monkeypatch.setattr(AGENTS["skill_gap"], "run", boom)
    r = client.post(f"/api/users/{priya_id}/comeback", json={})
    assert r.status_code == 500
    assert r.json()["error"]["code"] == "agent_failed"
    errors = [l for l in client.get(f"/api/users/{priya_id}/activity").json()["logs"] if l["status"] == "error"]
    assert len(errors) == 1
    assert errors[0]["agent"] == "skill_gap" and "simulated failure" in errors[0]["output"]["error"]
    runs = client.get(f"/api/users/{priya_id}/activity").json()["runs"]
    assert runs[0]["errors"] == 1

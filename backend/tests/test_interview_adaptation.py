"""Includes the headline agentic demo: the Spring Boot feedback loop."""
from conftest import complete_day, roadmap

WEAK_SB = "I think maybe it configures things. Not sure."
STRONG_SB = (
    "Spring Boot auto-configuration inspects the classpath and conditionally creates sensible default beans. "
    "For example, adding the spring-boot-starter-web starter brings in Tomcat and Jackson, which auto-configuration then wires up. "
    "I can override the defaults in application.properties or by defining my own bean, because user beans take precedence."
)


def _start(client, uid, itype="technical"):
    r = client.post(f"/api/users/{uid}/interviews", json={"interview_type": itype})
    assert r.status_code == 201, r.text
    return r.json()["session"]


def _answer(client, uid, sid, qid, text):
    return client.post(f"/api/users/{uid}/interviews/{sid}/answers", json={"question_id": qid, "answer": text})


def test_spring_boot_feedback_loop_end_to_end(client, priya_id):
    # 1–5: profile → skill gap (Spring Boot) → roadmap prioritises Spring Boot
    skills = client.get(f"/api/users/{priya_id}/skills").json()["assessment"]
    assert skills["summary"]["priorities"][0] == "Spring Boot"
    rm = roadmap(client, priya_id)
    assert rm["focus_skills"][0] == "Spring Boot"
    done = complete_day(client, priya_id, 1)
    assert done

    # 6–7: mock interview targets the top gap; weak answer detected
    session = _start(client, priya_id)
    q = session["questions"][0]
    assert q["skill"] == "Spring Boot"
    fb = _answer(client, priya_id, session["id"], q["id"], WEAK_SB).json()["feedback"]
    assert fb["weak"] is True and fb["overall"] < 60
    assert fb["missing_points"] and fb["improved_answer"]

    # 8–9: orchestrator receives the assessment and asks the Learning Agent to adapt
    out = client.post(f"/api/users/{priya_id}/interviews/{session['id']}/complete").json()
    orch = out["orchestration"]
    assert orch["trace"] == ["receive", "analyze", "evaluate", "adapt", "reassess", "opportunity", "plan"]
    assert orch["roadmap_changed"] is True
    assert orch["interview_summary"]["weak_topics"][0]["skill"] == "Spring Boot"
    assert "Spring Boot interview score" in orch["adaptation"]["reason"]
    assert out["session"]["status"] == "completed" and out["session"]["weak_topics"]

    # 10: the updated plan and the reason are visible; completed work is untouched
    after = roadmap(client, priya_id)
    assert after["version"] == rm["version"] + 1
    assert set(done) <= {t["id"] for t in after["tasks"] if t["completed"]}
    added = [t for t in after["tasks"] if t["added_by_adaptation"]]
    assert added and all(t["skill"] == "Spring Boot" and "interview score" in t["adaptation_note"] for t in added)
    assert any("focus on" in t["title"] for t in added if t["kind"] == "revision")  # targets the missing concepts
    assert after["changes"][-1]["trigger"] == "interview"
    plan = client.get(f"/api/users/{priya_id}/plan").json()
    assert "Roadmap adapted after interview" in plan["change_log"][-1]["reason"]
    assert plan["data"]["learning_roadmap"]["last_change"]["trigger"] == "interview"

    # the activity log shows the hand-offs, in order
    logs = client.get(f"/api/users/{priya_id}/activity", params={"run_id": orch["run_id"]}).json()["logs"]
    seq = [(l["agent"], l["next_agent"]) for l in logs]
    assert seq[0] == ("orchestrator", "confidence")
    assert ("confidence", "orchestrator") in seq
    assert ("orchestrator", "learning") in seq
    assert ("learning", "orchestrator") in seq
    assert any(l["agent"] == "orchestrator" and l["roadmap_changed"] for l in logs)


def test_strong_answer_is_not_weak(client, priya_id):
    session = _start(client, priya_id)
    q = next(x for x in session["questions"] if x["id"] == "t-sb-1")
    fb = _answer(client, priya_id, session["id"], q["id"], STRONG_SB).json()["feedback"]
    assert fb["weak"] is False
    assert fb["scores"]["technical_accuracy"] >= 75
    assert fb["overall"] >= 60


def test_hr_interview_is_supportive_about_career_break(client, priya_id):
    session = _start(client, priya_id, "hr")
    assert session["questions"][0]["id"] == "hr-break"
    assert all(q["type"] == "hr" for q in session["questions"])
    fb = _answer(client, priya_id, session["id"], "hr-break", "Sorry, I know it's been too long. I was just a housewife.").json()["feedback"]
    assert any("no need to apologise" in i.lower() for i in fb["improvements"])
    # improved answer uses only verified profile facts
    assert "Software Developer" in fb["improved_answer"] and "5 years" in fb["improved_answer"]
    assert "scores" in fb and "technical_accuracy" not in fb["scores"]


def test_re_answering_replaces_previous_attempt(client, priya_id):
    s = _start(client, priya_id)
    qid = s["questions"][0]["id"]
    _answer(client, priya_id, s["id"], qid, WEAK_SB)
    _answer(client, priya_id, s["id"], qid, STRONG_SB)
    session = client.get(f"/api/users/{priya_id}/interviews/{s['id']}").json()["session"]
    assert len(session["feedback"]) == 1 and session["feedback"][0]["answer"] == STRONG_SB


def test_interview_error_cases(client, priya_id, new_user):
    assert client.post(f"/api/users/{new_user}/interviews", json={"interview_type": "mixed"}).status_code == 409  # no profile
    assert client.post(f"/api/users/{priya_id}/interviews", json={"interview_type": "chat"}).status_code == 422
    s = _start(client, priya_id)
    assert _answer(client, priya_id, s["id"], "not-a-question", "Some answer here").status_code == 404
    assert _answer(client, priya_id, s["id"], s["questions"][0]["id"], "x").status_code == 422
    assert client.post(f"/api/users/{priya_id}/interviews/{s['id']}/complete").status_code == 422  # no answers yet
    _answer(client, priya_id, s["id"], s["questions"][0]["id"], WEAK_SB)
    assert client.post(f"/api/users/{priya_id}/interviews/{s['id']}/complete").status_code == 200
    assert client.post(f"/api/users/{priya_id}/interviews/{s['id']}/complete").status_code == 409
    assert _answer(client, priya_id, s["id"], s["questions"][1]["id"], WEAK_SB).status_code == 409
    assert client.get(f"/api/users/{priya_id}/interviews/99999").status_code == 404


def test_cannot_access_another_users_interview(client, priya_id):
    other = client.post("/api/demo/priya").json()["user"]["id"]
    s = _start(client, priya_id)
    assert client.get(f"/api/users/{other}/interviews/{s['id']}").status_code == 404
    assert _answer(client, other, s["id"], s["questions"][0]["id"], WEAK_SB).status_code == 404
    assert client.post(f"/api/users/{other}/interviews/{s['id']}/complete").status_code == 404


def test_interview_history_and_readiness(client, priya_id):
    s = _start(client, priya_id, "mixed")
    assert [q["type"] for q in s["questions"]] == ["hr", "technical", "technical", "hr"]
    _answer(client, priya_id, s["id"], s["questions"][1]["id"], STRONG_SB)
    client.post(f"/api/users/{priya_id}/interviews/{s['id']}/complete")
    hist = client.get(f"/api/users/{priya_id}/interviews").json()["sessions"]
    assert len(hist) == 1 and hist[0]["overall_score"] is not None
    readiness = client.get(f"/api/users/{priya_id}/plan").json()["data"]["readiness"]
    assert readiness["components"]["interview"] is not None

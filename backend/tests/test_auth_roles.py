"""Tests for authentication, role authorization, and agent endpoints."""
import pytest
from fastapi.testclient import TestClient


def test_register_and_login_flow(client: TestClient):
    # 1. Register listener
    reg_payload = {
        "name": "Maya Patel",
        "email": "maya@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "terms_accepted": True,
    }
    r = client.post("/api/auth/register", json=reg_payload)
    assert r.status_code == 201, r.text
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "maya@example.com"
    assert data["user"]["role"] == "listener"
    assert data["redirect"] == "/app"

    # 2. Cannot duplicate register
    r_dup = client.post("/api/auth/register", json=reg_payload)
    assert r_dup.status_code == 409

    # 3. Login with correct password
    login_r = client.post("/api/auth/login", json={"email": "maya@example.com", "password": "Password123!"})
    assert login_r.status_code == 200
    token = login_r.json()["access_token"]

    # 4. Login with bad password fails
    bad_login = client.post("/api/auth/login", json={"email": "maya@example.com", "password": "WrongPassword"})
    assert bad_login.status_code == 401

    # 5. Call /api/auth/me with Bearer token
    me_r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_r.status_code == 200
    assert me_r.json()["user"]["name"] == "Maya Patel"


def test_role_authorization_guards(client: TestClient):
    # Register regular listener
    client.post("/api/auth/register", json={
        "name": "Sarah Listener",
        "email": "sarah@example.com",
        "password": "Password123!",
        "terms_accepted": True,
    })
    token = client.post("/api/auth/login", json={"email": "sarah@example.com", "password": "Password123!"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Listener can access /api/listeners/me
    r_listener = client.get("/api/listeners/me", headers=headers)
    assert r_listener.status_code == 200

    # Listener CANNOT access trainer routes
    r_trainer = client.get("/api/trainers/me/listeners", headers=headers)
    assert r_trainer.status_code == 403

    # Listener CANNOT access admin routes
    r_admin = client.get("/api/admin/dashboard", headers=headers)
    assert r_admin.status_code == 403


def test_admin_and_trainer_workflows(client: TestClient):
    # Admin login with seeded credentials
    login_admin = client.post("/api/auth/login", json={
        "email": "admin@restarther.org",
        "password": "AdminSecure123!",
    })
    assert login_admin.status_code == 200
    admin_token = login_admin.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin dashboard
    dash = client.get("/api/admin/dashboard", headers=admin_headers)
    assert dash.status_code == 200
    assert "kpis" in dash.json()

    # Admin creates a new trainer
    new_trainer = client.post("/api/admin/trainers", json={
        "name": "Deepa Mentor",
        "email": "deepa@restarther.org",
        "password": "TrainerPassword123!",
        "specialization": "Frontend & React Mentorship",
    }, headers=admin_headers)
    assert new_trainer.status_code == 201

    # Trainer logs in
    login_trainer = client.post("/api/auth/login", json={
        "email": "deepa@restarther.org",
        "password": "TrainerPassword123!",
    })
    assert login_trainer.status_code == 200
    assert login_trainer.json()["user"]["role"] == "trainer"
    trainer_token = login_trainer.json()["access_token"]
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}

    # Trainer can access trainer listeners
    t_listeners = client.get("/api/trainers/me/listeners", headers=trainer_headers)
    assert t_listeners.status_code == 200


def test_agent_registry_endpoints(client: TestClient):
    # Both /api/agents (with jotform_agents key) and /api/agents/jotform return the 6 Jotform agents
    r = client.get("/api/agents")
    assert r.status_code == 200
    data = r.json()
    assert len(data["agents"]) == 7  # 7 orchestrator agents
    assert len(data["jotform_agents"]) == 6  # 6 verified Jotform AI agents

    r2 = client.get("/api/agents/jotform")
    assert r2.status_code == 200
    agents = r2.json()
    assert len(agents) == 6
    keys = {a["key"] for a in agents}
    assert keys == {
        "profile_intake",
        "skill_gap",
        "tutor_coach",
        "interview_coach",
        "job_scout",
        "application_assistant",
    }

    # Check individual health
    h = client.get("/api/agents/job_scout/health")
    assert h.status_code == 200
    assert h.json()["status"] == "ready"
    assert "01a1de" in h.json()["jotform_id"]


def test_admin_and_trainer_account_creation_and_task_sync(client: TestClient):
    # 1. Admin creates another Admin
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@restarther.org",
        "password": "AdminSecure123!",
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    create_admin_res = client.post("/api/admin/admins", json={
        "name": "Co-Administrator",
        "email": "coadmin@restarther.org",
        "password": "AdminPassword123!",
    }, headers=admin_headers)
    assert create_admin_res.status_code == 201

    # New admin can log in
    coadmin_login = client.post("/api/auth/login", json={
        "email": "coadmin@restarther.org",
        "password": "AdminPassword123!",
    })
    assert coadmin_login.status_code == 200
    assert coadmin_login.json()["user"]["role"] == "admin"

    # 2. Trainer creates a Trainer colleague
    trainer_login = client.post("/api/auth/login", json={
        "email": "trainer@restarther.org",
        "password": "TrainerSecure123!",
    })
    assert trainer_login.status_code == 200
    trainer_token = trainer_login.json()["access_token"]
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}

    create_colleague_res = client.post("/api/trainers/colleagues", json={
        "name": "Meera Mentor",
        "email": "meera@restarther.org",
        "password": "ColleaguePassword123!",
        "specialization": "Backend Cloud Mentorship",
    }, headers=trainer_headers)
    assert create_colleague_res.status_code == 201

    # New colleague logs in
    colleague_login = client.post("/api/auth/login", json={
        "email": "meera@restarther.org",
        "password": "ColleaguePassword123!",
    })
    assert colleague_login.status_code == 200
    assert colleague_login.json()["user"]["role"] == "trainer"

    # 3. Trainer assigns task to Priya (learner)
    # Get Priya's id
    priya_user = client.post("/api/auth/login", json={
        "email": "priya@restarther.org",
        "password": "PriyaSecure123!",
    })
    assert priya_user.status_code == 200
    priya_id = priya_user.json()["user"]["id"]
    priya_token = priya_user.json()["access_token"]
    priya_headers = {"Authorization": f"Bearer {priya_token}"}

    assign_res = client.post(f"/api/trainers/listeners/{priya_id}/assign-task", json={
        "title": "Spring Security JWT Practice",
        "description": "Implement a custom JWT authentication filter in Spring Boot.",
        "skill": "Spring Boot",
        "due_date": "Day 7",
    }, headers=trainer_headers)
    assert assign_res.status_code == 200
    task_id = assign_res.json()["task_id"]

    # 4. Learner checks tasks via /api/listeners/tasks
    tasks_res = client.get("/api/listeners/tasks", headers=priya_headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()["tasks"]
    assigned = next((t for t in tasks if t["id"] == task_id), None)
    assert assigned is not None
    assert assigned["status"] == "pending"
    assert assigned["title"] == "Spring Security JWT Practice"

    # 5. Learner submits completion proof
    complete_res = client.post(f"/api/listeners/tasks/{task_id}/complete", json={
        "proof_notes": "Implemented custom JWT authentication filter and verified test coverage is 100%.",
        "proof_url": "https://github.com/priya/jwt-security-practice",
    }, headers=priya_headers)
    assert complete_res.status_code == 200
    assert complete_res.json()["task"]["status"] == "completed"
    assert "Implemented custom JWT" in complete_res.json()["task"]["feedback"]

    # 6. Trainer inspects learner detail and sees completed task with proof
    detail_res = client.get(f"/api/trainers/listeners/{priya_id}", headers=trainer_headers)
    assert detail_res.status_code == 200
    trainer_tasks = detail_res.json()["assigned_tasks"]
    task_in_trainer = next((t for t in trainer_tasks if t["id"] == task_id), None)
    assert task_in_trainer is not None
    assert task_in_trainer["status"] == "completed"
    assert "jwt-security-practice" in task_in_trainer["feedback"]


def test_account_deletion_flow(client: TestClient):
    # Register temporary user
    reg = client.post("/api/auth/register", json={
        "name": "Delete Me Test",
        "email": "deleteme@example.com",
        "password": "Password123!",
        "terms_accepted": True,
    })
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify user can access profile
    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200

    # Delete account
    del_res = client.delete("/api/users/me", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "ok"

    # Subsequent access fails
    me_after = client.get("/api/auth/me", headers=headers)
    assert me_after.status_code == 404

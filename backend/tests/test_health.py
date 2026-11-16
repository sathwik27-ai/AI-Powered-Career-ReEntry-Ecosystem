def test_health_ok_and_demo_mode(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"
    assert body["ai_mode"] == "demo"
    assert "demo" in body["ai_mode_description"].lower()


def test_health_and_schema_do_not_expose_secrets(client):
    text = client.get("/api/health").text + client.get("/openapi.json").text
    assert "ANTHROPIC_API_KEY" not in text
    assert "sk-ant" not in text


def test_root_points_to_docs(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["docs"] == "/docs"


def test_unknown_route_uses_structured_error(client):
    r = client.get("/api/does-not-exist")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "not_found"

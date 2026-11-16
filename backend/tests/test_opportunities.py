def _list(client, uid, **params):
    r = client.get(f"/api/users/{uid}/opportunities", params=params)
    assert r.status_code == 200, r.text
    return r.json()


def test_demo_listings_clearly_labelled_and_never_linked(client, priya_id):
    data = _list(client, priya_id)
    assert data["count"] == 14
    assert "not real vacancies" in data["disclaimer"]
    for o in data["results"]:
        assert o["is_demo"] is True and o["source"] == "demo"
        assert o["listing_label"] == "Illustrative demo listing – not a live vacancy"
        assert o["source_url"] is None
        assert o["employer_label"].startswith("Illustrative")


def test_matches_are_explained_and_ranked(client, priya_id):
    results = _list(client, priya_id)["results"]
    top = results[0]
    assert top["role_family"] == "Backend Developer" and top["role_fit"] is True
    assert set(top["components"]) == {"skills", "experience", "flexibility", "location", "returnship"}
    assert top["reasons"]
    fits = [r for r in results if r["role_fit"]]
    assert [r["match_score"] for r in fits] == sorted((r["match_score"] for r in fits), reverse=True)
    # off-target roles come after all role-fit roles
    first_misfit = next(i for i, r in enumerate(results) if not r["role_fit"])
    assert all(r["role_fit"] for r in results[:first_misfit])
    # missing qualifications are listed
    hc = next(r for r in results if r["slug"] == "demo-backend-hybrid-health")
    assert "Docker" in hc["missing_skills"] or "Docker" in hc["in_progress_skills"]


def test_skills_on_roadmap_count_as_in_progress(client, priya_id):
    hc = next(r for r in _list(client, priya_id)["results"] if r["slug"] == "demo-backend-hybrid-health")
    assert "Docker" in hc["in_progress_skills"]  # Docker is a focus skill on Priya's roadmap


def test_career_break_does_not_reduce_experience_match(client, priya_id):
    r = next(r for r in _list(client, priya_id)["results"] if r["slug"] == "demo-backend-returnship-fintech")
    assert r["components"]["experience"] == 100  # 5 yrs vs 3 required, despite a 4-year break


def test_filters(client, priya_id):
    remote = _list(client, priya_id, arrangement="Remote")["results"]
    assert remote and all(r["arrangement"] == "Remote" for r in remote)
    ret = _list(client, priya_id, returnship_only=True)["results"]
    assert ret and all(r["returnship_friendly"] for r in ret)
    pt = _list(client, priya_id, employment_type="Part-time")["results"]
    assert pt and all(r["employment_type"] == "Part-time" for r in pt)
    chennai = _list(client, priya_id, location="Chennai")["results"]
    assert chennai and all("Chennai" in r["location"] for r in chennai)
    java = _list(client, priya_id, role="Java")["results"]
    assert java and all("java" in (r["title"] + r["role_family"]).lower() for r in java)
    combo = _list(client, priya_id, arrangement="Remote", returnship_only=True)
    assert combo["filters"] == {"arrangement": "Remote", "returnship_only": True}
    assert all(r["arrangement"] == "Remote" and r["returnship_friendly"] for r in combo["results"])


def test_invalid_filters_and_missing_profile(client, priya_id, new_user):
    assert client.get(f"/api/users/{priya_id}/opportunities", params={"arrangement": "Moon"}).status_code == 422
    assert client.get(f"/api/users/{priya_id}/opportunities", params={"employment_type": "Forever"}).status_code == 422
    assert client.get(f"/api/users/{new_user}/opportunities").status_code == 409


def test_save_and_unsave(client, priya_id):
    oid = _list(client, priya_id)["results"][0]["id"]
    assert client.post(f"/api/users/{priya_id}/opportunities/{oid}/save").status_code == 201
    assert client.post(f"/api/users/{priya_id}/opportunities/{oid}/save").status_code == 201  # idempotent
    saved = client.get(f"/api/users/{priya_id}/opportunities/saved").json()
    assert [s["id"] for s in saved["results"]] == [oid]
    assert saved["results"][0]["listing_label"].startswith("Illustrative")
    assert next(r for r in _list(client, priya_id)["results"] if r["id"] == oid)["saved"] is True
    assert client.delete(f"/api/users/{priya_id}/opportunities/{oid}/save").status_code == 200
    assert client.get(f"/api/users/{priya_id}/opportunities/saved").json()["results"] == []
    assert client.post(f"/api/users/{priya_id}/opportunities/99999/save").status_code == 404


def test_saved_lists_are_per_user(client, priya_id):
    other = client.post("/api/demo/priya").json()["user"]["id"]
    oid = _list(client, priya_id)["results"][0]["id"]
    client.post(f"/api/users/{priya_id}/opportunities/{oid}/save")
    assert client.get(f"/api/users/{other}/opportunities/saved").json()["results"] == []

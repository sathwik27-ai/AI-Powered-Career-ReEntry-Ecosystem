import json
from pathlib import Path

import pymupdf
import pytest

from config import settings
from conftest import ONBOARDING

DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _upload(client, uid, name, data, ctype, onboarding=None):
    payload = {"onboarding": json.dumps(onboarding)} if onboarding else None
    return client.post(f"/api/users/{uid}/resume", files={"file": (name, data, ctype)}, data=payload)


@pytest.mark.parametrize("fixture,name,ctype", [("sample_pdf", "cv.pdf", "application/pdf"), ("sample_docx", "cv.docx", DOCX_TYPE)])
def test_resume_upload_extracts_profile(client, new_user, request, fixture, name, ctype):
    r = _upload(client, new_user, name, request.getfixturevalue(fixture), ctype, ONBOARDING)
    assert r.status_code == 200, r.text
    body = r.json()
    p = body["profile"]
    assert p["full_name"] == "Priya Raman"
    assert p["previous_role"] == "Software Developer"
    assert p["experience_years"] == 5.0
    assert p["career_break_years"] >= 4.0
    assert p["career_break_reason"] == "maternity, caregiving"
    assert {"Java", "SQL", "Spring Boot", "Python"} <= set(p["skills"])
    assert len(p["employment"]) == 2
    assert p["education"] and "Computer Science" in p["education"][0]
    assert p["source"] == "resume+onboarding"
    # onboarding answers are applied
    assert p["target_role"] == "Backend Developer" and p["work_preferences"] == ["Remote", "Hybrid"]
    assert body["resume"]["type"] == name.split(".")[1]
    assert body["workflow"]["needs_clarification"] is False


def test_parser_does_not_invent_skills(client, new_user, sample_pdf):
    p = _upload(client, new_user, "cv.pdf", sample_pdf, "application/pdf", ONBOARDING).json()["profile"]
    for absent in ["Docker", "Kubernetes", "React", "Microservices", "Cloud Deployment"]:
        assert absent not in p["skills"]
    # every detected skill is backed by a snippet from the document
    assert set(p["skills"]) <= set(p["skill_evidence"])


def test_uploaded_file_stored_safely_under_random_name(client, new_user, sample_pdf):
    r = _upload(client, new_user, "../../evil name.pdf", sample_pdf, "application/pdf", ONBOARDING)
    assert r.status_code == 200
    folder = Path(settings.upload_dir) / str(new_user)
    files = list(folder.iterdir())
    assert len(files) == 1
    assert files[0].suffix == ".pdf" and "evil" not in files[0].name
    assert files[0].resolve().is_relative_to(Path(settings.upload_dir).resolve())


def test_resume_without_target_role_requests_clarification(client, new_user, sample_pdf):
    r = _upload(client, new_user, "cv.pdf", sample_pdf, "application/pdf")
    assert r.status_code == 200
    wf = r.json()["workflow"]
    assert wf["needs_clarification"] is True
    assert wf["suggested_roles"] and wf["suggested_roles"][0] == "Backend Developer"


@pytest.mark.parametrize("name,data,ctype,status", [
    ("cv.txt", b"plain text resume", "text/plain", 415),
    ("cv.exe", b"MZ....", "application/octet-stream", 415),
    ("cv.pdf", b"this is not really a pdf", "application/pdf", 400),
    ("cv.docx", b"%PDF-1.4 pretending to be docx", DOCX_TYPE, 400),
    ("cv.pdf", b"", "application/pdf", 400),
])
def test_invalid_uploads_rejected(client, new_user, name, data, ctype, status):
    r = _upload(client, new_user, name, data, ctype)
    assert r.status_code == status, r.text
    assert "error" in r.json()
    assert not (Path(settings.upload_dir) / str(new_user)).exists()


def test_oversized_upload_rejected(client, new_user):
    data = b"%PDF" + b"0" * int(settings.max_upload_mb * 1024 * 1024 + 10)
    r = _upload(client, new_user, "big.pdf", data, "application/pdf")
    assert r.status_code == 413


def test_pdf_without_text_rejected_with_helpful_message(client, new_user):
    doc = pymupdf.open()
    doc.new_page()
    r = _upload(client, new_user, "scan.pdf", doc.tobytes(), "application/pdf")
    assert r.status_code == 422
    assert "scanned" in r.json()["error"]["message"].lower()


def test_corrupt_pdf_rejected(client, new_user):
    r = _upload(client, new_user, "broken.pdf", b"%PDF-1.4\n garbage garbage", "application/pdf")
    assert r.status_code == 422


def test_invalid_onboarding_json_rejected(client, new_user, sample_pdf):
    r = client.post(f"/api/users/{new_user}/resume", files={"file": ("cv.pdf", sample_pdf, "application/pdf")}, data={"onboarding": "{not json"})
    assert r.status_code == 422
    r = client.post(f"/api/users/{new_user}/resume", files={"file": ("cv.pdf", sample_pdf, "application/pdf")}, data={"onboarding": json.dumps({"hours_per_day": 99})})
    assert r.status_code == 422


def test_upload_requires_file(client, new_user):
    assert client.post(f"/api/users/{new_user}/resume").status_code == 422


def test_sample_resume_download(client):
    assert client.get("/api/demo/sample-resume/pdf").status_code == 200
    assert client.get("/api/demo/sample-resume/docx").status_code == 200
    assert client.get("/api/demo/sample-resume/exe").status_code == 404

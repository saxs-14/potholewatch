from io import BytesIO

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

client = TestClient(app, headers={"X-API-Key": settings.api_key})


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200


def test_protected_endpoint_rejects_missing_key():
    anon = TestClient(app)
    r = anon.get("/api/dashboard/summary")
    assert r.status_code == 401


def test_dashboard_summary_shape():
    r = client.get("/api/dashboard/summary")
    assert r.status_code == 200
    for key in [
        "total_reports", "total_potholes", "severe_count",
        "avg_confidence", "open_reports", "fixed_reports"
    ]:
        assert key in r.json()


def test_reports_list_returns_array():
    r = client.get("/api/reports")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_invalid_upload_type_is_rejected():
    r = client.post(
        "/api/analyze",
        files={"file": ("test.txt", BytesIO(b"not an image"), "text/plain")},
    )
    assert r.status_code == 415


def test_invalid_coordinates_are_rejected():
    r = client.post(
        "/api/analyze",
        data={"latitude": "100", "longitude": "20"},
        files={"file": ("test.jpg", BytesIO(b"not an image"), "image/jpeg")},
    )
    assert r.status_code == 400


def test_report_status_update_and_history():
    created = client.post("/api/analyze/demo")
    if created.status_code == 404:
        return
    assert created.status_code == 200
    report_id = created.json()["id"]

    updated = client.patch(
        f"/api/reports/{report_id}/status",
        json={"status": "reviewed", "note": "Reviewed by operator"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "reviewed"

    history = client.get(f"/api/reports/{report_id}/history")
    assert history.status_code == 200
    assert history.json()[-1]["to_status"] == "reviewed"


def test_analyze_demo_runs_end_to_end():
    r = client.post("/api/analyze/demo")
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        body = r.json()
        assert body["severity"] in ("none", "minor", "moderate", "severe")


def test_auth_registration_and_login():
    email = "student-test@example.com"
    password = "strong-password-123"
    created = client.post("/api/auth/register", json={"email": email, "password": password})
    assert created.status_code in (200, 409)
    logged = client.post("/api/auth/login", json={"email": email, "password": password})
    assert logged.status_code == 200
    token = logged.json()["access_token"]
    protected = client.get("/api/reports", headers={"Authorization": "Bearer " + token})
    assert protected.status_code == 200


def test_auth_rejects_short_password():
    r = client.post("/api/auth/register", json={"email": "short@example.com", "password": "short"})
    assert r.status_code == 422


def test_status_transitions_are_validated():
    created = client.post("/api/analyze/demo")
    if created.status_code == 404:
        return
    report_id = created.json()["id"]
    r = client.patch(f"/api/reports/{report_id}/status", json={"status": "fixed"})
    assert r.status_code == 409

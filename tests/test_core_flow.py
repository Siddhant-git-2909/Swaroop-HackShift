import io
import pytest
from fastapi.testclient import TestClient
from server.app.main import app
from server.app.shared.mongodb import mongo_store

client = TestClient(app)

def test_health_check_mongodb():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] == "MongoDB Atlas"
    assert data["database_connected"] is True
    assert "public_base_url" in data

def test_privacy_no_phone_in_public_passport():
    res = client.get("/api/v1/public/workers/ramesh-electrician")
    assert res.status_code == 200
    data = res.json()
    assert "phone" not in data["worker"]
    assert "public_url" in data
    assert "/w/ramesh-electrician" in data["public_url"]

def test_matching_search_breakdown():
    res = client.post("/api/v1/matching/search", json={"category": "electrician", "area_id": "area-1"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    top = data["results"][0]
    assert "score" in top
    assert "breakdown" in top
    assert "reason_en" in top
    assert "reason_hi" in top
    assert top["breakdown"]["skill"] <= 40
    assert top["breakdown"]["location"] <= 25

def test_trust_ladder_l3_gate():
    res = client.post("/api/v1/facilitator/claims/claim-1/assess", json={
        "facilitator_id": "user-f1",
        "scope": "In-person test",
        "note": "Field verification complete"
    })
    assert res.status_code == 200
    claim = res.json()["claim"]
    assert claim["status"] == "independently_assessed"

def test_quotation_workflow():
    # Create booking
    b_res = client.post("/api/v1/bookings", json={
        "customer_id": "user-c1",
        "worker_id": "user-w1",
        "category": "electrician",
        "description": "Short circuit in bedroom"
    })
    assert b_res.status_code == 200
    bid = b_res.json()["id"]

    # Send quote
    q_res = client.post(f"/api/v1/bookings/{bid}/quotations", json={
        "created_by": "user-w1",
        "note": "Replacement parts",
        "items": [
            {"label": "Switch", "qty": 2, "unit_paise": 10000},
            {"label": "Labor", "qty": 1, "unit_paise": 20000}
        ]
    })
    assert q_res.status_code == 200
    quote = q_res.json()
    assert quote["total_paise"] == 40000 # 2*10000 + 1*20000

    # Accept quote
    a_res = client.post(f"/api/v1/quotations/{quote['id']}/accept?customer_id=user-c1")
    assert a_res.status_code == 200
    assert a_res.json()["status"] == "accepted"

def test_contractor_project_and_squad():
    p_res = client.post("/api/v1/contractor/projects", json={
        "contractor_id": "user-ct1",
        "title": "Hospital Wing Substation Cabling",
        "category": "electrician",
        "workers_needed": 3,
        "area_id": "area-1",
        "budget_rs": 60000,
        "description": "Cable pulling and terminal lugging"
    })
    assert p_res.status_code == 200
    proj = p_res.json()
    assert proj["title"] == "Hospital Wing Substation Cabling"
    pid = proj["id"]

    # Assign worker to squad
    assign_res = client.post(f"/api/v1/contractor/projects/{pid}/assign", json={
        "worker_id": "user-w1"
    })
    assert assign_res.status_code == 200
    assert "user-w1" in assign_res.json()["assigned_worker_ids"]

def test_evidence_file_upload_multipart():
    fake_img = io.BytesIO(b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;")
    res = client.post(
        "/api/v1/evidence",
        data={
            "worker_id": "user-w1",
            "caption": "Substation DB neat trunking and busbar link"
        },
        files={
            "file": ("busbar_test.png", fake_img, "image/png")
        }
    )
    assert res.status_code == 200
    ev = res.json()
    assert ev["status"] == "ai_consistent"
    assert "/uploads/" in ev["image_url"]

def test_demo_reset_preserves_user_records():
    # Create user worker profile
    test_uid = "user-test-persistence-99"
    client.post("/api/v1/workers/profile/confirm", json={
        "user_id": test_uid,
        "name": "Manish Sharma (User Created)",
        "headline": "Experienced AC Technician",
        "core_skills": ["ac-technician"],
        "secondary_skills": [],
        "experience_years": 6,
        "area_id": "area-1",
        "area_text": "Karol Bagh",
        "source": "text"
    })

    # Trigger demo reset
    reset_res = client.post("/api/v1/demo/reset")
    assert reset_res.status_code == 200

    # Verify user profile still exists in MongoDB!
    get_res = client.get(f"/api/v1/workers/me?worker_id={test_uid}")
    assert get_res.status_code == 200
    assert get_res.json()["profile"]["name"] == "Manish Sharma (User Created)"

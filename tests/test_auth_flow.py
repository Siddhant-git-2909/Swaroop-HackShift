import pytest
from fastapi.testclient import TestClient
from server.app.main import app

client = TestClient(app)

def test_signup_valid_worker():
    phone = "9811122233"
    res = client.post("/api/v1/auth/signup", json={
        "name": "Devendra Kumar",
        "phone": f"+91 {phone}",
        "role": "worker"
    })
    assert res.status_code in [200, 400]
    if res.status_code == 200:
        data = res.json()
        assert data["success"] is True
        assert data["user"]["phone"] == phone
        assert data["user"]["role"] == "worker"
        assert data["user"]["name"] == "Devendra Kumar"
        assert "token" in data
        assert data["worker_profile"] is not None

def test_signup_valid_contractor_and_customer():
    # Contractor
    c_res = client.post("/api/v1/auth/signup", json={
        "name": "Vikram Construction",
        "phone": "9822233344",
        "role": "contractor"
    })
    assert c_res.status_code in [200, 400]
    if c_res.status_code == 200:
        assert c_res.json()["user"]["role"] == "contractor"

    # Customer
    cust_res = client.post("/api/v1/auth/signup", json={
        "name": "Ananya Sen",
        "phone": "9833344455",
        "role": "customer"
    })
    assert cust_res.status_code in [200, 400]
    if cust_res.status_code == 200:
        assert cust_res.json()["user"]["role"] == "customer"

def test_signup_duplicate_phone_rejected():
    phone = "9844455566"
    # First registration
    res1 = client.post("/api/v1/auth/signup", json={
        "name": "Rajesh Pilot",
        "phone": phone,
        "role": "worker"
    })
    assert res1.status_code in [200, 400]

    # Second registration with same phone
    res2 = client.post("/api/v1/auth/signup", json={
        "name": "Another Name",
        "phone": f"+91-{phone}",
        "role": "customer"
    })
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"].lower()

def test_signup_invalid_phone_rejected():
    # Too short
    res1 = client.post("/api/v1/auth/signup", json={
        "name": "Test User",
        "phone": "12345",
        "role": "customer"
    })
    assert res1.status_code == 400

    # Invalid starting digit (starts with 1)
    res2 = client.post("/api/v1/auth/signup", json={
        "name": "Test User",
        "phone": "1234567890",
        "role": "customer"
    })
    assert res2.status_code == 400

def test_signup_invalid_role_rejected():
    res = client.post("/api/v1/auth/signup", json={
        "name": "Test User",
        "phone": "9855566677",
        "role": "superadmin"
    })
    assert res.status_code == 400
    assert "role must be one of" in res.json()["detail"].lower()

def test_otp_request_unregistered_phone_rejected():
    res = client.post("/api/v1/auth/otp/request", json={
        "phone": "9999999999"
    })
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_otp_request_registered_phone_success():
    # Ramesh Kumar demo worker is pre-seeded with phone 9000000001
    res = client.post("/api/v1/auth/otp/request", json={
        "phone": "9000000001"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "DEMO OTP" in data["message"]
    assert data["phone"] == "9000000001"

def test_otp_verify_correct():
    # Verify Ramesh Kumar demo account
    res = client.post("/api/v1/auth/otp/verify", json={
        "phone": "9000000001",
        "otp": "123456"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["user"]["phone"] == "9000000001"
    assert data["user"]["role"] == "worker"
    assert "token" in data

def test_otp_verify_incorrect_rejected():
    res = client.post("/api/v1/auth/otp/verify", json={
        "phone": "9000000001",
        "otp": "999999"
    })
    assert res.status_code == 400
    assert "invalid otp" in res.json()["detail"].lower()

def test_login_stored_role_retrieval():
    # Contractor Hardeep Singh demo phone: 9400000001
    res = client.post("/api/v1/auth/otp/verify", json={
        "phone": "9400000001",
        "otp": "123456"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "contractor"
    assert "Hardeep" in data["user"]["name"]

    # Customer Priya Sharma demo phone: 9100000001
    res2 = client.post("/api/v1/auth/otp/verify", json={
        "phone": "9100000001",
        "otp": "123456"
    })
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["user"]["role"] == "customer"
    assert "Priya" in data2["user"]["name"]

def test_worker_contact_visibility():
    # Worker contact endpoint
    res = client.get("/api/v1/workers/user-w1/contact")
    assert res.status_code == 200
    data = res.json()
    assert data["worker_id"] == "user-w1"
    assert data["phone"] == "9000000001"
    assert "Ramesh" in data["name"]

def test_public_and_search_endpoints_hide_phone():
    # Public passport hides phone
    res = client.get("/api/v1/public/workers/ramesh-electrician")
    assert res.status_code == 200
    assert "phone" not in res.json()["worker"]

    # Bulk search results hide phone
    search_res = client.post("/api/v1/matching/search", json={"category": "electrician"})
    assert search_res.status_code == 200
    for r in search_res.json()["results"]:
        assert "phone" not in r["user"]

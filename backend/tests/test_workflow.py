import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "MSDE" in data["organization"]

def test_login_demo_admin(client):
    response = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_list_qualifications(client):
    response = client.get("/api/qualifications")
    assert response.status_code == 200
    qps = response.json()
    assert len(qps) >= 1
    assert any(q["qp_code"] == "ELE/Q5901" for q in qps)

def test_qualification_match_api(client):
    req = {
        "trade": "Solar Installer",
        "tasks_summary": "Rooftop solar panel mounting and inverter connections",
        "tools_used": "Multimeter, MC4 crimping tool",
        "years_experience": 4.0
    }
    response = client.post("/api/qualifications/match", json=req)
    assert response.status_code == 200
    res = response.json()
    assert len(res["suggestions"]) > 0
    assert res["suggestions"][0]["qp_code"] == "ELE/Q5901"

def test_offline_sync_api(client):
    # Login assessor
    login_res = client.post("/api/auth/login", json={"username": "assessor1", "password": "assessor123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    test_op_id = f"OP-LOCAL-TEST-{uuid.uuid4().hex[:8]}"

    sync_req = {
        "operations": [
            {
                "client_op_id": test_op_id,
                "type": "SAVE_RESULT",
                "payload": {"score": 10.0, "observations": "Offline sync test"}
            }
        ]
    }

    sync_res = client.post("/api/sync", json=sync_req, headers=headers)
    assert sync_res.status_code == 200
    res = sync_res.json()
    assert res["processed_count"] == 1

    # Re-send same operation (duplicate check)
    dup_res = client.post("/api/sync", json=sync_req, headers=headers)
    assert dup_res.status_code == 200
    assert dup_res.json()["duplicates_count"] == 1

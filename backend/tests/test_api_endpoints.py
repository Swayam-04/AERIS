import pytest
from fastapi.testclient import TestClient
from backend.main import app, mission_service, db_manager, batch_writer


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_api_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "history_count" in data


def test_api_database_status_endpoint(client):
    response = client.get("/api/database/status")
    assert response.status_code == 200
    data = response.json()
    assert "database" in data
    assert "batch_writer" in data
    assert "ring_buffer_count" in data


def test_api_telemetry_live_endpoint(client):
    response = client.get("/api/telemetry/live")
    assert response.status_code == 200
    data = response.json()
    assert "timestamp" in data
    assert "engine_id" in data
    assert "observed" in data
    assert "rpm" in data["observed"]


def test_api_telemetry_history_with_params(client):
    response = client.get("/api/telemetry/history?limit=10&source=auto")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 10


def test_api_telemetry_stats_endpoint(client):
    response = client.get("/api/telemetry/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_records" in data

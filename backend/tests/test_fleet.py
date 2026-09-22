import pytest
from fastapi.testclient import TestClient
from backend.main import app, mission_service
from backend.schemas.telemetry import MissionPhase, FaultType, FaultInjectionRequest


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_fleet_initialization():
    """Verify fleet has 5 distinct DRDO UAV airframes with correct configurations."""
    assert len(mission_service.fleet) == 5
    expected_ids = ["UAV-RUST-01", "UAV-RUST-02", "UAV-TAPAS-03", "UAV-ABHYAS-04", "UAV-GHATAK-05"]
    for uav_id in expected_ids:
        assert uav_id in mission_service.fleet
        instance = mission_service.fleet[uav_id]
        assert instance.aircraft_id == uav_id
        assert instance.callsign is not None
        assert instance.model_name is not None
        assert instance.engine_id is not None


def test_fleet_summary_api(client):
    """Test /api/fleet and /api/fleet/summary endpoints."""
    res = client.get("/api/fleet")
    assert res.status_code == 200
    data = res.json()
    assert "fleet" in data
    assert data["total_airframes"] == 5
    assert "average_health" in data
    assert "active_sorties" in data
    assert len(data["fleet"]) == 5

    res_sum = client.get("/api/fleet/summary")
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert len(data_sum["fleet"]) == 5


def test_active_uav_selection(client):
    """Test switching the active UAV via /api/fleet/select/{uav_id}."""
    # Switch to UAV-RUST-02 (Garuda-2)
    res = client.post("/api/fleet/select/UAV-RUST-02")
    assert res.status_code == 200
    data = res.json()
    assert data["aircraft_id"] == "UAV-RUST-02"
    assert data["callsign"] == "Garuda-2"
    assert mission_service.active_uav_id == "UAV-RUST-02"

    # Switch to UAV-TAPAS-03 (Tapas-3)
    res2 = client.post("/api/fleet/select/UAV-TAPAS-03")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["aircraft_id"] == "UAV-TAPAS-03"
    assert data2["callsign"] == "Tapas-3"
    assert mission_service.active_uav_id == "UAV-TAPAS-03"

    # Switch back to UAV-RUST-01
    res3 = client.post("/api/fleet/select/UAV-RUST-01")
    assert res3.status_code == 200
    assert mission_service.active_uav_id == "UAV-RUST-01"


def test_uav_fault_isolation(client):
    """Verify that injecting a fault into UAV-2 does not affect UAV-1."""
    # Clear all faults first
    client.post("/api/fleet/UAV-RUST-01/fault/clear")
    client.post("/api/fleet/UAV-RUST-02/fault/clear")

    # Step simulation
    for _ in range(5):
        mission_service.step_simulation()

    state_uav1_before = mission_service.get_uav_state("UAV-RUST-01")
    assert state_uav1_before.active_fault == FaultType.NONE

    # Inject overheating fault on UAV-2
    res = client.post(
        "/api/fleet/UAV-RUST-02/fault",
        json={"fault_type": "overheating", "severity": 0.85, "duration_s": 120.0}
    )
    assert res.status_code == 200

    # Step simulation 15 times to let fault ramp
    for _ in range(15):
        mission_service.step_simulation()

    state_uav2 = mission_service.get_uav_state("UAV-RUST-02")
    state_uav1 = mission_service.get_uav_state("UAV-RUST-01")

    # UAV-2 should have overheating active and degraded health
    assert state_uav2.active_fault == FaultType.OVERHEATING
    assert state_uav2.overall_health_score < 95.0

    # UAV-1 should remain nominal and healthy!
    assert state_uav1.active_fault == FaultType.NONE
    assert state_uav1.overall_health_score >= 90.0

    # Clear fault on UAV-2
    client.post("/api/fleet/UAV-RUST-02/fault/clear")


def test_uav_phase_transition(client):
    """Test changing mission phase on specific UAV."""
    res = client.post("/api/fleet/UAV-TAPAS-03/phase?phase=loiter")
    assert res.status_code == 200
    state = res.json()
    assert state["mission_phase"] == "loiter"
    assert mission_service.fleet["UAV-TAPAS-03"].simulator.current_phase == MissionPhase.LOITER


def test_fleet_uav_state_and_history_endpoints(client):
    """Test getting state and history for specific UAV."""
    res_state = client.get("/api/fleet/UAV-ABHYAS-04/state")
    assert res_state.status_code == 200
    data_state = res_state.json()
    assert data_state["aircraft_id"] == "UAV-ABHYAS-04"
    assert data_state["callsign"] == "Abhyas-4"

    res_hist = client.get("/api/fleet/UAV-ABHYAS-04/history?limit=10")
    assert res_hist.status_code == 200
    data_hist = res_hist.json()
    assert isinstance(data_hist, list)

    res_3d = client.get("/api/fleet/UAV-GHATAK-05/3d-state")
    assert res_3d.status_code == 200
    data_3d = res_3d.json()
    assert data_3d["aircraftId"] == "UAV-GHATAK-05"
    assert data_3d["callsign"] == "Ghatak-5"

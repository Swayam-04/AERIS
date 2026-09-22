import asyncio
import os
import tempfile
import time
import pytest
from sqlalchemy import text

from backend.database.config import DatabaseSettings
from backend.database.connection import DatabaseManager
from backend.database.models import Base, TelemetryRecordModel
from backend.database.repository import TelemetryRepository
from backend.database.batch_writer import TelemetryBatchWriter
from backend.services.mission_service import MissionService
from backend.schemas.telemetry import (
    DigitalTwinState,
    TelemetryRecord,
    ResidualRecord,
    SubsystemHealth,
    DiagnosticAlert,
    RULEstimate,
    MissionPhase,
    FaultType
)


@pytest.fixture
def temp_db_manager():
    """Creates an isolated temporary SQLite database for test execution."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        temp_path = f.name

    db_url = f"sqlite:///{temp_path}"
    manager = DatabaseManager(database_url=db_url)
    assert manager.initialize() is True

    yield manager

    # Teardown
    if manager.engine:
        manager.engine.dispose()
    try:
        os.remove(temp_path)
    except OSError:
        pass


def test_database_connection_and_table_creation(temp_db_manager):
    """Verifies that the database manager connects, initializes tables, and passes health check."""
    assert temp_db_manager.is_healthy() is True
    status = temp_db_manager.get_status()
    assert status["connected"] is True
    assert status["dialect"] == "sqlite"

    with temp_db_manager.get_session() as session:
        result = session.execute(text("SELECT 1;")).scalar()
        assert result == 1


def test_telemetry_model_roundtrip(temp_db_manager):
    """Verifies lossless serialization and deserialization between DigitalTwinState and database model."""
    state = DigitalTwinState(
        timestamp=1700000000.0,
        engine_id="TEST-ENG-01",
        mission_id="TEST-MIS-99",
        mission_phase=MissionPhase.CLIMB,
        observed=TelemetryRecord(
            timestamp=1700000000.0,
            engine_id="TEST-ENG-01",
            mission_id="TEST-MIS-99",
            mission_phase=MissionPhase.CLIMB,
            throttle_pct=85.0,
            altitude_ft=5000.0,
            ambient_temp_c=10.0,
            rpm=4800.0,
            cht_c=165.0,
            egt_c=720.0,
            oil_pressure_psi=55.0,
            oil_temp_c=85.0,
            fuel_flow_lph=38.0,
            vibration_g=0.45,
            injection_timing_deg=22.0,
            battery_volts=28.2
        ),
        expected=TelemetryRecord(
            timestamp=1700000000.0,
            engine_id="TEST-ENG-01",
            mission_id="TEST-MIS-99",
            mission_phase=MissionPhase.CLIMB,
            throttle_pct=85.0,
            altitude_ft=5000.0,
            ambient_temp_c=10.0,
            rpm=4800.0,
            cht_c=162.0,
            egt_c=715.0,
            oil_pressure_psi=56.0,
            oil_temp_c=84.0,
            fuel_flow_lph=37.5,
            vibration_g=0.40,
            injection_timing_deg=22.0,
            battery_volts=28.2
        ),
        residuals=ResidualRecord(
            rpm=0.0,
            cht_c=3.0,
            egt_c=5.0,
            oil_pressure_psi=-1.0,
            oil_temp_c=1.0,
            fuel_flow_lph=0.5,
            vibration_g=0.05,
            injection_timing_deg=0.0,
            battery_volts=0.0,
            mahalanobis_distance=0.82
        ),
        subsystem_health=SubsystemHealth(
            piston_cylinder=99.0,
            lubrication=98.0,
            fuel_injection=99.5,
            ignition=100.0,
            electrical=99.0
        ),
        overall_health_score=98.5,
        active_fault=FaultType.NONE,
        fault_severity=0.0,
        status="normal",
        alerts=[
            DiagnosticAlert(
                alert_id="ALT-001",
                timestamp=1700000000.0,
                severity="info",
                candidate_fault="Nominal Operations",
                confidence_pct=99.0,
                contributing_signals=["rpm", "cht"],
                evidence_summary="All parameters within limits",
                recommendation="Continue normal operation"
            )
        ],
        rul=RULEstimate(
            rul_hours=1150.0,
            degradation_rate_pct_per_hr=0.04,
            confidence_lower_hr=1050.0,
            confidence_upper_hr=1250.0,
            primary_degradation_subsystem="nominal",
            assumptions=["standard cruise"]
        )
    )

    # 1. Convert to DB model
    db_record = TelemetryRecordModel.from_digital_twin_state(state)
    assert db_record.engine_id == "TEST-ENG-01"
    assert db_record.mission_id == "TEST-MIS-99"
    assert db_record.rpm == 4800.0
    assert db_record.cht_c == 165.0
    assert db_record.overall_health_score == 98.5
    assert db_record.mahalanobis_distance == 0.82

    # 2. Insert into database
    with temp_db_manager.get_session() as session:
        session.add(db_record)

    # 3. Read back from database
    with temp_db_manager.get_session() as session:
        queried = session.query(TelemetryRecordModel).filter_by(engine_id="TEST-ENG-01").first()
        assert queried is not None
        reconstructed = queried.to_digital_twin_state()
        assert reconstructed.engine_id == state.engine_id
        assert reconstructed.observed.rpm == state.observed.rpm
        assert reconstructed.overall_health_score == state.overall_health_score
        assert reconstructed.status == state.status
        assert len(reconstructed.alerts) == 1
        assert reconstructed.alerts[0].alert_id == "ALT-001"
        assert reconstructed.rul.rul_hours == 1150.0


def test_batch_insertion(temp_db_manager):
    """Verifies that repository batch insertion writes all records efficiently."""
    repo = TelemetryRepository(temp_db_manager)
    mission_svc = MissionService()

    # Generate 30 frames
    frames = [mission_svc.step_simulation() for _ in range(30)]
    written = repo.insert_batch(frames)
    assert written == 30

    # Query back
    history = repo.query_history(limit=50)
    assert len(history) == 30
    assert repo.count_records() == 30


def test_historical_retrieval_and_filtering(temp_db_manager):
    """Verifies historical queries with time-range, engine ID, mission ID, status, and pagination."""
    repo = TelemetryRepository(temp_db_manager)
    sim = MissionService()

    # Create frames with controlled properties
    records = []
    base_time = 1700000000.0
    for i in range(20):
        state = sim.step_simulation()
        state.timestamp = base_time + (i * 10)  # 0s, 10s, 20s... 190s
        state.engine_id = "ENG-ALPHA" if i < 10 else "ENG-BETA"
        state.mission_id = "MIS-101" if i < 15 else "MIS-202"
        state.status = "warning" if i % 5 == 0 else "normal"
        records.append(state)

    repo.insert_batch(records)

    # 1. Time range filter
    time_filtered = repo.query_history(
        start_time=base_time + 30,  # 30s
        end_time=base_time + 80,    # 80s
    )
    assert len(time_filtered) == 6  # 30, 40, 50, 60, 70, 80

    # 2. Engine ID filter
    alpha_records = repo.query_history(engine_id="ENG-ALPHA")
    assert len(alpha_records) == 10
    assert all(r.engine_id == "ENG-ALPHA" for r in alpha_records)

    # 3. Mission ID filter
    mis_202 = repo.query_history(mission_id="MIS-202")
    assert len(mis_202) == 5

    # 4. Status filter
    warning_records = repo.query_history(status="warning")
    assert len(warning_records) == 4

    # 5. Pagination
    paged = repo.query_history(limit=5, offset=5)
    assert len(paged) == 5
    assert paged[0].timestamp == base_time + 50


@pytest.mark.asyncio
async def test_persistence_queue_and_batch_writer(temp_db_manager):
    """Verifies that TelemetryBatchWriter consumes from queue and flushes on batch size and timeout."""
    writer = TelemetryBatchWriter(
        db_manager=temp_db_manager,
        batch_size=5,
        flush_interval=0.2,
        max_queue_size=100
    )
    await writer.start()

    mission_svc = MissionService()

    # Enqueue 5 frames (should trigger batch_size flush)
    for _ in range(5):
        state = mission_svc.step_simulation()
        writer.enqueue_state(state)

    # Give worker brief moment to execute batch
    await asyncio.sleep(0.15)
    assert writer.total_written == 5

    # Enqueue 3 frames (less than batch_size=5, should trigger timer flush)
    for _ in range(3):
        state = mission_svc.step_simulation()
        writer.enqueue_state(state)

    await asyncio.sleep(0.35)
    assert writer.total_written == 8

    await writer.stop()


def test_queue_overflow_reliability():
    """Verifies that bounded queue drops oldest frames without throwing exception when saturated."""
    writer = TelemetryBatchWriter(
        max_queue_size=10,
        batch_size=50,
        flush_interval=10.0
    )
    mission_svc = MissionService()

    # Enqueue 25 items without running background worker
    for _ in range(25):
        state = mission_svc.step_simulation()
        success = writer.enqueue_state(state)
        assert success is True

    # Max capacity is 10, 15 items should have been dropped
    assert writer.queue.qsize() == 10
    assert writer.total_dropped == 15
    assert writer.total_enqueued == 25


@pytest.mark.asyncio
async def test_database_failure_and_retry_resilience():
    """Verifies that batch writer handles database failure gracefully without affecting simulation loop."""
    broken_manager = DatabaseManager(database_url="sqlite:////non_existent_folder_xyz_123/unreachable.db")
    writer = TelemetryBatchWriter(
        db_manager=broken_manager,
        batch_size=5,
        flush_interval=0.1,
        retry_interval=0.1
    )
    mission_svc = MissionService(batch_writer=writer)

    await writer.start()

    # Simulation loop should run completely unimpeded
    for _ in range(10):
        state = mission_svc.step_simulation()
        assert state is not None

    # Ring buffer should work normally
    assert len(mission_svc.telemetry_history) == 10

    # Wait for batch writer to encounter failure and enter retry loop
    await asyncio.sleep(0.35)
    assert writer.total_retries > 0
    assert writer.last_error is not None

    await writer.stop()


def test_telemetry_persistence_after_backend_restart(temp_db_manager):
    """
    Verifies that telemetry saved to persistent database remains available
    when the backend restarts with a fresh, empty in-memory ring buffer.
    """
    repo = TelemetryRepository(temp_db_manager)
    sim_1 = MissionService(repository=repo)

    # Backend Session 1: Produce 15 frames and write to database
    frames = [sim_1.step_simulation() for _ in range(15)]
    repo.insert_batch(frames)
    assert len(sim_1.telemetry_history) == 15

    # Backend Session 2 (Simulated Restart):
    # Brand new MissionService instance with empty in-memory ring buffer
    sim_2 = MissionService(repository=repo)
    assert len(sim_2.telemetry_history) == 0  # Ring buffer is empty after restart

    # Retrieve history from persistent database
    recovered_history = sim_2.get_history(limit=50, source="auto")
    assert len(recovered_history) == 15
    assert recovered_history[0].observed.rpm == frames[0].observed.rpm
    assert recovered_history[-1].observed.rpm == frames[-1].observed.rpm

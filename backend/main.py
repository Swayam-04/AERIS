import asyncio
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import json
from backend.schemas.telemetry import (
    DigitalTwinState,
    FaultInjectionRequest,
    FaultType,
    MissionPhase,
    UAVSummary,
    FleetSummaryResponse,
    AircraftCoordinates
)
from backend.services.mission_service import MissionService
from backend.database.connection import get_db_manager
from backend.database.batch_writer import TelemetryBatchWriter
from backend.database.repository import TelemetryRepository


db_manager = get_db_manager()
batch_writer = TelemetryBatchWriter(db_manager=db_manager)
telemetry_repo = TelemetryRepository(db_manager=db_manager)
mission_service = MissionService(batch_writer=batch_writer, repository=telemetry_repo)

bg_task = None


async def live_simulation_loop():
    """Continuous background loop running simulation for all fleet UAVs, updating ring buffers, persistence, and broadcasting."""
    while True:
        try:
            if mission_service.is_running:
                state = mission_service.step_simulation()
                await mission_service.broadcast_state(state)
            await asyncio.sleep(1.0 / max(0.1, mission_service.simulation_speed))
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in simulation loop: {e}")
            await asyncio.sleep(1.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global bg_task
    # Startup: initialize database tables/hypertables and start persistence batch worker
    db_manager.initialize()
    await batch_writer.start()

    # Pre-populate initial telemetry states for all fleet aircraft
    for _ in range(30):
        mission_service.step_simulation()
    
    bg_task = asyncio.create_task(live_simulation_loop())
    yield
    # Shutdown: cancel simulation and flush remaining telemetry to database
    if bg_task:
        bg_task.cancel()
    await batch_writer.stop()


app = FastAPI(
    title="AeroTwin Digital Twin Engine & Multi-UAV Fleet Management API",
    description="SIH 26054 — Real-time telemetry, physics electrical baseline, multi-UAV digital twin fleet, fault diagnosis, RUL estimation, and PostgreSQL/TimescaleDB persistent storage.",
    version="2.2.0",
    lifespan=lifespan
)

# Enable CORS for local React development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def api_health():
    db_healthy = db_manager.is_healthy()
    return {
        "status": "healthy",
        "service": "AeroTwin Multi-UAV Backend API",
        "fleet_size": len(mission_service.fleet),
        "active_uav_id": mission_service.active_uav_id,
        "active_connections": len(mission_service.active_connections),
        "history_count": len(mission_service.telemetry_history),
        "database": {
            "connected": db_healthy,
            "timescaledb_enabled": db_manager.timescaledb_enabled if db_healthy else False,
            "queue_depth": batch_writer.queue.qsize(),
            "total_persisted": batch_writer.total_written
        }
    }


@app.get("/api/database/status")
def get_database_status():
    """Returns detailed status of PostgreSQL/TimescaleDB connectivity and batch persistence metrics."""
    db_status = db_manager.get_status()
    writer_status = batch_writer.get_status()
    return {
        "status": "healthy" if db_status["connected"] else "degraded",
        "database": db_status,
        "batch_writer": writer_status,
        "ring_buffer_count": len(mission_service.telemetry_history)
    }


# ==========================================
# MULTI-UAV FLEET MANAGEMENT ENDPOINTS
# ==========================================

@app.get("/api/fleet", response_model=FleetSummaryResponse)
@app.get("/api/fleet/summary", response_model=FleetSummaryResponse)
def get_fleet_summary():
    """Returns real-time status summary for all UAV digital twins across the fleet squadron."""
    return mission_service.get_fleet_response()


@app.get("/api/fleet/active")
def get_active_uav():
    """Returns the currently active focus UAV identifier and full state."""
    active_id = mission_service.active_uav_id
    state = mission_service.get_uav_state(active_id)
    return {
        "active_uav_id": active_id,
        "state": state
    }


@app.post("/api/fleet/select/{uav_id}", response_model=DigitalTwinState)
@app.post("/api/fleet/active", response_model=DigitalTwinState)
def select_active_uav(uav_id: str):
    """Sets the active focused UAV for all console telemetry and 3D visualizers."""
    if not mission_service.set_active_uav(uav_id):
        raise HTTPException(status_code=404, detail=f"UAV {uav_id} not found in fleet squadron")
    state = mission_service.get_uav_state(uav_id)
    if not state:
        state = mission_service.step_simulation()
    return state


@app.get("/api/fleet/{uav_id}/state", response_model=DigitalTwinState)
def get_fleet_uav_state(uav_id: str):
    """Returns detailed digital twin state for the specified UAV."""
    state = mission_service.get_uav_state(uav_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"UAV {uav_id} not found in fleet squadron")
    return state


@app.get("/api/fleet/{uav_id}/history", response_model=List[DigitalTwinState])
def get_fleet_uav_history(
    uav_id: str,
    limit: int = Query(300, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    source: str = Query("auto")
):
    """Retrieves telemetry history for a specific fleet UAV."""
    return mission_service.get_history(uav_id=uav_id, limit=limit, start_idx=offset, source=source)


@app.get("/api/fleet/{uav_id}/3d-state")
def get_fleet_uav_3d_state(uav_id: str):
    """Returns 3D viewer state for a specific fleet UAV."""
    return _build_3d_state(uav_id)


@app.post("/api/fleet/{uav_id}/fault", response_model=DigitalTwinState)
def inject_fleet_uav_fault(uav_id: str, req: FaultInjectionRequest):
    """Injects a controlled fault scenario into the specified fleet UAV."""
    req.uav_id = uav_id
    return mission_service.inject_fault(req)


@app.post("/api/fleet/{uav_id}/fault/clear", response_model=DigitalTwinState)
def clear_fleet_uav_fault(uav_id: str):
    """Clears active fault from the specified fleet UAV."""
    return mission_service.clear_fault(uav_id=uav_id)


@app.post("/api/fleet/{uav_id}/phase", response_model=DigitalTwinState)
def set_fleet_uav_phase(uav_id: str, phase: MissionPhase):
    """Transitions the specified fleet UAV into a new flight phase."""
    return mission_service.set_phase(phase=phase, uav_id=uav_id)


@app.post("/api/fleet/{uav_id}/reset", response_model=DigitalTwinState)
def reset_fleet_uav(uav_id: str, seed: int = 42):
    """Resets the simulation telemetry and state for the specified fleet UAV."""
    mission_service.reset_mission(seed=seed, uav_id=uav_id)
    return mission_service.get_uav_state(uav_id) or mission_service.step_simulation()


# ==========================================
# TELEMETRY & OPERATIONS ENDPOINTS
# ==========================================

@app.get("/api/telemetry/live", response_model=DigitalTwinState)
def get_live_telemetry(uav_id: Optional[str] = Query(None, description="Optional UAV identifier")):
    state = mission_service.get_uav_state(uav_id)
    if not state:
        return mission_service.step_simulation()
    return state


@app.get("/api/telemetry/history", response_model=List[DigitalTwinState])
def get_telemetry_history(
    uav_id: Optional[str] = Query(None, description="Filter by UAV identifier"),
    start_time: Optional[float] = Query(None, description="Start timestamp (POSIX seconds)"),
    end_time: Optional[float] = Query(None, description="End timestamp (POSIX seconds)"),
    engine_id: Optional[str] = Query(None, description="Filter by engine identifier"),
    mission_id: Optional[str] = Query(None, description="Filter by mission identifier"),
    mission_phase: Optional[str] = Query(None, description="Filter by mission phase"),
    status: Optional[str] = Query(None, description="Filter by status (normal, warning, critical)"),
    limit: int = Query(300, ge=1, le=5000, description="Max number of records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    source: str = Query("auto", description="Source of history: 'auto', 'db', or 'memory'")
):
    """
    Retrieves historical telemetry records with time-range, engine, flight, mission, and status filtering.
    Leverages PostgreSQL/TimescaleDB when available, with automatic fallback to ring buffer.
    """
    return mission_service.get_history(
        start_idx=offset,
        limit=limit,
        start_time=start_time,
        end_time=end_time,
        uav_id=uav_id,
        engine_id=engine_id,
        mission_id=mission_id,
        mission_phase=mission_phase,
        status=status,
        source=source
    )


@app.get("/api/telemetry/stats")
def get_telemetry_statistics():
    """Returns summary statistics for persisted telemetry records."""
    try:
        return telemetry_repo.get_stats()
    except Exception as e:
        return {
            "total_records": len(mission_service.telemetry_history),
            "source": "in_memory_ring_buffer",
            "error": str(e)
        }


@app.post("/api/mission/fault", response_model=DigitalTwinState)
def inject_fault(req: FaultInjectionRequest):
    return mission_service.inject_fault(req)


@app.post("/api/mission/fault/clear", response_model=DigitalTwinState)
def clear_fault(uav_id: Optional[str] = Query(None)):
    return mission_service.clear_fault(uav_id=uav_id)


@app.post("/api/mission/phase", response_model=DigitalTwinState)
def set_mission_phase(phase: MissionPhase, uav_id: Optional[str] = Query(None)):
    return mission_service.set_phase(phase=phase, uav_id=uav_id)


@app.post("/api/mission/reset", response_model=DigitalTwinState)
def reset_mission(seed: int = 42, uav_id: Optional[str] = Query(None)):
    mission_service.reset_mission(seed=seed, uav_id=uav_id)
    return mission_service.get_uav_state(uav_id) or mission_service.step_simulation()


@app.post("/api/mission/demo/chain", response_model=DigitalTwinState)
def run_electrical_demo_chain(uav_id: Optional[str] = Query(None)):
    """
    Deterministic demonstration scenario:
    NORMAL -> Alternator degradation -> Battery compensates -> Battery discharge increases ->
    SOC decreases -> Voltage becomes unstable -> Electrical Health decreases -> Alert generated -> Maintenance advisory generated
    """
    req = FaultInjectionRequest(
        uav_id=uav_id,
        fault_type=FaultType.ALTERNATOR_OUTPUT_DEGRADATION,
        severity=0.85,
        duration_s=180.0
    )
    return mission_service.inject_fault(req)


class ControlSpeedRequest(BaseModel):
    speed: float = 1.0


@app.post("/api/mission/speed")
def set_simulation_speed(req: ControlSpeedRequest):
    mission_service.simulation_speed = max(0.1, min(10.0, req.speed))
    return {"speed": mission_service.simulation_speed}


class WhatIfRequest(BaseModel):
    uav_id: Optional[str] = None
    fault_type: FaultType = FaultType.INJECTOR_ABNORMALITY
    severity: float = 0.6
    fault_start_sec: float = 90.0
    duration_sec: float = 300.0


@app.post("/api/whatif/simulate")
def run_what_if_scenario(req: WhatIfRequest):
    baseline = mission_service.run_what_if_scenario(
        fault_type=FaultType.NONE,
        severity=0.0,
        fault_start_sec=0.0,
        duration_sec=req.duration_sec,
        uav_id=req.uav_id
    )
    degraded = mission_service.run_what_if_scenario(
        fault_type=req.fault_type,
        severity=req.severity,
        fault_start_sec=req.fault_start_sec,
        duration_sec=req.duration_sec,
        uav_id=req.uav_id
    )

    return {
        "duration_sec": req.duration_sec,
        "fault_type": req.fault_type,
        "severity": req.severity,
        "fault_start_sec": req.fault_start_sec,
        "baseline": [s.model_dump() for s in baseline],
        "degraded": [s.model_dump() for s in degraded]
    }


def _build_3d_state(uav_id: Optional[str] = None) -> dict:
    state = mission_service.get_uav_state(uav_id)
    if not state:
        state = mission_service.step_simulation()

    elec = state.observed.electrical
    return {
        "aircraftId": state.aircraft_id,
        "callsign": state.callsign,
        "modelName": state.model_name,
        "engineHealth": state.overall_health_score,
        "engineStatus": state.status,
        "missionPhase": state.mission_phase,
        "activeFault": state.active_fault,
        "activeAlert": state.alerts[0].candidate_fault if state.alerts else "None",
        "faultSeverity": state.fault_severity,
        "rpm": state.observed.rpm,
        "cht": state.observed.cht_c,
        "egt": state.observed.egt_c,
        "oilPressure": state.observed.oil_pressure_psi,
        "vibration": state.observed.vibration_g,
        "residualDistance": state.residuals.mahalanobis_distance,
        # Electrical Subsystem specific parameters
        "electricalHealth": state.subsystem_health.electrical,
        "busVoltage": state.observed.battery_volts,
        "batterySoc": elec.battery.state_of_charge if elec else 92.0,
        "batteryCurrent": elec.battery.current if elec else 0.0,
        "batteryTemp": elec.battery.temperature if elec else 22.0,
        "batteryStatus": elec.battery.status if elec else "NORMAL",
        "alternatorStatus": elec.alternator.status if elec else "NORMAL",
        "alternatorPower": elec.alternator.output_power_w if elec else 840.0
    }


@app.get("/api/3d/state")
def get_3d_uav_state(uav_id: Optional[str] = Query(None)):
    """Returns state for the Three.js 3D UAV model component with electrical subsystem targets."""
    return _build_3d_state(uav_id)


@app.get("/api/engine/fault-mapping")
def get_engine_fault_mapping():
    """
    Returns complete physical component registry and fault-to-location mapping
    for the Lycoming O-320 horizontally opposed 4-cylinder aero engine.
    """
    return {
        "engine_model": "Lycoming O-320-D2J",
        "type": "Four-Cylinder, Air-Cooled, Horizontally Opposed Aero-Piston Engine",
        "displacement_cc": 5240,
        "rated_power_hp": 150,
        "cylinders": [
            {"id": "cylinder_1", "name": "Cylinder #1", "bank": "Starboard (Right)", "position": "Forward", "bore_mm": 130.2, "stroke_mm": 98.4},
            {"id": "cylinder_2", "name": "Cylinder #2", "bank": "Port (Left)", "position": "Forward", "bore_mm": 130.2, "stroke_mm": 98.4},
            {"id": "cylinder_3", "name": "Cylinder #3", "bank": "Starboard (Right)", "position": "Aft", "bore_mm": 130.2, "stroke_mm": 98.4},
            {"id": "cylinder_4", "name": "Cylinder #4", "bank": "Port (Left)", "position": "Aft", "bore_mm": 130.2, "stroke_mm": 98.4}
        ],
        "fault_mappings": {
            "misfire": {
                "target_component": "cylinder_2",
                "component_name": "Cylinder #2 Combustion Chamber",
                "subsystem": "combustion",
                "physical_location": "Left Bank, Forward Port Cylinder (Cyl #2)",
                "symptoms": ["RPM drop", "Elevated 1.8g harmonic vibration", "Exhaust temperature cooling"]
            },
            "injector_abnormality": {
                "target_component": "fuel_injector_2",
                "component_name": "Fuel Injector #2",
                "subsystem": "fuel",
                "physical_location": "Left Bank, Cylinder #2 Intake Runner Port",
                "symptoms": ["Elevated EGT (+145°C)", "Reduced fuel flow", "Localized lean combustion"]
            },
            "oil_pressure_loss": {
                "target_component": "oil_pump",
                "component_name": "Oil Pressure Pump & Relief Gallery",
                "subsystem": "lubrication",
                "physical_location": "Lower Crankcase Accessory Sump & Main Gallery",
                "symptoms": ["Oil pressure drop below 28 PSI", "Oil temperature rise", "Bearing wear risk"]
            },
            "overheating": {
                "target_component": "cylinder_head_3",
                "component_name": "Cylinder Head #3 & Cooling Fins",
                "subsystem": "cooling",
                "physical_location": "Right Bank, Aft Starboard Head & Baffle Duct",
                "symptoms": ["CHT exceeding 230°C", "Cooling airflow starvation", "Thermal gradient"]
            },
            "vibration_spike": {
                "target_component": "crankshaft_prop_interface",
                "component_name": "Crankshaft Front Journal & Propeller Flange",
                "subsystem": "propulsion",
                "physical_location": "Forward Crankcase Nose Section & Propeller Flange",
                "symptoms": ["Rotational harmonic imbalance", "Propeller drive fatigue", "High g-force vibration"]
            },
            "sensor_drift": {
                "target_component": "sensor_cht_3",
                "component_name": "CHT Thermocouple Sensor #3",
                "subsystem": "sensors",
                "physical_location": "Cylinder #3 Spark Plug Gasket Well",
                "symptoms": ["Calibration offset +45°C", "Engine block physically nominal", "Discrepancy vs model"]
            }
        }
    }


@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await mission_service.connect_websocket(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    payload = json.loads(data)
                    if payload.get("action") in ["select_uav", "switch_uav"]:
                        target_uav = payload.get("uav_id")
                        if target_uav and mission_service.set_active_uav(target_uav):
                            state = mission_service.get_uav_state(target_uav)
                            if state:
                                await websocket.send_json(state.model_dump())
                except Exception:
                    pass
    except WebSocketDisconnect:
        mission_service.disconnect_websocket(websocket)
    except Exception:
        mission_service.disconnect_websocket(websocket)


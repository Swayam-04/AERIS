import asyncio
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.schemas.telemetry import (
    DigitalTwinState,
    FaultInjectionRequest,
    FaultType,
    MissionPhase
)
from backend.services.mission_service import MissionService


mission_service = MissionService()
bg_task = None


async def live_simulation_loop():
    """Continuous background loop running simulation and broadcasting live state."""
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
    # Startup: populate initial telemetry states and start background ticker
    for _ in range(30):
        mission_service.step_simulation()
    bg_task = asyncio.create_task(live_simulation_loop())
    yield
    # Shutdown
    if bg_task:
        bg_task.cancel()


app = FastAPI(
    title="AeroTwin Digital Twin Engine Monitoring API",
    description="SIH 26054 — Real-time telemetry, physics baseline models, digital twin, fault diagnosis, and RUL estimation.",
    version="1.0.0",
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
    return {
        "status": "healthy",
        "service": "AeroTwin Backend API",
        "active_connections": len(mission_service.active_connections),
        "history_count": len(mission_service.telemetry_history)
    }


@app.get("/api/telemetry/live", response_model=DigitalTwinState)
def get_live_telemetry():
    if not mission_service.telemetry_history:
        return mission_service.step_simulation()
    return mission_service.telemetry_history[-1]


@app.get("/api/telemetry/history", response_model=List[DigitalTwinState])
def get_telemetry_history(limit: int = 300):
    return mission_service.get_history(limit=limit)


@app.post("/api/mission/fault", response_model=DigitalTwinState)
def inject_fault(req: FaultInjectionRequest):
    return mission_service.inject_fault(req)


@app.post("/api/mission/fault/clear", response_model=DigitalTwinState)
def clear_fault():
    return mission_service.clear_fault()


@app.post("/api/mission/phase", response_model=DigitalTwinState)
def set_mission_phase(phase: MissionPhase):
    return mission_service.set_phase(phase)


@app.post("/api/mission/reset", response_model=DigitalTwinState)
def reset_mission(seed: int = 42):
    mission_service.reset_mission(seed)
    return mission_service.step_simulation()


class ControlSpeedRequest(BaseModel):
    speed: float = 1.0


@app.post("/api/mission/speed")
def set_simulation_speed(req: ControlSpeedRequest):
    mission_service.simulation_speed = max(0.1, min(10.0, req.speed))
    return {"speed": mission_service.simulation_speed}


class WhatIfRequest(BaseModel):
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
        duration_sec=req.duration_sec
    )
    degraded = mission_service.run_what_if_scenario(
        fault_type=req.fault_type,
        severity=req.severity,
        fault_start_sec=req.fault_start_sec,
        duration_sec=req.duration_sec
    )

    return {
        "duration_sec": req.duration_sec,
        "fault_type": req.fault_type,
        "severity": req.severity,
        "fault_start_sec": req.fault_start_sec,
        "baseline": [s.model_dump() for s in baseline],
        "degraded": [s.model_dump() for s in degraded]
    }


@app.get("/api/3d/state")
def get_3d_uav_state():
    """Returns simplified JSON state for the Three.js 3D UAV model component."""
    if not mission_service.telemetry_history:
        state = mission_service.step_simulation()
    else:
        state = mission_service.telemetry_history[-1]

    return {
        "engineHealth": state.overall_health_score,
        "engineStatus": state.status,
        "missionPhase": state.mission_phase,
        "activeFault": state.active_fault,
        "activeAlert": state.alerts[0].candidate_fault if state.alerts else "None",
        "rpm": state.observed.rpm,
        "cht": state.observed.cht_c,
        "egt": state.observed.egt_c,
        "oilPressure": state.observed.oil_pressure_psi,
        "vibration": state.observed.vibration_g,
        "residualDistance": state.residuals.mahalanobis_distance
    }


@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await mission_service.connect_websocket(websocket)
    try:
        while True:
            # Keep WebSocket connection alive and process incoming control pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        mission_service.disconnect_websocket(websocket)
    except Exception:
        mission_service.disconnect_websocket(websocket)

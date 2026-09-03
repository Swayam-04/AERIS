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
    title="AeroTwin Digital Twin Engine & Electrical Subsystem API",
    description="SIH 26054 — Real-time telemetry, physics electrical baseline, digital twin, fault diagnosis, and RUL estimation.",
    version="2.0.0",
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


@app.post("/api/mission/demo/chain", response_model=DigitalTwinState)
def run_electrical_demo_chain():
    """
    Deterministic demonstration scenario:
    NORMAL -> Alternator degradation -> Battery compensates -> Battery discharge increases ->
    SOC decreases -> Voltage becomes unstable -> Electrical Health decreases -> Alert generated -> Maintenance advisory generated
    """
    req = FaultInjectionRequest(
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
    """Returns state for the Three.js 3D UAV model component with electrical subsystem targets."""
    if not mission_service.telemetry_history:
        state = mission_service.step_simulation()
    else:
        state = mission_service.telemetry_history[-1]

    elec = state.observed.electrical
    return {
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
    except WebSocketDisconnect:
        mission_service.disconnect_websocket(websocket)
    except Exception:
        mission_service.disconnect_websocket(websocket)

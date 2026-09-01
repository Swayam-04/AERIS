import asyncio
from typing import Dict, List, Optional, Set
from fastapi import WebSocket
from backend.schemas.telemetry import (
    DigitalTwinState,
    TelemetryRecord,
    MissionPhase,
    FaultType,
    FaultInjectionRequest
)
from backend.simulator.engine_sim import EngineSimulator
from backend.digital_twin.twin_service import DigitalTwinService


class MissionService:
    """
    Mission Lifecycle Controller & WebSockets Broadcast Gateway.
    Manages live simulation, telemetry buffer retention for replay, and what-if isolation.
    """

    def __init__(self):
        self.simulator = EngineSimulator()
        self.twin_service = DigitalTwinService()
        
        # State
        self.is_running: bool = True
        self.simulation_speed: float = 1.0  # Multiplier
        self.telemetry_history: List[DigitalTwinState] = []
        self.max_history_records: int = 3600  # 1 hour at 1Hz
        
        # Active WebSockets
        self.active_connections: Set[WebSocket] = set()

    async def connect_websocket(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Send current latest state immediately on connection
        if self.telemetry_history:
            latest = self.telemetry_history[-1]
            await websocket.send_json(latest.model_dump())

    def disconnect_websocket(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast_state(self, state: DigitalTwinState):
        if not self.active_connections:
            return
        data = state.model_dump()
        disconnected = set()
        for ws in self.active_connections:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self.active_connections.discard(ws)

    def step_simulation(self) -> DigitalTwinState:
        """
        Advance simulator by 1 second, compute twin state, append to history.
        """
        observed = self.simulator.step(dt_seconds=1.0)
        twin_state = self.twin_service.update_twin(
            observed=observed,
            active_fault=self.simulator.active_fault,
            fault_severity=self.simulator.fault_severity
        )
        
        self.telemetry_history.append(twin_state)
        if len(self.telemetry_history) > self.max_history_records:
            self.telemetry_history.pop(0)

        return twin_state

    def reset_mission(self, seed: int = 42):
        self.simulator.reset(seed)
        self.telemetry_history.clear()

    def inject_fault(self, req: FaultInjectionRequest) -> DigitalTwinState:
        self.simulator.inject_fault(req.fault_type, req.severity)
        return self.step_simulation()

    def clear_fault(self) -> DigitalTwinState:
        self.simulator.clear_fault()
        return self.step_simulation()

    def set_phase(self, phase: MissionPhase) -> DigitalTwinState:
        self.simulator.set_phase(phase)
        return self.step_simulation()

    def get_history(self, start_idx: int = 0, limit: int = 500) -> List[DigitalTwinState]:
        return self.telemetry_history[start_idx:start_idx + limit]

    def run_what_if_scenario(
        self,
        fault_type: FaultType,
        severity: float,
        fault_start_sec: float,
        duration_sec: float = 300.0,
        seed: int = 42
    ) -> List[DigitalTwinState]:
        """
        Run isolated comparative scenario from 0 to duration_sec.
        Returns full DigitalTwinState trajectory without mutating active simulation state.
        """
        sim = EngineSimulator(seed=seed)
        twin_svc = DigitalTwinService()
        results: List[DigitalTwinState] = []

        # Default mission phase timeline
        phases = [
            (0, 30, MissionPhase.TAKEOFF),
            (30, 90, MissionPhase.CLIMB),
            (90, 210, MissionPhase.CRUISE),
            (210, 270, MissionPhase.LOITER),
            (270, 300, MissionPhase.LANDING),
        ]

        for sec in range(int(duration_sec)):
            # Set phase based on timeline
            for start, end, phase in phases:
                if start <= sec < end:
                    sim.set_phase(phase)
                    break

            # Inject fault at specified time
            if sec == int(fault_start_sec) and fault_type != FaultType.NONE:
                sim.inject_fault(fault_type, severity)

            obs = sim.step(dt_seconds=1.0)
            state = twin_svc.update_twin(obs, sim.active_fault, sim.fault_severity)
            results.append(state)

        return results

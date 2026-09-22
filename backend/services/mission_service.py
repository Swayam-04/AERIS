import asyncio
import logging
from typing import Dict, List, Optional, Set
from fastapi import WebSocket

from backend.schemas.telemetry import (
    DigitalTwinState,
    TelemetryRecord,
    MissionPhase,
    FaultType,
    FaultInjectionRequest,
    UAVSummary,
    FleetSummaryResponse,
    AircraftCoordinates
)
from backend.simulator.engine_sim import EngineSimulator
from backend.digital_twin.twin_service import DigitalTwinService
from backend.database.batch_writer import TelemetryBatchWriter
from backend.database.repository import TelemetryRepository

logger = logging.getLogger("aeris.mission")


class UAVTwinInstance:
    """
    Encapsulates a single UAV digital twin instance: simulator, state synchronizer,
    and individual in-memory historical telemetry ring buffer.
    """
    def __init__(
        self,
        aircraft_id: str,
        callsign: str,
        model_name: str,
        engine_id: str,
        engine_model: str,
        mission_id: str,
        mission_type: str,
        initial_phase: MissionPhase,
        base_lat: float,
        base_lon: float,
        sector: str,
        base_speed: float,
        base_heading: float,
        seed: int = 42,
        max_history_records: int = 3600
    ):
        self.aircraft_id = aircraft_id
        self.callsign = callsign
        self.model_name = model_name
        self.engine_id = engine_id
        self.engine_model = engine_model
        self.mission_id = mission_id
        self.mission_type = mission_type
        
        self.simulator = EngineSimulator(
            aircraft_id=aircraft_id,
            callsign=callsign,
            model_name=model_name,
            engine_id=engine_id,
            engine_model=engine_model,
            mission_id=mission_id,
            mission_type=mission_type,
            initial_phase=initial_phase,
            base_lat=base_lat,
            base_lon=base_lon,
            sector=sector,
            base_speed=base_speed,
            base_heading=base_heading,
            seed=seed
        )
        self.twin_service = DigitalTwinService()
        self.telemetry_history: List[DigitalTwinState] = []
        self.max_history_records = max_history_records
        self.latest_state: Optional[DigitalTwinState] = None

    def step(self) -> DigitalTwinState:
        observed = self.simulator.step(dt_seconds=1.0)
        twin_state = self.twin_service.update_twin(
            observed=observed,
            active_fault=self.simulator.active_fault,
            fault_severity=self.simulator.fault_severity
        )
        self.latest_state = twin_state
        self.telemetry_history.append(twin_state)
        if len(self.telemetry_history) > self.max_history_records:
            self.telemetry_history.pop(0)
        return twin_state

    def reset(self, seed: Optional[int] = None):
        self.simulator.reset(seed)
        self.telemetry_history.clear()
        self.latest_state = None

    def to_summary(self) -> UAVSummary:
        state = self.latest_state
        if state:
            return UAVSummary(
                aircraft_id=self.aircraft_id,
                callsign=self.callsign,
                model_name=self.model_name,
                engine_id=self.engine_id,
                engine_model=self.engine_model,
                mission_id=self.mission_id,
                mission_type=self.mission_type,
                mission_phase=state.mission_phase,
                overall_health_score=state.overall_health_score,
                status=state.status,
                active_fault=state.active_fault,
                fault_severity=state.fault_severity,
                alerts_count=len(state.alerts),
                altitude_ft=state.observed.altitude_ft,
                rpm=state.observed.rpm,
                battery_soc=state.observed.electrical.battery.state_of_charge if state.observed.electrical else 92.0,
                bus_voltage=state.observed.battery_volts,
                fuel_flow_lph=state.observed.fuel_flow_lph,
                rul_hours=state.rul.rul_hours if state.rul else 1200.0,
                coordinates=state.coordinates
            )
        return UAVSummary(
            aircraft_id=self.aircraft_id,
            callsign=self.callsign,
            model_name=self.model_name,
            engine_id=self.engine_id,
            engine_model=self.engine_model,
            mission_id=self.mission_id,
            mission_type=self.mission_type,
            mission_phase=self.simulator.current_phase,
            overall_health_score=100.0,
            status="normal",
            active_fault=self.simulator.active_fault,
            fault_severity=self.simulator.fault_severity,
            alerts_count=0,
            altitude_ft=15000.0,
            rpm=2450.0,
            battery_soc=92.0,
            bus_voltage=28.2,
            fuel_flow_lph=24.5,
            rul_hours=1200.0,
            coordinates=AircraftCoordinates(
                latitude=self.simulator.base_lat,
                longitude=self.simulator.base_lon,
                altitude_ft=15000.0,
                heading_deg=self.simulator.heading_deg,
                speed_knots=self.simulator.speed_knots,
                sector=self.simulator.sector
            )
        )


class MissionService:
    """
    Multi-UAV Tactical Fleet Mission Lifecycle Controller & WebSockets Gateway.
    Manages concurrent digital twin instances across the DRDO UAV fleet,
    fast in-memory ring buffers per aircraft, active UAV switching, and PostgreSQL/TimescaleDB persistence.
    """

    def __init__(
        self,
        batch_writer: Optional[TelemetryBatchWriter] = None,
        repository: Optional[TelemetryRepository] = None
    ):
        # Database persistence integration
        self.batch_writer: Optional[TelemetryBatchWriter] = batch_writer
        self.repository: Optional[TelemetryRepository] = repository or (
            TelemetryRepository() if batch_writer is None else TelemetryRepository(batch_writer.db_manager)
        )

        # State
        self.is_running: bool = True
        self.simulation_speed: float = 1.0  # Multiplier
        self.active_connections: Set[WebSocket] = set()

        # Initialize Multi-UAV Squadron
        self.fleet: Dict[str, UAVTwinInstance] = {}
        self._init_fleet()
        self.active_uav_id: str = "UAV-RUST-01"

    def _init_fleet(self):
        """Initializes the 5 operational DRDO UAV fleet squadron instances."""
        configs = [
            {
                "aircraft_id": "UAV-RUST-01",
                "callsign": "Garuda-1",
                "model_name": "DRDO RUSTOM-II MALE",
                "engine_id": "UAV-ENG-26054",
                "engine_model": "Lycoming O-320-D2J",
                "mission_id": "MIS-ALPHA-01",
                "mission_type": "Border Surveillance Patrol",
                "initial_phase": MissionPhase.CRUISE,
                "base_lat": 26.9124,
                "base_lon": 70.9015,
                "sector": "Western Thar Border Sector",
                "base_speed": 120.0,
                "base_heading": 85.0,
                "seed": 42
            },
            {
                "aircraft_id": "UAV-RUST-02",
                "callsign": "Garuda-2",
                "model_name": "DRDO RUSTOM-I Tactical",
                "engine_id": "UAV-ENG-26055",
                "engine_model": "Rotax 914 Turbo",
                "mission_id": "MIS-BRAVO-02",
                "mission_type": "Forward Area Tactical Recon",
                "initial_phase": MissionPhase.LOITER,
                "base_lat": 27.4250,
                "base_lon": 71.8320,
                "sector": "Jaisalmer Air Defense Sector",
                "base_speed": 95.0,
                "base_heading": 140.0,
                "seed": 107
            },
            {
                "aircraft_id": "UAV-TAPAS-03",
                "callsign": "Tapas-3",
                "model_name": "DRDO TAPAS-BH-201 MALE",
                "engine_id": "UAV-ENG-30112",
                "engine_model": "Austro Engine AE300 Diesel Turbo",
                "mission_id": "MIS-CHARLIE-03",
                "mission_type": "Coastal Radar & EEZ Escort",
                "initial_phase": MissionPhase.CLIMB,
                "base_lat": 21.7051,
                "base_lon": 69.3456,
                "sector": "Gujarat Coastal EEZ Vector",
                "base_speed": 135.0,
                "base_heading": 210.0,
                "seed": 219
            },
            {
                "aircraft_id": "UAV-ABHYAS-04",
                "callsign": "Abhyas-4",
                "model_name": "DRDO ABHYAS Target / Recon",
                "engine_id": "UAV-ENG-40221",
                "engine_model": "Micro-Turbo Aero Gas Turbine",
                "mission_id": "MIS-DELTA-04",
                "mission_type": "Air Defense Tracking Sortie",
                "initial_phase": MissionPhase.TAKEOFF,
                "base_lat": 21.5034,
                "base_lon": 86.9234,
                "sector": "Chandipur Bay Test Range",
                "base_speed": 160.0,
                "base_heading": 45.0,
                "seed": 331
            },
            {
                "aircraft_id": "UAV-GHATAK-05",
                "callsign": "Ghatak-5",
                "model_name": "DRDO GHATAK UCAV Demonstrator",
                "engine_id": "UAV-ENG-50334",
                "engine_model": "Kaveri Hybrid DC Generator",
                "mission_id": "MIS-ECHO-05",
                "mission_type": "Stealth Vector Flight Demo",
                "initial_phase": MissionPhase.RETURN,
                "base_lat": 14.2810,
                "base_lon": 75.8234,
                "sector": "Chitradurga ATR Test Corridor",
                "base_speed": 190.0,
                "base_heading": 310.0,
                "seed": 554
            }
        ]

        for cfg in configs:
            self.fleet[cfg["aircraft_id"]] = UAVTwinInstance(**cfg)

    @property
    def simulator(self) -> EngineSimulator:
        """Backward-compatibility accessor for primary/active simulator."""
        return self.fleet[self.active_uav_id].simulator

    @property
    def twin_service(self) -> DigitalTwinService:
        """Backward-compatibility accessor for primary/active twin service."""
        return self.fleet[self.active_uav_id].twin_service

    @property
    def telemetry_history(self) -> List[DigitalTwinState]:
        """Backward-compatibility accessor for active UAV history."""
        return self.fleet[self.active_uav_id].telemetry_history

    def get_fleet_summary(self) -> List[UAVSummary]:
        """Returns summaries for all UAVs in the fleet squadron."""
        return [instance.to_summary() for instance in self.fleet.values()]

    def get_fleet_response(self) -> FleetSummaryResponse:
        summaries = self.get_fleet_summary()
        active_sorties = sum(1 for s in summaries if s.mission_phase not in [MissionPhase.LANDING])
        total_alerts = sum(s.alerts_count for s in summaries)
        avg_health = round(sum(s.overall_health_score for s in summaries) / max(1, len(summaries)), 1)
        return FleetSummaryResponse(
            fleet=summaries,
            active_uav_id=self.active_uav_id,
            total_airframes=len(summaries),
            active_sorties=active_sorties,
            average_health=avg_health,
            total_alerts=total_alerts
        )

    def set_active_uav(self, uav_id: str) -> bool:
        if uav_id in self.fleet:
            self.active_uav_id = uav_id
            return True
        return False

    def get_uav_state(self, uav_id: Optional[str] = None) -> Optional[DigitalTwinState]:
        target_id = uav_id or self.active_uav_id
        instance = self.fleet.get(target_id)
        if instance:
            if instance.latest_state is None:
                instance.step()
            return instance.latest_state
        return None

    def step_simulation(self) -> DigitalTwinState:
        """
        Advance all fleet simulators by 1 second, compute respective digital twin states,
        generate fleet-wide summary, append to individual ring buffers, and enqueue for DB persistence.
        Returns the DigitalTwinState for the active UAV.
        """
        # 1. Step all fleet aircraft
        fleet_states: Dict[str, DigitalTwinState] = {}
        for uav_id, instance in self.fleet.items():
            state = instance.step()
            fleet_states[uav_id] = state

        # 2. Build squadron fleet summary
        fleet_summaries = self.get_fleet_summary()

        # 3. Attach fleet summary to each aircraft's state & enqueue to batch writer
        for uav_id, state in fleet_states.items():
            state.fleet_summary = fleet_summaries
            if self.batch_writer:
                self.batch_writer.enqueue_state(state)

        # 4. Return the state of the currently active UAV
        active_state = fleet_states.get(self.active_uav_id)
        if not active_state:
            active_state = next(iter(fleet_states.values()))
        return active_state

    async def connect_websocket(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Send current active state with fleet summary immediately on connection
        active_instance = self.fleet.get(self.active_uav_id)
        if active_instance and active_instance.latest_state:
            await websocket.send_json(active_instance.latest_state.model_dump())
        elif self.fleet:
            latest = self.step_simulation()
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

    def reset_mission(self, seed: int = 42, uav_id: Optional[str] = None):
        if uav_id:
            if uav_id in self.fleet:
                self.fleet[uav_id].reset(seed)
        else:
            for inst in self.fleet.values():
                inst.reset(seed)

    def inject_fault(self, req: FaultInjectionRequest) -> DigitalTwinState:
        target_id = req.uav_id or self.active_uav_id
        instance = self.fleet.get(target_id)
        if not instance:
            instance = self.fleet[self.active_uav_id]
        instance.simulator.inject_fault(req.fault_type, req.severity)
        self.step_simulation()
        return self.get_uav_state(target_id) or self.step_simulation()

    def clear_fault(self, uav_id: Optional[str] = None) -> DigitalTwinState:
        target_id = uav_id or self.active_uav_id
        instance = self.fleet.get(target_id)
        if not instance:
            instance = self.fleet[self.active_uav_id]
        instance.simulator.clear_fault()
        self.step_simulation()
        return self.get_uav_state(target_id) or self.step_simulation()

    def set_phase(self, phase: MissionPhase, uav_id: Optional[str] = None) -> DigitalTwinState:
        target_id = uav_id or self.active_uav_id
        instance = self.fleet.get(target_id)
        if not instance:
            instance = self.fleet[self.active_uav_id]
        instance.simulator.set_phase(phase)
        self.step_simulation()
        return self.get_uav_state(target_id) or self.step_simulation()

    def get_history(
        self,
        start_idx: int = 0,
        limit: int = 500,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        uav_id: Optional[str] = None,
        engine_id: Optional[str] = None,
        mission_id: Optional[str] = None,
        mission_phase: Optional[str] = None,
        status: Optional[str] = None,
        source: str = "auto"
    ) -> List[DigitalTwinState]:
        """
        Retrieves historical telemetry for a specific UAV or active UAV.
        Leverages PostgreSQL/TimescaleDB with fallback to the aircraft's ring buffer.
        """
        target_uav_id = uav_id or self.active_uav_id

        # 1. Try querying persistent database
        if source in ("auto", "db") and self.repository:
            try:
                db_results = self.repository.query_history(
                    start_time=start_time,
                    end_time=end_time,
                    engine_id=engine_id or (self.fleet[target_uav_id].engine_id if target_uav_id in self.fleet else None),
                    mission_id=mission_id,
                    mission_phase=mission_phase,
                    status=status,
                    limit=limit,
                    offset=start_idx,
                    order_desc=False
                )
                if db_results or source == "db":
                    return db_results
            except Exception as e:
                logger.warning(f"Database query failed, falling back to ring buffer: {e}")
                if source == "db":
                    raise

        # 2. Fallback to in-memory ring buffer
        instance = self.fleet.get(target_uav_id)
        records = instance.telemetry_history if instance else self.telemetry_history

        # Apply filters in-memory if requested
        if start_time is not None:
            records = [r for r in records if r.timestamp >= start_time]
        if end_time is not None:
            records = [r for r in records if r.timestamp <= end_time]
        if engine_id:
            records = [r for r in records if r.engine_id == engine_id]
        if mission_id:
            records = [r for r in records if r.mission_id == mission_id]
        if mission_phase:
            records = [r for r in records if str(r.mission_phase.value if hasattr(r.mission_phase, 'value') else r.mission_phase).lower() == mission_phase.lower()]
        if status:
            records = [r for r in records if r.status.lower() == status.lower()]

        return records[start_idx:start_idx + limit]

    def run_what_if_scenario(
        self,
        fault_type: FaultType,
        severity: float,
        fault_start_sec: float,
        duration_sec: float = 300.0,
        seed: int = 42,
        uav_id: Optional[str] = None
    ) -> List[DigitalTwinState]:
        """
        Run isolated comparative scenario from 0 to duration_sec for the given UAV configuration.
        Returns full DigitalTwinState trajectory without mutating active simulation state.
        """
        target_uav = self.fleet.get(uav_id or self.active_uav_id)
        sim = EngineSimulator(
            aircraft_id=target_uav.aircraft_id if target_uav else "UAV-RUST-01",
            callsign=target_uav.callsign if target_uav else "Garuda-1",
            model_name=target_uav.model_name if target_uav else "DRDO RUSTOM-II MALE",
            engine_id=target_uav.engine_id if target_uav else "UAV-ENG-26054",
            engine_model=target_uav.engine_model if target_uav else "Lycoming O-320-D2J",
            mission_id=target_uav.mission_id if target_uav else "MIS-ALPHA-01",
            seed=seed
        )
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


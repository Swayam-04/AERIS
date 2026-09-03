import math
import random
from typing import Dict, Optional, Tuple
from backend.schemas.telemetry import TelemetryRecord, MissionPhase, FaultType
from backend.physics.physics_model import PhysicsEngineModel
from backend.physics.electrical_model import ElectricalSubsystemPhysicsModel


class EngineSimulator:
    """
    Deterministic Aero-Piston Engine & Electrical Digital-Twin Telemetry Simulator.
    Simulates real-time telemetry generation across flight phases with coupled
    alternator mechanical drive, aircraft electrical load, battery electrochemistry,
    and controlled fault injection.
    """

    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = random.Random(seed)
        self.physics_model = PhysicsEngineModel()
        self.electrical_model = ElectricalSubsystemPhysicsModel()
        
        # Simulation state
        self.elapsed_time: float = 0.0
        self.current_phase: MissionPhase = MissionPhase.CRUISE
        self.active_fault: FaultType = FaultType.NONE
        self.fault_severity: float = 0.0
        self.fault_start_time: float = 0.0

    def reset(self, seed: Optional[int] = None):
        if seed is not None:
            self.seed = seed
        self.rng = random.Random(self.seed)
        self.electrical_model.reset()
        self.elapsed_time = 0.0
        self.current_phase = MissionPhase.CRUISE
        self.active_fault = FaultType.NONE
        self.fault_severity = 0.0
        self.fault_start_time = 0.0

    def inject_fault(self, fault_type: FaultType, severity: float = 0.5):
        self.active_fault = fault_type
        self.fault_severity = max(0.0, min(1.0, severity))
        self.fault_start_time = self.elapsed_time

    def clear_fault(self):
        self.active_fault = FaultType.NONE
        self.fault_severity = 0.0

    def set_phase(self, phase: MissionPhase):
        self.current_phase = phase

    def _get_phase_parameters(self, phase: MissionPhase) -> Tuple[float, float, float]:
        """
        Returns (throttle_pct, altitude_ft, ambient_temp_c) for a given mission phase.
        """
        if phase == MissionPhase.TAKEOFF:
            return (95.0, 500.0, 20.0)
        elif phase == MissionPhase.CLIMB:
            return (85.0, 6000.0, 10.0)
        elif phase == MissionPhase.CRUISE:
            return (72.0, 15000.0, -5.0)
        elif phase == MissionPhase.LOITER:
            return (55.0, 12000.0, 0.0)
        elif phase == MissionPhase.RETURN:
            return (68.0, 8000.0, 8.0)
        elif phase == MissionPhase.LANDING:
            return (35.0, 1000.0, 18.0)
        return (70.0, 10000.0, 5.0)

    def step(self, dt_seconds: float = 1.0) -> TelemetryRecord:
        """
        Advance simulation by dt_seconds and return observed telemetry with synchronized electrical twin.
        """
        self.elapsed_time += dt_seconds
        
        throttle_pct, altitude_ft, ambient_temp_c = self._get_phase_parameters(self.current_phase)
        
        # Add smooth throttle dynamics / slight oscillation
        wobble = math.sin(self.elapsed_time / 15.0) * 0.8
        throttle = max(0.0, min(100.0, throttle_pct + wobble))

        # Base nominal values from physics model
        expected = self.physics_model.compute_expected(
            timestamp=self.elapsed_time,
            throttle_pct=throttle,
            altitude_ft=altitude_ft,
            ambient_temp_c=ambient_temp_c,
            mission_phase=self.current_phase
        )

        # Apply sensor measurement noise (Gaussian)
        rpm = expected.rpm + self.rng.gauss(0, 8.0)
        cht = expected.cht_c + self.rng.gauss(0, 1.2)
        egt = expected.egt_c + self.rng.gauss(0, 2.5)
        oil_press = expected.oil_pressure_psi + self.rng.gauss(0, 0.6)
        oil_temp = expected.oil_temp_c + self.rng.gauss(0, 0.8)
        fuel_flow = expected.fuel_flow_lph + self.rng.gauss(0, 0.15)
        vibration = expected.vibration_g + abs(self.rng.gauss(0, 0.02))
        timing = expected.injection_timing_deg + self.rng.gauss(0, 0.2)

        time_since_fault = max(0.0, self.elapsed_time - self.fault_start_time)
        ramp = min(1.0, time_since_fault / 10.0) * self.fault_severity if self.active_fault != FaultType.NONE else 0.0

        # Apply Engine Mechanical/Thermal Fault Deviations
        if self.active_fault == FaultType.MISFIRE:
            rpm -= 320.0 * ramp
            vibration += 1.85 * ramp
            egt -= 110.0 * ramp
            fuel_flow += 3.2 * ramp

        elif self.active_fault == FaultType.INJECTOR_ABNORMALITY:
            egt += 145.0 * ramp
            cht += 28.0 * ramp
            fuel_flow -= 4.5 * ramp
            vibration += 0.45 * ramp

        elif self.active_fault == FaultType.OIL_PRESSURE_LOSS:
            oil_press -= 38.0 * ramp
            oil_temp += 42.0 * ramp
            vibration += 0.65 * ramp

        elif self.active_fault == FaultType.OVERHEATING:
            cht += 55.0 * ramp
            oil_temp += 35.0 * ramp
            egt += 65.0 * ramp

        elif self.active_fault == FaultType.VIBRATION_SPIKE:
            vibration += 3.2 * ramp
            rpm += self.rng.gauss(0, 45.0) * ramp

        elif self.active_fault == FaultType.SENSOR_DRIFT:
            cht += 45.0 * ramp
            egt -= 35.0 * ramp

        # Step Coupled Electrical Power Subsystem
        # Engine RPM directly drives alternator, mission phase defines electrical load demand
        electrical_state = self.electrical_model.step(
            dt_seconds=dt_seconds,
            engine_rpm=max(0.0, rpm),
            phase=self.current_phase,
            ambient_temp_c=ambient_temp_c,
            altitude_ft=altitude_ft,
            active_fault=self.active_fault,
            fault_severity=self.fault_severity,
            time_since_fault=time_since_fault
        )

        # Bus voltage with realistic sensor noise
        bus_volts = electrical_state.system.bus_voltage + self.rng.gauss(0, 0.04)

        return TelemetryRecord(
            timestamp=round(self.elapsed_time, 2),
            engine_id="UAV-ENG-26054",
            mission_id="MIS-ALPHA-01",
            mission_phase=self.current_phase,
            throttle_pct=round(throttle, 1),
            altitude_ft=round(altitude_ft, 0),
            ambient_temp_c=round(ambient_temp_c, 1),
            rpm=round(max(0.0, rpm), 1),
            cht_c=round(cht, 1),
            egt_c=round(egt, 1),
            oil_pressure_psi=round(max(0.0, oil_press), 1),
            oil_temp_c=round(oil_temp, 1),
            fuel_flow_lph=round(max(0.0, fuel_flow), 2),
            vibration_g=round(max(0.0, vibration), 3),
            injection_timing_deg=round(timing, 1),
            battery_volts=round(bus_volts, 2),
            electrical=electrical_state,
            source_type="simulated",
            schema_version="2.0"
        )

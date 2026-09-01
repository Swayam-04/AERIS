from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class MissionPhase(str, Enum):
    TAKEOFF = "takeoff"
    CLIMB = "climb"
    CRUISE = "cruise"
    LOITER = "loiter"
    RETURN = "return"
    LANDING = "landing"


class FaultType(str, Enum):
    NONE = "none"
    MISFIRE = "misfire"
    INJECTOR_ABNORMALITY = "injector_abnormality"
    OIL_PRESSURE_LOSS = "oil_pressure_loss"
    OVERHEATING = "overheating"
    VIBRATION_SPIKE = "vibration_spike"
    SENSOR_DRIFT = "sensor_drift"


class TelemetryRecord(BaseModel):
    timestamp: float = Field(..., description="POSIX timestamp in seconds")
    engine_id: str = Field(default="UAV-ENG-26054")
    mission_id: str = Field(default="MIS-ALPHA-01")
    mission_phase: MissionPhase = Field(default=MissionPhase.CRUISE)
    throttle_pct: float = Field(..., ge=0.0, le=100.0)
    altitude_ft: float = Field(..., ge=0.0)
    ambient_temp_c: float = Field(default=15.0)
    
    # Primary Telemetry Signals
    rpm: float = Field(..., description="Engine RPM (0 - 6500)")
    cht_c: float = Field(..., description="Cylinder Head Temp (°C)")
    egt_c: float = Field(..., description="Exhaust Gas Temp (°C)")
    oil_pressure_psi: float = Field(..., description="Oil Pressure (PSI)")
    oil_temp_c: float = Field(..., description="Oil Temp (°C)")
    fuel_flow_lph: float = Field(..., description="Fuel Flow (Liters per hour)")
    vibration_g: float = Field(..., description="Vibration (g-force RMS)")
    injection_timing_deg: float = Field(..., description="Injection Timing (° BTDC)")
    battery_volts: float = Field(..., description="Battery/Alternator (Volts)")
    
    source_type: str = Field(default="simulated")
    schema_version: str = Field(default="1.0")


class ResidualRecord(BaseModel):
    rpm: float = 0.0
    cht_c: float = 0.0
    egt_c: float = 0.0
    oil_pressure_psi: float = 0.0
    oil_temp_c: float = 0.0
    fuel_flow_lph: float = 0.0
    vibration_g: float = 0.0
    injection_timing_deg: float = 0.0
    battery_volts: float = 0.0
    mahalanobis_distance: float = 0.0


class SubsystemHealth(BaseModel):
    piston_cylinder: float = Field(default=100.0, ge=0.0, le=100.0)
    lubrication: float = Field(default=100.0, ge=0.0, le=100.0)
    fuel_injection: float = Field(default=100.0, ge=0.0, le=100.0)
    ignition: float = Field(default=100.0, ge=0.0, le=100.0)
    electrical: float = Field(default=100.0, ge=0.0, le=100.0)


class DiagnosticAlert(BaseModel):
    alert_id: str
    timestamp: float
    severity: str = Field(..., description="info, warning, critical")
    candidate_fault: str
    confidence_pct: float
    contributing_signals: List[str]
    evidence_summary: str
    recommendation: str


class RULEstimate(BaseModel):
    rul_hours: float
    baseline_hours: float = 1200.0
    degradation_rate_pct_per_hr: float
    confidence_lower_hr: float
    confidence_upper_hr: float
    primary_degradation_subsystem: str
    model_version: str = "AeroTwin-RUL-v1.4"
    assumptions: List[str]


class DigitalTwinState(BaseModel):
    timestamp: float
    engine_id: str
    mission_id: str
    mission_phase: MissionPhase
    observed: TelemetryRecord
    expected: TelemetryRecord
    residuals: ResidualRecord
    subsystem_health: SubsystemHealth
    overall_health_score: float = Field(..., ge=0.0, le=100.0)
    active_fault: FaultType = FaultType.NONE
    fault_severity: float = 0.0
    status: str = Field(..., description="normal, warning, critical")
    alerts: List[DiagnosticAlert] = []
    rul: Optional[RULEstimate] = None


class FaultInjectionRequest(BaseModel):
    fault_type: FaultType
    severity: float = Field(default=0.5, ge=0.0, le=1.0)
    duration_s: float = Field(default=60.0, ge=5.0)


class ScenarioConfig(BaseModel):
    name: str = "Standard Patrol Mission"
    profile: List[MissionPhase] = [
        MissionPhase.TAKEOFF,
        MissionPhase.CLIMB,
        MissionPhase.CRUISE,
        MissionPhase.LOITER,
        MissionPhase.RETURN,
        MissionPhase.LANDING
    ]
    altitude_ft: float = 15000.0
    ambient_temp_c: float = -5.0
    seed: int = 42

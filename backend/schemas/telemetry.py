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
    # Electrical Power Subsystem Faults
    BATTERY_LOW_SOC = "battery_low_soc"
    BATTERY_OVERHEATING = "battery_overheating"
    BATTERY_VOLTAGE_SAG = "battery_voltage_sag"
    BATTERY_INTERNAL_RESISTANCE_INCREASE = "battery_internal_resistance_increase"
    ALTERNATOR_OUTPUT_DEGRADATION = "alternator_output_degradation"
    ALTERNATOR_OVERHEATING = "alternator_overheating"
    ALTERNATOR_REGULATION_FAILURE = "alternator_regulation_failure"
    ALTERNATOR_FAILURE = "alternator_failure"
    ELECTRICAL_LOAD_SURGE = "electrical_load_surge"
    CHARGING_SYSTEM_FAULT = "charging_system_fault"


class BatteryTelemetry(BaseModel):
    voltage: float = Field(default=28.2, description="Battery Terminal Voltage (V)")
    current: float = Field(default=0.0, description="Battery Current (A) - Positive = Discharge, Negative = Charge")
    temperature: float = Field(default=22.0, description="Battery Temperature (°C)")
    state_of_charge: float = Field(default=92.0, ge=0.0, le=100.0, description="State of Charge (SOC %)")
    state_of_health: float = Field(default=98.5, ge=0.0, le=100.0, description="State of Health (SOH %)")
    internal_resistance_mohm: float = Field(default=18.0, description="Internal Resistance (mΩ)")
    power_w: float = Field(default=0.0, description="Battery Power (W) = Voltage x Current")
    health: float = Field(default=100.0, ge=0.0, le=100.0, description="Battery Subsystem Health (0-100%)")
    status: str = Field(default="STANDBY", description="CHARGING, DISCHARGING, STANDBY, LOW SOC, DEGRADED, CRITICAL")


class AlternatorTelemetry(BaseModel):
    output_voltage: float = Field(default=28.2, description="Alternator Output Voltage (V)")
    output_current: float = Field(default=30.0, description="Alternator Output Current (A)")
    output_power_w: float = Field(default=846.0, description="Alternator Output Power (W) = Output V x Output A")
    rpm: float = Field(default=4500.0, description="Alternator RPM (1.8x Engine RPM)")
    temperature: float = Field(default=45.0, description="Alternator Stator/Diode Temperature (°C)")
    regulation_error_pct: float = Field(default=0.0, description="Regulation Error (% deviation from 28.2V)")
    health: float = Field(default=98.0, ge=0.0, le=100.0, description="Alternator Health (0-100%)")
    status: str = Field(default="NORMAL", description="NORMAL, UNDERPERFORMING, DEGRADED, FAILED")


class ElectricalLoadTelemetry(BaseModel):
    total_load_w: float = Field(default=820.0, description="Total Aircraft Electrical Load (W)")
    essential_load_w: float = Field(default=420.0, description="Essential Flight Critical Avionics Load (W)")
    peak_load_w: float = Field(default=1107.0, description="Peak Transient Load Capability (W)")


class SystemElectricalTelemetry(BaseModel):
    bus_voltage: float = Field(default=28.2, description="Primary 28V DC Bus Voltage (V)")
    power_balance_w: float = Field(default=26.0, description="Power Balance (W) = Alternator Power - Total Load")
    health: float = Field(default=100.0, ge=0.0, le=100.0, description="Composite Electrical Health (0-100%)")
    status: str = Field(default="NORMAL", description="NORMAL, WARNING, DEGRADED, CRITICAL")


class AircraftCoordinates(BaseModel):
    latitude: float = Field(default=26.9124, description="Latitude in decimal degrees")
    longitude: float = Field(default=70.9015, description="Longitude in decimal degrees")
    altitude_ft: float = Field(default=15000.0, description="Altitude in feet AMSL")
    heading_deg: float = Field(default=85.0, description="Heading in degrees (0-360)")
    speed_knots: float = Field(default=120.0, description="Airspeed in knots")
    sector: str = Field(default="Western Thar Border Sector", description="Operational tactical sector name")


class UAVSummary(BaseModel):
    aircraft_id: str = Field(..., description="Unique UAV airframe ID, e.g. UAV-RUST-01")
    callsign: str = Field(..., description="Tactical callsign, e.g. Garuda-1")
    model_name: str = Field(..., description="Airframe model name, e.g. DRDO RUSTOM-II MALE")
    engine_id: str = Field(..., description="Engine serial ID, e.g. UAV-ENG-26054")
    engine_model: str = Field(..., description="Engine model name, e.g. Lycoming O-320-D2J")
    mission_id: str = Field(..., description="Mission identifier, e.g. MIS-ALPHA-01")
    mission_type: str = Field(..., description="Mission operational type, e.g. Surveillance Patrol")
    mission_phase: MissionPhase = Field(default=MissionPhase.CRUISE)
    overall_health_score: float = Field(..., ge=0.0, le=100.0)
    status: str = Field(default="normal", description="normal, warning, critical, standby")
    active_fault: FaultType = Field(default=FaultType.NONE)
    fault_severity: float = Field(default=0.0)
    alerts_count: int = Field(default=0)
    altitude_ft: float = Field(default=15000.0)
    rpm: float = Field(default=2450.0)
    battery_soc: float = Field(default=92.0)
    bus_voltage: float = Field(default=28.2)
    fuel_flow_lph: float = Field(default=24.5)
    rul_hours: Optional[float] = Field(default=1200.0)
    coordinates: Optional[AircraftCoordinates] = None


class FleetSummaryResponse(BaseModel):
    fleet: List[UAVSummary]
    active_uav_id: str
    total_airframes: int
    active_sorties: int
    average_health: float
    total_alerts: int


class ElectricalState(BaseModel):
    battery: BatteryTelemetry = Field(default_factory=BatteryTelemetry)
    alternator: AlternatorTelemetry = Field(default_factory=AlternatorTelemetry)
    electrical_load: ElectricalLoadTelemetry = Field(default_factory=ElectricalLoadTelemetry)
    system: SystemElectricalTelemetry = Field(default_factory=SystemElectricalTelemetry)


class TelemetryRecord(BaseModel):
    timestamp: float = Field(..., description="POSIX timestamp in seconds")
    aircraft_id: str = Field(default="UAV-RUST-01", description="UAV airframe identifier")
    callsign: str = Field(default="Garuda-1", description="Tactical callsign")
    model_name: str = Field(default="DRDO RUSTOM-II MALE", description="Airframe model name")
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
    battery_volts: float = Field(..., description="Battery/Alternator Bus Voltage (Volts)")
    
    # Unified Electrical Subsystem Digital Twin State
    electrical: Optional[ElectricalState] = Field(default=None)
    coordinates: Optional[AircraftCoordinates] = Field(default=None)

    source_type: str = Field(default="simulated")
    schema_version: str = Field(default="2.0")


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
    bus_voltage: float = 0.0
    battery_current_a: float = 0.0
    alternator_power_w: float = 0.0
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
    model_version: str = "AeroTwin-RUL-v2.0-ElectricalPhysics"
    assumptions: List[str]
    # Specific Electrical Component RUL
    battery_rul_hours: Optional[float] = 650.0
    battery_rul_confidence: Optional[str] = "600–720 flight hours (82% confidence)"
    alternator_rul_hours: Optional[float] = 920.0
    alternator_rul_confidence: Optional[str] = "880–980 flight hours (85% confidence)"


class ComponentFaultLocation(BaseModel):
    component_id: str
    component_name: str
    subsystem: str
    physical_location: str
    mesh_anchor: str
    severity: str = "normal"  # normal, warning, critical
    correlated_signals: List[str] = []
    callout_text: Optional[str] = None


class DigitalTwinState(BaseModel):
    timestamp: float
    aircraft_id: str = "UAV-RUST-01"
    callsign: str = "Garuda-1"
    model_name: str = "DRDO RUSTOM-II MALE"
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
    affected_component: Optional[ComponentFaultLocation] = None
    coordinates: Optional[AircraftCoordinates] = None
    fleet_summary: Optional[List[UAVSummary]] = None


class FaultInjectionRequest(BaseModel):
    uav_id: Optional[str] = None
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

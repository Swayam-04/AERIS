import datetime
from typing import Any, Dict, Optional
from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    DateTime,
    Float,
    String,
    JSON,
    Index
)
from sqlalchemy.orm import declarative_base

from backend.schemas.telemetry import (
    DigitalTwinState,
    TelemetryRecord,
    ResidualRecord,
    SubsystemHealth,
    DiagnosticAlert,
    RULEstimate,
    ComponentFaultLocation,
    MissionPhase,
    FaultType
)

Base = declarative_base()


class TelemetryRecordModel(Base):
    """
    SQLAlchemy table model for persistent telemetry storage.
    Optimized for time-series queries and TimescaleDB hypertable partitioning on timestamp.
    """
    __tablename__ = "telemetry_records"
    __table_args__ = (
        Index("idx_telemetry_engine_time", "engine_id", "timestamp"),
        Index("idx_telemetry_mission_time", "mission_id", "timestamp"),
        Index("idx_telemetry_status_time", "status", "timestamp"),
        Index("idx_telemetry_timestamp_desc", "timestamp"),
        {"extend_existing": True}
    )

    # Primary key with variant for SQLite and PostgreSQL compatibility
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)

    # Identifiers & Metadata
    engine_id = Column(String(64), nullable=False, default="UAV-ENG-26054", index=True)
    mission_id = Column(String(64), nullable=False, default="MIS-ALPHA-01", index=True)
    mission_phase = Column(String(32), nullable=False, default="cruise")
    source_type = Column(String(32), nullable=False, default="simulated")
    schema_version = Column(String(16), nullable=False, default="2.0")

    # Environmental & Control Telemetry
    throttle_pct = Column(Float, nullable=False, default=70.0)
    altitude_ft = Column(Float, nullable=False, default=15000.0)
    ambient_temp_c = Column(Float, nullable=False, default=15.0)

    # Primary Engine Telemetry Signals
    rpm = Column(Float, nullable=False)
    cht_c = Column(Float, nullable=False)
    egt_c = Column(Float, nullable=False)
    oil_pressure_psi = Column(Float, nullable=False)
    oil_temp_c = Column(Float, nullable=False)
    fuel_flow_lph = Column(Float, nullable=False)
    vibration_g = Column(Float, nullable=False)
    injection_timing_deg = Column(Float, nullable=False)
    battery_volts = Column(Float, nullable=False)

    # Electrical Subsystem Signals
    bus_voltage = Column(Float, nullable=True)
    battery_current = Column(Float, nullable=True)
    battery_temp = Column(Float, nullable=True)
    battery_soc = Column(Float, nullable=True)
    battery_soh = Column(Float, nullable=True)
    alternator_power = Column(Float, nullable=True)
    alternator_current = Column(Float, nullable=True)
    alternator_temp = Column(Float, nullable=True)

    # Physics Model & Residuals
    expected_values = Column(JSON, nullable=True)
    residual_values = Column(JSON, nullable=True)
    mahalanobis_distance = Column(Float, nullable=False, default=0.0)

    # Digital Twin Health & Fault Diagnostics
    overall_health_score = Column(Float, nullable=False, default=100.0)
    subsystem_health = Column(JSON, nullable=True)
    status = Column(String(32), nullable=False, default="normal", index=True)
    active_fault = Column(String(64), nullable=False, default="none")
    fault_severity = Column(Float, nullable=False, default=0.0)
    alerts = Column(JSON, nullable=True)
    rul_hours = Column(Float, nullable=True)

    # Full Complete DigitalTwinState for lossless reconstruction
    state_json = Column(JSON, nullable=False)

    @classmethod
    def from_digital_twin_state(cls, state: DigitalTwinState) -> "TelemetryRecordModel":
        """Converts a DigitalTwinState Pydantic model into a SQLAlchemy record."""
        # Convert POSIX timestamp float into timezone-aware datetime UTC
        if isinstance(state.timestamp, (int, float)):
            dt = datetime.datetime.fromtimestamp(state.timestamp, tz=datetime.timezone.utc)
        elif isinstance(state.timestamp, datetime.datetime):
            dt = state.timestamp if state.timestamp.tzinfo else state.timestamp.replace(tzinfo=datetime.timezone.utc)
        else:
            dt = datetime.datetime.now(datetime.timezone.utc)

        obs = state.observed
        elec = obs.electrical

        # Extract electrical sub-fields if present
        bus_voltage = elec.system.bus_voltage if elec and elec.system else obs.battery_volts
        battery_current = elec.battery.current if elec and elec.battery else None
        battery_temp = elec.battery.temperature if elec and elec.battery else None
        battery_soc = elec.battery.state_of_charge if elec and elec.battery else None
        battery_soh = elec.battery.state_of_health if elec and elec.battery else None
        alternator_power = elec.alternator.output_power_w if elec and elec.alternator else None
        alternator_current = elec.alternator.output_current if elec and elec.alternator else None
        alternator_temp = elec.alternator.temperature if elec and elec.alternator else None

        rul_hours = state.rul.rul_hours if state.rul else None

        state_dict = state.model_dump()

        return cls(
            timestamp=dt,
            engine_id=state.engine_id,
            mission_id=state.mission_id,
            mission_phase=str(state.mission_phase.value if hasattr(state.mission_phase, 'value') else state.mission_phase),
            source_type=obs.source_type,
            schema_version=obs.schema_version,
            throttle_pct=obs.throttle_pct,
            altitude_ft=obs.altitude_ft,
            ambient_temp_c=obs.ambient_temp_c,
            rpm=obs.rpm,
            cht_c=obs.cht_c,
            egt_c=obs.egt_c,
            oil_pressure_psi=obs.oil_pressure_psi,
            oil_temp_c=obs.oil_temp_c,
            fuel_flow_lph=obs.fuel_flow_lph,
            vibration_g=obs.vibration_g,
            injection_timing_deg=obs.injection_timing_deg,
            battery_volts=obs.battery_volts,
            bus_voltage=bus_voltage,
            battery_current=battery_current,
            battery_temp=battery_temp,
            battery_soc=battery_soc,
            battery_soh=battery_soh,
            alternator_power=alternator_power,
            alternator_current=alternator_current,
            alternator_temp=alternator_temp,
            expected_values=state.expected.model_dump() if state.expected else None,
            residual_values=state.residuals.model_dump() if state.residuals else None,
            mahalanobis_distance=state.residuals.mahalanobis_distance if state.residuals else 0.0,
            overall_health_score=state.overall_health_score,
            subsystem_health=state.subsystem_health.model_dump() if state.subsystem_health else None,
            status=state.status,
            active_fault=str(state.active_fault.value if hasattr(state.active_fault, 'value') else state.active_fault),
            fault_severity=state.fault_severity,
            alerts=[a.model_dump() for a in state.alerts] if state.alerts else [],
            rul_hours=rul_hours,
            state_json=state_dict
        )

    def to_digital_twin_state(self) -> DigitalTwinState:
        """Reconstructs a DigitalTwinState Pydantic model from database row."""
        if self.state_json and isinstance(self.state_json, dict):
            return DigitalTwinState.model_validate(self.state_json)
        
        # Fallback reconstruction from columns if state_json is unavailable
        ts = self.timestamp.timestamp() if isinstance(self.timestamp, datetime.datetime) else float(self.timestamp)
        return DigitalTwinState(
            timestamp=ts,
            engine_id=self.engine_id,
            mission_id=self.mission_id,
            mission_phase=MissionPhase(self.mission_phase) if self.mission_phase in MissionPhase._value2member_map_ else MissionPhase.CRUISE,
            observed=TelemetryRecord(
                timestamp=ts,
                engine_id=self.engine_id,
                mission_id=self.mission_id,
                mission_phase=MissionPhase(self.mission_phase) if self.mission_phase in MissionPhase._value2member_map_ else MissionPhase.CRUISE,
                throttle_pct=self.throttle_pct,
                altitude_ft=self.altitude_ft,
                ambient_temp_c=self.ambient_temp_c,
                rpm=self.rpm,
                cht_c=self.cht_c,
                egt_c=self.egt_c,
                oil_pressure_psi=self.oil_pressure_psi,
                oil_temp_c=self.oil_temp_c,
                fuel_flow_lph=self.fuel_flow_lph,
                vibration_g=self.vibration_g,
                injection_timing_deg=self.injection_timing_deg,
                battery_volts=self.battery_volts,
            ),
            expected=TelemetryRecord.model_validate(self.expected_values) if self.expected_values else TelemetryRecord(
                timestamp=ts,
                throttle_pct=self.throttle_pct,
                altitude_ft=self.altitude_ft,
                rpm=self.rpm,
                cht_c=self.cht_c,
                egt_c=self.egt_c,
                oil_pressure_psi=self.oil_pressure_psi,
                oil_temp_c=self.oil_temp_c,
                fuel_flow_lph=self.fuel_flow_lph,
                vibration_g=self.vibration_g,
                injection_timing_deg=self.injection_timing_deg,
                battery_volts=self.battery_volts,
            ),
            residuals=ResidualRecord.model_validate(self.residual_values) if self.residual_values else ResidualRecord(
                mahalanobis_distance=self.mahalanobis_distance
            ),
            subsystem_health=SubsystemHealth.model_validate(self.subsystem_health) if self.subsystem_health else SubsystemHealth(),
            overall_health_score=self.overall_health_score,
            active_fault=FaultType(self.active_fault) if self.active_fault in FaultType._value2member_map_ else FaultType.NONE,
            fault_severity=self.fault_severity,
            status=self.status,
            alerts=[DiagnosticAlert.model_validate(a) for a in self.alerts] if self.alerts else [],
            rul=RULEstimate(
                rul_hours=self.rul_hours if self.rul_hours is not None else 1200.0,
                degradation_rate_pct_per_hr=0.05,
                confidence_lower_hr=1100.0,
                confidence_upper_hr=1300.0,
                primary_degradation_subsystem="nominal",
                assumptions=[]
            ) if self.rul_hours is not None else None
        )

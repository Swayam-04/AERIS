from typing import List, Optional
from backend.schemas.telemetry import (
    TelemetryRecord,
    ResidualRecord,
    SubsystemHealth,
    DigitalTwinState,
    FaultType
)
from backend.physics.physics_model import PhysicsEngineModel
from backend.ml.analytics_service import MLAnalyticsService


class DigitalTwinService:
    """
    Digital Twin State Synchronization Engine.
    Maintains observed, physics-expected, vector residuals, health indicators,
    and alert states in continuous synchronization.
    """

    def __init__(self):
        self.physics_model = PhysicsEngineModel()
        self.analytics_service = MLAnalyticsService()

    def update_twin(
        self,
        observed: TelemetryRecord,
        active_fault: FaultType = FaultType.NONE,
        fault_severity: float = 0.0
    ) -> DigitalTwinState:
        """
        Synchronize live observed telemetry with physics expected baseline
        and produce full Digital Twin state object.
        """
        # 1. Compute physics-informed nominal expected baseline
        expected = self.physics_model.compute_expected(
            timestamp=observed.timestamp,
            throttle_pct=observed.throttle_pct,
            altitude_ft=observed.altitude_ft,
            ambient_temp_c=observed.ambient_temp_c,
            mission_phase=observed.mission_phase,
            engine_id=observed.engine_id,
            mission_id=observed.mission_id
        )

        # 2. Compute residual vector deltas
        residuals = self.physics_model.calculate_residuals(observed, expected)

        # 3. Compute Subsystem Health (0-100%) based on residual magnitudes
        piston_cyl_health = max(0.0, min(100.0, 100.0 - (abs(residuals.cht_c) * 0.8 + abs(residuals.egt_c) * 0.25)))
        lubrication_health = max(0.0, min(100.0, 100.0 - (abs(residuals.oil_pressure_psi) * 1.6 + abs(residuals.oil_temp_c) * 0.7)))
        fuel_inj_health = max(0.0, min(100.0, 100.0 - (abs(residuals.fuel_flow_lph) * 8.0 + abs(residuals.injection_timing_deg) * 3.0)))
        ignition_health = max(0.0, min(100.0, 100.0 - (abs(residuals.vibration_g) * 22.0 + (abs(residuals.rpm) * 0.1 if residuals.rpm < 0 else 0))))
        electrical_health = max(0.0, min(100.0, 100.0 - abs(residuals.battery_volts) * 25.0))

        subsystem_health = SubsystemHealth(
            piston_cylinder=round(piston_cyl_health, 1),
            lubrication=round(lubrication_health, 1),
            fuel_injection=round(fuel_inj_health, 1),
            ignition=round(ignition_health, 1),
            electrical=round(electrical_health, 1)
        )

        # 4. Overall Engine Health Index (Weighted Minimum Subsystem + Mean Health)
        min_subsystem = min([
            piston_cyl_health,
            lubrication_health,
            fuel_inj_health,
            ignition_health,
            electrical_health
        ])
        avg_subsystem = (piston_cyl_health + lubrication_health + fuel_inj_health + ignition_health + electrical_health) / 5.0
        overall_health = round(0.65 * min_subsystem + 0.35 * avg_subsystem, 1)

        # 5. Detect Anomaly & Diagnose Candidate Faults
        status, contributing_signals = self.analytics_service.detect_anomalies(observed, residuals)
        alerts = self.analytics_service.diagnose_fault(observed, residuals, observed.timestamp)

        # 6. Estimate RUL
        rul_estimate = self.analytics_service.estimate_rul(subsystem_health, residuals)

        return DigitalTwinState(
            timestamp=observed.timestamp,
            engine_id=observed.engine_id,
            mission_id=observed.mission_id,
            mission_phase=observed.mission_phase,
            observed=observed,
            expected=expected,
            residuals=residuals,
            subsystem_health=subsystem_health,
            overall_health_score=overall_health,
            active_fault=active_fault,
            fault_severity=fault_severity,
            status=status,
            alerts=alerts,
            rul=rul_estimate
        )

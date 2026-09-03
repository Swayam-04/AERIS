from typing import List, Optional
from backend.schemas.telemetry import (
    TelemetryRecord,
    ResidualRecord,
    SubsystemHealth,
    DigitalTwinState,
    FaultType,
    ComponentFaultLocation,
    DiagnosticAlert
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

    def resolve_affected_component(
        self,
        active_fault: FaultType,
        severity: float,
        alerts: List[DiagnosticAlert]
    ) -> Optional[ComponentFaultLocation]:
        """
        Maps the active fault or diagnosed alert directly to the exact physical
        component and 3D coordinate anchor inside the Lycoming O-320 aero engine.
        """
        if active_fault == FaultType.MISFIRE:
            return ComponentFaultLocation(
                component_id="cylinder_2",
                component_name="Cylinder #2 Combustion Chamber",
                subsystem="combustion",
                physical_location="Left Bank, Forward Port Cylinder (Cyl #2)",
                mesh_anchor="cylinder_2",
                severity="critical" if severity > 0.6 else "warning",
                correlated_signals=["vibration_g", "rpm", "egt_c"],
                callout_text="Ignition misfire detected in Cylinder #2. Incomplete combustion with unburnt fuel cooling exhaust and generating 1.8g harmonic vibration."
            )
        elif active_fault == FaultType.INJECTOR_ABNORMALITY:
            return ComponentFaultLocation(
                component_id="fuel_injector_2",
                component_name="Fuel Injector #2",
                subsystem="fuel",
                physical_location="Left Bank, Cylinder #2 Intake Runner Port",
                mesh_anchor="fuel_injector_2",
                severity="critical" if severity > 0.7 else "warning",
                correlated_signals=["fuel_flow_lph", "egt_c", "cht_c"],
                callout_text="Fuel injector restriction on Cylinder #2 intake runner. Reduced fuel metering causing localized lean-burn thermal rise (+145°C EGT delta)."
            )
        elif active_fault == FaultType.OIL_PRESSURE_LOSS:
            return ComponentFaultLocation(
                component_id="oil_pump",
                component_name="Oil Pressure Pump & Relief Gallery",
                subsystem="lubrication",
                physical_location="Lower Crankcase Accessory Sump & Main Gallery",
                mesh_anchor="oil_pump",
                severity="critical" if severity > 0.4 else "warning",
                correlated_signals=["oil_pressure_psi", "oil_temp_c"],
                callout_text="Lube pressure loss detected. Main oil gallery pressure dropped below safe threshold, risking hydrodynamic journal bearing wear."
            )
        elif active_fault == FaultType.OVERHEATING:
            return ComponentFaultLocation(
                component_id="cylinder_head_3",
                component_name="Cylinder Head #3 & Cooling Fins",
                subsystem="cooling",
                physical_location="Right Bank, Aft Starboard Head & Baffle Duct",
                mesh_anchor="cylinder_head_3",
                severity="critical" if severity > 0.5 else "warning",
                correlated_signals=["cht_c", "oil_temp_c"],
                callout_text="Thermal duct restriction on Cylinder #3 head. Cooling fin airflow starvation driving localized CHT over 230°C."
            )
        elif active_fault == FaultType.VIBRATION_SPIKE:
            return ComponentFaultLocation(
                component_id="crankshaft_prop_interface",
                component_name="Crankshaft Front Journal & Propeller Flange",
                subsystem="propulsion",
                physical_location="Forward Crankcase Nose Section & Propeller Flange",
                mesh_anchor="crankshaft",
                severity="critical" if severity > 0.6 else "warning",
                correlated_signals=["vibration_g", "rpm"],
                callout_text="Mechanical imbalance detected. Abnormal rotational oscillation centered on forward crankshaft journal and propeller hub."
            )
        elif active_fault == FaultType.SENSOR_DRIFT:
            return ComponentFaultLocation(
                component_id="sensor_cht_3",
                component_name="CHT Thermocouple Sensor #3",
                subsystem="sensors",
                physical_location="Cylinder #3 Spark Plug Gasket Well",
                mesh_anchor="sensor_cht_3",
                severity="warning",
                correlated_signals=["cht_c"],
                callout_text="Calibration drift on CHT Thermocouple #3. Engine physical block intact; signal offset +45°C requires sensor recalibration."
            )
        elif active_fault in [
            FaultType.ALTERNATOR_OUTPUT_DEGRADATION,
            FaultType.ALTERNATOR_FAILURE,
            FaultType.ALTERNATOR_OVERHEATING,
            FaultType.ALTERNATOR_REGULATION_FAILURE
        ]:
            return ComponentFaultLocation(
                component_id="alternator",
                component_name="28V Alternator Assembly & Drive Belt",
                subsystem="electrical",
                physical_location="Rear Accessory Case Drive Pad",
                mesh_anchor="alternator",
                severity="critical" if "failure" in active_fault.value else "warning",
                correlated_signals=["bus_voltage", "alternator_power_w", "battery_current"],
                callout_text="Alternator generation anomaly on rear accessory drive pad. Output derated, bus deficit transferred to battery reserve."
            )
        elif active_fault in [
            FaultType.BATTERY_LOW_SOC,
            FaultType.BATTERY_OVERHEATING,
            FaultType.BATTERY_VOLTAGE_SAG,
            FaultType.BATTERY_INTERNAL_RESISTANCE_INCREASE,
            FaultType.ELECTRICAL_LOAD_SURGE,
            FaultType.CHARGING_SYSTEM_FAULT
        ]:
            return ComponentFaultLocation(
                component_id="battery",
                component_name="Aircraft 24V LiFePO4 Battery Pack",
                subsystem="electrical",
                physical_location="Forward Avionics Bay & DC Distribution Bus",
                mesh_anchor="battery",
                severity="critical" if "overheating" in active_fault.value or "low_soc" in active_fault.value else "warning",
                correlated_signals=["battery_volts", "battery_current", "battery_soc"],
                callout_text=f"Battery storage anomaly: {active_fault.value}. Monitoring internal impedance and state of charge."
            )
        elif alerts:
            # Fallback based on top diagnostic alert
            top_alert = alerts[0].candidate_fault.lower()
            if "misfire" in top_alert:
                return ComponentFaultLocation(
                    component_id="cylinder_2",
                    component_name="Cylinder #2 Combustion Chamber",
                    subsystem="combustion",
                    physical_location="Left Bank, Forward Port Cylinder (Cyl #2)",
                    mesh_anchor="cylinder_2",
                    severity="warning",
                    correlated_signals=alerts[0].contributing_signals,
                    callout_text=alerts[0].evidence_summary
                )
            elif "injector" in top_alert:
                return ComponentFaultLocation(
                    component_id="fuel_injector_2",
                    component_name="Fuel Injector #2",
                    subsystem="fuel",
                    physical_location="Left Bank, Cylinder #2 Intake Runner Port",
                    mesh_anchor="fuel_injector_2",
                    severity="warning",
                    correlated_signals=alerts[0].contributing_signals,
                    callout_text=alerts[0].evidence_summary
                )
            elif "lubrication" in top_alert or "oil" in top_alert:
                return ComponentFaultLocation(
                    component_id="oil_pump",
                    component_name="Oil Pressure Pump & Relief Gallery",
                    subsystem="lubrication",
                    physical_location="Lower Crankcase Accessory Sump & Main Gallery",
                    mesh_anchor="oil_pump",
                    severity="warning",
                    correlated_signals=alerts[0].contributing_signals,
                    callout_text=alerts[0].evidence_summary
                )
            elif "overheating" in top_alert or "thermal" in top_alert:
                return ComponentFaultLocation(
                    component_id="cylinder_head_3",
                    component_name="Cylinder Head #3 & Cooling Fins",
                    subsystem="cooling",
                    physical_location="Right Bank, Aft Starboard Head & Baffle Duct",
                    mesh_anchor="cylinder_head_3",
                    severity="warning",
                    correlated_signals=alerts[0].contributing_signals,
                    callout_text=alerts[0].evidence_summary
                )
            elif "vibration" in top_alert or "imbalance" in top_alert:
                return ComponentFaultLocation(
                    component_id="crankshaft_prop_interface",
                    component_name="Crankshaft Front Journal & Propeller Flange",
                    subsystem="propulsion",
                    physical_location="Forward Crankcase Nose Section & Propeller Flange",
                    mesh_anchor="crankshaft",
                    severity="warning",
                    correlated_signals=alerts[0].contributing_signals,
                    callout_text=alerts[0].evidence_summary
                )

        return None

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

        # 3. Compute Subsystem Health (0-100%) based on physical models & residuals
        piston_cyl_health = max(0.0, min(100.0, 100.0 - (abs(residuals.cht_c) * 0.8 + abs(residuals.egt_c) * 0.25)))
        lubrication_health = max(0.0, min(100.0, 100.0 - (abs(residuals.oil_pressure_psi) * 1.6 + abs(residuals.oil_temp_c) * 0.7)))
        fuel_inj_health = max(0.0, min(100.0, 100.0 - (abs(residuals.fuel_flow_lph) * 8.0 + abs(residuals.injection_timing_deg) * 3.0)))
        ignition_health = max(0.0, min(100.0, 100.0 - (abs(residuals.vibration_g) * 22.0 + (abs(residuals.rpm) * 0.1 if residuals.rpm < 0 else 0))))
        
        # Composite Electrical Power Subsystem Health (Battery + Alternator + Voltage Stability + Power Balance)
        if observed.electrical and observed.electrical.system:
            electrical_health = observed.electrical.system.health
        else:
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
        rul_estimate = self.analytics_service.estimate_rul(subsystem_health, residuals, observed)

        # 7. Map to exact physical engine component
        affected_component = self.resolve_affected_component(active_fault, fault_severity, alerts)

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
            rul=rul_estimate,
            affected_component=affected_component
        )

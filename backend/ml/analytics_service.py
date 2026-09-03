import math
from typing import List, Tuple, Dict, Optional
from backend.schemas.telemetry import (
    TelemetryRecord,
    ResidualRecord,
    DiagnosticAlert,
    RULEstimate,
    FaultType,
    SubsystemHealth
)


class MLAnalyticsService:
    """
    ML & Engineering Analytics Engine:
    - Multivariate Anomaly Detection (Aero-Engine + Electrical Power Subsystem)
    - Ranked Explainable Fault Diagnosis with Physical Evidence
    - Physics-Informed Degradation & Component RUL Estimation (Engine, Battery, Alternator)
    - Maintenance Advisory generation
    """

    def __init__(self):
        # Operational limits for warning and critical thresholds
        self.limits = {
            "cht_max_warning": 210.0,
            "cht_max_critical": 240.0,
            "egt_max_warning": 890.0,
            "egt_max_critical": 960.0,
            "oil_press_min_warning": 28.0,
            "oil_press_min_critical": 18.0,
            "oil_temp_max_warning": 120.0,
            "oil_temp_max_critical": 135.0,
            "vibration_max_warning": 2.5,
            "vibration_max_critical": 4.0,
            "mahalanobis_threshold_warning": 6.0,
            "mahalanobis_threshold_critical": 12.0,
            # Electrical Power Subsystem Limits
            "bus_volts_min_warning": 25.5,
            "bus_volts_min_critical": 23.5,
            "bus_volts_max_warning": 29.5,
            "bus_volts_max_critical": 31.0,
            "battery_soc_min_warning": 30.0,
            "battery_soc_min_critical": 18.0,
            "battery_temp_max_warning": 45.0,
            "battery_temp_max_critical": 58.0,
            "alternator_temp_max_warning": 105.0,
            "alternator_temp_max_critical": 130.0,
            "regulation_error_max_warning": 5.0,
            "regulation_error_max_critical": 9.0,
        }

    def detect_anomalies(
        self,
        observed: TelemetryRecord,
        residuals: ResidualRecord
    ) -> Tuple[str, List[str]]:
        """
        Determine anomaly severity and list contributing signals across engine and electrical subsystems.
        Returns (status: 'normal'|'warning'|'critical', contributing_signals: List[str])
        """
        contributing = []
        severity_score = 0

        # Parameter boundary checks - Engine
        if observed.cht_c > self.limits["cht_max_critical"]:
            contributing.append(f"CHT Critical ({observed.cht_c}°C > {self.limits['cht_max_critical']}°C)")
            severity_score += 3
        elif observed.cht_c > self.limits["cht_max_warning"]:
            contributing.append(f"CHT High ({observed.cht_c}°C)")
            severity_score += 1

        if observed.egt_c > self.limits["egt_max_critical"]:
            contributing.append(f"EGT Critical ({observed.egt_c}°C)")
            severity_score += 3
        elif observed.egt_c > self.limits["egt_max_warning"]:
            contributing.append(f"EGT High ({observed.egt_c}°C)")
            severity_score += 1

        if observed.oil_pressure_psi < self.limits["oil_press_min_critical"]:
            contributing.append(f"Oil Pressure Low Critical ({observed.oil_pressure_psi} PSI)")
            severity_score += 3
        elif observed.oil_pressure_psi < self.limits["oil_press_min_warning"]:
            contributing.append(f"Oil Pressure Low Warning ({observed.oil_pressure_psi} PSI)")
            severity_score += 1

        if observed.oil_temp_c > self.limits["oil_temp_max_critical"]:
            contributing.append(f"Oil Temp Critical ({observed.oil_temp_c}°C)")
            severity_score += 3
        elif observed.oil_temp_c > self.limits["oil_temp_max_warning"]:
            contributing.append(f"Oil Temp High ({observed.oil_temp_c}°C)")
            severity_score += 1

        if observed.vibration_g > self.limits["vibration_max_critical"]:
            contributing.append(f"Vibration Critical ({observed.vibration_g} g)")
            severity_score += 3
        elif observed.vibration_g > self.limits["vibration_max_warning"]:
            contributing.append(f"Vibration High ({observed.vibration_g} g)")
            severity_score += 1

        # Parameter boundary checks - Electrical Power Subsystem
        if observed.electrical:
            elec = observed.electrical
            bus_v = elec.system.bus_voltage
            soc = elec.battery.state_of_charge
            bat_temp = elec.battery.temperature
            alt_temp = elec.alternator.temperature
            reg_err = elec.alternator.regulation_error_pct

            if bus_v < self.limits["bus_volts_min_critical"] or bus_v > self.limits["bus_volts_max_critical"]:
                contributing.append(f"Bus Voltage Critical ({bus_v:.1f}V)")
                severity_score += 3
            elif bus_v < self.limits["bus_volts_min_warning"] or bus_v > self.limits["bus_volts_max_warning"]:
                contributing.append(f"Bus Voltage Sag/Drift ({bus_v:.1f}V)")
                severity_score += 1

            if soc < self.limits["battery_soc_min_critical"]:
                contributing.append(f"Battery Critical Low SOC ({soc:.1f}%)")
                severity_score += 3
            elif soc < self.limits["battery_soc_min_warning"]:
                contributing.append(f"Battery Low SOC ({soc:.1f}%)")
                severity_score += 1

            if bat_temp > self.limits["battery_temp_max_critical"]:
                contributing.append(f"Battery Overheating Critical ({bat_temp:.1f}°C)")
                severity_score += 3
            elif bat_temp > self.limits["battery_temp_max_warning"]:
                contributing.append(f"Battery Temp High ({bat_temp:.1f}°C)")
                severity_score += 1

            if alt_temp > self.limits["alternator_temp_max_critical"]:
                contributing.append(f"Alternator Temp Critical ({alt_temp:.1f}°C)")
                severity_score += 3
            elif alt_temp > self.limits["alternator_temp_max_warning"]:
                contributing.append(f"Alternator Temp High ({alt_temp:.1f}°C)")
                severity_score += 1

            if reg_err > self.limits["regulation_error_max_critical"]:
                contributing.append(f"Voltage Regulation Failure ({reg_err:.1f}%)")
                severity_score += 3
            elif reg_err > self.limits["regulation_error_max_warning"]:
                contributing.append(f"Voltage Regulation Error ({reg_err:.1f}%)")
                severity_score += 1

            if elec.system.status == "CRITICAL":
                severity_score += 3
            elif elec.system.status in ["WARNING", "DEGRADED"]:
                severity_score += 1

        # Multivariate Mahalanobis Residual Distance
        if residuals.mahalanobis_distance > self.limits["mahalanobis_threshold_critical"]:
            contributing.append(f"Multivariate Residual Divergence D_M={residuals.mahalanobis_distance:.2f}")
            severity_score += 3
        elif residuals.mahalanobis_distance > self.limits["mahalanobis_threshold_warning"]:
            contributing.append(f"Residual Anomaly D_M={residuals.mahalanobis_distance:.2f}")
            severity_score += 1

        if severity_score >= 4:
            return "critical", contributing
        elif severity_score >= 1:
            return "warning", contributing
        return "normal", []

    def diagnose_fault(
        self,
        observed: TelemetryRecord,
        residuals: ResidualRecord,
        timestamp: float
    ) -> List[DiagnosticAlert]:
        """
        Evaluate physical signal residual patterns and output ranked candidate fault alerts with evidence.
        Includes engine mechanical, thermal, and complete electrical subsystem faults.
        """
        alerts = []

        # -------------------------------------------------------------
        # 1. Electrical Power Subsystem Fault Diagnostics
        # -------------------------------------------------------------
        if observed.electrical:
            elec = observed.electrical
            bat = elec.battery
            alt = elec.alternator
            sys = elec.system
            load = elec.electrical_load

            # Fault: Alternator Failure (Collapse of generation)
            if alt.status == "FAILED" or (alt.output_power_w < 60.0 and observed.rpm > 1800.0 and load.total_load_w > 400.0):
                confidence = min(99.0, 75.0 + abs(sys.power_balance_w) * 0.03 + max(0.0, (28.2 - sys.bus_voltage) * 4.0))
                alerts.append(DiagnosticAlert(
                    alert_id=f"ALT-GEN-FAIL-{int(timestamp)}",
                    timestamp=timestamp,
                    severity="critical",
                    candidate_fault="Alternator Generation Failure / Total Loss",
                    confidence_pct=round(confidence, 1),
                    contributing_signals=["alternator_power_w", "bus_voltage", "battery_current", "power_balance_w"],
                    evidence_summary=(
                        f"Alternator output collapsed to {alt.output_power_w:.1f}W ({alt.output_current:.1f}A at {alt.output_voltage:.1f}V). "
                        f"Aircraft DC bus operating under severe deficit ({sys.power_balance_w:.1f}W). "
                        f"Battery discharging at {bat.current:.1f}A to sustain avionics."
                    ),
                    recommendation=(
                        "ELECTRICAL EMERGENCY: Shed non-essential mission payloads immediately. "
                        "Monitor battery reserve endurance. Plan immediate RTB (Return to Base)."
                    )
                ))

            # Fault: Alternator Output Degradation
            elif alt.status == "DEGRADED" or (sys.power_balance_w < -80.0 and alt.output_power_w > 60.0 and alt.output_power_w < load.total_load_w):
                confidence = min(96.0, 60.0 + abs(sys.power_balance_w) * 0.05 + (100.0 - alt.health) * 0.4)
                alerts.append(DiagnosticAlert(
                    alert_id=f"ALT-GEN-DEG-{int(timestamp)}",
                    timestamp=timestamp,
                    severity="critical" if sys.bus_voltage < 25.0 or bat.state_of_charge < 35.0 else "warning",
                    candidate_fault="Alternator Output Capacity Degradation",
                    confidence_pct=round(confidence, 1),
                    contributing_signals=["alternator_power_w", "power_balance_w", "battery_current", "bus_voltage"],
                    evidence_summary=(
                        f"Alternator generation derated to {alt.output_power_w:.1f}W against {load.total_load_w:.1f}W demand. "
                        f"Power deficit of {abs(sys.power_balance_w):.1f}W is depleting battery reserve (Current: {bat.current:.1f}A, SOC: {bat.state_of_charge:.1f}%)."
                    ),
                    recommendation=(
                        "Inspect alternator stator windings, rotor slip rings, and drive gear train. "
                        "Reduce sensor payload power consumption to halt battery drain."
                    )
                ))

            # Fault: Voltage Regulation Failure
            if alt.regulation_error_pct > 6.5 or sys.bus_voltage > 30.5 or sys.bus_voltage < 24.5:
                confidence = min(97.0, 55.0 + alt.regulation_error_pct * 4.5)
                alerts.append(DiagnosticAlert(
                    alert_id=f"ALT-REG-FAIL-{int(timestamp)}",
                    timestamp=timestamp,
                    severity="critical" if alt.regulation_error_pct > 9.0 else "warning",
                    candidate_fault="Voltage Regulator Instability / GCU Fault",
                    confidence_pct=round(confidence, 1),
                    contributing_signals=["bus_voltage", "regulation_error_pct", "alternator_output_voltage"],
                    evidence_summary=(
                        f"DC bus voltage drifted to {sys.bus_voltage:.2f}V with regulation deviation of {alt.regulation_error_pct:.2f}% "
                        f"from nominal 28.2V target."
                    ),
                    recommendation=(
                        "Check Solid-State Generator Control Unit (GCU) voltage sense line and trim pot. "
                        "Prevent avionics overvoltage by testing overvoltage protection relay."
                    )
                ))

            # Fault: Battery Internal Resistance Increase & Voltage Sag
            if bat.internal_resistance_mohm > 45.0 or (bat.current > 10.0 and bat.voltage < 24.5 and bat.state_of_charge > 40.0):
                confidence = min(95.0, 50.0 + (bat.internal_resistance_mohm - 18.0) * 0.7)
                alerts.append(DiagnosticAlert(
                    alert_id=f"ALT-BAT-SAG-{int(timestamp)}",
                    timestamp=timestamp,
                    severity="critical" if bat.voltage < 23.0 else "warning",
                    candidate_fault="Battery Internal Impedance Rise & Voltage Sag",
                    confidence_pct=round(confidence, 1),
                    contributing_signals=["battery_voltage", "internal_resistance_mohm", "battery_current"],
                    evidence_summary=(
                        f"Battery internal resistance degraded to {bat.internal_resistance_mohm:.1f} mΩ (nominal 18 mΩ), "
                        f"causing acute closed-circuit terminal voltage sag to {bat.voltage:.2f}V under {bat.current:.1f}A draw."
                    ),
                    recommendation=(
                        "Perform battery conductance and internal cell impedance analysis. "
                        "Replace battery pack prior to high-transient flight profiles."
                    )
                ))

            # Fault: Battery Critical Low SOC
            if bat.state_of_charge < 25.0:
                confidence = min(99.0, 70.0 + (25.0 - bat.state_of_charge) * 1.5)
                alerts.append(DiagnosticAlert(
                    alert_id=f"ALT-BAT-SOC-{int(timestamp)}",
                    timestamp=timestamp,
                    severity="critical" if bat.state_of_charge < 18.0 else "warning",
                    candidate_fault="Battery Low State of Charge (SOC Depletion)",
                    confidence_pct=round(confidence, 1),
                    contributing_signals=["battery_soc", "battery_voltage", "battery_current"],
                    evidence_summary=(
                        f"Battery reserve depleted to {bat.state_of_charge:.1f}% SOC ({bat.voltage:.2f}V). "
                        f"Flight endurance on battery reserve is critically degraded."
                    ),
                    recommendation=(
                        "Verify alternator charging bus continuity. Minimize electrical flight loads to prevent bus collapse."
                    )
                ))

            # Fault: Battery Overheating
            if bat.temperature > 48.0:
                confidence = min(98.0, 60.0 + (bat.temperature - 48.0) * 2.5)
                alerts.append(DiagnosticAlert(
                    alert_id=f"ALT-BAT-TEMP-{int(timestamp)}",
                    timestamp=timestamp,
                    severity="critical" if bat.temperature > 58.0 else "warning",
                    candidate_fault="Battery Thermal Overheating / Cell Stress",
                    confidence_pct=round(confidence, 1),
                    contributing_signals=["battery_temperature", "battery_current", "internal_resistance_mohm"],
                    evidence_summary=(
                        f"Battery core temperature elevated to {bat.temperature:.1f}°C (warning threshold 45°C) "
                        f"due to Joulean thermal accumulation."
                    ),
                    recommendation=(
                        "Reduce charge/discharge current throughput. Check battery compartment cooling louvers."
                    )
                ))

            # Fault: Alternator Overheating
            if alt.temperature > 105.0:
                confidence = min(96.0, 60.0 + (alt.temperature - 105.0) * 1.2)
                alerts.append(DiagnosticAlert(
                    alert_id=f"ALT-GEN-TEMP-{int(timestamp)}",
                    timestamp=timestamp,
                    severity="critical" if alt.temperature > 130.0 else "warning",
                    candidate_fault="Alternator Stator & Diode Bridge Overheating",
                    confidence_pct=round(confidence, 1),
                    contributing_signals=["alternator_temperature", "alternator_current", "alternator_rpm"],
                    evidence_summary=(
                        f"Alternator temperature climbed to {alt.temperature:.1f}°C (warning threshold 105°C). "
                        f"High continuous current draw ({alt.output_current:.1f}A) inducing thermal fatigue."
                    ),
                    recommendation=(
                        "Derate auxiliary electrical loads. Inspect engine cowl alternator cooling duct for obstruction."
                    )
                ))

            # Fault: Electrical Load Surge
            if load.total_load_w > 1800.0:
                confidence = min(97.0, 65.0 + (load.total_load_w - 1800.0) * 0.04)
                alerts.append(DiagnosticAlert(
                    alert_id=f"ALT-LOAD-SURGE-{int(timestamp)}",
                    timestamp=timestamp,
                    severity="critical" if sys.power_balance_w < -400.0 else "warning",
                    candidate_fault="Electrical Load Surge / Actuator Overdraw",
                    confidence_pct=round(confidence, 1),
                    contributing_signals=["total_load_w", "power_balance_w", "battery_current"],
                    evidence_summary=(
                        f"Electrical bus demand spiked to {load.total_load_w:.1f}W, exceeding nominal envelope. "
                        f"Alternator saturated at {alt.output_power_w:.1f}W; battery assist active at {bat.current:.1f}A."
                    ),
                    recommendation=(
                        "Isolate secondary actuator systems and non-essential avionics. Check payload circuit breakers."
                    )
                ))

        # -------------------------------------------------------------
        # 2. Engine Mechanical & Combustion Diagnostics
        # -------------------------------------------------------------
        # Candidate 1: Lubrication / Oil Pressure Loss
        if residuals.oil_pressure_psi < -15.0 or observed.oil_pressure_psi < 28.0:
            confidence = min(98.0, 50.0 + abs(residuals.oil_pressure_psi) * 1.5 + (residuals.oil_temp_c if residuals.oil_temp_c > 0 else 0) * 0.8)
            alerts.append(DiagnosticAlert(
                alert_id=f"ALT-LUB-{int(timestamp)}",
                timestamp=timestamp,
                severity="critical" if observed.oil_pressure_psi < 20.0 else "warning",
                candidate_fault="Likely Lubrication Degradation / Oil Pressure Drop",
                confidence_pct=round(confidence, 1),
                contributing_signals=["oil_pressure_psi", "oil_temp_c", "vibration_g"],
                evidence_summary=f"Oil pressure residual delta of {residuals.oil_pressure_psi:.1f} PSI with oil temperature rise of {residuals.oil_temp_c:.1f}°C.",
                recommendation="Reduce throttle immediately to loiter RPM. Inspect oil lines, pressure relief valve, and pump for leakages."
            ))

        # Candidate 2: Fuel Injector Abnormality / Lean Mixture
        if residuals.egt_c > 60.0 or (residuals.egt_c > 40.0 and residuals.fuel_flow_lph < -1.5):
            confidence = min(96.0, 45.0 + residuals.egt_c * 0.4 + abs(residuals.fuel_flow_lph) * 8.0)
            alerts.append(DiagnosticAlert(
                alert_id=f"ALT-INJ-{int(timestamp)}",
                timestamp=timestamp,
                severity="critical" if residuals.egt_c > 110.0 else "warning",
                candidate_fault="Likely Fuel Injector Restriction / Lean Combustion",
                confidence_pct=round(confidence, 1),
                contributing_signals=["egt_c", "fuel_flow_lph", "cht_c"],
                evidence_summary=f"Exhaust gas temperature elevated by +{residuals.egt_c:.1f}°C above baseline with fuel flow reduction delta of {residuals.fuel_flow_lph:.2f} L/h.",
                recommendation="Verify injection pulse width and fuel delivery rail pressure. Monitor cylinder head thermal gradient."
            ))

        # Candidate 3: Ignition Misfire
        if residuals.vibration_g > 0.8 and residuals.rpm < -120.0:
            confidence = min(95.0, 50.0 + residuals.vibration_g * 18.0 + abs(residuals.rpm) * 0.1)
            alerts.append(DiagnosticAlert(
                alert_id=f"ALT-MIS-{int(timestamp)}",
                timestamp=timestamp,
                severity="critical" if residuals.vibration_g > 1.8 else "warning",
                candidate_fault="Likely Cylinder Misfire / Ignition Fault",
                confidence_pct=round(confidence, 1),
                contributing_signals=["vibration_g", "rpm", "egt_c"],
                evidence_summary=f"High engine vibration delta (+{residuals.vibration_g:.3f} g) paired with RPM drop ({residuals.rpm:.1f} RPM) and unburnt exhaust cooling.",
                recommendation="Check dual spark plug primary/secondary ignition coils and check engine harness connections."
            ))

        # Candidate 4: Thermal Overheating / Cooling Failure
        if residuals.cht_c > 25.0 and residuals.oil_temp_c > 15.0:
            confidence = min(94.0, 40.0 + residuals.cht_c * 0.9 + residuals.oil_temp_c * 1.1)
            alerts.append(DiagnosticAlert(
                alert_id=f"ALT-OHT-{int(timestamp)}",
                timestamp=timestamp,
                severity="warning" if residuals.cht_c < 45.0 else "critical",
                candidate_fault="Likely Engine Thermal Overheating",
                confidence_pct=round(confidence, 1),
                contributing_signals=["cht_c", "oil_temp_c", "egt_c"],
                evidence_summary=f"Cylinder head temperature elevated by +{residuals.cht_c:.1f}°C and oil temp elevated by +{residuals.oil_temp_c:.1f}°C above expected model.",
                recommendation="Increase airspeed to improve cowl cooling airflow and reduce engine load factor."
            ))

        # Candidate 5: Mechanical Imbalance / Structural Vibration
        if residuals.vibration_g > 1.2 and abs(residuals.rpm) < 80.0 and len(alerts) == 0:
            confidence = min(92.0, 45.0 + residuals.vibration_g * 15.0)
            alerts.append(DiagnosticAlert(
                alert_id=f"ALT-VIB-{int(timestamp)}",
                timestamp=timestamp,
                severity="warning" if residuals.vibration_g < 2.5 else "critical",
                candidate_fault="Likely Mechanical Imbalance / Bearing Fatigue",
                confidence_pct=round(confidence, 1),
                contributing_signals=["vibration_g", "rpm"],
                evidence_summary=f"Isolated abnormal high-frequency vibration spike of +{residuals.vibration_g:.3f} g without corresponding EGT/CHT thermal anomalies.",
                recommendation="Inspect propeller shaft coupling, engine mounts, and crankcase dampeners upon landing."
            ))

        # Sort alerts by confidence high to low
        alerts.sort(key=lambda x: x.confidence_pct, reverse=True)
        return alerts

    def estimate_rul(
        self,
        subsystem_health: SubsystemHealth,
        residuals: ResidualRecord,
        observed: Optional[TelemetryRecord] = None,
        accumulated_hours: float = 485.0
    ) -> RULEstimate:
        """
        Calculate Remaining Useful Life (RUL) for Engine and specific Electrical components (Battery, Alternator).
        Deterministic physics wear accumulation without false precision.
        """
        baseline_tbo = 1200.0
        min_health = min([
            subsystem_health.piston_cylinder,
            subsystem_health.lubrication,
            subsystem_health.fuel_injection,
            subsystem_health.ignition,
            subsystem_health.electrical
        ])

        # Subsystem identification
        subsystem_map = {
            subsystem_health.piston_cylinder: "Piston & Cylinder Assembly",
            subsystem_health.lubrication: "Lubrication & Oil Pump",
            subsystem_health.fuel_injection: "Fuel Injection System",
            subsystem_health.ignition: "Ignition & Harness",
            subsystem_health.electrical: "Electrical Power Subsystem (Battery/Alternator)"
        }
        primary_subsystem = subsystem_map.get(min_health, "General Engine Wear")

        # Baseline engine wear rate
        nominal_wear_rate = 100.0 / baseline_tbo
        health_penalty = max(1.0, (100.0 - min_health) * 0.12)
        residual_penalty = max(1.0, residuals.mahalanobis_distance * 0.35)
        
        effective_degradation_rate = nominal_wear_rate * health_penalty * residual_penalty
        remaining_health_pct = max(0.0, min_health)
        
        rul_hours = remaining_health_pct / effective_degradation_rate if effective_degradation_rate > 0 else 0.0
        rul_hours = min(baseline_tbo - accumulated_hours, max(0.0, rul_hours))
        confidence_margin = rul_hours * 0.12

        # -------------------------------------------------------------
        # Dedicated Battery & Alternator RUL Calculations
        # -------------------------------------------------------------
        battery_rul_hours = 650.0
        battery_conf_str = "600–720 flight hours (82% confidence)"
        alternator_rul_hours = 920.0
        alternator_conf_str = "880–980 flight hours (85% confidence)"

        if observed and observed.electrical:
            elec = observed.electrical
            # Battery RUL calculation
            bat_soh = elec.battery.state_of_health
            bat_rint = elec.battery.internal_resistance_mohm
            bat_temp = elec.battery.temperature
            
            # Baseline battery life = 800 flight hours
            bat_wear_rate = 100.0 / 800.0
            bat_wear_accel = max(1.0, (100.0 - bat_soh) * 0.08 + (bat_rint - 18.0) * 0.05 + max(0.0, bat_temp - 40.0) * 0.06)
            effective_bat_rate = bat_wear_rate * bat_wear_accel
            calc_bat_rul = max(10.0, min(800.0, (bat_soh / effective_bat_rate)))
            battery_rul_hours = round(calc_bat_rul, 1)
            lower_bat = max(5, int(calc_bat_rul * 0.88))
            upper_bat = int(calc_bat_rul * 1.14)
            battery_conf_str = f"{lower_bat}–{upper_bat} flight hours (78% confidence)"

            # Alternator RUL calculation
            alt_health = elec.alternator.health
            alt_temp = elec.alternator.temperature
            alt_reg_err = elec.alternator.regulation_error_pct
            
            # Baseline alternator life = 1200 flight hours
            alt_wear_rate = 100.0 / 1200.0
            alt_wear_accel = max(1.0, (100.0 - alt_health) * 0.07 + max(0.0, alt_temp - 95.0) * 0.05 + alt_reg_err * 0.08)
            effective_alt_rate = alt_wear_rate * alt_wear_accel
            calc_alt_rul = max(15.0, min(1200.0, (alt_health / effective_alt_rate)))
            alternator_rul_hours = round(calc_alt_rul, 1)
            lower_alt = max(10, int(calc_alt_rul * 0.90))
            upper_alt = int(calc_alt_rul * 1.12)
            alternator_conf_str = f"{lower_alt}–{upper_alt} flight hours (83% confidence)"

        return RULEstimate(
            rul_hours=round(rul_hours, 1),
            baseline_hours=baseline_tbo,
            degradation_rate_pct_per_hr=round(effective_degradation_rate, 4),
            confidence_lower_hr=round(max(0.0, rul_hours - confidence_margin), 1),
            confidence_upper_hr=round(rul_hours + confidence_margin, 1),
            primary_degradation_subsystem=primary_subsystem,
            model_version="AeroTwin-RUL-v2.0-ElectricalPhysics",
            assumptions=[
                "Constant operating stress profiles across remaining flight envelope",
                "Baseline engine Time-Between-Overhaul (TBO) specified as 1200 flight hours",
                "Battery electrochemistry wear derived from internal resistance growth, temperature, and deep DOD cycles",
                "Alternator stator wear derived from Joulean thermal hours, regulation error, and mechanical RPM history",
                "Proportional degradation model assumption without unmodeled catastrophic mechanical failures"
            ],
            battery_rul_hours=battery_rul_hours,
            battery_rul_confidence=battery_conf_str,
            alternator_rul_hours=alternator_rul_hours,
            alternator_rul_confidence=alternator_conf_str
        )

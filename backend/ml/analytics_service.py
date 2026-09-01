import math
from typing import List, Tuple, Dict
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
    - Multivariate Anomaly Detection
    - Ranked Explainable Fault Diagnosis
    - Physics-Informed Degradation & RUL Estimation
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
        }

    def detect_anomalies(
        self,
        observed: TelemetryRecord,
        residuals: ResidualRecord
    ) -> Tuple[str, List[str]]:
        """
        Determine anomaly severity and list contributing signals.
        Returns (status: 'normal'|'warning'|'critical', contributing_signals: List[str])
        """
        contributing = []
        severity_score = 0

        # Parameter boundary checks
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
        """
        alerts = []

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
        accumulated_hours: float = 485.0
    ) -> RULEstimate:
        """
        Calculate Remaining Useful Life (RUL) based on physics wear accumulation model.
        Baseline engine overhaul interval (TBO) = 1200.0 hours.
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
            subsystem_health.ignition: "Ignition & Electrical",
            subsystem_health.electrical: "Alternator & Battery"
        }
        primary_subsystem = subsystem_map.get(min_health, "General Engine Wear")

        # Baseline linear wear rate = 100% / 1200 hours = 0.0833% per hour
        nominal_wear_rate = 100.0 / baseline_tbo

        # Degradation acceleration factor based on residual severity & minimum subsystem health
        health_penalty = max(1.0, (100.0 - min_health) * 0.12)
        residual_penalty = max(1.0, residuals.mahalanobis_distance * 0.4)
        
        effective_degradation_rate = nominal_wear_rate * health_penalty * residual_penalty

        # Remaining health percentage
        remaining_health_pct = max(0.0, min_health)

        # RUL in hours
        rul_hours = remaining_health_pct / effective_degradation_rate if effective_degradation_rate > 0 else 0.0
        rul_hours = min(baseline_tbo - accumulated_hours, max(0.0, rul_hours))

        # Confidence bounds (±12% under model assumptions)
        confidence_margin = rul_hours * 0.12

        return RULEstimate(
            rul_hours=round(rul_hours, 1),
            baseline_hours=baseline_tbo,
            degradation_rate_pct_per_hr=round(effective_degradation_rate, 4),
            confidence_lower_hr=round(max(0.0, rul_hours - confidence_margin), 1),
            confidence_upper_hr=round(rul_hours + confidence_margin, 1),
            primary_degradation_subsystem=primary_subsystem,
            model_version="AeroTwin-RUL-v1.4-PhysicsML",
            assumptions=[
                "Constant operating stress profiles across remaining flight envelope",
                "Baseline engine Time-Between-Overhaul (TBO) specified as 1200 flight hours",
                "Wear acceleration derived from physics residual deltas and thermal/vibration stress",
                "Proportional degradation model assumption without unmodeled catastrophic mechanical failures"
            ]
        )

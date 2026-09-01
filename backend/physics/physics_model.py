import math
from backend.schemas.telemetry import TelemetryRecord, ResidualRecord, MissionPhase


class PhysicsEngineModel:
    """
    Physics-Informed Expected-State Model for MALE UAV Aero-Piston Engines.
    Uses thermodynamics, barometric lapse, throttle-load curves, and engine heat balance
    to derive baseline expected telemetry signals.
    """

    def __init__(self, displacement_cc: float = 2500.0, max_rpm: float = 6200.0):
        self.displacement_cc = displacement_cc
        self.max_rpm = max_rpm

    def compute_expected(
        self,
        timestamp: float,
        throttle_pct: float,
        altitude_ft: float,
        ambient_temp_c: float,
        mission_phase: MissionPhase,
        engine_id: str = "UAV-ENG-26054",
        mission_id: str = "MIS-ALPHA-01"
    ) -> TelemetryRecord:
        """
        Calculate expected nominal baseline telemetry values.
        """
        throttle = max(0.0, min(100.0, throttle_pct)) / 100.0

        # Barometric pressure drop with altitude: P_alt = P0 * exp(-alt / 29000)
        air_density_ratio = math.exp(-altitude_ft / 29000.0)

        # Expected RPM based on throttle and air density
        base_rpm = 1200.0 + throttle * (self.max_rpm - 1200.0)
        expected_rpm = base_rpm * math.sqrt(air_density_ratio)

        # Expected Fuel Flow (Liters per hour): proportional to throttle, RPM, and air density
        expected_fuel_flow = (4.0 + 38.0 * (throttle ** 1.3)) * air_density_ratio

        # Expected CHT (°C): Cylinder Head Temp balance between heat input (throttle) and cooling airflow
        heat_input = throttle * 75.0
        cooling = 0.005 * expected_rpm * 0.4 + max(-20.0, ambient_temp_c) * 0.2
        expected_cht = 115.0 + heat_input - cooling + (altitude_ft * 0.0005)

        # Expected EGT (°C): Exhaust Gas Temp increases with throttle & lean mixture at higher altitude
        expected_egt = 460.0 + throttle * 310.0 + (1.0 - air_density_ratio) * 40.0

        # Expected Oil Pressure (PSI): Increases with RPM up to pressure relief valve threshold
        oil_viscosity_factor = max(0.8, 1.2 - (expected_cht - 150.0) * 0.002)
        expected_oil_pressure = min(85.0, (18.0 + (expected_rpm / self.max_rpm) * 62.0) * oil_viscosity_factor)

        # Expected Oil Temperature (°C): Tracks CHT with thermal hysteresis
        expected_oil_temp = 65.0 + throttle * 48.0 + ambient_temp_c * 0.4

        # Expected Vibration (g RMS): Power-law relationship with RPM
        expected_vibration = 0.3 + 1.8 * ((expected_rpm / self.max_rpm) ** 2.2)

        # Expected Injection Timing (° BTDC): Advances at higher RPM and lighter load
        expected_injection_timing = 12.0 + (expected_rpm / self.max_rpm) * 16.0 - throttle * 4.0

        # Expected Battery Volts: Alternator output stabilized above idle
        expected_battery_volts = 28.2 if expected_rpm > 1800.0 else (24.0 + (expected_rpm / 1800.0) * 4.2)

        return TelemetryRecord(
            timestamp=timestamp,
            engine_id=engine_id,
            mission_id=mission_id,
            mission_phase=mission_phase,
            throttle_pct=throttle_pct,
            altitude_ft=altitude_ft,
            ambient_temp_c=ambient_temp_c,
            rpm=round(expected_rpm, 1),
            cht_c=round(expected_cht, 1),
            egt_c=round(expected_egt, 1),
            oil_pressure_psi=round(expected_oil_pressure, 1),
            oil_temp_c=round(expected_oil_temp, 1),
            fuel_flow_lph=round(expected_fuel_flow, 2),
            vibration_g=round(expected_vibration, 3),
            injection_timing_deg=round(expected_injection_timing, 1),
            battery_volts=round(expected_battery_volts, 2),
            source_type="physics_expected",
            schema_version="1.0"
        )

    def calculate_residuals(self, observed: TelemetryRecord, expected: TelemetryRecord) -> ResidualRecord:
        """
        Calculate vector residuals (Observed - Expected) and Mahalanobis statistical distance.
        """
        delta_rpm = observed.rpm - expected.rpm
        delta_cht = observed.cht_c - expected.cht_c
        delta_egt = observed.egt_c - expected.egt_c
        delta_oil_press = observed.oil_pressure_psi - expected.oil_pressure_psi
        delta_oil_temp = observed.oil_temp_c - expected.oil_temp_c
        delta_fuel = observed.fuel_flow_lph - expected.fuel_flow_lph
        delta_vib = observed.vibration_g - expected.vibration_g
        delta_timing = observed.injection_timing_deg - expected.injection_timing_deg
        delta_volts = observed.battery_volts - expected.battery_volts

        # Standard deviations for normalization (nominal variation tolerances)
        norm_scores = [
            (delta_rpm / 45.0) ** 2,
            (delta_cht / 8.0) ** 2,
            (delta_egt / 18.0) ** 2,
            (delta_oil_press / 5.0) ** 2,
            (delta_oil_temp / 4.5) ** 2,
            (delta_fuel / 1.2) ** 2,
            (delta_vib / 0.15) ** 2,
            (delta_timing / 1.5) ** 2,
            (delta_volts / 0.4) ** 2
        ]
        mahalanobis_dist = math.sqrt(sum(norm_scores))

        return ResidualRecord(
            rpm=round(delta_rpm, 1),
            cht_c=round(delta_cht, 1),
            egt_c=round(delta_egt, 1),
            oil_pressure_psi=round(delta_oil_press, 1),
            oil_temp_c=round(delta_oil_temp, 1),
            fuel_flow_lph=round(delta_fuel, 2),
            vibration_g=round(delta_vib, 3),
            injection_timing_deg=round(delta_timing, 1),
            battery_volts=round(delta_volts, 2),
            mahalanobis_distance=round(mahalanobis_dist, 3)
        )

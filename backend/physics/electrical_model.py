import math
from typing import Dict, Tuple, Optional
from backend.schemas.telemetry import (
    BatteryTelemetry,
    AlternatorTelemetry,
    ElectricalLoadTelemetry,
    SystemElectricalTelemetry,
    ElectricalState,
    MissionPhase,
    FaultType
)


class ElectricalSubsystemPhysicsModel:
    """
    Physics-Informed Digital-Twin Electrical Subsystem for DRDO RUSTOM MALE UAV.
    
    Coupled Components:
    1. Alternator: Engine-driven (1.8x RPM gear ratio), solid-state regulation, stator thermal dynamics.
    2. Aircraft Load: Configurable flight-phase electrical demand + avionics & actuators.
    3. Power Balance: Alternator Generation - Aircraft Load = Battery Charge/Discharge.
    4. Battery: LiFePO4 / Aircraft sealed buffer battery with electrochemistry, Coulomb counting SOC,
       internal resistance R_int dynamics, Joulean heating, and cycle/thermal SOH degradation.
    5. Voltage Regulation & Bus: 28.2V DC nominal bus with realistic sag under overload or alternator failure.
    """

    def __init__(self):
        # Hardware Specifications (28V Aircraft DC System)
        self.nominal_bus_voltage = 28.2  # Volts (regulated alternator output)
        self.battery_nominal_voltage = 25.6  # 8S LiFePO4 nominal (3.2V x 8)
        self.battery_capacity_ah = 28.0  # Ampere-hours (716.8 Wh)
        self.battery_nominal_rint = 0.018  # 18 mOhms baseline internal resistance
        self.alternator_max_current = 70.0  # Amps maximum at rated RPM
        self.alternator_gear_ratio = 1.8  # Driven at 1.8x engine crankshaft RPM
        self.charging_efficiency = 0.92  # Battery charge acceptance efficiency
        
        # State Variables (Continuous Simulation Time)
        self.battery_soc = 92.0  # State of Charge (%)
        self.battery_soh = 98.5  # State of Health (%)
        self.battery_internal_resistance = 0.018  # Ohms
        self.battery_temp_c = 22.0  # °C
        self.alternator_temp_c = 45.0  # °C
        self.alternator_health = 98.0  # %
        self.accumulated_flight_hours = 312.0  # Hours
        self.charge_discharge_cycles = 142.0

        # Degradation Accumulators
        self.deep_discharge_seconds = 0.0
        self.overheat_seconds = 0.0

    def reset(self):
        self.battery_soc = 92.0
        self.battery_soh = 98.5
        self.battery_internal_resistance = 0.018
        self.battery_temp_c = 22.0
        self.alternator_temp_c = 45.0
        self.alternator_health = 98.0
        self.accumulated_flight_hours = 312.0
        self.charge_discharge_cycles = 142.0
        self.deep_discharge_seconds = 0.0
        self.overheat_seconds = 0.0

    def compute_expected_load(self, phase: MissionPhase, ambient_temp_c: float = 15.0) -> Tuple[float, float, float]:
        """
        Calculates configurable expected electrical load profiles per mission phase.
        Returns (total_load_w, essential_load_w, peak_load_w).
        """
        # Essential base avionics + flight computer + ignition + primary comms
        essential_load = 420.0  # Watts
        
        # Environmental heater factor (pitot heat, fuel heaters active in cold air)
        heater_load = max(0.0, (10.0 - ambient_temp_c) * 8.0)

        phase_loads = {
            MissionPhase.TAKEOFF: 1250.0,  # Boost pumps, pitot heat, control surface actuators
            MissionPhase.CLIMB: 1050.0,    # Continuous climb pumps, avionics, sensors
            MissionPhase.CRUISE: 820.0,    # Steady-state surveillance payload, standard radar/comm
            MissionPhase.LOITER: 750.0,    # Low-drag, sustained sensor package, maximum endurance
            MissionPhase.RETURN: 880.0,    # High-power datalink telemetry, navigation guidance
            MissionPhase.LANDING: 1150.0   # Gear retraction/extension actuators, landing lights
        }

        base_load = phase_loads.get(phase, 850.0)
        total_load = base_load + heater_load
        peak_load = total_load * 1.35

        return round(total_load, 1), round(essential_load, 1), round(peak_load, 1)

    def compute_battery_ocv(self, soc: float) -> float:
        """
        Calculates battery Open Circuit Voltage (OCV) as a function of State of Charge (SOC)
        for an 8S LiFePO4 aerospace pack (nominal 25.6V, float 27.2V, flat plateau 26.4V).
        """
        norm_soc = max(0.0, min(100.0, soc)) / 100.0
        if norm_soc >= 0.90:
            # Upper knee: 26.8V to 27.6V
            return 26.6 + (norm_soc - 0.90) * 10.0
        elif norm_soc >= 0.20:
            # Flat plateau: 25.8V to 26.6V
            return 25.8 + (norm_soc - 0.20) * (0.8 / 0.70)
        else:
            # Lower knee (rapid voltage drop under 20% SOC): 21.0V to 25.8V
            return 21.0 + (norm_soc / 0.20) * 4.8

    def step(
        self,
        dt_seconds: float,
        engine_rpm: float,
        phase: MissionPhase,
        ambient_temp_c: float = 15.0,
        altitude_ft: float = 10000.0,
        active_fault: FaultType = FaultType.NONE,
        fault_severity: float = 0.0,
        time_since_fault: float = 0.0
    ) -> ElectricalState:
        """
        Advances the electrical subsystem physics by dt_seconds.
        Couples engine RPM, electrical demand, power balance, electrochemistry, and degradation.
        """
        ramp = min(1.0, time_since_fault / 10.0) * fault_severity if active_fault != FaultType.NONE else 0.0

        # 1. Aircraft Electrical Load Calculation
        total_load, essential_load, peak_load = self.compute_expected_load(phase, ambient_temp_c)
        
        # Fault: Electrical Load Surge
        if active_fault == FaultType.ELECTRICAL_LOAD_SURGE:
            load_surge = 950.0 * ramp  # Sudden short circuit or actuator stall surge
            total_load += load_surge
            peak_load += load_surge * 1.2

        # 2. Alternator Mechanical Drive & Generation
        alternator_rpm = engine_rpm * self.alternator_gear_ratio
        
        # Alternator cut-in speed and RPM-dependent generation curve
        # Cut-in around 1500 alternator RPM (approx 830 engine RPM)
        if alternator_rpm < 1200.0:
            rpm_factor = 0.0
        elif alternator_rpm < 3600.0:
            rpm_factor = (alternator_rpm - 1200.0) / 2400.0
        else:
            rpm_factor = 1.0

        # Base alternator output capability
        max_available_current = self.alternator_max_current * rpm_factor * (self.alternator_health / 100.0)
        base_voltage_target = self.nominal_bus_voltage

        # Faults affecting Alternator
        if active_fault == FaultType.ALTERNATOR_FAILURE:
            # Complete generation collapse
            max_available_current *= max(0.0, 1.0 - ramp)
            base_voltage_target = 0.0 if ramp > 0.9 else self.nominal_bus_voltage * (1.0 - ramp)

        elif active_fault == FaultType.ALTERNATOR_OUTPUT_DEGRADATION:
            # Stator winding / diode drop reducing capacity by up to 85%
            max_available_current *= max(0.15, 1.0 - (0.85 * ramp))

        elif active_fault == FaultType.ALTERNATOR_REGULATION_FAILURE:
            # Voltage regulator drifting out of specification (overvoltage or undervoltage)
            drift_direction = 1.0 if fault_severity > 0.5 else -1.0
            base_voltage_target += drift_direction * (5.5 * ramp)  # Can reach 33.7V or 22.7V

        elif active_fault == FaultType.ALTERNATOR_OVERHEATING:
            # Thermal derating of diode bridge
            max_available_current *= max(0.4, 1.0 - (0.5 * ramp))

        # 3. Closed-Loop Bus Voltage & Power Balance
        # Desired bus power by aircraft load
        bus_voltage_target = base_voltage_target if base_voltage_target > 0.0 else self.battery_nominal_voltage
        current_demand_from_bus = total_load / max(18.0, bus_voltage_target)

        # Alternator supplies as much current as it can up to max_available_current
        alt_output_current = min(max_available_current, current_demand_from_bus)
        alt_output_power = bus_voltage_target * alt_output_current
        
        # Net power balance on DC bus: Alternator Output - Total Load
        power_balance = alt_output_power - total_load

        # Fault: Charging System Fault (Open-circuit relay/fuse between alternator and battery)
        charging_system_broken = (active_fault == FaultType.CHARGING_SYSTEM_FAULT and ramp > 0.2)

        # 4. Battery Dynamics & Electrochemistry
        # Fault: Battery Internal Resistance Increase
        effective_rint = self.battery_internal_resistance
        if active_fault == FaultType.BATTERY_INTERNAL_RESISTANCE_INCREASE:
            effective_rint += 0.075 * ramp  # R_int jumps from 18mΩ up to ~93mΩ
        elif active_fault == FaultType.BATTERY_VOLTAGE_SAG:
            effective_rint += 0.055 * ramp  # High dynamic impedance causes acute sag under load

        # Fault: Battery Low SOC
        if active_fault == FaultType.BATTERY_LOW_SOC:
            target_soc = max(8.0, 18.0 * (1.0 - ramp))
            self.battery_soc = max(target_soc, self.battery_soc - 2.5 * dt_seconds * ramp)

        battery_ocv = self.compute_battery_ocv(self.battery_soc)

        if power_balance < 0.0:
            # Alternator is insufficient or failed: Battery DISCHARGES to support bus deficit
            deficit_power = abs(power_balance)
            # Closed-circuit equation: P = V_term * I = (V_oc - I * R_int) * I  =>  R_int * I^2 - V_oc * I + P = 0
            # Quadratic solution: I = (V_oc - sqrt(V_oc^2 - 4 * R_int * P)) / (2 * R_int)
            disc = max(0.0, battery_ocv ** 2 - 4.0 * effective_rint * deficit_power)
            battery_current = (battery_ocv - math.sqrt(disc)) / (2.0 * max(0.001, effective_rint))
            battery_voltage = max(16.0, battery_ocv - battery_current * effective_rint)
            battery_power = battery_voltage * battery_current  # Positive = discharging

            # Bus voltage sags to match battery terminal voltage under load
            bus_voltage = battery_voltage
            alt_output_voltage = bus_voltage

        elif power_balance > 0.0 and not charging_system_broken:
            # Surplus generation: Battery CHARGES from alternator excess
            surplus_power = power_balance
            charge_power = min(surplus_power * self.charging_efficiency, 550.0)  # Max charge limit ~20A
            
            # If battery is full (SOC > 98%), float charging tapers off
            if self.battery_soc > 98.0:
                charge_power *= max(0.05, (100.0 - self.battery_soc) / 2.0)

            battery_voltage = min(28.8, battery_ocv + (charge_power / max(1.0, battery_ocv)) * effective_rint)
            battery_current = -(charge_power / max(18.0, battery_voltage))  # Negative = charging
            battery_power = battery_voltage * battery_current  # Negative = charging

            bus_voltage = bus_voltage_target
            alt_output_voltage = bus_voltage

        else:
            # Standby / float / isolated
            battery_current = 0.0
            battery_voltage = battery_ocv
            battery_power = 0.0
            bus_voltage = bus_voltage_target if alt_output_power > 0 else battery_ocv
            alt_output_voltage = bus_voltage

        # Update Battery SOC via Coulomb Counting
        # dSOC/dt = - (I_batt * dt) / (Capacity_Ah * 3600) * 100
        delta_soc = -(battery_current * dt_seconds) / (self.battery_capacity_ah * 3600.0) * 100.0
        self.battery_soc = max(0.0, min(100.0, self.battery_soc + delta_soc))

        # Battery Thermal Model: Joulean Heating (I^2 * R) vs Convective Cooling
        joule_heat = (battery_current ** 2) * effective_rint  # Watts
        cooling_heat = 1.2 * (self.battery_temp_c - ambient_temp_c)  # Watts
        net_heat_w = joule_heat - cooling_heat

        # Fault: Battery Overheating
        if active_fault == FaultType.BATTERY_OVERHEATING:
            net_heat_w += 280.0 * ramp  # Thermal runaway exothermic heating

        self.battery_temp_c += (net_heat_w / 350.0) * dt_seconds  # Thermal capacitance ~350 J/K
        self.battery_temp_c = max(ambient_temp_c, min(95.0, self.battery_temp_c))

        # Alternator Thermal Model: Stator Copper Loss & Airflow Cooling
        stator_heat = (alt_output_current ** 2) * 0.045
        airspeed_cooling = (0.8 + (engine_rpm / 6000.0) * 2.5) * (self.alternator_temp_c - ambient_temp_c)
        if active_fault == FaultType.ALTERNATOR_OVERHEATING:
            stator_heat += 450.0 * ramp  # Rectifier diode short / friction

        net_alt_heat = stator_heat - airspeed_cooling
        self.alternator_temp_c += (net_alt_heat / 280.0) * dt_seconds
        self.alternator_temp_c = max(ambient_temp_c, min(160.0, self.alternator_temp_c))

        # Alternator Regulation Error Calculation
        reg_error_pct = abs(bus_voltage - self.nominal_bus_voltage) / self.nominal_bus_voltage * 100.0

        # 5. Deterministic Degradation & State of Health (SOH)
        # SOH degrades with deep discharge, temperature overstress, and high C-rates
        hour_increment = dt_seconds / 3600.0
        self.accumulated_flight_hours += hour_increment
        
        # Base wear rate ~ 0.002% per flight hour
        base_soh_loss = 0.002 * hour_increment
        
        # Acceleration factors
        temp_stress = max(0.0, (self.battery_temp_c - 40.0) * 0.0008) * hour_increment
        dod_stress = (1.0 if self.battery_soc < 25.0 else 0.0) * 0.005 * hour_increment
        high_c_rate = (max(0.0, abs(battery_current) - 25.0) * 0.0003) * hour_increment
        
        total_soh_loss = base_soh_loss + temp_stress + dod_stress + high_c_rate
        self.battery_soh = max(10.0, min(100.0, self.battery_soh - total_soh_loss))

        # Internal Resistance growth tied to SOH degradation
        soh_degradation = max(0.0, 100.0 - self.battery_soh)
        self.battery_internal_resistance = self.battery_nominal_rint + (soh_degradation * 0.00045)

        # Alternator Health Degradation
        alt_thermal_stress = max(0.0, (self.alternator_temp_c - 105.0) * 0.002) * hour_increment
        alt_wear = (0.0015 * hour_increment) + alt_thermal_stress
        if active_fault in [FaultType.ALTERNATOR_FAILURE, FaultType.ALTERNATOR_OUTPUT_DEGRADATION]:
            alt_wear += 0.8 * ramp * hour_increment

        self.alternator_health = max(5.0, min(100.0, self.alternator_health - alt_wear))

        # 6. Derive Subsystem Health States & Status Strings
        # Battery Health
        bat_health_score = 100.0
        if self.battery_soc < 20.0:
            bat_health_score -= (20.0 - self.battery_soc) * 2.5
        elif self.battery_soc < 35.0:
            bat_health_score -= (35.0 - self.battery_soc) * 0.8

        if self.battery_temp_c > 55.0:
            bat_health_score -= (self.battery_temp_c - 55.0) * 2.0
        elif self.battery_temp_c > 42.0:
            bat_health_score -= (self.battery_temp_c - 42.0) * 0.6

        bat_health_score -= (100.0 - self.battery_soh) * 0.4
        bat_health_score -= (effective_rint - self.battery_nominal_rint) * 500.0
        bat_health_score = max(0.0, min(100.0, bat_health_score))

        # Battery Status Category
        if self.battery_soc < 15.0 or self.battery_temp_c > 65.0 or bat_health_score < 35.0:
            battery_status = "CRITICAL"
        elif self.battery_soc < 28.0:
            battery_status = "LOW SOC"
        elif bat_health_score < 65.0 or self.battery_soh < 70.0:
            battery_status = "DEGRADED"
        elif battery_current < -0.5:
            battery_status = "CHARGING"
        elif battery_current > 1.0:
            battery_status = "DISCHARGING"
        else:
            battery_status = "STANDBY"

        # Alternator Health & Status
        alt_health_score = max(0.0, min(100.0, self.alternator_health - (reg_error_pct * 3.5) - max(0.0, (self.alternator_temp_c - 100.0) * 0.8)))
        if active_fault == FaultType.ALTERNATOR_FAILURE and ramp > 0.5:
            alt_health_score = max(0.0, 20.0 * (1.0 - ramp))

        if alt_health_score < 30.0 or (active_fault == FaultType.ALTERNATOR_FAILURE and ramp > 0.6):
            alternator_status = "FAILED"
        elif alt_health_score < 65.0:
            alternator_status = "DEGRADED"
        elif alt_health_score < 85.0 or reg_error_pct > 6.0:
            alternator_status = "UNDERPERFORMING"
        else:
            alternator_status = "NORMAL"

        # Overall System Electrical Health (0-100%)
        voltage_stability_penalty = min(50.0, reg_error_pct * 4.0)
        power_deficit_penalty = min(35.0, (abs(power_balance) / 30.0) if power_balance < 0 else 0.0)
        
        system_health = (
            0.35 * bat_health_score +
            0.35 * alt_health_score +
            0.15 * max(0.0, 100.0 - voltage_stability_penalty * 2.0) +
            0.15 * max(0.0, 100.0 - power_deficit_penalty * 2.0)
        )
        system_health = round(max(0.0, min(100.0, system_health)), 1)

        if system_health >= 90.0:
            system_status = "NORMAL"
        elif system_health >= 70.0:
            system_status = "WARNING"
        elif system_health >= 40.0:
            system_status = "DEGRADED"
        else:
            system_status = "CRITICAL"

        # 7. Assemble Complete Typed Electrical State
        battery_telemetry = BatteryTelemetry(
            voltage=round(battery_voltage, 2),
            current=round(battery_current, 2),
            temperature=round(self.battery_temp_c, 1),
            state_of_charge=round(self.battery_soc, 1),
            state_of_health=round(self.battery_soh, 1),
            internal_resistance_mohm=round(effective_rint * 1000.0, 1),
            power_w=round(battery_power, 1),
            health=round(bat_health_score, 1),
            status=battery_status
        )

        alternator_telemetry = AlternatorTelemetry(
            output_voltage=round(alt_output_voltage, 2),
            output_current=round(alt_output_current, 2),
            output_power_w=round(alt_output_power, 1),
            rpm=round(alternator_rpm, 0),
            temperature=round(self.alternator_temp_c, 1),
            regulation_error_pct=round(reg_error_pct, 2),
            health=round(alt_health_score, 1),
            status=alternator_status
        )

        load_telemetry = ElectricalLoadTelemetry(
            total_load_w=round(total_load, 1),
            essential_load_w=round(essential_load, 1),
            peak_load_w=round(peak_load, 1)
        )

        system_telemetry = SystemElectricalTelemetry(
            bus_voltage=round(bus_voltage, 2),
            power_balance_w=round(power_balance, 1),
            health=system_health,
            status=system_status
        )

        return ElectricalState(
            battery=battery_telemetry,
            alternator=alternator_telemetry,
            electrical_load=load_telemetry,
            system=system_telemetry
        )

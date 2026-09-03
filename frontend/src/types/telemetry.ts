export type MissionPhase = 'takeoff' | 'climb' | 'cruise' | 'loiter' | 'return' | 'landing';

export type FaultType = 
  | 'none'
  | 'misfire'
  | 'injector_abnormality'
  | 'oil_pressure_loss'
  | 'overheating'
  | 'vibration_spike'
  | 'sensor_drift'
  // Electrical Power Subsystem Faults
  | 'battery_low_soc'
  | 'battery_overheating'
  | 'battery_voltage_sag'
  | 'battery_internal_resistance_increase'
  | 'alternator_output_degradation'
  | 'alternator_overheating'
  | 'alternator_regulation_failure'
  | 'alternator_failure'
  | 'electrical_load_surge'
  | 'charging_system_fault';

export interface BatteryTelemetry {
  voltage: number;
  current: number;
  temperature: number;
  state_of_charge: number;
  state_of_health: number;
  internal_resistance_mohm: number;
  power_w: number;
  health: number;
  status: 'CHARGING' | 'DISCHARGING' | 'STANDBY' | 'LOW SOC' | 'DEGRADED' | 'CRITICAL' | string;
}

export interface AlternatorTelemetry {
  output_voltage: number;
  output_current: number;
  output_power_w: number;
  rpm: number;
  temperature: number;
  regulation_error_pct: number;
  health: number;
  status: 'NORMAL' | 'UNDERPERFORMING' | 'DEGRADED' | 'FAILED' | string;
}

export interface ElectricalLoadTelemetry {
  total_load_w: number;
  essential_load_w: number;
  peak_load_w: number;
}

export interface SystemElectricalTelemetry {
  bus_voltage: number;
  power_balance_w: number;
  health: number;
  status: 'NORMAL' | 'WARNING' | 'DEGRADED' | 'CRITICAL' | string;
}

export interface ElectricalState {
  battery: BatteryTelemetry;
  alternator: AlternatorTelemetry;
  electrical_load: ElectricalLoadTelemetry;
  system: SystemElectricalTelemetry;
}

export interface TelemetryRecord {
  timestamp: number;
  engine_id: string;
  mission_id: string;
  mission_phase: MissionPhase;
  throttle_pct: number;
  altitude_ft: number;
  ambient_temp_c: number;
  rpm: number;
  cht_c: number;
  egt_c: number;
  oil_pressure_psi: number;
  oil_temp_c: number;
  fuel_flow_lph: number;
  vibration_g: number;
  injection_timing_deg: number;
  battery_volts: number;
  electrical?: ElectricalState;
  source_type: string;
  schema_version: string;
}

export interface ResidualRecord {
  rpm: number;
  cht_c: number;
  egt_c: number;
  oil_pressure_psi: number;
  oil_temp_c: number;
  fuel_flow_lph: number;
  vibration_g: number;
  injection_timing_deg: number;
  battery_volts: number;
  bus_voltage?: number;
  battery_current_a?: number;
  alternator_power_w?: number;
  mahalanobis_distance: number;
}

export interface SubsystemHealth {
  piston_cylinder: number;
  lubrication: number;
  fuel_injection: number;
  ignition: number;
  electrical: number;
}

export interface DiagnosticAlert {
  alert_id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
  candidate_fault: string;
  confidence_pct: number;
  contributing_signals: string[];
  evidence_summary: string;
  recommendation: string;
}

export interface RULEstimate {
  rul_hours: number;
  baseline_hours: number;
  degradation_rate_pct_per_hr: number;
  confidence_lower_hr: number;
  confidence_upper_hr: number;
  primary_degradation_subsystem: string;
  model_version: string;
  assumptions: string[];
  battery_rul_hours?: number;
  battery_rul_confidence?: string;
  alternator_rul_hours?: number;
  alternator_rul_confidence?: string;
}

export interface ComponentFaultLocation {
  component_id: string;
  component_name: string;
  subsystem: string;
  physical_location: string;
  mesh_anchor: string;
  severity: 'normal' | 'warning' | 'critical';
  correlated_signals: string[];
  callout_text?: string;
}

export interface DigitalTwinState {
  timestamp: number;
  engine_id: string;
  mission_id: string;
  mission_phase: MissionPhase;
  observed: TelemetryRecord;
  expected: TelemetryRecord;
  residuals: ResidualRecord;
  subsystem_health: SubsystemHealth;
  overall_health_score: number;
  active_fault: FaultType;
  fault_severity: number;
  status: 'normal' | 'warning' | 'critical';
  alerts: DiagnosticAlert[];
  rul: RULEstimate | null;
  affected_component?: ComponentFaultLocation | null;
}

export interface UAV3DState {
  engineHealth: number;
  engineStatus: string;
  missionPhase: string;
  activeFault: string;
  activeAlert: string;
  faultSeverity?: number;
  rpm: number;
  cht: number;
  egt: number;
  oilPressure: number;
  vibration: number;
  residualDistance: number;
  expectedRpm?: number;
  expectedCht?: number;
  expectedEgt?: number;
  expectedOilPressure?: number;
  expectedVibration?: number;
  rulHours?: number;
  // Electrical Subsystem 3D Digital Twin State
  electricalHealth?: number;
  busVoltage?: number;
  batterySoc?: number;
  batteryCurrent?: number;
  batteryTemp?: number;
  batteryStatus?: string;
  batteryRint?: number;
  batterySoh?: number;
  alternatorStatus?: string;
  alternatorPower?: number;
  alternatorCurrent?: number;
  alternatorRegError?: number;
  alternatorHealth?: number;
  alternatorTemp?: number;
  activeFaultTarget?: 'battery' | 'alternator' | 'engine' | 'none';
}

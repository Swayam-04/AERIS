export type MissionPhase = 'takeoff' | 'climb' | 'cruise' | 'loiter' | 'return' | 'landing';

export type FaultType = 
  | 'none'
  | 'misfire'
  | 'injector_abnormality'
  | 'oil_pressure_loss'
  | 'overheating'
  | 'vibration_spike'
  | 'sensor_drift';

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
}

export interface UAV3DState {
  engineHealth: number;
  engineStatus: string;
  missionPhase: string;
  activeFault: string;
  activeAlert: string;
  rpm: number;
  cht: number;
  egt: number;
  oilPressure: number;
  vibration: number;
  residualDistance: number;
}

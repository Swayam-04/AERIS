import React from 'react';
import { DigitalTwinState, UAV3DState, MissionPhase } from '../types/telemetry';
import { UAV3DViewer } from '../components/UAV3DViewer';
import { FlightPhaseController } from '../components/FlightPhaseController';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  Activity,
  ShieldAlert,
  Gauge,
  Thermometer,
  Flame,
  Zap,
  BatteryCharging,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers
} from 'lucide-react';

interface OverviewViewProps {
  state: DigitalTwinState | null;
  history: DigitalTwinState[];
  onNavigateToFaults: () => void;
  onNavigateToControl: () => void;
  onSetPhase?: (phase: MissionPhase) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  state,
  history,
  onNavigateToFaults,
  onNavigateToControl,
  onSetPhase
}) => {
  if (!state) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 font-mono text-xs">
        <Activity className="w-5 h-5 animate-spin text-[#38bdf8] mr-2" />
        INITIALIZING AERIS DIGITAL TWIN TELEMETRY STREAM...
      </div>
    );
  }

  const chartData = history.slice(-30).map((s) => ({
    time: `${Math.floor(s.timestamp)}s`,
    rpm_obs: s.observed.rpm,
    rpm_exp: s.expected.rpm,
    cht_obs: s.observed.cht_c,
    cht_exp: s.expected.cht_c,
    egt_obs: s.observed.egt_c,
    egt_exp: s.expected.egt_c,
    oil_press_obs: s.observed.oil_pressure_psi,
    oil_press_exp: s.expected.oil_pressure_psi,
    residual_dm: s.residuals.mahalanobis_distance,
  }));

  const elec = state.observed.electrical;

  const uav3dState: UAV3DState = {
    engineHealth: state.overall_health_score,
    engineStatus: state.status,
    missionPhase: state.mission_phase,
    activeFault: state.active_fault,
    activeAlert: state.alerts[0]?.candidate_fault || 'None',
    faultSeverity: state.fault_severity,
    rpm: state.observed.rpm,
    cht: state.observed.cht_c,
    egt: state.observed.egt_c,
    oilPressure: state.observed.oil_pressure_psi,
    vibration: state.observed.vibration_g,
    residualDistance: state.residuals.mahalanobis_distance,
    electricalHealth: state.subsystem_health.electrical,
    busVoltage: state.observed.battery_volts,
    batterySoc: elec?.battery.state_of_charge,
    batteryCurrent: elec?.battery.current,
    batteryTemp: elec?.battery.temperature,
    batteryStatus: elec?.battery.status,
    batteryRint: elec?.battery.internal_resistance_mohm,
    batterySoh: elec?.battery.state_of_health,
    alternatorStatus: elec?.alternator.status,
    alternatorPower: elec?.alternator.output_power_w,
    alternatorCurrent: elec?.alternator.output_current,
    alternatorRegError: elec?.alternator.regulation_error_pct,
    alternatorHealth: elec?.alternator.health,
    alternatorTemp: elec?.alternator.temperature,
  };

  return (
    <div className="space-y-4">
      {/* 1. Executive Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#38bdf8]" />
            <h1 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
              AERIS Executive Condition & Health Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Aero Engine Reliability & Intelligence System | DRDO RUSTOM MALE UAV
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-2.5 py-1 rounded bg-[#090e1c] border border-[#162035] text-slate-300">
            AIRCRAFT: <strong className="text-[#38bdf8]">DRDO RUSTOM</strong>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#090e1c] border border-[#162035] text-slate-300">
            POWERPLANT: <strong className="text-emerald-400">LYCOMING O-320 (150 HP)</strong>
          </div>
        </div>
      </div>

      {/* 2. Flight Phase Timeline */}
      <FlightPhaseController
        currentPhase={state.mission_phase}
        onSetPhase={onSetPhase}
      />

      {/* 3. CONSOLIDATED INSTRUMENT PANEL */}
      <div className="eng-panel">
        <div className="eng-header flex items-center justify-between">
          <span className="font-sans font-bold text-xs uppercase text-slate-200 tracking-wider flex items-center gap-2">
            <Gauge size={14} className="text-[#38bdf8]" />
            PRIMARY AERO-ENGINE INSTRUMENT MATRIX
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            BASELINE MODEL: <strong className="text-slate-200">PHYSICS-INFORMED EXPERT SYSTEM</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-[#162035] font-mono">
          {/* Overall Health */}
          <div className="p-3 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">Engine Health</span>
            <div className="flex items-baseline justify-between">
              <span className={`text-xl font-bold ${
                state.overall_health_score > 80 ? 'text-emerald-400' :
                state.overall_health_score > 50 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {state.overall_health_score}%
              </span>
              <span className="text-[10px] text-slate-500">TBO 1200h</span>
            </div>
            <div className="w-full bg-[#162035] h-1.5 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${
                  state.overall_health_score > 80 ? 'bg-emerald-400' :
                  state.overall_health_score > 50 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${state.overall_health_score}%` }}
              />
            </div>
          </div>

          {/* RPM Speed */}
          <div className="p-3 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">RPM Speed</span>
            <div className="text-xl font-bold text-slate-100">
              {state.observed.rpm} <span className="text-xs font-normal text-slate-400">RPM</span>
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Expected:</span>
              <span className="text-slate-300">{state.expected.rpm}</span>
            </div>
          </div>

          {/* CHT Temp */}
          <div className="p-3 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">CHT Temperature</span>
            <div className="text-xl font-bold text-slate-100">
              {state.observed.cht_c} <span className="text-xs font-normal text-slate-400">°C</span>
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Expected:</span>
              <span className="text-slate-300">{state.expected.cht_c} °C</span>
            </div>
          </div>

          {/* EGT Temp */}
          <div className="p-3 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">EGT Exhaust Temp</span>
            <div className="text-xl font-bold text-slate-100">
              {state.observed.egt_c} <span className="text-xs font-normal text-slate-400">°C</span>
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Expected:</span>
              <span className="text-slate-300">{state.expected.egt_c} °C</span>
            </div>
          </div>

          {/* Oil Pressure */}
          <div className="p-3 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">Oil Pressure</span>
            <div className="text-xl font-bold text-slate-100">
              {state.observed.oil_pressure_psi} <span className="text-xs font-normal text-slate-400">PSI</span>
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Expected:</span>
              <span className="text-slate-300">{state.expected.oil_pressure_psi} PSI</span>
            </div>
          </div>

          {/* Residual Vector (Mahalanobis Distance) */}
          <div className="p-3 space-y-1 bg-[#0c1326]">
            <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">Mahalanobis (D_M)</span>
            <div className={`text-xl font-bold ${
              state.residuals.mahalanobis_distance > 4.5 ? 'text-rose-400' :
              state.residuals.mahalanobis_distance > 2.5 ? 'text-amber-400' : 'text-[#38bdf8]'
            }`}>
              {state.residuals.mahalanobis_distance.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Threshold:</span>
              <span className="text-slate-300">3.50 D_M</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. COMPACT ELECTRICAL POWER SYSTEM PANEL (Requirement 25) */}
      <div className="eng-panel font-mono text-xs">
        <div className="eng-header flex items-center justify-between">
          <span className="font-sans font-bold text-xs uppercase text-slate-200 tracking-wider flex items-center gap-2">
            <Zap size={14} className="text-[#38bdf8]" />
            ELECTRICAL POWER SYSTEM DIGITAL TWIN (28V DC BUS)
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">
              POWER BALANCE: <strong className={((elec?.system.power_balance_w || 0) >= 0) ? 'text-emerald-400' : 'text-amber-400'}>
                {elec?.system.power_balance_w !== undefined ? (elec.system.power_balance_w >= 0 ? `+${elec.system.power_balance_w.toFixed(1)}` : elec.system.power_balance_w.toFixed(1)) : '+0.0'} W
              </strong>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              elec?.system.status === 'CRITICAL' ? 'eng-badge-critical' :
              elec?.system.status === 'DEGRADED' || elec?.system.status === 'WARNING' ? 'eng-badge-warning' : 'eng-badge-success'
            }`}>
              {elec?.system.status || 'NORMAL'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#162035] bg-[#070b16]">
          {/* BATTERY SUBSYSTEM */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#162035] pb-1.5">
              <span className="font-sans font-bold text-[11px] text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <BatteryCharging size={13} className="text-[#38bdf8]" />
                BATTERY (24V 28Ah)
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                elec?.battery.status === 'CRITICAL' ? 'text-rose-400' :
                elec?.battery.status === 'LOW SOC' || elec?.battery.status === 'DEGRADED' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {elec?.battery.status || 'NORMAL'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Voltage</span>
                <span className="text-slate-100 font-bold">{elec?.battery.voltage.toFixed(1) || state.observed.battery_volts.toFixed(1)} V</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Current</span>
                <span className={`font-bold ${(elec?.battery.current || 0) > 1.0 ? 'text-amber-400' : (elec?.battery.current || 0) < -0.5 ? 'text-cyan-400' : 'text-slate-200'}`}>
                  {elec?.battery.current !== undefined ? (elec.battery.current > 0 ? `+${elec.battery.current.toFixed(1)}` : elec.battery.current.toFixed(1)) : '0.0'} A
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">State of Charge (SOC)</span>
                <span className="text-[#38bdf8] font-bold">{elec?.battery.state_of_charge.toFixed(1) || '92.0'}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">State of Health (SOH)</span>
                <span className="text-emerald-400 font-bold">{elec?.battery.state_of_health.toFixed(1) || '98.5'}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Temperature</span>
                <span className="text-slate-200 font-bold">{elec?.battery.temperature.toFixed(1) || '22.0'} °C</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Internal Resistance</span>
                <span className="text-amber-400 font-bold">{elec?.battery.internal_resistance_mohm.toFixed(1) || '18.0'} mΩ</span>
              </div>
            </div>
          </div>

          {/* ALTERNATOR SUBSYSTEM */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#162035] pb-1.5">
              <span className="font-sans font-bold text-[11px] text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Zap size={13} className="text-[#38bdf8]" />
                ALTERNATOR (28V 70A)
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                elec?.alternator.status === 'FAILED' ? 'text-rose-400' :
                elec?.alternator.status === 'DEGRADED' || elec?.alternator.status === 'UNDERPERFORMING' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {elec?.alternator.status || 'NORMAL'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Output Voltage</span>
                <span className="text-slate-100 font-bold">{elec?.alternator.output_voltage.toFixed(1) || '28.2'} V</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Output Current</span>
                <span className="text-slate-100 font-bold">{elec?.alternator.output_current.toFixed(1) || '30.0'} A</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Output Power</span>
                <span className="text-[#38bdf8] font-bold">{elec?.alternator.output_power_w.toFixed(0) || '846'} W</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Temperature</span>
                <span className="text-slate-200 font-bold">{elec?.alternator.temperature.toFixed(1) || '45.0'} °C</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Regulation Error</span>
                <span className="text-amber-400 font-bold">{elec?.alternator.regulation_error_pct.toFixed(1) || '0.2'}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Alternator Health</span>
                <span className="text-emerald-400 font-bold">{elec?.alternator.health.toFixed(1) || '98.0'}%</span>
              </div>
            </div>
          </div>

          {/* SYSTEM & DC BUS */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#162035] pb-1.5">
              <span className="font-sans font-bold text-[11px] text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Activity size={13} className="text-[#38bdf8]" />
                DC BUS & LOAD BALANCE
              </span>
              <span className="text-[10px] text-slate-400">
                HEALTH: <strong className="text-emerald-400">{state.subsystem_health.electrical}%</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Bus Voltage</span>
                <span className={`font-bold ${state.observed.battery_volts < 25.0 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {state.observed.battery_volts.toFixed(2)} V
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Total Load</span>
                <span className="text-slate-100 font-bold">{elec?.electrical_load.total_load_w.toFixed(0) || '820'} W</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Essential Load</span>
                <span className="text-slate-300">{elec?.electrical_load.essential_load_w.toFixed(0) || '420'} W</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Power Balance</span>
                <span className={`font-bold ${((elec?.system.power_balance_w || 0) >= 0) ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {elec?.system.power_balance_w !== undefined ? (elec.system.power_balance_w >= 0 ? `+${elec.system.power_balance_w.toFixed(1)}` : elec.system.power_balance_w.toFixed(1)) : '+0.0'} W
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-500 block font-sans mb-0.5">Electrical Health Index</span>
                <div className="w-full bg-[#162035] h-1.5 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      state.subsystem_health.electrical > 80 ? 'bg-emerald-400' :
                      state.subsystem_health.electrical > 40 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${state.subsystem_health.electrical}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. MAIN SPLIT PANEL: 3D DIGITAL TWIN & REAL-TIME OBSERVED VS EXPECTED CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 3D Digital Twin Viewport (7 Cols) */}
        <div className="lg:col-span-7 h-[460px]">
          <UAV3DViewer state={uav3dState} height="h-full" showOverlay={true} />
        </div>

        {/* Real-time Telemetry Vector Chart (5 Cols) */}
        <div className="lg:col-span-5 eng-panel flex flex-col justify-between p-3 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#162035] pb-2">
            <span className="font-sans font-bold text-xs uppercase text-slate-200 tracking-wider">
              REAL-TIME SENSOR VECTOR RESIDUALS
            </span>
            <span className="text-[10px] text-[#38bdf8] font-bold">OBSERVED VS EXPECTED</span>
          </div>

          {/* EGT & CHT Observed vs Physics Expected Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162035" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090e1c', borderColor: '#212f4d', fontSize: '11px', color: '#f1f5f9' }}
                />
                <Line type="monotone" dataKey="egt_obs" name="EGT Observed (°C)" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="egt_exp" name="EGT Expected (°C)" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="cht_obs" name="CHT Observed (°C)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 rounded bg-[#090e1c] border border-[#162035] space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">ACTIVE FAULT STATUS:</span>
              <span className={`font-bold ${state.active_fault !== 'none' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {state.active_fault.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">PHYSICS RESIDUAL DELTA:</span>
              <span className="text-slate-200">
                EGT: <strong className="text-[#38bdf8]">{state.residuals.egt_c > 0 ? `+${state.residuals.egt_c.toFixed(1)}` : state.residuals.egt_c.toFixed(1)} °C</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. INCIDENT & ALERTS TABLE PANEL */}
      <div className="eng-panel">
        <div className="eng-header flex items-center justify-between">
          <span className="font-sans font-bold text-xs uppercase text-slate-200 tracking-wider flex items-center gap-2">
            <ShieldAlert size={14} className="text-amber-400" />
            SYSTEM DIAGNOSTIC ALERTS & RECENT INCIDENTS LOG
          </span>
          <button
            onClick={onNavigateToFaults}
            className="text-[11px] font-mono text-[#38bdf8] hover:underline"
          >
            OPEN FAULT CENTER ↗
          </button>
        </div>

        {state.alerts.length > 0 ? (
          <table className="eng-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>SEVERITY</th>
                <th>CANDIDATE FAULT</th>
                <th>PRIMARY EVIDENCE</th>
                <th>CONFIDENCE</th>
                <th>RECOMMENDED ACTION</th>
              </tr>
            </thead>
            <tbody>
              {state.alerts.map((alert, idx) => (
                <tr key={idx}>
                  <td className="text-slate-400">{Math.floor(alert.timestamp)}s</td>
                  <td>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      alert.severity === 'critical' ? 'eng-badge-critical' : 'eng-badge-warning'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="font-bold text-slate-200">{alert.candidate_fault}</td>
                  <td className="text-slate-300">{alert.evidence_summary}</td>
                  <td className="text-[#38bdf8] font-bold">{Math.round(alert.confidence_pct)}%</td>
                  <td className="text-slate-400">{alert.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4 text-center text-slate-500 font-mono text-xs">
            ✓ NO ACTIVE ALERTS DETECTED — ALL AERO-ENGINE & ELECTRICAL SUBSYSTEMS OPERATING WITHIN NOMINAL TOLERANCES
          </div>
        )}
      </div>
    </div>
  );
};

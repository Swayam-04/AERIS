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

  const uav3dState: UAV3DState = {
    engineHealth: state.overall_health_score,
    engineStatus: state.status,
    missionPhase: state.mission_phase,
    activeFault: state.active_fault,
    activeAlert: state.alerts[0]?.candidate_fault || 'None',
    rpm: state.observed.rpm,
    cht: state.observed.cht_c,
    egt: state.observed.egt_c,
    oilPressure: state.observed.oil_pressure_psi,
    vibration: state.observed.vibration_g,
    residualDistance: state.residuals.mahalanobis_distance
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
            Aero Engine Reliability & Intelligence System | DRDO TAPAS-BH-201 (RUSTOM-II) MALE UAV
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-2.5 py-1 rounded bg-[#090e1c] border border-[#162035] text-slate-300">
            AIRCRAFT: <strong className="text-[#38bdf8]">TAPAS-BH-201</strong>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#090e1c] border border-[#162035] text-slate-300">
            PROPULSION: <strong className="text-emerald-400">ROTAX 914/915 iS CLASS</strong>
          </div>
        </div>
      </div>

      {/* 2. Flight Phase Timeline */}
      <FlightPhaseController
        currentPhase={state.mission_phase}
        onSetPhase={onSetPhase}
      />

      {/* 3. CONSOLIDATED INSTRUMENT PANEL (Replaces Card Spam) */}
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

      {/* 4. MAIN SPLIT PANEL: 3D DIGITAL TWIN & REAL-TIME OBSERVED VS EXPECTED CHART */}
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

      {/* 5. INCIDENT & ALERTS TABLE PANEL */}
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
            ✓ NO ACTIVE ALERTS DETECTED — ALL AERO-ENGINE SUBSYSTEMS OPERATING WITHIN NOMINAL TOLERANCES
          </div>
        )}
      </div>
    </div>
  );
};

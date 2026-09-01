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
  Legend,
  CartesianGrid
} from 'recharts';
import {
  Activity,
  ShieldAlert,
  Thermometer,
  Gauge,
  Flame,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
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
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Activity className="w-6 h-6 animate-spin text-cyan-400 mr-2" />
        Synchronizing live telemetry twin stream...
      </div>
    );
  }

  // Format Recharts data history
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
    <div className="space-y-6">
      {/* Executive Page Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            AERIS — Executive Mission & Health Dashboard
          </h2>
          <p className="text-xs text-slate-400">Aero Engine Reliability & Intelligence System | DRDO TAPAS-BH-201 / RUSTOM-II</p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            AIRCRAFT: <strong className="text-cyan-400">TAPAS-BH-201 / RUSTOM-II</strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            ENGINE: <strong className="text-emerald-400">ROTAX 914/915 iS CLASS</strong>
          </span>
        </div>
      </div>

      {/* Flight Phase Controller & Timeline HUD */}
      <FlightPhaseController
        currentPhase={state.mission_phase}
        onSetPhase={onSetPhase}
      />

      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Overall Health Card */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Engine Health</span>
          <div className="flex items-baseline gap-2 my-1">
            <span className={`text-2xl font-bold font-mono ${
              state.overall_health_score > 80 ? 'text-emerald-400' :
              state.overall_health_score > 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {state.overall_health_score}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                state.overall_health_score > 80 ? 'bg-emerald-400' :
                state.overall_health_score > 50 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${state.overall_health_score}%` }}
            />
          </div>
        </div>

        {/* Engine RPM */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">RPM SPEED</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-100">{state.observed.rpm}</span>
            <span className="text-xs text-slate-400 ml-1">RPM</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Nominal: {state.expected.rpm}</span>
        </div>

        {/* CHT Temp */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">CHT TEMP</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-100">{state.observed.cht_c}</span>
            <span className="text-xs text-slate-400 ml-1">°C</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Residual: {state.residuals.cht_c > 0 ? `+${state.residuals.cht_c}` : state.residuals.cht_c}°C</span>
        </div>

        {/* EGT Temp */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">EGT TEMP</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-100">{state.observed.egt_c}</span>
            <span className="text-xs text-slate-400 ml-1">°C</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Residual: {state.residuals.egt_c > 0 ? `+${state.residuals.egt_c}` : state.residuals.egt_c}°C</span>
        </div>

        {/* Oil Pressure */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">OIL PRESSURE</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-100">{state.observed.oil_pressure_psi}</span>
            <span className="text-xs text-slate-400 ml-1">PSI</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Expected: {state.expected.oil_pressure_psi} PSI</span>
        </div>

        {/* Active Alerts */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between cursor-pointer hover:border-cyan-500/50 transition" onClick={onNavigateToFaults}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">ACTIVE ALERTS</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-1">
            <span className={`text-2xl font-bold font-mono ${state.alerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {state.alerts.length}
            </span>
          </div>
          <span className="text-[11px] text-cyan-400 font-medium hover:underline">Inspect Diagnostic Center →</span>
        </div>
      </div>

      {/* Main Grid: 3D UAV Model & Live Dual Telemetry Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D MALE UAV Live Context (5 cols) */}
        <div className="lg:col-span-5 h-[420px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              MALE UAV Digital Twin Context
            </h3>
            <button onClick={onNavigateToControl} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
              Simulation Controller →
            </button>
          </div>
          <UAV3DViewer state={uav3dState} height="h-full" showOverlay={true} />
        </div>

        {/* Dual Physics Model Comparison Graph (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Physics-Informed Expected vs Observed Telemetry
              </h3>
              <p className="text-xs text-slate-400">Real-time signal tracking and vector residual calculation</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-3 h-0.5 bg-cyan-400" /> Observed Signal
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-0.5 bg-slate-500 border-dashed" /> Physics Expected
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="rpm_obs" name="RPM (Observed)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rpm_exp" name="RPM (Expected)" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="cht_obs" name="CHT °C (Observed)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cht_exp" name="CHT °C (Expected)" stroke="#78350f" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block">MAHALANOBIS D_M</span>
              <span className="font-mono text-cyan-400 font-bold">{state.residuals.mahalanobis_distance}</span>
            </div>
            <div>
              <span className="text-slate-500 block">FUEL FLOW DELTA</span>
              <span className="font-mono text-slate-200">{state.residuals.fuel_flow_lph} L/h</span>
            </div>
            <div>
              <span className="text-slate-500 block">VIBRATION DELTA</span>
              <span className="font-mono text-slate-200">{state.residuals.vibration_g} g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Diagnostic Alerts Queue & Subsystem Health Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Alerts Queue */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Live Diagnostic Alert Stream
            </h3>
            <span className="text-xs text-slate-400">Explainable ML Diagnostics</span>
          </div>

          {state.alerts.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-semibold">Normal Aero-Piston Operation Verified</p>
                <p className="text-emerald-400/80">No multivariate telemetry anomalies detected. All parameters within physics model tolerance.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {state.alerts.map((alert) => (
                <div key={alert.alert_id} className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      {alert.candidate_fault}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-bold">
                      {alert.confidence_pct}% CONFIDENCE
                    </span>
                  </div>
                  <p className="text-slate-300">{alert.evidence_summary}</p>
                  <div className="pt-1 text-cyan-300 font-medium">
                    <span className="text-slate-400 font-normal">Recommendation: </span>
                    {alert.recommendation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subsystem Health Breakdowns */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Subsystem Health Status
          </h3>

          {[
            { label: 'Piston & Cylinder Assembly', val: state.subsystem_health.piston_cylinder },
            { label: 'Lubrication System', val: state.subsystem_health.lubrication },
            { label: 'Fuel Injection System', val: state.subsystem_health.fuel_injection },
            { label: 'Ignition & Combustion', val: state.subsystem_health.ignition },
            { label: 'Electrical & Alternator', val: state.subsystem_health.electrical },
          ].map((sub) => (
            <div key={sub.label} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">{sub.label}</span>
                <span className={`font-mono font-bold ${
                  sub.val > 80 ? 'text-emerald-400' : sub.val > 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {sub.val}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    sub.val > 80 ? 'bg-emerald-400' : sub.val > 50 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${sub.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { DigitalTwinState, UAV3DState, MissionPhase } from '../types/telemetry';
import { UAV3DViewer } from '../components/UAV3DViewer';
import { FlightPhaseController } from '../components/FlightPhaseController';
import { Box, Cpu, Activity, ShieldCheck, ShieldAlert, Zap, Layers, Compass, Radio, Info } from 'lucide-react';

interface LiveTwinViewProps {
  state: DigitalTwinState | null;
  onSetPhase?: (phase: MissionPhase) => void;
}

export const LiveTwinView: React.FC<LiveTwinViewProps> = ({ state, onSetPhase }) => {
  if (!state) return null;

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
      {/* Page Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Box className="w-5 h-5 text-cyan-400" />
            AERIS — TAPAS-BH-201 / RUSTOM-II 3D Digital Twin
          </h2>
          <p className="text-xs text-slate-400">Aero Engine Reliability & Intelligence System | DRDO MALE UAV (9.5m / 20.6m Scale)</p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            AIRCRAFT: <strong className="text-cyan-400">TAPAS-BH-201</strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            TWIN SYNC: <strong className="text-emerald-400">100% REALTIME</strong>
          </span>
        </div>
      </div>

      {/* Interactive Flight Phase Controller & Timeline HUD */}
      <FlightPhaseController
        currentPhase={state.mission_phase}
        onSetPhase={onSetPhase}
      />

      {/* Main 3D Canvas (Full Height 540px Workstation Viewport) */}
      <div className="w-full h-[540px]">
        <UAV3DViewer state={uav3dState} height="h-full" showOverlay={true} />
      </div>

      {/* Four Concise Engineering Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        {/* Card 1: UAV Information */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="text-slate-400 font-sans font-semibold uppercase text-[10px] tracking-wider block border-b border-slate-800 pb-1">
            UAV SPECIFICATIONS
          </span>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">MODEL:</span><span className="text-slate-200 font-bold">TAPAS-BH-201</span></div>
            <div className="flex justify-between"><span className="text-slate-500">DESIGNATION:</span><span className="text-slate-200">RUSTOM-II</span></div>
            <div className="flex justify-between"><span className="text-slate-500">WINGSPAN:</span><span className="text-cyan-400">20.6 m</span></div>
            <div className="flex justify-between"><span className="text-slate-500">LENGTH:</span><span className="text-cyan-400">9.5 m</span></div>
          </div>
        </div>

        {/* Card 2: Mission Status */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="text-slate-400 font-sans font-semibold uppercase text-[10px] tracking-wider block border-b border-slate-800 pb-1">
            MISSION STATUS
          </span>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">MISSION ID:</span><span className="text-slate-200 font-bold">{state.mission_id}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">CURRENT PHASE:</span><span className="text-cyan-400 font-bold uppercase">{state.mission_phase}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">ALTITUDE:</span><span className="text-slate-200">{state.observed.altitude_ft} ft</span></div>
            <div className="flex justify-between"><span className="text-slate-500">THROTTLE:</span><span className="text-slate-200">{state.observed.throttle_pct}%</span></div>
          </div>
        </div>

        {/* Card 3: Engine Health */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="text-slate-400 font-sans font-semibold uppercase text-[10px] tracking-wider block border-b border-slate-800 pb-1">
            ENGINE HEALTH
          </span>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">COMPOSITE HEALTH:</span><span className="text-emerald-400 font-bold">{state.overall_health_score}%</span></div>
            <div className="flex justify-between"><span className="text-slate-500">ENGINE STATUS:</span><span className="text-slate-200 uppercase font-bold">{state.status}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">MAHALANOBIS D_M:</span><span className="text-cyan-400">{state.residuals.mahalanobis_distance}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">POWERPLANT:</span><span className="text-slate-200">ROTAX 914/915 iS</span></div>
          </div>
        </div>

        {/* Card 4: Active Alerts */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="text-slate-400 font-sans font-semibold uppercase text-[10px] tracking-wider block border-b border-slate-800 pb-1">
            ACTIVE ALERTS
          </span>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">ACTIVE FAULT:</span><span className="text-rose-400 font-bold truncate max-w-[120px]">{state.active_fault || 'NONE'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">ALERTS COUNT:</span><span className="text-slate-200 font-bold">{state.alerts.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">TIMESTAMP:</span><span className="text-slate-400">{Math.floor(state.timestamp)}s</span></div>
            <div className="flex justify-between"><span className="text-slate-500">AI DIAGNOSIS:</span><span className="text-cyan-400 truncate max-w-[120px]">{state.alerts[0]?.candidate_fault || 'NORMAL'}</span></div>
          </div>
        </div>
      </div>

      {/* Synchronized Twin State Vector Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Observed Telemetry */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Observed Telemetry Vector
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">RPM:</span>
              <span className="text-slate-100 font-bold">{state.observed.rpm}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">CHT (°C):</span>
              <span className="text-slate-100 font-bold">{state.observed.cht_c}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">EGT (°C):</span>
              <span className="text-slate-100 font-bold">{state.observed.egt_c}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Oil Pressure (PSI):</span>
              <span className="text-slate-100 font-bold">{state.observed.oil_pressure_psi}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Fuel Flow (L/h):</span>
              <span className="text-slate-100 font-bold">{state.observed.fuel_flow_lph}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Vibration (g RMS):</span>
              <span className="text-slate-100 font-bold">{state.observed.vibration_g}</span>
            </div>
          </div>
        </div>

        {/* Physics Expected Baseline */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            Physics Nominal Baseline
          </h3>
          <div className="space-y-2 text-xs font-mono text-slate-400">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span>RPM:</span>
              <span>{state.expected.rpm}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span>CHT (°C):</span>
              <span>{state.expected.cht_c}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span>EGT (°C):</span>
              <span>{state.expected.egt_c}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span>Oil Pressure (PSI):</span>
              <span>{state.expected.oil_pressure_psi}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span>Fuel Flow (L/h):</span>
              <span>{state.expected.fuel_flow_lph}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Vibration (g RMS):</span>
              <span>{state.expected.vibration_g}</span>
            </div>
          </div>
        </div>

        {/* Computed Residual Deltas */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Vector Residual Deltas
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Δ RPM:</span>
              <span className={state.residuals.rpm < -100 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {state.residuals.rpm > 0 ? `+${state.residuals.rpm}` : state.residuals.rpm}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Δ CHT:</span>
              <span className={state.residuals.cht_c > 20 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                {state.residuals.cht_c > 0 ? `+${state.residuals.cht_c}` : state.residuals.cht_c} °C
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Δ EGT:</span>
              <span className={state.residuals.egt_c > 50 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {state.residuals.egt_c > 0 ? `+${state.residuals.egt_c}` : state.residuals.egt_c} °C
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Δ Oil Press:</span>
              <span className={state.residuals.oil_pressure_psi < -15 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {state.residuals.oil_pressure_psi > 0 ? `+${state.residuals.oil_pressure_psi}` : state.residuals.oil_pressure_psi} PSI
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Δ Vibration:</span>
              <span className={state.residuals.vibration_g > 0.5 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                {state.residuals.vibration_g > 0 ? `+${state.residuals.vibration_g}` : state.residuals.vibration_g} g
              </span>
            </div>
            <div className="flex justify-between py-1 font-bold">
              <span className="text-slate-300">Mahalanobis D_M:</span>
              <span className="text-cyan-400">{state.residuals.mahalanobis_distance}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

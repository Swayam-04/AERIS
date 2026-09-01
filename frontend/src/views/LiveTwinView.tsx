import React from 'react';
import { DigitalTwinState, UAV3DState, MissionPhase } from '../types/telemetry';
import { UAV3DViewer } from '../components/UAV3DViewer';
import { FlightPhaseController } from '../components/FlightPhaseController';
import { Box, Activity, Layers, Zap } from 'lucide-react';

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
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-sans tracking-wide flex items-center gap-2 uppercase">
            <Box className="w-5 h-5 text-[#38bdf8]" />
            DRDO RUSTOM-1 3D Digital Twin Environment
          </h2>
          <p className="text-xs text-slate-400">Aero Engine Reliability & Intelligence System | DRDO MALE UAV (5.12m / 7.9m Scale | Lycoming O-320 Powerplant)</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded bg-[#090e1c] border border-[#162035] text-slate-300">
            TWIN STREAM: <strong className="text-emerald-400">100% REALTIME</strong>
          </div>
        </div>
      </div>

      {/* Flight Phase Controller */}
      <FlightPhaseController
        currentPhase={state.mission_phase}
        onSetPhase={onSetPhase}
      />

      {/* Main 3D Canvas */}
      <div className="w-full h-[520px]">
        <UAV3DViewer state={uav3dState} height="h-full" showOverlay={true} />
      </div>

      {/* Synchronized Vector Matrix (Observed vs Expected vs Delta) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Observed Telemetry */}
        <div className="eng-panel p-4 space-y-3">
          <div className="border-b border-[#162035] pb-2 font-sans flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#38bdf8]" />
            <span className="font-bold text-xs uppercase text-slate-200">OBSERVED SENSOR VECTOR</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-500">RPM SPEED:</span>
              <span className="font-bold text-slate-100">{state.observed.rpm}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-500">CHT TEMP:</span>
              <span className="font-bold text-slate-100">{state.observed.cht_c} °C</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-500">EGT TEMP:</span>
              <span className="font-bold text-slate-100">{state.observed.egt_c} °C</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-500">OIL PRESSURE:</span>
              <span className="font-bold text-slate-100">{state.observed.oil_pressure_psi} PSI</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-500">FUEL FLOW:</span>
              <span className="font-bold text-slate-100">{state.observed.fuel_flow_lph} L/h</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">VIBRATION:</span>
              <span className="font-bold text-slate-100">{state.observed.vibration_g} g RMS</span>
            </div>
          </div>
        </div>

        {/* Physics Expected Baseline */}
        <div className="eng-panel p-4 space-y-3">
          <div className="border-b border-[#162035] pb-2 font-sans flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-xs uppercase text-slate-200">PHYSICS NOMINAL BASELINE</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span>RPM SPEED:</span>
              <span>{state.expected.rpm}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span>CHT TEMP:</span>
              <span>{state.expected.cht_c} °C</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span>EGT TEMP:</span>
              <span>{state.expected.egt_c} °C</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span>OIL PRESSURE:</span>
              <span>{state.expected.oil_pressure_psi} PSI</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span>FUEL FLOW:</span>
              <span>{state.expected.fuel_flow_lph} L/h</span>
            </div>
            <div className="flex justify-between py-1">
              <span>VIBRATION:</span>
              <span>{state.expected.vibration_g} g RMS</span>
            </div>
          </div>
        </div>

        {/* Computed Residual Deltas */}
        <div className="eng-panel p-4 space-y-3">
          <div className="border-b border-[#162035] pb-2 font-sans flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs uppercase text-slate-200">VECTOR RESIDUAL DELTAS</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-500">Δ RPM:</span>
              <span className={state.residuals.rpm < -100 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {state.residuals.rpm > 0 ? `+${state.residuals.rpm}` : state.residuals.rpm}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-500">Δ CHT:</span>
              <span className={state.residuals.cht_c > 20 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                {state.residuals.cht_c > 0 ? `+${state.residuals.cht_c}` : state.residuals.cht_c} °C
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-500">Δ EGT:</span>
              <span className={state.residuals.egt_c > 50 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {state.residuals.egt_c > 0 ? `+${state.residuals.egt_c}` : state.residuals.egt_c} °C
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-500">Δ OIL PRESS:</span>
              <span className={state.residuals.oil_pressure_psi < -15 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {state.residuals.oil_pressure_psi > 0 ? `+${state.residuals.oil_pressure_psi}` : state.residuals.oil_pressure_psi} PSI
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-500">Δ VIBRATION:</span>
              <span className={state.residuals.vibration_g > 0.5 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                {state.residuals.vibration_g > 0 ? `+${state.residuals.vibration_g}` : state.residuals.vibration_g} g
              </span>
            </div>
            <div className="flex justify-between py-1 font-bold">
              <span className="text-slate-400">MAHALANOBIS D_M:</span>
              <span className="text-[#38bdf8]">{state.residuals.mahalanobis_distance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

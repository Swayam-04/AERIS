import React, { useState } from 'react';
import { DigitalTwinState, FaultType, MissionPhase, UAV3DState } from '../types/telemetry';
import { FlightPhaseController } from '../components/FlightPhaseController';
import { UAV3DViewer } from '../components/UAV3DViewer';
import { Sliders, RotateCcw, ShieldAlert, Activity, CheckCircle2, AlertTriangle, Box } from 'lucide-react';

interface MissionControlViewProps {
  state: DigitalTwinState | null;
  onInjectFault: (fault: FaultType, severity: number) => void;
  onClearFault: () => void;
  onSetPhase: (phase: MissionPhase) => void;
  onResetMission: () => void;
}

export const MissionControlView: React.FC<MissionControlViewProps> = ({
  state,
  onInjectFault,
  onClearFault,
  onSetPhase,
  onResetMission,
}) => {
  const [selectedFault, setSelectedFault] = useState<FaultType>('injector_abnormality');
  const [severity, setSeverity] = useState<number>(0.65);

  if (!state) return null;

  const uav3dState: UAV3DState = {
    engineHealth: state.overall_health_score,
    engineStatus: state.status,
    missionPhase: state.mission_phase,
    activeFault: state.active_fault,
    activeAlert: state.alerts[0]?.candidate_fault || 'None',
    faultSeverity: state.fault_severity || severity,
    rpm: state.observed.rpm,
    cht: state.observed.cht_c,
    egt: state.observed.egt_c,
    oilPressure: state.observed.oil_pressure_psi,
    vibration: state.observed.vibration_g,
    residualDistance: state.residuals.mahalanobis_distance,
    expectedRpm: state.expected.rpm,
    expectedCht: state.expected.cht_c,
    expectedEgt: state.expected.egt_c,
    expectedOilPressure: state.expected.oil_pressure_psi,
    expectedVibration: state.expected.vibration_g,
    rulHours: state.rul ? Math.round(state.rul.rul_hours) : undefined
  };

  const faultOptions = [
    { type: 'misfire' as FaultType, label: 'Cylinder Misfire', desc: 'Ignition coil failure causing RPM drop & high vibration' },
    { type: 'injector_abnormality' as FaultType, label: 'Fuel Injector Restriction', desc: 'Lean fuel mixture causing elevated EGT & CHT rise' },
    { type: 'oil_pressure_loss' as FaultType, label: 'Oil Pressure Loss', desc: 'Crankcase lubrication leak causing severe oil pressure drop' },
    { type: 'overheating' as FaultType, label: 'Thermal Overheating', desc: 'Cooling duct restriction elevating CHT above 230°C' },
    { type: 'vibration_spike' as FaultType, label: 'Vibration Spike', desc: 'Propeller/bearing mechanical imbalance' },
    { type: 'sensor_drift' as FaultType, label: 'Sensor Reading Drift', desc: 'Cylinder head temperature sensor calibration drift' },
  ];

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-sans tracking-wide flex items-center gap-2 uppercase">
            <Sliders className="w-5 h-5 text-[#38bdf8]" />
            Mission Control & Fault Injection Console
          </h2>
          <p className="text-xs text-slate-400">Interactive flight profile switcher and controlled fault scenario trigger with live RUSTOM 3D Digital Twin</p>
        </div>
        <button
          onClick={onResetMission}
          className="px-3 py-1 rounded bg-[#0e152a] text-slate-200 border border-[#212f4d] font-bold text-xs hover:bg-[#131c36] flex items-center gap-1.5 transition"
        >
          <RotateCcw size={13} /> RESET MISSION TIMELINE
        </button>
      </div>

      {/* Flight Phase Controller */}
      <FlightPhaseController
        currentPhase={state.mission_phase}
        onSetPhase={onSetPhase}
      />

      {/* Live RUSTOM 3D Viewport & Scenario Result Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 3D Viewport Panel */}
        <div className="lg:col-span-2 h-[460px]">
          <UAV3DViewer state={uav3dState} height="h-full" showOverlay={true} />
        </div>

        {/* Real-time Scenario Result Summary Card */}
        <div className="eng-panel p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="border-b border-[#162035] pb-2 font-sans flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-slate-200 tracking-wide flex items-center gap-2">
                <Box size={14} className="text-[#38bdf8]" />
                SCENARIO DIGITAL TWIN OUTCOME
              </span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                state.status === 'critical' ? 'eng-badge-critical' : state.status === 'warning' ? 'eng-badge-warning' : 'eng-badge-success'
              }`}>
                {state.status}
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">ACTIVE SCENARIO:</span>
                <span className="font-bold text-slate-100 uppercase">{state.active_fault.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">SEVERITY FACTOR:</span>
                <span className="font-bold text-[#38bdf8]">{(severity * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">MISSION PHASE:</span>
                <span className="font-bold text-slate-100 uppercase">{state.mission_phase}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">ENGINE HEALTH SCORE:</span>
                <span className={`font-bold ${state.overall_health_score > 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {state.overall_health_score}%
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">OBSERVED VS EXP CHT:</span>
                <span className="text-slate-200">{state.observed.cht_c}°C <span className="text-slate-500">({state.expected.cht_c}°C)</span></span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">OBSERVED VS EXP EGT:</span>
                <span className="text-slate-200">{state.observed.egt_c}°C <span className="text-slate-500">({state.expected.egt_c}°C)</span></span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">VIBRATION RMS:</span>
                <span className="text-slate-200">{state.observed.vibration_g} g</span>
              </div>
              {state.rul && (
                <div className="flex justify-between py-1 pt-2 border-t border-[#162035]">
                  <span className="text-slate-400 font-bold">REMAINING USEFUL LIFE:</span>
                  <span className="text-emerald-400 font-bold">{Math.round(state.rul.rul_hours)} Hours</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-2.5 bg-[#060810] rounded border border-[#162035] text-[10px] text-slate-400">
            <span className="text-slate-300 font-bold block uppercase mb-0.5">3D DIGITAL TWIN STATUS:</span>
            {state.active_fault === 'none' ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 size={12} /> RUSTOM digital twin operating nominal
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 font-semibold">
                <AlertTriangle size={12} /> Digital twin active fault effect: {state.active_fault.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fault Injection Panel */}
      <div className="eng-panel p-4 space-y-4">
        <div className="border-b border-[#162035] pb-2 flex items-center justify-between font-sans">
          <span className="font-bold text-xs uppercase text-slate-200 tracking-wide flex items-center gap-2">
            <ShieldAlert size={15} className="text-rose-400" />
            CONTROLLED FAULT INJECTION SIMULATOR
          </span>
          {state.active_fault !== 'none' && (
            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/50 font-mono font-bold text-[10px] uppercase">
              ACTIVE FAULT: {state.active_fault}
            </span>
          )}
        </div>

        {/* Fault Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {faultOptions.map((f) => {
            const isSelected = selectedFault === f.type;
            return (
              <div
                key={f.type}
                onClick={() => setSelectedFault(f.type)}
                className={`p-3 rounded border cursor-pointer transition space-y-1 ${
                  isSelected
                    ? 'bg-[#121c38] border-[#0284c7] text-slate-100'
                    : 'bg-[#0c1224] border-[#162035] text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs block text-slate-200">{f.label}</span>
                <p className="text-[11px] text-slate-400 leading-tight">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Severity Range Input */}
        <div className="p-3 bg-[#0c1224] rounded border border-[#162035] space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-sans font-bold uppercase">Fault Severity Factor:</span>
            <span className="text-[#38bdf8] font-bold">{(severity * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={severity}
            onChange={(e) => setSeverity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#162035] rounded appearance-none cursor-pointer accent-[#38bdf8]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1 font-sans">
          <button
            onClick={() => onInjectFault(selectedFault, severity)}
            className="flex-1 py-2.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition"
          >
            INJECT SELECTED FAULT SCENARIO
          </button>
          <button
            onClick={onClearFault}
            className="px-5 py-2.5 rounded bg-[#0e152a] hover:bg-[#131c36] text-slate-200 font-bold text-xs uppercase tracking-wider transition border border-[#212f4d]"
          >
            CLEAR FAULT
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { DigitalTwinState, FaultType, MissionPhase } from '../types/telemetry';
import { FlightPhaseController } from '../components/FlightPhaseController';
import { Sliders, RotateCcw, ShieldAlert } from 'lucide-react';

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
          <p className="text-xs text-slate-400">Interactive flight profile switcher and controlled fault scenario trigger</p>
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

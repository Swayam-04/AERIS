import React, { useState } from 'react';
import { DigitalTwinState, FaultType, MissionPhase } from '../types/telemetry';
import { FlightPhaseController } from '../components/FlightPhaseController';
import { Sliders, Play, Pause, RotateCcw, ShieldAlert, Zap, Flame, Activity, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Mission Control & Fault Injection Console
          </h2>
          <p className="text-xs text-slate-400">Interactive flight profile switcher and controlled fault scenario trigger</p>
        </div>
        <button
          onClick={onResetMission}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs hover:bg-slate-700 flex items-center gap-1.5 transition"
        >
          <RotateCcw size={14} /> Reset Mission Timeline
        </button>
      </div>

      {/* Flight Phase Steps Controller & Timeline */}
      <FlightPhaseController
        currentPhase={state.mission_phase}
        onSetPhase={onSetPhase}
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Fault Injection Panel */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Controlled Fault Injector
            </h3>
            {state.active_fault !== 'none' && (
              <span className="px-2.5 py-0.5 rounded bg-rose-500 text-slate-950 font-bold text-xs font-mono uppercase">
                FAULT ACTIVE: {state.active_fault}
              </span>
            )}
          </div>

          {/* Fault Scenario Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {faultOptions.map((f) => {
              const isSelected = selectedFault === f.type;
              return (
                <div
                  key={f.type}
                  onClick={() => setSelectedFault(f.type)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition space-y-1 ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 text-slate-100 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs block">{f.label}</span>
                  <p className="text-[11px] text-slate-400 leading-tight">{f.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Severity Slider */}
          <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Fault Severity Factor:</span>
              <span className="font-mono text-cyan-400">{(severity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={severity}
              onChange={(e) => setSeverity(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onInjectFault(selectedFault, severity)}
              className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-rose-500/20"
            >
              Inject Selected Fault Scenario
            </button>
            <button
              onClick={onClearFault}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition border border-slate-700"
            >
              Clear Fault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { DigitalTwinState, FaultType, MissionPhase, UAV3DState } from '../types/telemetry';
import { FlightPhaseController } from '../components/FlightPhaseController';
import { UAV3DViewer } from '../components/UAV3DViewer';
import { Sliders, RotateCcw, ShieldAlert, Activity, CheckCircle2, AlertTriangle, Box, Zap, BatteryCharging } from 'lucide-react';

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
  const [selectedFault, setSelectedFault] = useState<FaultType>('alternator_output_degradation');
  const [severity, setSeverity] = useState<number>(0.75);

  if (!state) return null;

  const elec = state.observed.electrical;

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
    rulHours: state.rul ? Math.round(state.rul.rul_hours) : undefined,
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

  const faultOptions = [
    // Engine Mechanical/Thermal Faults
    { type: 'misfire' as FaultType, label: 'Cylinder Misfire', desc: 'Ignition coil failure causing RPM drop & high vibration' },
    { type: 'injector_abnormality' as FaultType, label: 'Fuel Injector Restriction', desc: 'Lean fuel mixture causing elevated EGT & CHT rise' },
    { type: 'oil_pressure_loss' as FaultType, label: 'Oil Pressure Loss', desc: 'Crankcase lubrication leak causing severe oil pressure drop' },
    { type: 'overheating' as FaultType, label: 'Thermal Overheating', desc: 'Cooling duct restriction elevating CHT above 230°C' },
    { type: 'vibration_spike' as FaultType, label: 'Vibration Spike', desc: 'Propeller/bearing mechanical imbalance' },
    { type: 'sensor_drift' as FaultType, label: 'Sensor Reading Drift', desc: 'Cylinder head temperature sensor calibration drift' },
    // Electrical Power Subsystem Faults
    { type: 'alternator_output_degradation' as FaultType, label: 'Alternator Output Degradation', desc: 'Derated generation forcing battery to discharge and deplete reserve' },
    { type: 'alternator_failure' as FaultType, label: 'Alternator Total Failure', desc: 'Complete generation loss; battery becomes sole primary power source' },
    { type: 'battery_voltage_sag' as FaultType, label: 'Battery Voltage Sag', desc: 'Severe terminal voltage drop under high flight electrical loads' },
    { type: 'battery_internal_resistance_increase' as FaultType, label: 'Battery Resistance Increase', desc: 'High internal impedance (R_int) degrading voltage stability' },
    { type: 'battery_low_soc' as FaultType, label: 'Battery Critical Low SOC', desc: 'Battery reserve drops below 20% threatening avionics endurance' },
    { type: 'battery_overheating' as FaultType, label: 'Battery Overheating', desc: 'Exothermic thermal runaway heating in avionics bay' },
    { type: 'alternator_regulation_failure' as FaultType, label: 'Voltage Regulation Failure', desc: 'Regulator drifts out of 28.2V specification (overvoltage/undervoltage)' },
    { type: 'alternator_overheating' as FaultType, label: 'Alternator Overheating', desc: 'Stator & diode bridge thermal overstress causing derating' },
    { type: 'electrical_load_surge' as FaultType, label: 'Electrical Load Surge', desc: 'Actuator short circuit or payload demand exceeding alternator rating' },
    { type: 'charging_system_fault' as FaultType, label: 'Charging System Fault', desc: 'Isolation relay open-circuit; battery unable to recharge from bus' },
  ];

  const handleRunDemoChain = async () => {
    try {
      await fetch('/api/mission/demo/chain', { method: 'POST' });
    } catch (e) {
      onInjectFault('alternator_output_degradation', 0.85);
    }
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunDemoChain}
            className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase flex items-center gap-1.5 transition shadow"
            title="Trigger Section 26 complete deterministic chain demo"
          >
            <Zap size={13} />
            <span>RUN ELECTRICAL DEMO CHAIN</span>
          </button>
          <button
            onClick={onResetMission}
            className="px-3 py-1.5 rounded bg-[#0e152a] text-slate-200 border border-[#212f4d] font-bold text-xs hover:bg-[#131c36] flex items-center gap-1.5 transition"
          >
            <RotateCcw size={13} /> RESET MISSION TIMELINE
          </button>
        </div>
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
                <span className="font-bold text-slate-100 uppercase">{state.active_fault.replace(/_/g, ' ')}</span>
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
                <span className="text-slate-500">ELECTRICAL HEALTH:</span>
                <span className={`font-bold ${state.subsystem_health.electrical > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {state.subsystem_health.electrical}%
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">BUS VOLTAGE:</span>
                <span className={`font-bold ${state.observed.battery_volts < 25.0 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {state.observed.battery_volts.toFixed(2)} V
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">BATTERY SOC:</span>
                <span className="text-[#38bdf8] font-bold">{elec?.battery.state_of_charge.toFixed(1) || '92.0'}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">BATTERY CURRENT:</span>
                <span className={`font-bold ${(elec?.battery.current || 0) > 1.0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {elec?.battery.current !== undefined ? (elec.battery.current > 0 ? `+${elec.battery.current.toFixed(1)} A (Discharge)` : `${elec.battery.current.toFixed(1)} A (Charge)`) : '0.0 A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">ALTERNATOR POWER:</span>
                <span className="text-slate-200">{elec?.alternator.output_power_w.toFixed(0) || '846'} W</span>
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
                <AlertTriangle size={12} /> Digital twin active fault localized highlight: {state.active_fault.replace(/_/g, ' ')}
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
            CONTROLLED FAULT INJECTION SIMULATOR (ENGINE & ELECTRICAL POWER SUBSYSTEM)
          </span>
          {state.active_fault !== 'none' && (
            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/50 font-mono font-bold text-[10px] uppercase">
              ACTIVE FAULT: {state.active_fault.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Fault Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {faultOptions.map((f) => {
            const isSelected = selectedFault === f.type;
            const isElectrical = f.type.includes('battery') || f.type.includes('alternator') || f.type.includes('load') || f.type.includes('charging');
            return (
              <div
                key={f.type}
                onClick={() => setSelectedFault(f.type)}
                className={`p-2.5 rounded border cursor-pointer transition space-y-1 ${
                  isSelected
                    ? 'bg-[#121c38] border-[#0284c7] text-slate-100 ring-1 ring-[#0284c7]'
                    : 'bg-[#0c1224] border-[#162035] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs block text-slate-200">{f.label}</span>
                  {isElectrical && (
                    <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 text-[9px] font-sans font-bold">
                      ELEC
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">{f.desc}</p>
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
        <div className="flex flex-wrap items-center gap-3 pt-1 font-sans">
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
          <button
            onClick={handleRunDemoChain}
            className="px-4 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow"
          >
            <Zap size={14} />
            <span>RUN ELECTRICAL DEMO CHAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

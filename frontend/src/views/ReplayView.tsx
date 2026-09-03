import React, { useState } from 'react';
import { DigitalTwinState, UAV3DState } from '../types/telemetry';
import { FlightPhaseController } from '../components/FlightPhaseController';
import { UAV3DViewer } from '../components/UAV3DViewer';
import { RotateCcw, Play, Pause, Zap, BatteryCharging, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface ReplayViewProps {
  history: DigitalTwinState[];
}

export const ReplayView: React.FC<ReplayViewProps> = ({ history }) => {
  const [scrubIndex, setScrubIndex] = useState<number>(Math.max(0, history.length - 1));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const selectedState = history[scrubIndex] || history[history.length - 1];
  const elec = selectedState?.observed.electrical;

  const chartData = history.map((s, idx) => ({
    index: idx,
    time: `${Math.floor(s.timestamp)}s`,
    rpm: s.observed.rpm,
    bus_v: s.observed.battery_volts,
    soc: s.observed.electrical?.battery.state_of_charge || 92.0,
    alt_pwr: s.observed.electrical?.alternator.output_power_w || 840.0,
    health: s.overall_health_score,
    elec_health: s.subsystem_health.electrical,
  }));

  const uav3dState: UAV3DState | null = selectedState
    ? {
        engineHealth: selectedState.overall_health_score,
        engineStatus: selectedState.status,
        missionPhase: selectedState.mission_phase,
        activeFault: selectedState.active_fault,
        activeAlert: selectedState.alerts[0]?.candidate_fault || 'Replay Scrubbing Active',
        faultSeverity: selectedState.fault_severity,
        rpm: selectedState.observed.rpm,
        cht: selectedState.observed.cht_c,
        egt: selectedState.observed.egt_c,
        oilPressure: selectedState.observed.oil_pressure_psi,
        vibration: selectedState.observed.vibration_g,
        residualDistance: selectedState.residuals.mahalanobis_distance,
        electricalHealth: selectedState.subsystem_health.electrical,
        busVoltage: selectedState.observed.battery_volts,
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
      }
    : null;

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-sans uppercase tracking-wide flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-[#38bdf8]" />
            Flight Recorder & Electrical Subsystem Timeline Replay
          </h2>
          <p className="text-xs text-slate-400">Deterministic mission telemetry replay and historical event scrubbing with live synchronized RUSTOM 3D Digital Twin</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-[#090e1c] px-3 py-1 rounded border border-[#162035]">
          BUFFERED RECORDS: <strong className="text-[#38bdf8]">{history.length} SECONDS</strong>
        </div>
      </div>

      {/* Flight Phase Controller */}
      <FlightPhaseController
        currentPhase={selectedState?.mission_phase || 'cruise'}
        isReplayMode={true}
      />

      {/* Scrubber Controls Panel */}
      <div className="eng-panel p-4 space-y-3">
        <div className="flex items-center justify-between font-sans">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded bg-[#0284c7] text-white font-bold text-xs hover:bg-[#0369a1] transition flex items-center gap-1"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>
            <span className="font-mono text-xs text-slate-300">
              SCRUBBED TIMESTAMP: <strong className="text-[#38bdf8]">{selectedState ? `${Math.floor(selectedState.timestamp)}s (${selectedState.mission_phase.toUpperCase()})` : '0s'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScrubIndex(0)}
              className="px-2.5 py-1 rounded bg-[#0e152a] border border-[#212f4d] text-slate-300 font-mono text-[11px] hover:bg-[#131c36]"
            >
              Start (0s)
            </button>
            <button
              onClick={() => setScrubIndex(history.length - 1)}
              className="px-2.5 py-1 rounded bg-[#0e152a] border border-[#212f4d] text-slate-300 font-mono text-[11px] hover:bg-[#131c36]"
            >
              Live Tip
            </button>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max={Math.max(0, history.length - 1)}
          value={scrubIndex}
          onChange={(e) => setScrubIndex(parseInt(e.target.value))}
          className="w-full h-1.5 bg-[#162035] rounded appearance-none cursor-pointer accent-[#38bdf8]"
        />
      </div>

      {/* 3D Digital Twin Viewport reproducing exact scrubbed replay state */}
      {uav3dState && (
        <div className="w-full h-[400px]">
          <UAV3DViewer state={uav3dState} height="h-full" showOverlay={true} />
        </div>
      )}

      {/* Replay Split Panels */}
      {selectedState && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 eng-panel p-4 space-y-2">
            <div className="border-b border-[#162035] pb-2 font-sans flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-slate-200">RECORDED TELEMETRY HISTORY</span>
              <span className="text-[10px] text-[#38bdf8]">POWER & BUS PROFILE</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#162035" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#090e1c', borderColor: '#212f4d', fontSize: '11px', color: '#f1f5f9' }} />
                  <Legend />
                  <Line type="monotone" dataKey="bus_v" name="Bus Voltage (V)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="soc" name="Battery SOC (%)" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="alt_pwr" name="Alternator Power (W)" stroke="#38bdf8" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="elec_health" name="Electrical Health %" stroke="#a855f7" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scrubbed State Snapshot Card with all Section 22 parameters */}
          <div className="lg:col-span-5 eng-panel p-4 space-y-3">
            <div className="border-b border-[#162035] pb-2 font-sans flex justify-between items-center">
              <span className="font-bold text-xs uppercase text-[#38bdf8]">ELECTRICAL & ENGINE REPLAY SNAPSHOT</span>
              <span className="text-[10px] text-slate-400">T={Math.floor(selectedState.timestamp)}s</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">TIME:</span>
                <span className="font-bold text-slate-200">{Math.floor(selectedState.timestamp)} s</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">RPM:</span>
                <span className="font-bold text-slate-200">{selectedState.observed.rpm}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">BATTERY VOLTAGE:</span>
                <span className="font-bold text-slate-100">{elec?.battery.voltage.toFixed(1) || selectedState.observed.battery_volts.toFixed(1)} V</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">BATTERY CURRENT:</span>
                <span className={`font-bold ${(elec?.battery.current || 0) > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {elec?.battery.current !== undefined ? (elec.battery.current > 0 ? `+${elec.battery.current.toFixed(1)}` : elec.battery.current.toFixed(1)) : '0.0'} A
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">SOC:</span>
                <span className="text-[#38bdf8] font-bold">{elec?.battery.state_of_charge.toFixed(1) || '92.0'}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">SOH:</span>
                <span className="text-emerald-400 font-bold">{elec?.battery.state_of_health.toFixed(1) || '98.5'}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">ALT VOLTAGE:</span>
                <span className="text-slate-200">{elec?.alternator.output_voltage.toFixed(1) || '28.2'} V</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">ALT CURRENT:</span>
                <span className="text-slate-200">{elec?.alternator.output_current.toFixed(1) || '30.0'} A</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">ALT POWER:</span>
                <span className="text-[#38bdf8] font-bold">{elec?.alternator.output_power_w.toFixed(0) || '846'} W</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">ELECTRICAL LOAD:</span>
                <span className="text-slate-200">{elec?.electrical_load.total_load_w.toFixed(0) || '820'} W</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">BUS VOLTAGE:</span>
                <span className={`font-bold ${selectedState.observed.battery_volts < 25.0 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {selectedState.observed.battery_volts.toFixed(2)} V
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">ELECTRICAL HEALTH:</span>
                <span className="font-bold text-emerald-400">{selectedState.subsystem_health.electrical}%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#162035] flex items-center justify-between text-xs">
              <span className="text-slate-400">ACTIVE FAULT IN REPLAY:</span>
              <span className={`font-bold ${selectedState.active_fault !== 'none' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {selectedState.active_fault.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

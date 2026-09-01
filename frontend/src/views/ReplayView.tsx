import React, { useState } from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { FlightPhaseController } from '../components/FlightPhaseController';
import { RotateCcw, Play, Pause, FastForward, Rewind, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface ReplayViewProps {
  history: DigitalTwinState[];
}

export const ReplayView: React.FC<ReplayViewProps> = ({ history }) => {
  const [scrubIndex, setScrubIndex] = useState<number>(Math.max(0, history.length - 1));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const selectedState = history[scrubIndex] || history[history.length - 1];

  const chartData = history.map((s, idx) => ({
    index: idx,
    time: `${Math.floor(s.timestamp)}s`,
    rpm: s.observed.rpm,
    cht: s.observed.cht_c,
    egt: s.observed.egt_c,
    health: s.overall_health_score,
  }));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-cyan-400" />
            Flight Recorder Timeline Replay Studio
          </h2>
          <p className="text-xs text-slate-400">Deterministic mission telemetry replay and historical event scrubbing</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          BUFFER RECORDS: <strong className="text-cyan-400">{history.length} SECONDS</strong>
        </div>
      </div>

      {/* Synchronized Flight Phase Controller */}
      <FlightPhaseController
        currentPhase={selectedState?.mission_phase || 'cruise'}
        isReplayMode={true}
      />

      {/* Timeline Scrubber Bar Card */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold block">SCRUBBED TIMESTAMP</span>
              <span className="font-mono text-base font-bold text-slate-100">
                {selectedState ? `${Math.floor(selectedState.timestamp)}s (${selectedState.mission_phase.toUpperCase()})` : '0s'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScrubIndex(0)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:bg-slate-800"
            >
              Skip to Start (0s)
            </button>
            <button
              onClick={() => setScrubIndex(history.length - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:bg-slate-800"
            >
              Skip to Live
            </button>
          </div>
        </div>

        {/* Timeline Range Slider */}
        <input
          type="range"
          min="0"
          max={Math.max(0, history.length - 1)}
          value={scrubIndex}
          onChange={(e) => setScrubIndex(parseInt(e.target.value))}
          className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>

      {/* Historical Telemetry & Twin State Snapshot */}
      {selectedState && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Recorded Mission Telemetry Timeline
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="rpm" name="RPM" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cht" name="CHT °C" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="health" name="Health %" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 glass-panel p-5 rounded-xl border border-slate-800 space-y-3 text-xs">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
              Scrubbed State Snapshot
            </h3>

            <div className="space-y-2 font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">HEALTH SCORE:</span>
                <span className="font-bold text-emerald-400">{selectedState.overall_health_score}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">ACTIVE FAULT:</span>
                <span className="font-bold text-rose-400">{selectedState.active_fault}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">RPM:</span>
                <span>{selectedState.observed.rpm}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">CHT (°C):</span>
                <span>{selectedState.observed.cht_c}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">EGT (°C):</span>
                <span>{selectedState.observed.egt_c}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">OIL PRESSURE:</span>
                <span>{selectedState.observed.oil_pressure_psi} PSI</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

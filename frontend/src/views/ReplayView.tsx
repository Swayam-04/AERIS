import React, { useState } from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { FlightPhaseController } from '../components/FlightPhaseController';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-sans uppercase tracking-wide flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-[#38bdf8]" />
            Flight Recorder Timeline Replay Studio
          </h2>
          <p className="text-xs text-slate-400">Deterministic mission telemetry replay and historical event scrubbing</p>
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

      {/* Replay Split Panels */}
      {selectedState && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 eng-panel p-4 space-y-2">
            <div className="border-b border-[#162035] pb-2 font-sans">
              <span className="font-bold text-xs uppercase text-slate-200">RECORDED TELEMETRY HISTORY</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#162035" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#090e1c', borderColor: '#212f4d', fontSize: '11px', color: '#f1f5f9' }} />
                  <Line type="monotone" dataKey="rpm" name="RPM" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="cht" name="CHT °C" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="health" name="Health %" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 eng-panel p-4 space-y-3">
            <div className="border-b border-[#162035] pb-2 font-sans">
              <span className="font-bold text-xs uppercase text-[#38bdf8]">SCRUBBED STATE SNAPSHOT</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">HEALTH SCORE:</span>
                <span className="font-bold text-emerald-400">{selectedState.overall_health_score}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">ACTIVE FAULT:</span>
                <span className="font-bold text-rose-400">{selectedState.active_fault}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">RPM SPEED:</span>
                <span>{selectedState.observed.rpm}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">CHT TEMP:</span>
                <span>{selectedState.observed.cht_c} °C</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#162035]">
                <span className="text-slate-500">EGT TEMP:</span>
                <span>{selectedState.observed.egt_c} °C</span>
              </div>
              <div className="flex justify-between py-1">
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

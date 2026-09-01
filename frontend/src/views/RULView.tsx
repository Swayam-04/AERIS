import React from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { Clock, Info, CheckCircle2 } from 'lucide-react';

interface RULViewProps {
  state: DigitalTwinState | null;
}

export const RULView: React.FC<RULViewProps> = ({ state }) => {
  if (!state || !state.rul) return null;

  const rul = state.rul;
  const pctRemaining = Math.max(0, Math.min(100, (rul.rul_hours / rul.baseline_hours) * 100));

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase font-sans tracking-wide flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#38bdf8]" />
            Remaining Useful Life (RUL) & Wear Degradation Console
          </h2>
          <p className="text-xs text-slate-400">Physics-informed cumulative damage accumulation and lifetime estimation</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-[#090e1c] px-3 py-1 rounded border border-[#162035]">
          RUL MODEL VERSION: <strong className="text-[#38bdf8]">{rul.model_version}</strong>
        </div>
      </div>

      {/* Main RUL Engineering Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Estimated RUL Summary Panel (6 Cols) */}
        <div className="lg:col-span-6 eng-panel p-4 space-y-4">
          <div className="border-b border-[#162035] pb-2 flex justify-between items-center font-sans">
            <span className="font-bold text-xs uppercase text-slate-200">ESTIMATED REMAINING USEFUL LIFE</span>
            <span className="text-xs text-emerald-400 font-mono font-bold">DATA QUALITY: GOOD</span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className="text-4xl font-bold text-[#38bdf8]">{rul.rul_hours}</span>
            <span className="text-sm font-semibold text-slate-300">FLIGHT HOURS</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Time Between Overhaul (TBO): 1,200 Hours</span>
              <span className="text-slate-200 font-bold">{pctRemaining.toFixed(1)}% Remaining</span>
            </div>
            <div className="w-full bg-[#162035] h-2 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${
                  pctRemaining > 50 ? 'bg-emerald-400' : pctRemaining > 25 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${pctRemaining}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-[#0c1224] p-3 rounded border border-[#162035]">
            <div>
              <span className="text-slate-500 block text-[10px]">95% CONFIDENCE INTERVAL</span>
              <span className="text-slate-100 font-bold">{rul.confidence_lower_hr}h — {rul.confidence_upper_hr}h</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">DEGRADATION RATE</span>
              <span className="text-amber-400 font-bold">{rul.degradation_rate_pct_per_hr}% / hr</span>
            </div>
          </div>
        </div>

        {/* Wear Contributor & Operating Guidance Panel (6 Cols) */}
        <div className="lg:col-span-6 eng-panel p-4 space-y-4">
          <div className="border-b border-[#162035] pb-2 font-sans">
            <span className="font-bold text-xs uppercase text-slate-200">PRIMARY DEGRADATION CONTRIBUTOR</span>
          </div>

          <div className="p-3 rounded bg-[#0c1224] border border-[#162035] space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Leading Subsystem Wear</span>
            <span className="text-base font-bold text-amber-400">{rul.primary_degradation_subsystem}</span>
            <p className="text-xs text-slate-300 mt-1">
              Current thermal CHT/EGT cycles and vibration harmonics accelerate component fatigue in this subsystem.
            </p>
          </div>

          <div className="space-y-1 text-xs">
            <span className="font-bold text-slate-300 font-sans block uppercase">Operational Wear Guidance</span>
            <p className="text-slate-400 leading-relaxed">
              Operating at continuous loiter RPM extends RUL by reducing cylinder head thermal stress and peak pressure dynamics.
            </p>
          </div>
        </div>
      </div>

      {/* Model Assumptions Table Panel */}
      <div className="eng-panel">
        <div className="eng-header">
          <span className="font-sans font-bold text-xs uppercase text-slate-200 tracking-wider flex items-center gap-2">
            <Info size={14} className="text-[#38bdf8]" />
            MODEL ASSUMPTIONS & UNCERTAINTY BOUNDS
          </span>
        </div>

        <div className="p-4 space-y-2 text-xs text-slate-300">
          {rul.assumptions.map((ass, i) => (
            <div key={i} className="flex items-start gap-2 bg-[#0c1224] p-2.5 rounded border border-[#162035]">
              <CheckCircle2 size={14} className="text-[#38bdf8] shrink-0 mt-0.5" />
              <span>{ass}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { Clock, ShieldAlert, AlertTriangle, Layers, Info, CheckCircle2 } from 'lucide-react';

interface RULViewProps {
  state: DigitalTwinState | null;
}

export const RULView: React.FC<RULViewProps> = ({ state }) => {
  if (!state || !state.rul) return null;

  const rul = state.rul;
  const pctRemaining = Math.max(0, Math.min(100, (rul.rul_hours / rul.baseline_hours) * 100));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Remaining Useful Life (RUL) & Degradation Model
          </h2>
          <p className="text-xs text-slate-400">Prototype wear degradation model based on physics residual accumulation</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          MODEL: <strong className="text-cyan-400">{rul.model_version}</strong>
        </div>
      </div>

      {/* Main RUL Display Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RUL Primary Hero Card */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Estimated Remaining Useful Life
          </span>

          <div className="flex items-baseline gap-3 my-2">
            <span className="text-5xl font-bold font-mono text-cyan-400">{rul.rul_hours}</span>
            <span className="text-lg font-semibold text-slate-300">HOURS</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Time Between Overhaul (TBO): 1200 Hours</span>
              <span>{pctRemaining.toFixed(1)}% Life</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pctRemaining > 50 ? 'bg-emerald-400' : pctRemaining > 25 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${pctRemaining}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">95% CONFIDENCE INTERVAL</span>
              <span className="text-slate-200 font-bold">{rul.confidence_lower_hr}h — {rul.confidence_upper_hr}h</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">DEGRADATION RATE</span>
              <span className="text-amber-400 font-bold">{rul.degradation_rate_pct_per_hr}% / hr</span>
            </div>
          </div>
        </div>

        {/* Degradation Driver & Subsystem Breakdown */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Primary Wear Subsystem Contributor
          </h3>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider block">Leading Subsystem Wear</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{rul.primary_degradation_subsystem}</span>
            <p className="text-xs text-slate-400">
              Current thermal and vibration stress vectors accelerate component fatigue in this subsystem.
            </p>
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block uppercase tracking-wider">Operational Wear Guidance</span>
            <p>
              Operating at continuous loiter RPM extends RUL by reducing cylinder head thermal cycle stress.
            </p>
          </div>
        </div>
      </div>

      {/* Explicit Domain Assumptions Card */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          Model Assumptions & Limitations
        </h3>

        <div className="space-y-2 text-xs text-slate-300">
          {rul.assumptions.map((ass, i) => (
            <div key={i} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{ass}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

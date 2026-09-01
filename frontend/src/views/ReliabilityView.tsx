import React from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { BarChart3, ShieldCheck, Zap, Thermometer, Activity, CheckCircle2 } from 'lucide-react';

interface ReliabilityViewProps {
  state: DigitalTwinState | null;
}

export const ReliabilityView: React.FC<ReliabilityViewProps> = ({ state }) => {
  if (!state) return null;

  const phaseRisks = [
    { phase: 'TAKEOFF', stress: 'High Thermal & Mechanical', riskLevel: 'Moderate', color: 'text-amber-400', pct: 68 },
    { phase: 'CLIMB', stress: 'High EGT & Cooling Gradient', riskLevel: 'Moderate-High', color: 'text-amber-400', pct: 75 },
    { phase: 'CRUISE', stress: 'Stable High-Altitude Operation', riskLevel: 'Low Risk', color: 'text-emerald-400', pct: 25 },
    { phase: 'LOITER', stress: 'Maximum Endurance / Low RPM', riskLevel: 'Optimal Reliability', color: 'text-emerald-400', pct: 15 },
    { phase: 'LANDING', stress: 'Thermal Shock / Rapid Throttle Idle', riskLevel: 'Moderate', color: 'text-amber-400', pct: 45 },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Mission Reliability & Fleet Risk Analytics
          </h2>
          <p className="text-xs text-slate-400">Phase-wise thermal stress accumulation and reliability enhancement metrics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mean Time Between Alerts (MTBA)
          </span>
          <div className="text-3xl font-bold font-mono text-cyan-400">412.5 hrs</div>
          <p className="text-xs text-slate-400">Derived from historical mission telemetry across fleet runs</p>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Cumulative Thermal Stress Factor
          </span>
          <div className="text-3xl font-bold font-mono text-amber-400">1.18x Nominal</div>
          <p className="text-xs text-slate-400">Cylinder head temperature integral stress index</p>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Vibration Fatigue Accumulation
          </span>
          <div className="text-3xl font-bold font-mono text-emerald-400">Low (0.34 g RMS)</div>
          <p className="text-xs text-slate-400">Harmonic crankshaft vibration exposure balance</p>
        </div>
      </div>

      {/* Phase Risk Matrix */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Mission Phase Stress & Risk Profile
        </h3>

        <div className="space-y-3">
          {phaseRisks.map((pr) => (
            <div key={pr.phase} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-100 font-mono">{pr.phase}</span>
                <span className={`font-mono ${pr.color}`}>{pr.riskLevel}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    pr.pct > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${pr.pct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">{pr.stress}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

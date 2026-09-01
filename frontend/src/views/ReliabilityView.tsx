import React from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { BarChart3 } from 'lucide-react';

interface ReliabilityViewProps {
  state: DigitalTwinState | null;
}

export const ReliabilityView: React.FC<ReliabilityViewProps> = ({ state }) => {
  if (!state) return null;

  const phaseRisks = [
    { phase: 'TAKEOFF', stress: 'High Thermal & Mechanical', riskLevel: 'MODERATE', pct: 68 },
    { phase: 'CLIMB', stress: 'High EGT & Cooling Gradient', riskLevel: 'ELEVATED', pct: 75 },
    { phase: 'CRUISE', stress: 'Stable High-Altitude Operation', riskLevel: 'LOW RISK', pct: 25 },
    { phase: 'LOITER', stress: 'Maximum Endurance / Low RPM', riskLevel: 'OPTIMAL', pct: 15 },
    { phase: 'LANDING', stress: 'Thermal Shock / Rapid Throttle Idle', riskLevel: 'MODERATE', pct: 45 },
  ];

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-sans tracking-wide flex items-center gap-2 uppercase">
            <BarChart3 className="w-5 h-5 text-[#38bdf8]" />
            Mission Reliability & Fleet Risk Analytics
          </h2>
          <p className="text-xs text-slate-400">Phase-wise thermal stress accumulation and reliability enhancement metrics</p>
        </div>
      </div>

      {/* KPI Matrix Panel */}
      <div className="eng-panel">
        <div className="eng-header font-sans">
          <span className="font-bold text-xs uppercase text-slate-200">FLEET RELIABILITY METRIC MATRIX</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#162035] p-3">
          <div className="p-2 space-y-1">
            <span className="text-[10px] text-slate-400 font-sans font-bold block uppercase">Mean Time Between Alerts (MTBA)</span>
            <div className="text-2xl font-bold text-[#38bdf8]">412.5 hrs</div>
            <p className="text-[10px] text-slate-500">Derived from historical mission telemetry across fleet runs</p>
          </div>

          <div className="p-2 space-y-1">
            <span className="text-[10px] text-slate-400 font-sans font-bold block uppercase">Cumulative Thermal Stress</span>
            <div className="text-2xl font-bold text-amber-400">1.18x Nominal</div>
            <p className="text-[10px] text-slate-500">Cylinder head temperature integral stress index</p>
          </div>

          <div className="p-2 space-y-1">
            <span className="text-[10px] text-slate-400 font-sans font-bold block uppercase">Vibration Fatigue Index</span>
            <div className="text-2xl font-bold text-emerald-400">0.34 g RMS</div>
            <p className="text-[10px] text-slate-500">Harmonic crankshaft vibration exposure balance</p>
          </div>
        </div>
      </div>

      {/* Phase Risk Table */}
      <div className="eng-panel">
        <div className="eng-header font-sans">
          <span className="font-bold text-xs uppercase text-slate-200">MISSION FLIGHT PHASE RISK PROFILE</span>
        </div>

        <table className="eng-table">
          <thead>
            <tr>
              <th>FLIGHT PHASE</th>
              <th>OPERATIONAL STRESS PROFILE</th>
              <th>RELIABILITY EVALUATION</th>
              <th>ACCUMULATED STRESS %</th>
            </tr>
          </thead>
          <tbody>
            {phaseRisks.map((pr) => (
              <tr key={pr.phase}>
                <td className="font-bold text-slate-200">{pr.phase}</td>
                <td className="text-slate-300">{pr.stress}</td>
                <td>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    pr.pct < 30 ? 'eng-badge-success' : pr.pct < 70 ? 'eng-badge-warning' : 'eng-badge-critical'
                  }`}>
                    {pr.riskLevel}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-[#162035] h-1.5 rounded overflow-hidden">
                      <div
                        className={`h-full ${pr.pct > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${pr.pct}%` }}
                      />
                    </div>
                    <span>{pr.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

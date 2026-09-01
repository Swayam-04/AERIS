import React from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Cpu, ShieldCheck, Activity, Layers } from 'lucide-react';

interface HealthViewProps {
  state: DigitalTwinState | null;
  history: DigitalTwinState[];
}

export const HealthView: React.FC<HealthViewProps> = ({ state, history }) => {
  if (!state) return null;

  const historyData = history.slice(-30).map((s) => ({
    time: `${Math.floor(s.timestamp)}s`,
    health: s.overall_health_score,
    piston: s.subsystem_health.piston_cylinder,
    lubrication: s.subsystem_health.lubrication,
    fuel: s.subsystem_health.fuel_injection,
    ignition: s.subsystem_health.ignition,
    mahalanobis: s.residuals.mahalanobis_distance,
  }));

  const subsystems = [
    {
      name: 'Piston & Cylinder Assembly',
      health: state.subsystem_health.piston_cylinder,
      desc: 'Tracks thermal balance across cylinders, head gaskets, and valve seats.',
      contributing: `CHT residual: ${state.residuals.cht_c}°C, EGT residual: ${state.residuals.egt_c}°C`,
    },
    {
      name: 'Lubrication & Oil System',
      health: state.subsystem_health.lubrication,
      desc: 'Monitors crankcase oil pressure, oil cooler thermal efficiency, and pump delivery.',
      contributing: `Oil press residual: ${state.residuals.oil_pressure_psi} PSI, Oil temp: ${state.residuals.oil_temp_c}°C`,
    },
    {
      name: 'Fuel Injection & Mixture Rail',
      health: state.subsystem_health.fuel_injection,
      desc: 'Evaluates electronic fuel injection pulse timing and manifold pressure delivery.',
      contributing: `Fuel flow residual: ${state.residuals.fuel_flow_lph} L/h, Timing: ${state.residuals.injection_timing_deg}°`,
    },
    {
      name: 'Ignition & Mechanical Balance',
      health: state.subsystem_health.ignition,
      desc: 'Detects cylinder misfires, crankshaft rotational harmonics, and vibration spikes.',
      contributing: `Vibration residual: ${state.residuals.vibration_g} g, RPM delta: ${state.residuals.rpm}`,
    },
    {
      name: 'Electrical & Alternator Bus',
      health: state.subsystem_health.electrical,
      desc: 'Ensures 28V DC bus stability, alternator diode performance, and ignition coil power.',
      contributing: `Battery voltage residual: ${state.residuals.battery_volts} V`,
    },
  ];

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Executive Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase font-sans tracking-wide flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#38bdf8]" />
            Engine Health & Subsystem Degradation Matrix
          </h2>
          <p className="text-xs text-slate-400">Physics-informed composite health scoring and residual vector analysis</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1 rounded bg-[#090e1c] border border-[#162035] text-slate-300">
            HEALTH SCORE: <strong className="text-[#38bdf8]">{state.overall_health_score}%</strong>
          </div>
        </div>
      </div>

      {/* Structured Health Summary Panel (No circular dials) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Metric Summary Panel (5 Cols) */}
        <div className="lg:col-span-5 eng-panel p-4 space-y-4">
          <div className="border-b border-[#162035] pb-2 flex justify-between items-center">
            <span className="font-sans font-bold text-xs uppercase text-slate-200">COMPOSITE HEALTH EVALUATION</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              state.status === 'normal' ? 'eng-badge-success' : 'eng-badge-critical'
            }`}>
              {state.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#0c1224] rounded border border-[#162035]">
              <span className="text-[10px] text-slate-400 block font-sans">OVERALL HEALTH</span>
              <span className="text-2xl font-bold text-slate-100">{state.overall_health_score}%</span>
            </div>
            <div className="p-3 bg-[#0c1224] rounded border border-[#162035]">
              <span className="text-[10px] text-slate-400 block font-sans">MAHALANOBIS D_M</span>
              <span className="text-2xl font-bold text-[#38bdf8]">{state.residuals.mahalanobis_distance.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2 text-[11px] text-slate-300">
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-400">Baseline TBO Limit:</span>
              <span className="text-slate-200">1,200 Flight Hours</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#162035]">
              <span className="text-slate-400">Active Fault State:</span>
              <span className={`font-bold ${state.active_fault !== 'None' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {state.active_fault.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Model Precision Confidence:</span>
              <span className="text-emerald-400 font-bold">99.4% (Physics-Informed)</span>
            </div>
          </div>
        </div>

        {/* Historical Health Degradation Trajectory Chart (7 Cols) */}
        <div className="lg:col-span-7 eng-panel p-4 space-y-2">
          <div className="border-b border-[#162035] pb-2">
            <span className="font-sans font-bold text-xs uppercase text-slate-200">
              SUBSYSTEM HEALTH & RESIDUAL DIVERGENCE TRAJECTORY
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162035" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#090e1c', borderColor: '#212f4d', fontSize: '11px', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="health" name="Overall Health %" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="piston" name="Piston/Cylinder %" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="lubrication" name="Lubrication %" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="fuel" name="Fuel Injection %" stroke="#ec4899" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Subsystem Health Breakdown Table */}
      <div className="eng-panel">
        <div className="eng-header">
          <span className="font-sans font-bold text-xs uppercase text-slate-200 tracking-wider">
            SUBSYSTEM HEALTH BREAKDOWN & DIAGNOSTIC EVIDENCE
          </span>
        </div>

        <table className="eng-table">
          <thead>
            <tr>
              <th>SUBSYSTEM</th>
              <th>HEALTH INDEX</th>
              <th>STATUS</th>
              <th>FUNCTIONAL SCOPE</th>
              <th>CONTRIBUTING VECTOR EVIDENCE</th>
            </tr>
          </thead>
          <tbody>
            {subsystems.map((sub) => (
              <tr key={sub.name}>
                <td className="font-bold text-slate-200">{sub.name}</td>
                <td className="font-bold text-[#38bdf8]">{sub.health}%</td>
                <td>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    sub.health > 80 ? 'eng-badge-success' : sub.health > 50 ? 'eng-badge-warning' : 'eng-badge-critical'
                  }`}>
                    {sub.health > 80 ? 'NOMINAL' : sub.health > 50 ? 'DEGRADED' : 'FAULT'}
                  </span>
                </td>
                <td className="text-slate-300">{sub.desc}</td>
                <td className="text-slate-400">{sub.contributing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Cpu, ShieldCheck, Activity, Zap, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Engine Health & Subsystem Degradation Console
          </h2>
          <p className="text-xs text-slate-400">Physics-informed composite health scoring and residual vector analysis</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            COMPOSITE SCORE: <strong className="text-cyan-400">{state.overall_health_score}%</strong>
          </span>
        </div>
      </div>

      {/* Top Health Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Overall Score Dial Card */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-xl border border-slate-800 flex flex-col justify-between items-center text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Overall Aero-Piston Engine Health
          </span>

          <div className="relative my-4 flex items-center justify-center">
            {/* Circular Progress Representation */}
            <div className={`w-40 h-40 rounded-full border-8 flex flex-col items-center justify-center shadow-2xl ${
              state.overall_health_score > 80 ? 'border-emerald-500/80 led-glow-emerald bg-emerald-950/20' :
              state.overall_health_score > 50 ? 'border-amber-500/80 led-glow-amber bg-amber-950/20' :
              'border-rose-500/80 led-glow-rose bg-rose-950/20'
            }`}>
              <span className={`text-4xl font-bold font-mono ${
                state.overall_health_score > 80 ? 'text-emerald-400' :
                state.overall_health_score > 50 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {state.overall_health_score}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-1">HEALTH INDEX</span>
            </div>
          </div>

          <div className="w-full text-xs space-y-1 font-mono text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">ENGINE STATUS:</span>
              <span className={`font-bold uppercase ${state.status === 'normal' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {state.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MAHALANOBIS D_M:</span>
              <span className="text-cyan-400">{state.residuals.mahalanobis_distance}</span>
            </div>
          </div>
        </div>

        {/* Historical Health Trend Chart */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Subsystem Health & Residual Divergence Trajectory
              </h3>
              <p className="text-xs text-slate-400">Continuous health degradation tracking across mission timeline</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="health" name="Overall Health %" stroke="#10b981" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="piston" name="Piston/Cylinder %" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="lubrication" name="Lubrication %" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="fuel" name="Fuel Injection %" stroke="#ec4899" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Subsystem Health Cards List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Subsystem Health Breakdown & Diagnostic Evidence
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subsystems.map((sub) => (
            <div key={sub.name} className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{sub.name}</span>
                <span className={`font-mono text-xs font-bold ${
                  sub.health > 80 ? 'text-emerald-400' : sub.health > 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {sub.health}%
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    sub.health > 80 ? 'bg-emerald-400' : sub.health > 50 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${sub.health}%` }}
                />
              </div>

              <p className="text-xs text-slate-400">{sub.desc}</p>
              <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800">
                Evidence: <span className="text-slate-300">{sub.contributing}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

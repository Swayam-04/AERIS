import React, { useState } from 'react';
import { FaultType, DigitalTwinState } from '../types/telemetry';
import { GitCompare, Play, Layers, TrendingDown, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export const WhatIfLabView: React.FC = () => {
  const [faultType, setFaultType] = useState<FaultType>('injector_abnormality');
  const [severity, setSeverity] = useState<number>(0.7);
  const [faultStartSec, setFaultStartSec] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationData, setSimulationData] = useState<{
    baseline: DigitalTwinState[];
    degraded: DigitalTwinState[];
  } | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatif/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fault_type: faultType,
          severity,
          fault_start_sec: faultStartSec,
          duration_sec: 300.0,
        }),
      });
      const data = await res.json();
      setSimulationData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const chartData = simulationData
    ? simulationData.baseline.map((base, idx) => {
        const deg = simulationData.degraded[idx] || base;
        return {
          time: `${idx}s`,
          health_base: base.overall_health_score,
          health_deg: deg.overall_health_score,
          egt_base: base.observed.egt_c,
          egt_deg: deg.observed.egt_c,
          cht_base: base.observed.cht_c,
          cht_deg: deg.observed.cht_c,
        };
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            What-If Comparative Experiment Lab
          </h2>
          <p className="text-xs text-slate-400">Isolated sandbox: Baseline Normal Flight vs Degraded Scenario Comparative Analysis</p>
        </div>
      </div>

      {/* Experiment Configuration Panel */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Configure What-If Scenario Experiment
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5 uppercase">Fault Type</label>
            <select
              value={faultType}
              onChange={(e) => setFaultType(e.target.value as FaultType)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 font-semibold focus:border-cyan-500 outline-none"
            >
              <option value="misfire">Cylinder Misfire</option>
              <option value="injector_abnormality">Injector Restriction / Lean</option>
              <option value="oil_pressure_loss">Oil Pressure Loss</option>
              <option value="overheating">Thermal Overheating</option>
              <option value="vibration_spike">Vibration Spike</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5 uppercase">Severity Factor ({ (severity * 100).toFixed(0) }%)</label>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={severity}
              onChange={(e) => setSeverity(parseFloat(e.target.value))}
              className="w-full mt-3 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5 uppercase">Fault Injection Time ({faultStartSec}s)</label>
            <input
              type="number"
              min="10"
              max="240"
              value={faultStartSec}
              onChange={(e) => setFaultStartSec(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 font-mono focus:border-cyan-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
        >
          <Play size={16} /> {loading ? 'Running Isolated Simulation...' : 'Execute What-If Comparative Simulation'}
        </button>
      </div>

      {/* Results Comparison Matrix */}
      {simulationData && (
        <div className="space-y-6">
          {/* Comparative Graph */}
          <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Health & Temperature Divergence Trajectory (Baseline vs Degraded)
            </h3>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="health_base" name="Baseline Health %" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="health_deg" name="Degraded Health %" stroke="#f43f5e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="egt_deg" name="Degraded EGT °C" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

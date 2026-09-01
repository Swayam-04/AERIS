import React, { useState } from 'react';
import { FaultType, DigitalTwinState } from '../types/telemetry';
import { GitCompare, Play } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

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
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-sans tracking-wide flex items-center gap-2 uppercase">
            <GitCompare className="w-5 h-5 text-[#38bdf8]" />
            What-If Comparative Experiment Sandbox
          </h2>
          <p className="text-xs text-slate-400">Isolated sandbox: Nominal Baseline Flight vs Degraded Fault Profile Delta Analysis</p>
        </div>
      </div>

      {/* Experiment Config Panel */}
      <div className="eng-panel p-4 space-y-4">
        <div className="border-b border-[#162035] pb-2 font-sans">
          <span className="font-bold text-xs uppercase text-slate-200">EXPERIMENT SCENARIO PARAMETERS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 font-sans font-bold block mb-1 uppercase">FAULTS TYPE</label>
            <select
              value={faultType}
              onChange={(e) => setFaultType(e.target.value as FaultType)}
              className="w-full bg-[#0c1224] border border-[#162035] text-slate-200 text-xs rounded p-2 focus:border-[#0284c7] outline-none"
            >
              <option value="misfire">Cylinder Misfire</option>
              <option value="injector_abnormality">Injector Restriction / Lean</option>
              <option value="oil_pressure_loss">Oil Pressure Loss</option>
              <option value="overheating">Thermal Overheating</option>
              <option value="vibration_spike">Vibration Spike</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-sans font-bold block mb-1 uppercase">SEVERITY FACTOR ({(severity * 100).toFixed(0)}%)</label>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={severity}
              onChange={(e) => setSeverity(parseFloat(e.target.value))}
              className="w-full h-1.5 mt-2 bg-[#162035] rounded appearance-none cursor-pointer accent-[#38bdf8]"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-sans font-bold block mb-1 uppercase">INJECTION OFFSET ({faultStartSec}s)</label>
            <input
              type="number"
              min="10"
              max="240"
              value={faultStartSec}
              onChange={(e) => setFaultStartSec(parseInt(e.target.value))}
              className="w-full bg-[#0c1224] border border-[#162035] text-slate-200 text-xs rounded p-2 focus:border-[#0284c7] outline-none font-mono"
            />
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="w-full py-2.5 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs font-sans uppercase tracking-wider transition flex items-center justify-center gap-2"
        >
          <Play size={14} /> {loading ? 'RUNNING COMPARATIVE SIMULATION...' : 'EXECUTE WHAT-IF SIMULATION'}
        </button>
      </div>

      {/* Results Comparison Chart */}
      {simulationData && (
        <div className="eng-panel p-4 space-y-2">
          <div className="border-b border-[#162035] pb-2 font-sans">
            <span className="font-bold text-xs uppercase text-slate-200">
              HEALTH & TEMPERATURE DIVERGENCE TRAJECTORY (BASELINE VS DEGRADED)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162035" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#090e1c', borderColor: '#212f4d', fontSize: '11px', color: '#f1f5f9' }} />
                <Legend />
                <Line type="monotone" dataKey="health_base" name="Nominal Baseline Health %" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="health_deg" name="Fault Profile Health %" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="egt_deg" name="Degraded EGT (°C)" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Gauge, Thermometer, Flame, Activity, Zap, Wind, Sliders, BatteryCharging, Radio } from 'lucide-react';

interface TelemetryViewProps {
  state: DigitalTwinState | null;
  history: DigitalTwinState[];
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({ state, history }) => {
  if (!state) return null;

  const historyData = history.slice(-25).map((s) => ({
    time: `${Math.floor(s.timestamp)}s`,
    rpm: s.observed.rpm,
    cht: s.observed.cht_c,
    egt: s.observed.egt_c,
    oil_press: s.observed.oil_pressure_psi,
    oil_temp: s.observed.oil_temp_c,
    fuel_flow: s.observed.fuel_flow_lph,
    vibration: s.observed.vibration_g,
    injection: s.observed.injection_timing_deg,
    battery: s.observed.battery_volts,
  }));

  const signals = [
    {
      id: 'rpm',
      name: 'Engine RPM',
      unit: 'RPM',
      icon: Gauge,
      val: state.observed.rpm,
      exp: state.expected.rpm,
      delta: state.residuals.rpm,
      color: '#06b6d4',
      warnRange: '1200 - 5800 RPM',
      isWarning: state.observed.rpm < 1200 || state.observed.rpm > 5900,
    },
    {
      id: 'cht',
      name: 'Cylinder Head Temp (CHT)',
      unit: '°C',
      icon: Thermometer,
      val: state.observed.cht_c,
      exp: state.expected.cht_c,
      delta: state.residuals.cht_c,
      color: '#f59e0b',
      warnRange: '110 - 210 °C',
      isWarning: state.observed.cht_c > 210,
    },
    {
      id: 'egt',
      name: 'Exhaust Gas Temp (EGT)',
      unit: '°C',
      icon: Flame,
      val: state.observed.egt_c,
      exp: state.expected.egt_c,
      delta: state.residuals.egt_c,
      color: '#f43f5e',
      warnRange: '450 - 880 °C',
      isWarning: state.observed.egt_c > 880,
    },
    {
      id: 'oil_press',
      name: 'Oil Pressure',
      unit: 'PSI',
      icon: Activity,
      val: state.observed.oil_pressure_psi,
      exp: state.expected.oil_pressure_psi,
      delta: state.residuals.oil_pressure_psi,
      color: '#10b981',
      warnRange: '30 - 85 PSI',
      isWarning: state.observed.oil_pressure_psi < 28,
    },
    {
      id: 'oil_temp',
      name: 'Oil Temperature',
      unit: '°C',
      icon: Thermometer,
      val: state.observed.oil_temp_c,
      exp: state.expected.oil_temp_c,
      delta: state.residuals.oil_temp_c,
      color: '#3b82f6',
      warnRange: '60 - 118 °C',
      isWarning: state.observed.oil_temp_c > 118,
    },
    {
      id: 'fuel_flow',
      name: 'Fuel Consumption Rate',
      unit: 'L/h',
      icon: Wind,
      val: state.observed.fuel_flow_lph,
      exp: state.expected.fuel_flow_lph,
      delta: state.residuals.fuel_flow_lph,
      color: '#8b5cf6',
      warnRange: '4.0 - 42.0 L/h',
      isWarning: Math.abs(state.residuals.fuel_flow_lph) > 3.5,
    },
    {
      id: 'vibration',
      name: 'Vibration Acceleration',
      unit: 'g RMS',
      icon: Zap,
      val: state.observed.vibration_g,
      exp: state.expected.vibration_g,
      delta: state.residuals.vibration_g,
      color: '#ec4899',
      warnRange: '0.2 - 2.2 g',
      isWarning: state.observed.vibration_g > 2.2,
    },
    {
      id: 'injection',
      name: 'Injection Timing',
      unit: '° BTDC',
      icon: Sliders,
      val: state.observed.injection_timing_deg,
      exp: state.expected.injection_timing_deg,
      delta: state.residuals.injection_timing_deg,
      color: '#06b6d4',
      warnRange: '10 - 28 ° BTDC',
      isWarning: Math.abs(state.residuals.injection_timing_deg) > 3.0,
    },
    {
      id: 'battery',
      name: 'Alternator / Bus Voltage',
      unit: 'Volts',
      icon: BatteryCharging,
      val: state.observed.battery_volts,
      exp: state.expected.battery_volts,
      delta: state.residuals.battery_volts,
      color: '#10b981',
      warnRange: '26.0 - 28.8 V',
      isWarning: state.observed.battery_volts < 25.5,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            High-Frequency Telemetry Signal Console
          </h2>
          <p className="text-xs text-slate-400">9 Core aero-piston parameters with real-time physics residual tracking</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          SAMPLING RATE: <strong className="text-cyan-400">1.0 Hz (1000ms)</strong>
        </div>
      </div>

      {/* 9 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {signals.map((sig) => {
          const Icon = sig.icon;
          return (
            <div
              key={sig.id}
              className={`glass-panel p-5 rounded-xl border transition space-y-3 ${
                sig.isWarning ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    <Icon className="w-4 h-4" style={{ color: sig.color }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 uppercase">{sig.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                  sig.isWarning ? 'bg-rose-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {sig.isWarning ? 'ALERT' : 'NOMINAL'}
                </span>
              </div>

              {/* Main Metric Value */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-bold font-mono text-slate-100">{sig.val}</span>
                  <span className="text-xs text-slate-400 ml-1.5 font-mono">{sig.unit}</span>
                </div>
                <div className="text-right text-xs font-mono">
                  <span className="text-slate-500 block text-[10px]">PHYSICS EXP</span>
                  <span className="text-slate-400">{sig.exp} {sig.unit}</span>
                </div>
              </div>

              {/* Sparkline Trend Chart */}
              <div className="h-16 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey={sig.id} stroke={sig.color} fill={sig.color} fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Info */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-800 text-slate-400">
                <span>Tol: {sig.warnRange}</span>
                <span className={sig.delta !== 0 ? (sig.delta > 0 ? 'text-amber-400' : 'text-cyan-400') : 'text-slate-500'}>
                  Δ {sig.delta > 0 ? `+${sig.delta}` : sig.delta}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

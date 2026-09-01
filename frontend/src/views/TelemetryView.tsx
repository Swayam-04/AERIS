import React from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from 'recharts';
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
      color: '#38bdf8',
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
      color: '#38bdf8',
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
      color: '#a855f7',
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
      color: '#38bdf8',
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
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#38bdf8]" />
            High-Frequency Telemetry Signal Console
          </h2>
          <p className="text-xs text-slate-400 font-mono">9 Core aero-piston parameters with real-time physics residual tracking</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-[#090e1c] px-3 py-1 rounded border border-[#162035]">
          SAMPLING FREQUENCY: <strong className="text-[#38bdf8]">1.0 Hz (1000ms)</strong>
        </div>
      </div>

      {/* Structured Signal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signals.map((sig) => {
          const Icon = sig.icon;
          return (
            <div
              key={sig.id}
              className={`eng-panel p-3.5 space-y-2.5 transition ${
                sig.isWarning ? 'border-rose-500/60 bg-rose-950/20' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono">{sig.name}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                  sig.isWarning ? 'eng-badge-critical' : 'eng-badge-success'
                }`}>
                  {sig.isWarning ? 'ALERT' : 'NOMINAL'}
                </span>
              </div>

              {/* Metric Values */}
              <div className="flex items-baseline justify-between font-mono">
                <div>
                  <span className="text-2xl font-bold text-slate-100">{sig.val}</span>
                  <span className="text-xs text-slate-400 ml-1">{sig.unit}</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-500 block text-[10px]">PHYSICS EXP</span>
                  <span className="text-slate-300">{sig.exp} {sig.unit}</span>
                </div>
              </div>

              {/* Sparkline Chart */}
              <div className="h-12 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090e1c', borderColor: '#212f4d', borderRadius: '4px', fontSize: '11px', color: '#f1f5f9' }}
                    />
                    <Area type="monotone" dataKey={sig.id} stroke={sig.color} fill={sig.color} fillOpacity={0.12} strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Info */}
              <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#162035] text-slate-400">
                <span>Range: {sig.warnRange}</span>
                <span className={sig.delta !== 0 ? (sig.delta > 0 ? 'text-amber-400 font-bold' : 'text-[#38bdf8] font-bold') : 'text-slate-500'}>
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

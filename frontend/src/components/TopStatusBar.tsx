import React, { useState, useEffect } from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { Radio, ShieldAlert, Activity, Cpu, Menu, X, Clock, AlertTriangle } from 'lucide-react';

interface TopStatusBarProps {
  state: DigitalTwinState | null;
  wsConnected: boolean;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  state,
  wsConnected,
  onToggleMobileMenu,
  isMobileMenuOpen
}) => {
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(1842);

  // Live Uptime Counter
  useEffect(() => {
    const interval = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-[#060913]/95 border-b border-slate-800/80 backdrop-blur-xl px-4 flex items-center justify-between text-xs font-mono select-none">
      {/* Left: AERIS Brand Identity & Mobile Drawer Button */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100"
          title="Toggle Mobile Sidebar Navigation"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* AERIS Brand Pill */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wider text-slate-100 font-sans uppercase">AERIS</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-semibold" title="Aero Engine Reliability & Intelligence System">
              DRDO ADE
            </span>
          </div>
        </div>

        {/* Uptime Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800/60">
          <Clock size={12} className="text-cyan-400" />
          <span>UPTIME: <strong className="text-slate-200">{formatUptime(uptimeSeconds)}</strong></span>
        </div>
      </div>

      {/* Center: Live Operational Telemetry Status Indicators ONLY (No Navigation Links) */}
      <div className="flex items-center gap-4 text-xs font-mono">
        {/* Telemetry Live Stream Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 led-glow-emerald' : 'bg-rose-500 led-glow-rose animate-ping'}`} />
          <span className="text-slate-300 font-bold">{wsConnected ? 'TELEMETRY LIVE' : 'DISCONNECTED'}</span>
        </div>

        {/* Mission ID */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
          <span>MISSION:</span>
          <span className="text-slate-200 font-bold">{state?.mission_id || 'AERO-MISSION-01'}</span>
        </div>

        {/* Flight Phase */}
        {state && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500">PHASE:</span>
            <span className="text-cyan-400 font-bold uppercase">{state.mission_phase}</span>
          </div>
        )}

        {/* Overall Engine Health Score */}
        {state && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500">HEALTH:</span>
            <span className={`font-bold ${
              state.overall_health_score > 80 ? 'text-emerald-400' :
              state.overall_health_score > 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {state.overall_health_score}%
            </span>
          </div>
        )}

        {/* Engine Operational Status */}
        {state && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500">STATUS:</span>
            <span className={`font-bold uppercase ${
              state.status === 'critical' ? 'text-rose-400' :
              state.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {state.status}
            </span>
          </div>
        )}
      </div>

      {/* Right: Active Fault Alert Indicator */}
      <div className="flex items-center gap-2">
        {state && state.alerts.length > 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 font-bold animate-pulse">
            <AlertTriangle size={14} className="text-rose-400" />
            <span>{state.alerts.length} ALERTS</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
            <Activity size={13} />
            <span className="text-[11px]">SYS OK</span>
          </div>
        )}
      </div>
    </header>
  );
};

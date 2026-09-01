import React, { useState, useEffect } from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { Radio, Activity, Menu, X, Clock, AlertTriangle } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full h-12 bg-[#060810] border-b border-[#1a2438] px-4 flex items-center justify-between text-xs font-mono select-none">
      {/* Left: AERIS Brand Identity & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1 rounded bg-[#0a0f1d] border border-[#1a2438] text-slate-300 hover:text-slate-100"
          title="Toggle Mobile Sidebar Navigation"
        >
          {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[#0284c7]/10 border border-[#0284c7]/30 text-[#38bdf8]">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 font-sans">
            <span className="font-bold text-sm tracking-wider text-slate-100 uppercase">AERIS</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0a0f1d] text-[#38bdf8] border border-[#1a2438] font-mono font-semibold" title="SIH 26054 Platform">
              SIH 26054
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-slate-400 bg-[#0a0f1d] px-2 py-0.5 rounded border border-[#1a2438]">
          <Clock size={12} className="text-[#38bdf8]" />
          <span>UPTIME: <strong className="text-slate-200">{formatUptime(uptimeSeconds)}</strong></span>
        </div>
      </div>

      {/* Center: Live Operational Telemetry Status Indicators ONLY */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#0a0f1d] border border-[#1a2438]">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="text-slate-300 font-bold">{wsConnected ? 'TELEMETRY LIVE' : 'DISCONNECTED'}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0a0f1d] border border-[#1a2438] text-slate-400">
          <span>MISSION:</span>
          <span className="text-slate-200 font-bold">{state?.mission_id || 'AERO-MISSION-01'}</span>
        </div>

        {state && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0a0f1d] border border-[#1a2438]">
            <span className="text-slate-500">PHASE:</span>
            <span className="text-[#38bdf8] font-bold uppercase">{state.mission_phase}</span>
          </div>
        )}

        {state && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0a0f1d] border border-[#1a2438]">
            <span className="text-slate-500">HEALTH:</span>
            <span className={`font-bold ${
              state.overall_health_score > 80 ? 'text-emerald-400' :
              state.overall_health_score > 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {state.overall_health_score}%
            </span>
          </div>
        )}

        {state && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0a0f1d] border border-[#1a2438]">
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
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/50 text-rose-300 font-bold">
            <AlertTriangle size={13} className="text-rose-400" />
            <span>{state.alerts.length} ALERTS</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
            <Activity size={12} />
            <span className="text-[11px]">SYS OK</span>
          </div>
        )}
      </div>
    </header>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { DigitalTwinState, UAVSummary } from '../types/telemetry';
import { Radio, Activity, Menu, X, Clock, AlertTriangle, ShieldCheck, ChevronDown, Plane, ExternalLink, Check } from 'lucide-react';

interface TopStatusBarProps {
  state: DigitalTwinState | null;
  wsConnected: boolean;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  selectedUavId?: string;
  fleet?: UAVSummary[];
  onSelectUav?: (uavId: string) => void;
  onNavigateToFleet?: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  state,
  wsConnected,
  onToggleMobileMenu,
  isMobileMenuOpen,
  selectedUavId = "UAV-RUST-01",
  fleet = [],
  onSelectUav,
  onNavigateToFleet
}) => {
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(1842);
  const [isFleetDropdownOpen, setIsFleetDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFleetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const activeAirframe = fleet.find((u) => u.aircraft_id === selectedUavId) || {
    aircraft_id: selectedUavId,
    callsign: state?.callsign || "Garuda-1",
    model_name: state?.model_name || "DRDO RUSTOM-II MALE",
    engine_model: "Lycoming O-320-D2J",
    overall_health_score: state?.overall_health_score || 98.4,
    status: state?.status || "normal",
    mission_phase: state?.mission_phase || "cruise"
  };

  return (
    <header className="sticky top-0 z-40 w-full h-12 bg-[#070a12]/90 backdrop-blur-md border-b border-sky-500/20 px-3 sm:px-4 flex items-center justify-between text-xs font-mono select-none shadow-lg shadow-black/50">
      {/* Left: AERIS Brand Identity & Interactive Fleet Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-slate-100"
          title="Toggle Mobile Sidebar Navigation"
        >
          {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="font-extrabold text-sm tracking-wider text-slate-100 uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-cyan-200 to-sky-400 font-sans hidden sm:inline">
            AERIS
          </span>
        </div>

        {/* Interactive Multi-UAV Aircraft Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsFleetDropdownOpen(!isFleetDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-slate-850 border border-cyan-500/40 text-slate-200 transition shadow-sm group"
            title="Click to switch active UAV airframe"
          >
            <Plane size={13} className="text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
            <div className="flex items-center gap-1.5 text-left font-sans">
              <span className="font-bold text-xs text-slate-100 tracking-tight">
                {activeAirframe.callsign}
              </span>
              <span className="hidden xl:inline text-[10px] text-slate-400">
                • {activeAirframe.model_name}
              </span>
            </div>
            <span className={`w-1.5 h-1.5 rounded-full ${
              activeAirframe.status === 'critical' ? 'bg-rose-500 animate-ping' :
              activeAirframe.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isFleetDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>

          {/* Glassmorphic Fleet Dropdown Menu */}
          {isFleetDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-80 bg-[#080d1a] border border-cyan-500/40 rounded-xl shadow-2xl z-50 p-2 space-y-1.5 backdrop-blur-xl animate-fadeIn font-sans">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                <span className="uppercase tracking-wider font-bold text-cyan-400">Tactical Fleet Squadron</span>
                <span>{fleet.length || 5} AIRFRAMES</span>
              </div>

              <div className="space-y-1 max-h-72 overflow-y-auto">
                {(fleet.length > 0 ? fleet : [
                  { aircraft_id: "UAV-RUST-01", callsign: "Garuda-1", model_name: "DRDO RUSTOM-II MALE", engine_model: "Lycoming O-320", overall_health_score: 98, status: "normal", mission_phase: "cruise" },
                  { aircraft_id: "UAV-RUST-02", callsign: "Garuda-2", model_name: "DRDO RUSTOM-I Tactical", engine_model: "Rotax 914 Turbo", overall_health_score: 95, status: "normal", mission_phase: "loiter" },
                  { aircraft_id: "UAV-TAPAS-03", callsign: "Tapas-3", model_name: "DRDO TAPAS-BH-201", engine_model: "Austro Engine AE300", overall_health_score: 99, status: "normal", mission_phase: "climb" },
                  { aircraft_id: "UAV-ABHYAS-04", callsign: "Abhyas-4", model_name: "DRDO ABHYAS Target", engine_model: "Micro-Turbo Turbine", overall_health_score: 100, status: "normal", mission_phase: "takeoff" },
                  { aircraft_id: "UAV-GHATAK-05", callsign: "Ghatak-5", model_name: "DRDO GHATAK Demonstrator", engine_model: "Kaveri Hybrid DC", overall_health_score: 97, status: "normal", mission_phase: "return" },
                ]).map((uav) => {
                  const isSelected = uav.aircraft_id === selectedUavId;
                  return (
                    <button
                      key={uav.aircraft_id}
                      onClick={() => {
                        onSelectUav?.(uav.aircraft_id);
                        setIsFleetDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition ${
                        isSelected
                          ? 'bg-cyan-500/15 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                          : 'hover:bg-slate-900 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-md ${
                          isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-900 text-slate-400'
                        }`}>
                          <Plane size={14} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-100">{uav.callsign}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                              {uav.aircraft_id}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {uav.model_name} • {uav.engine_model}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-[11px] flex flex-col items-end gap-0.5">
                        <span className={`font-bold ${
                          uav.overall_health_score > 80 ? 'text-emerald-400' :
                          uav.overall_health_score > 50 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {Math.round(uav.overall_health_score)}%
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                          {uav.mission_phase}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {onNavigateToFleet && (
                <div className="pt-1.5 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onNavigateToFleet();
                      setIsFleetDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition"
                  >
                    <span>OPEN FLEET COMMAND CENTER</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden 2xl:flex items-center gap-1.5 text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800/80">
          <Clock size={12} className="text-cyan-400" />
          <span>UPTIME: <strong className="text-slate-200 font-mono">{formatUptime(uptimeSeconds)}</strong></span>
        </div>
      </div>

      {/* Center: Live Operational Telemetry Status Indicators */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
        <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-slate-950/70 border border-slate-800">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-300 font-bold tracking-tight text-[11px] sm:text-xs">{wsConnected ? 'WS LIVE' : 'OFFLINE'}</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800 text-slate-400">
          <span>SORTIE:</span>
          <span className="text-slate-200 font-bold">{state?.mission_id || 'MIS-ALPHA-01'}</span>
        </div>

        {state && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500">PHASE:</span>
            <span className="text-cyan-400 font-bold uppercase">{state.mission_phase}</span>
          </div>
        )}

        {state && (
          <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 hidden sm:inline">HEALTH:</span>
            <span className={`font-bold ${
              state.overall_health_score > 80 ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]' :
              state.overall_health_score > 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {state.overall_health_score}%
            </span>
          </div>
        )}

        {state && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500">STATUS:</span>
            <span className={`font-bold uppercase ${
              state.status === 'critical' ? 'text-rose-400 animate-pulse' :
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
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md bg-rose-950/80 border border-rose-500/60 text-rose-300 font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse">
            <AlertTriangle size={14} className="text-rose-400" />
            <span>{state.alerts.length} ALERTS</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <ShieldCheck size={14} />
            <span className="text-[11px] font-bold hidden sm:inline">NOMINAL</span>
          </div>
        )}
      </div>
    </header>
  );
};



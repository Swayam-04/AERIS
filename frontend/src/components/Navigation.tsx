import React from 'react';
import {
  Activity,
  Box,
  Cpu,
  ShieldAlert,
  Clock,
  Sliders,
  RotateCcw,
  GitCompare,
  BarChart3,
  Radio,
  Gauge
} from 'lucide-react';
import { DigitalTwinState } from '../types/telemetry';

export type ScreenId =
  | 'overview'
  | 'digital_twin'
  | 'telemetry'
  | 'health'
  | 'faults'
  | 'rul'
  | 'control'
  | 'replay'
  | 'whatif'
  | 'reliability';

interface NavigationProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  state: DigitalTwinState | null;
  wsConnected: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onSelectScreen,
  state,
  wsConnected,
}) => {
  const navItems = [
    { id: 'overview' as ScreenId, label: 'Overview', icon: Activity },
    { id: 'digital_twin' as ScreenId, label: 'Digital Twin 3D', icon: Box },
    { id: 'telemetry' as ScreenId, label: 'Telemetry Grid', icon: Gauge },
    { id: 'health' as ScreenId, label: 'Engine Health', icon: Cpu },
    { id: 'faults' as ScreenId, label: 'Fault Center', icon: ShieldAlert, badge: state?.alerts.length || 0 },
    { id: 'rul' as ScreenId, label: 'RUL Analytics', icon: Clock },
    { id: 'control' as ScreenId, label: 'Mission Control', icon: Sliders },
    { id: 'replay' as ScreenId, label: 'Replay Studio', icon: RotateCcw },
    { id: 'whatif' as ScreenId, label: 'What-If Lab', icon: GitCompare },
    { id: 'reliability' as ScreenId, label: 'Reliability', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 bg-[#080d1a]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-slate-100 uppercase">AeroTwin</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-semibold">
                  DRDO ADE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">AI Digital Twin for MALE UAV Aero-Piston Engines</p>
            </div>
          </div>

          {/* HUD Live Indicators */}
          <div className="hidden lg:flex items-center gap-6 text-xs">
            {/* Live Connection Tag */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-emerald-400 led-glow-emerald' : 'bg-rose-500 led-glow-rose'}`} />
              <span className="text-slate-300 font-mono">{wsConnected ? 'TELEMETRY LIVE' : 'DISCONNECTED'}</span>
            </div>

            {/* Current Phase */}
            {state && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500">PHASE:</span>
                <span className="font-mono font-bold text-cyan-400 uppercase">{state.mission_phase}</span>
              </div>
            )}

            {/* Health Score HUD */}
            {state && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500">HEALTH:</span>
                <span className={`font-mono font-bold ${
                  state.overall_health_score > 80 ? 'text-emerald-400' :
                  state.overall_health_score > 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {state.overall_health_score}%
                </span>
              </div>
            )}
          </div>

          {/* Quick Screen Selector */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectScreen(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-slate-950">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

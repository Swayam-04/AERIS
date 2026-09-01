import React, { useState } from 'react';
import {
  LayoutDashboard,
  Compass,
  Box,
  Cpu,
  Gauge,
  ShieldAlert,
  Clock,
  Sliders,
  RotateCcw,
  GitCompare,
  BarChart3,
  Bell,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Activity,
  Layers,
  Radio
} from 'lucide-react';
import { ScreenId } from './Navigation';
import { DigitalTwinState } from '../types/telemetry';

interface SidebarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId, presetMode?: string) => void;
  state: DigitalTwinState | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: ScreenId;
    label: string;
    icon: React.ElementType;
    badge?: number;
    presetMode?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  state,
  collapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  // Collapsible accordion section states
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    mission: true,
    digitalTwin: true,
    engine: true,
    analytics: true
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const alertCount = state?.alerts.length || 0;

  const handleNavClick = (screenId: ScreenId, presetMode?: string) => {
    onSelectScreen(screenId, presetMode);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Left Sidebar Navigation Container */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 bg-[#060913]/95 border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-16' : 'md:w-64'}`}
      >
        {/* Top Header Title Block (Expanded view) */}
        {!collapsed && (
          <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs tracking-wider text-slate-100 uppercase font-mono">
                AERIS CONSOLE
              </h3>
              <p className="text-[10px] text-slate-400 font-sans leading-tight">
                Aero Engine Reliability & Intelligence System
              </p>
              <p className="text-[9px] text-cyan-400 font-mono mt-0.5 font-semibold">DRDO TAPAS-BH-201 / RUSTOM-II</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 led-glow-emerald shrink-0" />
          </div>
        )}

        {/* Scrollable Navigation Category List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 text-xs font-sans select-none">
          {/* 1. Primary Dashboard Item */}
          <div>
            <button
              onClick={() => handleNavClick('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition group ${
                currentScreen === 'overview'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Dashboard Overview"
            >
              <LayoutDashboard size={18} className="shrink-0 text-cyan-400" />
              {!collapsed && <span>Dashboard</span>}
            </button>
          </div>

          {/* 2. Mission Section (Collapsible Accordion) */}
          <div>
            {!collapsed ? (
              <button
                onClick={() => toggleSection('mission')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300"
              >
                <span>Mission</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${openSections.mission ? '' : '-rotate-90'}`} />
              </button>
            ) : (
              <div className="w-full h-[1px] bg-slate-800/80 my-2" />
            )}

            {(!collapsed ? openSections.mission : true) && (
              <div className="space-y-1 mt-1">
                <button
                  onClick={() => handleNavClick('overview')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    currentScreen === 'overview' ? 'text-cyan-400 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title="Mission Overview"
                >
                  <Compass size={16} className="shrink-0" />
                  {!collapsed && <span>Mission Overview</span>}
                </button>

                <button
                  onClick={() => handleNavClick('control')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    currentScreen === 'control' ? 'text-cyan-400 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title="Mission Control & Injector"
                >
                  <Sliders size={16} className="shrink-0" />
                  {!collapsed && <span>Mission Control</span>}
                </button>

                <button
                  onClick={() => handleNavClick('replay')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    currentScreen === 'replay' ? 'text-cyan-400 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title="Mission Replay Studio"
                >
                  <RotateCcw size={16} className="shrink-0" />
                  {!collapsed && <span>Mission Replay</span>}
                </button>

                <button
                  onClick={() => handleNavClick('whatif')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    currentScreen === 'whatif' ? 'text-cyan-400 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title="What-if Comparative Analysis"
                >
                  <GitCompare size={16} className="shrink-0" />
                  {!collapsed && <span>What-if Analysis</span>}
                </button>
              </div>
            )}
          </div>

          {/* 3. Digital Twin Section (Collapsible Accordion) */}
          <div>
            {!collapsed ? (
              <button
                onClick={() => toggleSection('digitalTwin')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300"
              >
                <span>Digital Twin</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${openSections.digitalTwin ? '' : '-rotate-90'}`} />
              </button>
            ) : (
              <div className="w-full h-[1px] bg-slate-800/80 my-2" />
            )}

            {(!collapsed ? openSections.digitalTwin : true) && (
              <div className="space-y-1 mt-1">
                <button
                  onClick={() => handleNavClick('digital_twin', 'exterior')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    currentScreen === 'digital_twin' ? 'text-cyan-400 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title="3D UAV View"
                >
                  <Box size={16} className="shrink-0 text-cyan-400" />
                  {!collapsed && <span>3D UAV</span>}
                </button>

                <button
                  onClick={() => handleNavClick('digital_twin', 'internal')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition"
                  title="Internal Cutaway View"
                >
                  <Layers size={16} className="shrink-0 text-amber-400" />
                  {!collapsed && <span>Internal View</span>}
                </button>

                <button
                  onClick={() => handleNavClick('digital_twin', 'exploded')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition"
                  title="Cutaway / Exploded View"
                >
                  <Activity size={16} className="shrink-0 text-rose-400" />
                  {!collapsed && <span>Cutaway / Exploded</span>}
                </button>
              </div>
            )}
          </div>

          {/* 4. Engine Section (Collapsible Accordion) */}
          <div>
            {!collapsed ? (
              <button
                onClick={() => toggleSection('engine')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300"
              >
                <span>Engine</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${openSections.engine ? '' : '-rotate-90'}`} />
              </button>
            ) : (
              <div className="w-full h-[1px] bg-slate-800/80 my-2" />
            )}

            {(!collapsed ? openSections.engine : true) && (
              <div className="space-y-1 mt-1">
                <button
                  onClick={() => handleNavClick('telemetry')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    currentScreen === 'telemetry' ? 'text-cyan-400 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title="Telemetry Signal Grid"
                >
                  <Gauge size={16} className="shrink-0" />
                  {!collapsed && <span>Telemetry</span>}
                </button>

                <button
                  onClick={() => handleNavClick('health')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    currentScreen === 'health' ? 'text-cyan-400 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title="Engine Health Decomposition"
                >
                  <Cpu size={16} className="shrink-0" />
                  {!collapsed && <span>Engine Health</span>}
                </button>

                <button
                  onClick={() => handleNavClick('faults')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                    currentScreen === 'faults' ? 'text-cyan-400 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title="Diagnostic Fault Terminal"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={16} className="shrink-0 text-rose-400" />
                    {!collapsed && <span>Fault Center</span>}
                  </div>
                  {alertCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-slate-950 font-mono">
                      {alertCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('rul')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    currentScreen === 'rul' ? 'text-cyan-400 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title="Remaining Useful Life (RUL)"
                >
                  <Clock size={16} className="shrink-0" />
                  {!collapsed && <span>RUL / Degradation</span>}
                </button>
              </div>
            )}
          </div>

          {/* 5. Analytics Section */}
          <div>
            {!collapsed ? (
              <button
                onClick={() => toggleSection('analytics')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300"
              >
                <span>Analytics</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${openSections.analytics ? '' : '-rotate-90'}`} />
              </button>
            ) : (
              <div className="w-full h-[1px] bg-slate-800/80 my-2" />
            )}

            {(!collapsed ? openSections.analytics : true) && (
              <div className="space-y-1 mt-1">
                <button
                  onClick={() => handleNavClick('reliability')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    currentScreen === 'reliability' ? 'text-cyan-400 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title="Reliability Risk Analytics"
                >
                  <BarChart3 size={16} className="shrink-0" />
                  {!collapsed && <span>Reliability Analytics</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* System Footer Navigation Items */}
        <div className="p-3 border-t border-slate-800/80 space-y-1">
          <button
            onClick={() => handleNavClick('faults')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition text-xs"
            title="System Alert Notifications"
          >
            <div className="flex items-center gap-3">
              <Bell size={16} className="shrink-0 text-amber-400" />
              {!collapsed && <span>Alerts</span>}
            </div>
            {alertCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => handleNavClick('overview')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition text-xs"
            title="Console Settings"
          >
            <Settings size={16} className="shrink-0 text-slate-400" />
            {!collapsed && <span>Settings</span>}
          </button>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 font-bold font-mono text-xs">
                DRDO
              </div>
              {!collapsed && (
                <div className="truncate">
                  <span className="font-semibold text-slate-200 block text-xs truncate">UAV Engineer</span>
                  <span className="text-[10px] text-slate-500 font-mono block truncate">engineer@drdo.in</span>
                </div>
              )}
            </div>

            {/* Desktop Collapsible Toggle Button */}
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

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
  Radio,
  Crosshair
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

  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
        className={`fixed top-12 bottom-0 left-0 z-40 bg-[#060810] border-r border-[#1a2438] flex flex-col justify-between transition-all duration-300 ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-16' : 'md:w-64'}`}
      >
        {/* Top Header Title Block (Expanded view) */}
        {!collapsed && (
          <div className="p-3.5 border-b border-[#1a2438] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs tracking-wider text-slate-100 uppercase font-mono">
                AERIS CONSOLE
              </h3>
              <p className="text-[10px] text-slate-400 font-sans leading-tight">
                Aero Engine Reliability & Intelligence System
              </p>
              <p className="text-[9px] text-[#38bdf8] font-mono mt-0.5 font-semibold">DRDO RUSTOM</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          </div>
        )}

        {/* Scrollable Navigation Category List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3 text-xs font-sans select-none">
          {/* 1. Primary Dashboard Item */}
          <div>
            <button
              onClick={() => handleNavClick('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium transition ${
                currentScreen === 'overview'
                  ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
              }`}
              title="Dashboard Overview"
            >
              <LayoutDashboard size={16} className="shrink-0 text-[#38bdf8]" />
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium transition ${
                    currentScreen === 'overview' ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
                  }`}
                  title="Mission Overview"
                >
                  <Compass size={16} className="shrink-0" />
                  {!collapsed && <span>Mission Overview</span>}
                </button>

                <button
                  onClick={() => handleNavClick('control')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium transition ${
                    currentScreen === 'control' ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
                  }`}
                  title="Mission Control & Injector"
                >
                  <Sliders size={16} className="shrink-0" />
                  {!collapsed && <span>Mission Control</span>}
                </button>

                <button
                  onClick={() => handleNavClick('replay')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium transition ${
                    currentScreen === 'replay' ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
                  }`}
                  title="Mission Replay Studio"
                >
                  <RotateCcw size={16} className="shrink-0" />
                  {!collapsed && <span>Mission Replay</span>}
                </button>

                <button
                  onClick={() => handleNavClick('whatif')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium transition ${
                    currentScreen === 'whatif' ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
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
              <div className="w-full h-[1px] bg-[#1a2438] my-2" />
            )}

            {(!collapsed ? openSections.digitalTwin : true) && (
              <div className="space-y-1 mt-1">
                <button
                  onClick={() => handleNavClick('digital_twin', 'exterior')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium transition ${
                    currentScreen === 'digital_twin' ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
                  }`}
                  title="3D UAV View"
                >
                  <Box size={16} className="shrink-0 text-[#38bdf8]" />
                  {!collapsed && <span>3D UAV</span>}
                </button>

                <button
                  onClick={() => handleNavClick('digital_twin', 'internal')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded font-medium text-slate-400 hover:text-slate-200 hover:bg-[#0e1526] transition"
                  title="Internal Cutaway View"
                >
                  <Layers size={16} className="shrink-0 text-amber-400" />
                  {!collapsed && <span>Internal View</span>}
                </button>

                <button
                  onClick={() => handleNavClick('digital_twin', 'exploded')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded font-medium text-slate-400 hover:text-slate-200 hover:bg-[#0e1526] transition"
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
              <div className="w-full h-[1px] bg-[#1a2438] my-2" />
            )}

            {(!collapsed ? openSections.engine : true) && (
              <div className="space-y-1 mt-1">
                <button
                  onClick={() => handleNavClick('telemetry')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium transition ${
                    currentScreen === 'telemetry' ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
                  }`}
                  title="Telemetry Signal Grid"
                >
                  <Gauge size={16} className="shrink-0" />
                  {!collapsed && <span>Telemetry</span>}
                </button>

                <button
                  onClick={() => handleNavClick('engine_fault_map')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium transition ${
                    currentScreen === 'engine_fault_map'
                      ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
                  }`}
                  title="Internal Engine Diagnostics & Physical Fault Mapping"
                >
                  <div className="flex items-center gap-3">
                    <Crosshair size={16} className="shrink-0 text-cyan-400" />
                    {!collapsed && <span>Fault Map (3D)</span>}
                  </div>
                  {state?.active_fault && state.active_fault !== 'none' && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('health')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium transition ${
                    currentScreen === 'health' ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
                  }`}
                  title="Engine Health Decomposition"
                >
                  <Cpu size={16} className="shrink-0" />
                  {!collapsed && <span>Engine Health</span>}
                </button>

                <button
                  onClick={() => handleNavClick('faults')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium transition ${
                    currentScreen === 'faults' ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
                  }`}
                  title="Diagnostic Fault Terminal"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={16} className="shrink-0 text-rose-400" />
                    {!collapsed && <span>Fault Center</span>}
                  </div>
                  {alertCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-rose-500 text-slate-950 font-mono">
                      {alertCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('rul')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium transition ${
                    currentScreen === 'rul' ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
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
              <div className="w-full h-[1px] bg-[#1a2438] my-2" />
            )}

            {(!collapsed ? openSections.analytics : true) && (
              <div className="space-y-1 mt-1">
                <button
                  onClick={() => handleNavClick('reliability')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium transition ${
                    currentScreen === 'reliability' ? 'bg-[#0e1e38] text-[#38bdf8] border-l-2 border-[#0284c7] font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1526]'
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
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition text-xs"
            title="Console Settings & Credits"
          >
            <Settings size={16} className="shrink-0 text-slate-400" />
            {!collapsed && <span>Settings & Credits</span>}
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

      {/* Settings / About Credits Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="max-w-md w-full glass-panel p-6 rounded-2xl border border-cyan-500/50 bg-[#080d1a] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="text-cyan-400" size={20} />
                <h3 className="font-bold text-slate-100 text-base">AERIS System Settings & Credits</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold font-mono text-cyan-400 text-xs uppercase tracking-wider block">
                  3D Asset Attribution (CC BY)
                </span>
                <div className="font-mono text-[11px] space-y-1 text-slate-300">
                  <p><span className="text-slate-500">3D Model:</span> <strong className="text-slate-100">DRDO Rustom 2 UAV</strong></p>
                  <p><span className="text-slate-500">Artist:</span> <strong className="text-slate-100">Priyajit Bera</strong> (@priyajitbera)</p>
                  <p><span className="text-slate-500">Source:</span> <a href="https://sketchfab.com/3d-models/drdo-rustom-2-uav-6064f6b27edf47d4832e318c48c6a2ac" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Sketchfab Asset Page ↗</a></p>
                  <p><span className="text-slate-500">License:</span> <strong className="text-emerald-400">Creative Commons Attribution (CC BY)</strong></p>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <span className="font-bold text-slate-200 block">AERIS Platform Info</span>
                <p className="text-slate-400">Aero Engine Reliability & Intelligence System</p>
                <p className="text-slate-400">SIH Problem Statement ID: 26054</p>
                <p className="text-slate-400">Digital Twin Target: DRDO RUSTOM UAV</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition text-xs"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

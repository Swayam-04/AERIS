import React, { useState } from 'react';
import { MissionPhase } from '../types/telemetry';
import { Compass, CheckCircle2, Circle, Play, Pause, Sliders, Info, Zap, ShieldAlert, Clock, BarChart2 } from 'lucide-react';

export interface FlightPhaseMetrics {
  startTime: string;
  duration: string;
  altitudeFt: number;
  throttlePct: number;
  healthStart: number;
  healthEnd: number;
  alertsCount: number;
  primaryFault?: string;
}

interface FlightPhaseControllerProps {
  currentPhase: MissionPhase;
  onSetPhase?: (phase: MissionPhase) => void;
  isAutoMode?: boolean;
  onToggleAutoMode?: (auto: boolean) => void;
  isReplayMode?: boolean;
  compact?: boolean;
  phaseMetrics?: Record<string, FlightPhaseMetrics>;
}

export const ALL_PHASES: { id: MissionPhase; label: string; description: string }[] = [
  { id: 'takeoff', label: 'TAKEOFF', description: 'High power climbout, 95% throttle, 500 ft' },
  { id: 'climb', label: 'CLIMB', description: 'Sustained climb to cruise altitude, 85% throttle, 6000 ft' },
  { id: 'cruise', label: 'CRUISE', description: 'Nominal long-range endurance cruise, 72% throttle, 15,000 ft' },
  { id: 'loiter', label: 'LOITER', description: 'Station keeping & sensor surveillance, 55% throttle, 12,000 ft' },
  { id: 'return', label: 'RETURN', description: 'Base transit return flight profile, 68% throttle, 8000 ft' },
  { id: 'landing', label: 'LANDING', description: 'Approach descent & touchdown, 35% throttle, 1000 ft' },
];

export const FlightPhaseController: React.FC<FlightPhaseControllerProps> = ({
  currentPhase,
  onSetPhase,
  isAutoMode = true,
  onToggleAutoMode,
  isReplayMode = false,
  compact = false,
  phaseMetrics
}) => {
  const [selectedInspectPhase, setSelectedInspectPhase] = useState<MissionPhase | null>(null);

  // Default phase metrics fallback
  const defaultMetrics: Record<string, FlightPhaseMetrics> = {
    takeoff: { startTime: '00:00:00', duration: '00:03:45', altitudeFt: 500, throttlePct: 95, healthStart: 100, healthEnd: 99.8, alertsCount: 0 },
    climb: { startTime: '00:03:45', duration: '00:14:20', altitudeFt: 6000, throttlePct: 85, healthStart: 99.8, healthEnd: 99.2, alertsCount: 0 },
    cruise: { startTime: '00:18:05', duration: '01:45:10', altitudeFt: 15000, throttlePct: 72, healthStart: 99.2, healthEnd: 98.3, alertsCount: 0 },
    loiter: { startTime: '02:03:15', duration: '02:15:00', altitudeFt: 12000, throttlePct: 55, healthStart: 98.3, healthEnd: 97.5, alertsCount: 1, primaryFault: 'INJECTOR ABNORMALITY' },
    return: { startTime: '04:18:15', duration: '00:42:00', altitudeFt: 8000, throttlePct: 68, healthStart: 97.5, healthEnd: 96.8, alertsCount: 0 },
    landing: { startTime: '05:00:15', duration: '00:08:30', altitudeFt: 1000, throttlePct: 35, healthStart: 96.8, healthEnd: 96.5, alertsCount: 0 },
  };

  const activeMetricsMap = phaseMetrics || defaultMetrics;

  const currentPhaseIndex = ALL_PHASES.findIndex((p) => p.id.toLowerCase() === currentPhase?.toLowerCase());

  const handlePhaseClick = (phaseId: MissionPhase) => {
    // If in AUTO mode, clicking a phase switches to MANUAL mode to allow inspection
    if (isAutoMode && onToggleAutoMode) {
      onToggleAutoMode(false);
    }
    if (onSetPhase) {
      onSetPhase(phaseId);
    }
    setSelectedInspectPhase(phaseId);
  };

  return (
    <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-3 font-mono text-xs select-none">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-sans font-bold text-slate-100 uppercase tracking-wider text-xs">
            FLIGHT PHASE STEPS & MISSION TIMELINE
          </span>
          {isReplayMode && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
              REPLAY SYNCED
            </span>
          )}
        </div>

        {/* Mode Toggle Switch (AUTO / SIMULATION vs MANUAL / INSPECTION) */}
        {onToggleAutoMode && !isReplayMode && (
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => onToggleAutoMode(true)}
              className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1.5 ${
                isAutoMode
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Simulation automatically advances through flight phases"
            >
              <Zap size={12} />
              <span>AUTO SIMULATION</span>
            </button>

            <button
              onClick={() => onToggleAutoMode(false)}
              className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1.5 ${
                !isAutoMode
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Manual inspection mode allows selecting any phase"
            >
              <Sliders size={12} />
              <span>MANUAL INSPECTION</span>
            </button>
          </div>
        )}
      </div>

      {/* Flight Phase Steps Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
        {ALL_PHASES.map((phaseObj, index) => {
          const isCompleted = currentPhaseIndex >= 0 && index < currentPhaseIndex;
          const isActive = currentPhaseIndex >= 0 && index === currentPhaseIndex;
          const isUpcoming = index > currentPhaseIndex || currentPhaseIndex < 0;

          return (
            <button
              key={phaseObj.id}
              onClick={() => handlePhaseClick(phaseObj.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 border-cyan-300 ring-2 ring-cyan-400/40 scale-105 z-10'
                  : isCompleted
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/60'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title={`${phaseObj.label}: ${phaseObj.description} (Click to select & inspect)`}
            >
              {isCompleted && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
              {isActive && <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping shrink-0" />}
              {isUpcoming && <Circle size={14} className="text-slate-500 shrink-0" />}
              
              <span>{phaseObj.label}</span>
            </button>
          );
        })}
      </div>

      {/* Phase Metrics Inspection HUD (Shown when clicking any phase or inspecting active phase) */}
      {selectedInspectPhase && (
        <div className="mt-2 p-3 bg-slate-950/80 rounded-xl border border-cyan-500/30 text-xs font-mono space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-100 uppercase">
                PHASE METRICS MATRIX: <strong className="text-cyan-400">{selectedInspectPhase.toUpperCase()}</strong>
              </span>
            </div>
            <button
              onClick={() => setSelectedInspectPhase(null)}
              className="text-slate-500 hover:text-slate-300 font-bold px-1"
            >
              ✕
            </button>
          </div>

          {activeMetricsMap[selectedInspectPhase.toLowerCase()] && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1">
              <div>
                <span className="text-slate-500 block text-[10px]">START TIME / DURATION</span>
                <span className="text-slate-200 font-bold">
                  {activeMetricsMap[selectedInspectPhase.toLowerCase()].startTime} ({activeMetricsMap[selectedInspectPhase.toLowerCase()].duration})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">OPERATING PROFILE</span>
                <span className="text-cyan-400 font-bold">
                  {activeMetricsMap[selectedInspectPhase.toLowerCase()].throttlePct}% Throttle @ {activeMetricsMap[selectedInspectPhase.toLowerCase()].altitudeFt} ft
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">HEALTH RANGE</span>
                <span className="text-emerald-400 font-bold">
                  {activeMetricsMap[selectedInspectPhase.toLowerCase()].healthStart}% → {activeMetricsMap[selectedInspectPhase.toLowerCase()].healthEnd}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">FAULTS / ALERTS</span>
                <span className={activeMetricsMap[selectedInspectPhase.toLowerCase()].alertsCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {activeMetricsMap[selectedInspectPhase.toLowerCase()].alertsCount > 0
                    ? `⚠️ ${activeMetricsMap[selectedInspectPhase.toLowerCase()].alertsCount} Alert (${activeMetricsMap[selectedInspectPhase.toLowerCase()].primaryFault})`
                    : '✓ Nominal (0 Alerts)'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

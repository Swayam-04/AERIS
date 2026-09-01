import React, { useState } from 'react';
import { MissionPhase } from '../types/telemetry';
import { Compass, CheckCircle2, Circle, Sliders, Zap } from 'lucide-react';

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
  { id: 'climb', label: 'CLIMB', description: 'Sustained climb to cruise altitude, 85% throttle, 6,000 ft' },
  { id: 'cruise', label: 'CRUISE', description: 'Nominal long-range endurance cruise, 72% throttle, 15,000 ft' },
  { id: 'loiter', label: 'LOITER', description: 'Station keeping & sensor surveillance, 55% throttle, 12,000 ft' },
  { id: 'return', label: 'RETURN', description: 'Base transit return flight profile, 68% throttle, 8,000 ft' },
  { id: 'landing', label: 'LANDING', description: 'Approach descent & touchdown, 35% throttle, 1,000 ft' },
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
    if (isAutoMode && onToggleAutoMode) {
      onToggleAutoMode(false);
    }
    if (onSetPhase) {
      onSetPhase(phaseId);
    }
    setSelectedInspectPhase(phaseId);
  };

  return (
    <div className="eng-panel p-3 font-mono text-xs select-none">
      {/* Top Header & Controller Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#38bdf8]" />
          <span className="font-sans font-bold text-slate-200 text-xs tracking-wide">
            MISSION FLIGHT PHASE TIMELINE
          </span>
          {isReplayMode && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              REPLAY SYNCED
            </span>
          )}
        </div>

        {onToggleAutoMode && !isReplayMode && (
          <div className="flex items-center gap-1 bg-[#060913] p-1 rounded border border-[#162035] text-[11px]">
            <button
              onClick={() => onToggleAutoMode(true)}
              className={`px-2 py-0.5 rounded font-semibold transition flex items-center gap-1 ${
                isAutoMode
                  ? 'bg-[#0284c7] text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap size={11} />
              <span>AUTO SIMULATION</span>
            </button>

            <button
              onClick={() => onToggleAutoMode(false)}
              className={`px-2 py-0.5 rounded font-semibold transition flex items-center gap-1 ${
                !isAutoMode
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders size={11} />
              <span>MANUAL OVERRIDE</span>
            </button>
          </div>
        )}
      </div>

      {/* Structured Horizontal Flight Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 py-1">
        {ALL_PHASES.map((phaseObj, index) => {
          const isCompleted = currentPhaseIndex >= 0 && index < currentPhaseIndex;
          const isActive = currentPhaseIndex >= 0 && index === currentPhaseIndex;
          const isUpcoming = index > currentPhaseIndex || currentPhaseIndex < 0;

          return (
            <button
              key={phaseObj.id}
              onClick={() => handlePhaseClick(phaseObj.id)}
              className={`p-2.5 rounded border text-left transition flex flex-col justify-between ${
                isActive
                  ? 'bg-[#0e1935] border-[#0284c7] text-slate-100 ring-1 ring-[#0284c7]'
                  : isCompleted
                  ? 'bg-[#091422] border-emerald-900/60 text-emerald-300 hover:bg-[#0c1b2f]'
                  : 'bg-[#090e1c] border-[#162035] text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500 font-sans">0{index + 1}</span>
                {isCompleted && <CheckCircle2 size={13} className="text-emerald-400" />}
                {isActive && <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />}
                {isUpcoming && <Circle size={13} className="text-slate-600" />}
              </div>

              <div className="font-bold text-xs tracking-wider">{phaseObj.label}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{phaseObj.description.split(',')[2] || ''}</div>
            </button>
          );
        })}
      </div>

      {/* Phase Inspection Popover Card */}
      {selectedInspectPhase && (
        <div className="mt-2 p-3 bg-[#0e152a] rounded border border-[#212f4d] flex items-center justify-between text-xs">
          <div>
            <span className="text-[#38bdf8] font-bold uppercase">{selectedInspectPhase} PHASE DETAILS:</span>
            <span className="text-slate-300 ml-2">
              Altitude: {activeMetricsMap[selectedInspectPhase]?.altitudeFt} ft | Throttle: {activeMetricsMap[selectedInspectPhase]?.throttlePct}% | Duration: {activeMetricsMap[selectedInspectPhase]?.duration}
            </span>
          </div>
          <button onClick={() => setSelectedInspectPhase(null)} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}
    </div>
  );
};

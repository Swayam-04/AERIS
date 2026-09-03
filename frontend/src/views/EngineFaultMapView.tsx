import React, { useState, useMemo, useEffect } from 'react';
import { DigitalTwinState, FaultType } from '../types/telemetry';
import { Engine3DViewer } from '../components/Engine3DViewer';
import {
  ENGINE_COMPONENT_CATALOG,
  EngineComponentInfo,
  FAULT_TO_ENGINE_COMPONENT_MAP
} from '../utils/engineComponentCatalog';
import {
  Cpu,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Crosshair,
  RotateCcw,
  Play,
  Flame,
  Droplets,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Gauge,
  Sliders
} from 'lucide-react';

interface EngineFaultMapViewProps {
  state: DigitalTwinState | null;
  onInjectFault: (fault: FaultType, severity: number) => void;
  onClearFault: () => void;
  onNavigateToWhatIf?: () => void;
  onNavigateToControl?: () => void;
}

interface DiagnosticTimelineEvent {
  id: string;
  timeStr: string;
  severity: 'normal' | 'warning' | 'critical';
  title: string;
  detail: string;
  componentName?: string;
}

export const EngineFaultMapView: React.FC<EngineFaultMapViewProps> = ({
  state,
  onInjectFault,
  onClearFault,
  onNavigateToWhatIf,
  onNavigateToControl
}) => {
  // Selected engine component
  const [selectedComponent, setSelectedComponent] = useState<EngineComponentInfo>(
    ENGINE_COMPONENT_CATALOG.cylinder_2
  );

  // Diagnostic Event Timeline Log (simulation clocked)
  const [timelineEvents, setTimelineEvents] = useState<DiagnosticTimelineEvent[]>([
    {
      id: 'init',
      timeStr: '00:00:00',
      severity: 'normal',
      title: 'Engine Initialization & Pre-Flight Checkout',
      detail: 'Lycoming O-320 dual-magneto and fuel injection baseline nominal.',
      componentName: 'Engine Core'
    }
  ]);

  // Track state transitions into the timeline
  const lastLoggedFault = React.useRef<string>('none');
  const lastLoggedStatus = React.useRef<string>('normal');

  useEffect(() => {
    if (!state) return;

    const sec = Math.floor(state.timestamp);
    const hrs = String(Math.floor(sec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const secs = String(sec % 60).padStart(2, '0');
    const timeStr = `${hrs}:${mins}:${secs}`;

    // Log fault injection or clear
    if (state.active_fault !== lastLoggedFault.current) {
      if (state.active_fault !== 'none') {
        const mapping = FAULT_TO_ENGINE_COMPONENT_MAP[state.active_fault];
        const newEvent: DiagnosticTimelineEvent = {
          id: `fault-${Date.now()}`,
          timeStr,
          severity: 'critical',
          title: mapping ? mapping.title : `Fault: ${state.active_fault.toUpperCase()}`,
          detail: mapping ? mapping.summary : 'Anomaly detected in engine physical subsystem.',
          componentName: mapping ? mapping.componentName : 'Engine Subsystem'
        };
        setTimelineEvents((prev) => [newEvent, ...prev.slice(0, 19)]);

        // Auto-select the affected component when fault occurs
        if (mapping && ENGINE_COMPONENT_CATALOG[mapping.componentId]) {
          setSelectedComponent(ENGINE_COMPONENT_CATALOG[mapping.componentId]);
        }
      } else {
        const newEvent: DiagnosticTimelineEvent = {
          id: `clear-${Date.now()}`,
          timeStr,
          severity: 'normal',
          title: 'Fault Cleared — Engine Nominal',
          detail: 'Combustion, fuel flow, and lubrication parameters recovered to physics baseline.',
          componentName: 'All Subsystems'
        };
        setTimelineEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
      }
      lastLoggedFault.current = state.active_fault;
    }

    // Log status transitions (e.g. warning or critical alerts)
    if (state.status !== lastLoggedStatus.current && state.alerts.length > 0) {
      const topAlert = state.alerts[0];
      const newEvent: DiagnosticTimelineEvent = {
        id: `alert-${Date.now()}`,
        timeStr,
        severity: topAlert.severity === 'critical' ? 'critical' : 'warning',
        title: topAlert.candidate_fault,
        detail: topAlert.evidence_summary,
        componentName: 'Diagnostics Model'
      };
      setTimelineEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
      lastLoggedStatus.current = state.status;
    }
  }, [state?.active_fault, state?.status, state?.timestamp, state?.alerts]);

  // Active fault mapping lookup
  const activeFaultMapping = useMemo(() => {
    if (!state || state.active_fault === 'none') return null;
    return FAULT_TO_ENGINE_COMPONENT_MAP[state.active_fault] || null;
  }, [state?.active_fault]);

  if (!state) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 font-mono text-xs">
        Connecting to Engine Digital Twin Telemetry...
      </div>
    );
  }

  // Component telemetry value helper
  const getComponentMetrics = (comp: EngineComponentInfo) => {
    const obs = state.observed;
    const exp = state.expected;

    switch (comp.id) {
      case 'cylinder_1':
      case 'cylinder_2':
      case 'cylinder_4':
        return {
          observedVal: obs.cht_c,
          expectedVal: exp.cht_c,
          unit: '°C',
          label: 'CHT',
          secondaryVal: `${obs.egt_c.toFixed(0)}°C`,
          secondaryLabel: 'EGT'
        };
      case 'cylinder_3':
      case 'cylinder_head_3':
      case 'sensor_cht_3':
        return {
          observedVal: obs.cht_c,
          expectedVal: exp.cht_c,
          unit: '°C',
          label: 'CHT',
          secondaryVal: `${obs.egt_c.toFixed(0)}°C`,
          secondaryLabel: 'EGT'
        };
      case 'fuel_injector_2':
      case 'fuel_system':
        return {
          observedVal: obs.fuel_flow_lph,
          expectedVal: exp.fuel_flow_lph,
          unit: 'L/h',
          label: 'Fuel Flow',
          secondaryVal: `${obs.egt_c.toFixed(0)}°C`,
          secondaryLabel: 'Exhaust EGT'
        };
      case 'oil_pump':
      case 'oil_sump':
      case 'sensor_oil_press_temp':
        return {
          observedVal: obs.oil_pressure_psi,
          expectedVal: exp.oil_pressure_psi,
          unit: 'PSI',
          label: 'Oil Pressure',
          secondaryVal: `${obs.oil_temp_c.toFixed(1)}°C`,
          secondaryLabel: 'Oil Temp'
        };
      case 'crankshaft':
      case 'crankshaft_prop_interface':
      case 'sensor_vibration':
      case 'connecting_rods':
      case 'piston_assembly':
        return {
          observedVal: obs.vibration_g,
          expectedVal: exp.vibration_g,
          unit: 'g RMS',
          label: 'Vibration',
          secondaryVal: `${obs.rpm.toFixed(0)} RPM`,
          secondaryLabel: 'Crankshaft Speed'
        };
      case 'alternator':
        return {
          observedVal: obs.battery_volts,
          expectedVal: exp.battery_volts,
          unit: 'V',
          label: 'Bus Voltage',
          secondaryVal: `${obs.electrical?.alternator.output_power_w.toFixed(0) || 840} W`,
          secondaryLabel: 'Alternator Power'
        };
      default:
        return {
          observedVal: obs.rpm,
          expectedVal: exp.rpm,
          unit: 'RPM',
          label: 'RPM',
          secondaryVal: `${obs.cht_c.toFixed(0)}°C`,
          secondaryLabel: 'CHT'
        };
    }
  };

  const metrics = getComponentMetrics(selectedComponent);
  const metricDelta = metrics.observedVal - metrics.expectedVal;

  // Component Health Calculation
  const isSelectedActiveFault = activeFaultMapping?.componentId === selectedComponent.id;
  const compHealth = isSelectedActiveFault
    ? Math.max(25, Math.round(100 - (state.fault_severity || 0.6) * 75))
    : state.overall_health_score > 85
    ? 98
    : Math.max(70, Math.round(state.overall_health_score + 8));

  // Quick fault test scenarios
  const quickFaultScenarios: { type: FaultType; label: string; component: string }[] = [
    { type: 'misfire', label: 'Cylinder Misfire', component: 'Cylinder #2' },
    { type: 'injector_abnormality', label: 'Injector Restriction', component: 'Injector #2' },
    { type: 'oil_pressure_loss', label: 'Oil Pressure Loss', component: 'Oil Pump' },
    { type: 'overheating', label: 'Thermal Overheating', component: 'Cylinder #3 Head' },
    { type: 'vibration_spike', label: 'Vibration Spike', component: 'Crankshaft / Prop' },
    { type: 'sensor_drift', label: 'Sensor Drift', component: 'CHT Sensor #3' },
    { type: 'alternator_output_degradation', label: 'Alternator Degradation', component: 'Alternator' }
  ];

  return (
    <div className="space-y-4 font-sans text-xs select-none">
      {/* ========================================================================= */}
      {/* 1. TOP ENGINE STATUS SUMMARY BAR (Requirements 3 & 10)                     */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl border border-[#162035] bg-[#080d1a] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Section Identity */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 font-mono tracking-wide uppercase">
                  ENGINE HEALTH & FAULT MAP
                </h1>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-bold text-[10px]">
                  3D INTERNAL DIAGNOSTICS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Lycoming O-320 Horizontally Opposed 4-Cylinder Aero-Piston Engine Digital Twin
              </p>
            </div>
          </div>

          {/* Core Telemetry Indicators */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Overall Engine Health */}
            <div className="px-3.5 py-2 rounded-lg bg-[#060913] border border-[#1a2438] flex items-center gap-3">
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">ENGINE HEALTH</div>
                <div
                  className={`text-xl font-mono font-black ${
                    state.overall_health_score > 80
                      ? 'text-emerald-400'
                      : state.overall_health_score > 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {state.overall_health_score.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Overall Engine Status */}
            <div className="px-3.5 py-2 rounded-lg bg-[#060913] border border-[#1a2438] flex items-center gap-3">
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">STATUS</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      state.status === 'normal'
                        ? 'bg-emerald-400 led-glow-emerald'
                        : state.status === 'warning'
                        ? 'bg-amber-400 led-glow-amber'
                        : 'bg-rose-500 led-glow-rose'
                    }`}
                  />
                  <span
                    className={`font-mono font-bold uppercase ${
                      state.status === 'normal'
                        ? 'text-emerald-400'
                        : state.status === 'warning'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {state.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Fault & Affected Component */}
            <div className="px-3.5 py-2 rounded-lg bg-[#060913] border border-[#1a2438] min-w-[240px]">
              <div className="text-[10px] text-slate-400 font-mono uppercase">ACTIVE FAULT → PHYSICAL LOCATION</div>
              {activeFaultMapping ? (
                <div className="mt-0.5">
                  <div className="text-rose-400 font-mono font-bold text-xs truncate">
                    {activeFaultMapping.title}
                  </div>
                  <div className="text-sky-300 font-mono text-[10px] flex items-center gap-1">
                    <ArrowRight size={10} className="text-rose-400 shrink-0" />
                    <span className="font-semibold text-slate-200">{activeFaultMapping.componentName}</span>
                    <span className="text-slate-400 truncate">({activeFaultMapping.physicalLocation})</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5 text-emerald-400 font-mono font-semibold">
                  <CheckCircle2 size={13} />
                  <span>ALL COMPONENTS NOMINAL</span>
                </div>
              )}
            </div>

            {/* Quick Clear Fault Button */}
            {state.active_fault !== 'none' && (
              <button
                onClick={onClearFault}
                className="px-3 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-950/50"
                title="Clear active fault and restore nominal simulation"
              >
                <RotateCcw size={14} />
                <span>CLEAR FAULT</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Diagnostic Fault Trigger Pills */}
        <div className="mt-3 pt-3 border-t border-[#141f33] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Sliders size={13} className="text-sky-400" />
            <span>QUICK INJECT & TEST:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {quickFaultScenarios.map((scen) => {
              const isActive = state.active_fault === scen.type;
              return (
                <button
                  key={scen.type}
                  onClick={() => onInjectFault(scen.type, 0.75)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-rose-600 border-rose-400 text-white font-bold shadow-lg shadow-rose-950'
                      : 'bg-[#0e1626] border-[#1e293b] text-slate-300 hover:text-sky-300 hover:border-sky-600'
                  }`}
                  title={`Inject ${scen.label} into ${scen.component}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-slate-500'}`} />
                  <span>{scen.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN DIAGNOSTICS SPLIT: 3D ENGINE VIEW (65%) + DIAGNOSTICS SIDEBAR (35%) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left/Center: Interactive 3D Engine Viewport (7 cols on large screens) */}
        <div className="lg:col-span-8 space-y-3">
          <Engine3DViewer
            state={state}
            selectedComponentId={selectedComponent.id}
            onSelectComponent={(comp) => setSelectedComponent(comp)}
            height="h-[560px]"
          />

          {/* Quick Subsystem Navigation Strip below 3D */}
          <div className="p-3 rounded-xl border border-[#162035] bg-[#080d1a] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <Crosshair size={14} className="text-sky-400" />
              <span>SELECTED INSPECTION ANCHOR:</span>
              <span className="font-bold text-slate-100">{selectedComponent.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Subsystem:</span>
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-bold uppercase">
                {selectedComponent.subsystemLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Diagnostics Control Sidebar (4 cols on large screens) */}
        <div className="lg:col-span-4 space-y-4">
          {/* A. 2D ENGINE HEALTH MAP SCHEMATIC (Requirement 11) */}
          <div className="p-3.5 rounded-xl border border-[#162035] bg-[#080d1a] shadow-lg">
            <div className="flex items-center justify-between border-b border-[#141f33] pb-2 mb-2.5">
              <div className="flex items-center gap-2 text-slate-200 font-mono font-bold tracking-wider uppercase text-xs">
                <Layers size={14} className="text-sky-400" />
                <span>2D ENGINE HEALTH MAP</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Click item to focus 3D</span>
            </div>

            {/* Cylinder Banks Schematic */}
            <div className="space-y-2">
              {/* Starboard Bank (Cyl 1 & 3) */}
              <div className="p-2 rounded-lg bg-[#060913] border border-[#1a2438]">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5 flex justify-between">
                  <span>RIGHT (STARBOARD) BANK</span>
                  <span className="text-slate-500">Air-Cooled Finned</span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {/* Cylinder 1 */}
                  <button
                    onClick={() => setSelectedComponent(ENGINE_COMPONENT_CATALOG.cylinder_1)}
                    className={`p-2 rounded border text-left transition ${
                      selectedComponent.id === 'cylinder_1'
                        ? 'border-sky-500 bg-sky-950/30'
                        : 'border-[#1e293b] bg-[#0a0f1d] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">CYL 1</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">CHT {state.observed.cht_c.toFixed(0)}°C</div>
                    <div className="text-[9px] text-emerald-400 font-semibold">● NORMAL</div>
                  </button>

                  {/* Cylinder 3 */}
                  <button
                    onClick={() => setSelectedComponent(ENGINE_COMPONENT_CATALOG.cylinder_3)}
                    className={`p-2 rounded border text-left transition ${
                      selectedComponent.id === 'cylinder_3' || selectedComponent.id === 'cylinder_head_3'
                        ? 'border-sky-500 bg-sky-950/30'
                        : state.active_fault === 'overheating'
                        ? 'border-rose-500 bg-rose-950/30'
                        : 'border-[#1e293b] bg-[#0a0f1d] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">CYL 3</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          state.active_fault === 'overheating' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">CHT {state.observed.cht_c.toFixed(0)}°C</div>
                    <div
                      className={`text-[9px] font-semibold ${
                        state.active_fault === 'overheating' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      ● {state.active_fault === 'overheating' ? 'CRITICAL CHT' : 'NORMAL'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Port Bank (Cyl 2 & 4) */}
              <div className="p-2 rounded-lg bg-[#060913] border border-[#1a2438]">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5 flex justify-between">
                  <span>LEFT (PORT) BANK</span>
                  <span className="text-slate-500">Air-Cooled Finned</span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {/* Cylinder 2 */}
                  <button
                    onClick={() => setSelectedComponent(ENGINE_COMPONENT_CATALOG.cylinder_2)}
                    className={`p-2 rounded border text-left transition ${
                      selectedComponent.id === 'cylinder_2'
                        ? 'border-sky-500 bg-sky-950/30'
                        : state.active_fault === 'misfire'
                        ? 'border-rose-500 bg-rose-950/30'
                        : 'border-[#1e293b] bg-[#0a0f1d] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">CYL 2</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          state.active_fault === 'misfire' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">CHT {state.observed.cht_c.toFixed(0)}°C</div>
                    <div
                      className={`text-[9px] font-semibold ${
                        state.active_fault === 'misfire' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      ● {state.active_fault === 'misfire' ? 'MISFIRE' : 'NORMAL'}
                    </div>
                  </button>

                  {/* Cylinder 4 */}
                  <button
                    onClick={() => setSelectedComponent(ENGINE_COMPONENT_CATALOG.cylinder_4)}
                    className={`p-2 rounded border text-left transition ${
                      selectedComponent.id === 'cylinder_4'
                        ? 'border-sky-500 bg-sky-950/30'
                        : 'border-[#1e293b] bg-[#0a0f1d] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">CYL 4</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">CHT {state.observed.cht_c.toFixed(0)}°C</div>
                    <div className="text-[9px] text-emerald-400 font-semibold">● NORMAL</div>
                  </button>
                </div>
              </div>

              {/* Fuel Injectors & Lubrication Strip */}
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                {/* Fuel Injectors Strip */}
                <button
                  onClick={() => setSelectedComponent(ENGINE_COMPONENT_CATALOG.fuel_injector_2)}
                  className={`p-2 rounded-lg border text-left transition ${
                    selectedComponent.id === 'fuel_injector_2' || selectedComponent.id === 'fuel_system'
                      ? 'border-sky-500 bg-sky-950/30'
                      : state.active_fault === 'injector_abnormality'
                      ? 'border-amber-500 bg-amber-950/30'
                      : 'border-[#1a2438] bg-[#060913] hover:border-slate-600'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 uppercase">FUEL INJECTORS</div>
                  <div className="font-bold text-slate-200 mt-0.5">INJECTOR #2</div>
                  <div
                    className={`text-[9px] font-semibold mt-0.5 ${
                      state.active_fault === 'injector_abnormality' ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    ● {state.active_fault === 'injector_abnormality' ? 'RESTRICTED' : 'BALANCED'}
                  </div>
                </button>

                {/* Lubrication & Oil Pump */}
                <button
                  onClick={() => setSelectedComponent(ENGINE_COMPONENT_CATALOG.oil_pump)}
                  className={`p-2 rounded-lg border text-left transition ${
                    selectedComponent.id === 'oil_pump' || selectedComponent.id === 'oil_sump'
                      ? 'border-sky-500 bg-sky-950/30'
                      : state.active_fault === 'oil_pressure_loss'
                      ? 'border-rose-500 bg-rose-950/30'
                      : 'border-[#1a2438] bg-[#060913] hover:border-slate-600'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 uppercase">LUBRICATION PUMP</div>
                  <div className="font-bold text-slate-200 mt-0.5">{state.observed.oil_pressure_psi.toFixed(1)} PSI</div>
                  <div
                    className={`text-[9px] font-semibold mt-0.5 ${
                      state.active_fault === 'oil_pressure_loss' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    ● {state.active_fault === 'oil_pressure_loss' ? 'PRESSURE LOSS' : 'NORMAL'}
                  </div>
                </button>
              </div>

              {/* Propulsion / Crankshaft Strip */}
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <button
                  onClick={() => setSelectedComponent(ENGINE_COMPONENT_CATALOG.propeller_interface)}
                  className={`p-2 rounded-lg border text-left transition ${
                    selectedComponent.id === 'crankshaft_prop_interface' || selectedComponent.id === 'crankshaft'
                      ? 'border-sky-500 bg-sky-950/30'
                      : state.active_fault === 'vibration_spike'
                      ? 'border-rose-500 bg-rose-950/30'
                      : 'border-[#1a2438] bg-[#060913] hover:border-slate-600'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 uppercase">PROP INTERFACE</div>
                  <div className="font-bold text-slate-200 mt-0.5">{state.observed.vibration_g.toFixed(2)} g RMS</div>
                  <div
                    className={`text-[9px] font-semibold mt-0.5 ${
                      state.active_fault === 'vibration_spike' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    ● {state.active_fault === 'vibration_spike' ? 'VIB HARMONIC' : 'BALANCED'}
                  </div>
                </button>

                <button
                  onClick={() => setSelectedComponent(ENGINE_COMPONENT_CATALOG.sensor_cht_3)}
                  className={`p-2 rounded-lg border text-left transition ${
                    selectedComponent.id === 'sensor_cht_3'
                      ? 'border-sky-500 bg-sky-950/30'
                      : state.active_fault === 'sensor_drift'
                      ? 'border-amber-500 bg-amber-950/30'
                      : 'border-[#1a2438] bg-[#060913] hover:border-slate-600'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 uppercase">SENSORS SUITE</div>
                  <div className="font-bold text-slate-200 mt-0.5">CHT PROBE #3</div>
                  <div
                    className={`text-[9px] font-semibold mt-0.5 ${
                      state.active_fault === 'sensor_drift' ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    ● {state.active_fault === 'sensor_drift' ? 'SENSOR DRIFT' : 'CALIBRATED'}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* B. COMPONENT INSPECTOR PANEL (Requirement 6) */}
          <div className="p-3.5 rounded-xl border border-[#162035] bg-[#080d1a] shadow-lg font-sans">
            <div className="flex items-center justify-between border-b border-[#141f33] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-cyan-400" />
                <span className="font-mono font-bold text-slate-200 uppercase tracking-wider text-xs">
                  COMPONENT INSPECTOR
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold">
                {selectedComponent.category}
              </span>
            </div>

            {/* Component Title & Health */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{selectedComponent.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{selectedComponent.physicalLocation}</p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-400">HEALTH</div>
                  <div
                    className={`text-base font-bold ${
                      compHealth > 80 ? 'text-emerald-400' : compHealth > 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {compHealth}%
                  </div>
                </div>
              </div>

              {/* Status Pill & Active Fault info */}
              <div className="p-2 rounded bg-[#060913] border border-[#1a2438] space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">STATUS:</span>
                  <span
                    className={`font-bold uppercase ${
                      isSelectedActiveFault
                        ? activeFaultMapping?.severityLevel === 'critical'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    ● {isSelectedActiveFault ? (activeFaultMapping?.severityLevel || 'DEGRADED') : 'NORMAL'}
                  </span>
                </div>

                {isSelectedActiveFault && activeFaultMapping && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">FAULT:</span>
                    <span className="font-bold text-rose-400 truncate max-w-[170px]">{activeFaultMapping.title}</span>
                  </div>
                )}
              </div>

              {/* Live Telemetry vs Expected Model */}
              <div className="p-2.5 rounded bg-[#060913] border border-[#1a2438] space-y-2 font-mono text-xs">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  PHYSICS DYNAMICS & RESIDUALS
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-slate-400">{metrics.label} OBSERVED</div>
                    <div className="text-sm font-bold text-slate-100">
                      {metrics.observedVal.toFixed(1)} {metrics.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">PHYSICS BASELINE</div>
                    <div className="text-sm font-semibold text-slate-400">
                      {metrics.expectedVal.toFixed(1)} {metrics.unit}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400">Residual Delta:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(metricDelta) > 5 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {metricDelta >= 0 ? `+${metricDelta.toFixed(1)}` : metricDelta.toFixed(1)} {metrics.unit}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">{metrics.secondaryLabel}:</span>
                  <span className="font-semibold text-sky-300">{metrics.secondaryVal}</span>
                </div>
              </div>

              {/* Engineering Specs Drawer */}
              <div className="space-y-1 text-[11px] pt-1">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">AEROSPACE SPECIFICATIONS</div>
                <div className="space-y-1 bg-[#060913] p-2 rounded border border-[#1a2438] font-mono text-[10px]">
                  {Object.entries(selectedComponent.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-slate-200 font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* C. ENGINE DIAGNOSTIC TIMELINE (Requirement 12) */}
          <div className="p-3.5 rounded-xl border border-[#162035] bg-[#080d1a] shadow-lg">
            <div className="flex items-center justify-between border-b border-[#141f33] pb-2 mb-2.5">
              <div className="flex items-center gap-2 text-slate-200 font-mono font-bold tracking-wider uppercase text-xs">
                <Clock size={14} className="text-cyan-400" />
                <span>DIAGNOSTIC EVENT TIMELINE</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">SIM CLOCK</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {timelineEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-2 rounded border text-[11px] font-mono transition ${
                    evt.severity === 'critical'
                      ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                      : evt.severity === 'warning'
                      ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                      : 'bg-[#060913] border-[#1e293b] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">{evt.timeStr}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        evt.severity === 'critical'
                          ? 'bg-rose-900 text-rose-200'
                          : evt.severity === 'warning'
                          ? 'bg-amber-900 text-amber-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {evt.severity}
                    </span>
                  </div>
                  <div className="font-bold text-xs mt-0.5">{evt.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{evt.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

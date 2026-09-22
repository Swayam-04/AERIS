import React, { useState } from 'react';
import {
  Plane,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Gauge,
  Zap,
  BatteryCharging,
  Compass,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Crosshair,
  Flame,
  Thermometer,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import {
  DigitalTwinState,
  UAVSummary,
  MissionPhase,
  FaultType
} from '../types/telemetry';

interface FleetCommandViewProps {
  fleet: UAVSummary[];
  activeUavId: string;
  currentState: DigitalTwinState | null;
  onSelectUav: (uavId: string) => void;
  onNavigateToTwin: () => void;
  onNavigateToOverview: () => void;
  onNavigateToControl: () => void;
  onInjectFault: (uavId: string, fault: FaultType, severity: number) => void;
  onClearFault: (uavId: string) => void;
  onSetPhase: (uavId: string, phase: MissionPhase) => void;
  onResetUav: (uavId: string) => void;
}

export const FleetCommandView: React.FC<FleetCommandViewProps> = ({
  fleet,
  activeUavId,
  currentState,
  onSelectUav,
  onNavigateToTwin,
  onNavigateToOverview,
  onNavigateToControl,
  onInjectFault,
  onClearFault,
  onSetPhase,
  onResetUav
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuickFaultUav, setSelectedQuickFaultUav] = useState<string | null>(null);
  const [quickFaultType, setQuickFaultType] = useState<FaultType>('overheating');
  const [quickFaultSeverity, setQuickFaultSeverity] = useState<number>(0.75);

  // Fallback fleet array if not yet loaded from backend
  const displayFleet: UAVSummary[] = fleet.length > 0 ? fleet : [
    {
      aircraft_id: 'UAV-RUST-01',
      callsign: 'Garuda-1',
      model_name: 'DRDO RUSTOM-II MALE',
      engine_id: 'UAV-ENG-26054',
      engine_model: 'Lycoming O-320-D2J',
      mission_id: 'MIS-ALPHA-01',
      mission_type: 'Border Surveillance Patrol',
      mission_phase: 'cruise' as MissionPhase,
      overall_health_score: 98.4,
      status: 'normal',
      active_fault: 'none' as FaultType,
      fault_severity: 0.0,
      alerts_count: 0,
      altitude_ft: 15000,
      rpm: 2450,
      battery_soc: 92.0,
      bus_voltage: 28.2,
      fuel_flow_lph: 24.5,
      rul_hours: 1180,
      coordinates: { latitude: 26.9124, longitude: 70.9015, altitude_ft: 15000, heading_deg: 85, speed_knots: 120, sector: 'Western Thar Border Sector' }
    },
    {
      aircraft_id: 'UAV-RUST-02',
      callsign: 'Garuda-2',
      model_name: 'DRDO RUSTOM-I Tactical',
      engine_id: 'UAV-ENG-26055',
      engine_model: 'Rotax 914 Turbo',
      mission_id: 'MIS-BRAVO-02',
      mission_type: 'Forward Tactical Recon',
      mission_phase: 'loiter' as MissionPhase,
      overall_health_score: 94.8,
      status: 'normal',
      active_fault: 'none' as FaultType,
      fault_severity: 0.0,
      alerts_count: 0,
      altitude_ft: 12000,
      rpm: 2320,
      battery_soc: 88.5,
      bus_voltage: 28.1,
      fuel_flow_lph: 21.0,
      rul_hours: 1120,
      coordinates: { latitude: 27.4250, longitude: 71.8320, altitude_ft: 12000, heading_deg: 140, speed_knots: 95, sector: 'Jaisalmer Air Defense Sector' }
    },
    {
      aircraft_id: 'UAV-TAPAS-03',
      callsign: 'Tapas-3',
      model_name: 'DRDO TAPAS-BH-201 MALE',
      engine_id: 'UAV-ENG-30112',
      engine_model: 'Austro Engine AE300',
      mission_id: 'MIS-CHARLIE-03',
      mission_type: 'Coastal Radar & EEZ Escort',
      mission_phase: 'climb' as MissionPhase,
      overall_health_score: 99.1,
      status: 'normal',
      active_fault: 'none' as FaultType,
      fault_severity: 0.0,
      alerts_count: 0,
      altitude_ft: 6000,
      rpm: 2680,
      battery_soc: 95.0,
      bus_voltage: 28.3,
      fuel_flow_lph: 28.2,
      rul_hours: 1250,
      coordinates: { latitude: 21.7051, longitude: 69.3456, altitude_ft: 6000, heading_deg: 210, speed_knots: 135, sector: 'Gujarat Coastal EEZ Vector' }
    },
    {
      aircraft_id: 'UAV-ABHYAS-04',
      callsign: 'Abhyas-4',
      model_name: 'DRDO ABHYAS Target / Recon',
      engine_id: 'UAV-ENG-40221',
      engine_model: 'Micro-Turbo Aero Turbine',
      mission_id: 'MIS-DELTA-04',
      mission_type: 'Air Defense Tracking Sortie',
      mission_phase: 'takeoff' as MissionPhase,
      overall_health_score: 100.0,
      status: 'normal',
      active_fault: 'none' as FaultType,
      fault_severity: 0.0,
      alerts_count: 0,
      altitude_ft: 500,
      rpm: 2900,
      battery_soc: 99.0,
      bus_voltage: 28.4,
      fuel_flow_lph: 34.0,
      rul_hours: 1200,
      coordinates: { latitude: 21.5034, longitude: 86.9234, altitude_ft: 500, heading_deg: 45, speed_knots: 160, sector: 'Chandipur Bay Test Range' }
    },
    {
      aircraft_id: 'UAV-GHATAK-05',
      callsign: 'Ghatak-5',
      model_name: 'DRDO GHATAK UCAV Demonstrator',
      engine_id: 'UAV-ENG-50334',
      engine_model: 'Kaveri Hybrid DC Gen',
      mission_id: 'MIS-ECHO-05',
      mission_type: 'Stealth Vector Flight Demo',
      mission_phase: 'return' as MissionPhase,
      overall_health_score: 97.2,
      status: 'normal',
      active_fault: 'none' as FaultType,
      fault_severity: 0.0,
      alerts_count: 0,
      altitude_ft: 8000,
      rpm: 2400,
      battery_soc: 84.0,
      bus_voltage: 28.2,
      fuel_flow_lph: 25.8,
      rul_hours: 1140,
      coordinates: { latitude: 14.2810, longitude: 75.8234, altitude_ft: 8000, heading_deg: 310, speed_knots: 190, sector: 'Chitradurga ATR Test Corridor' }
    }
  ];

  // Filter fleet based on search and status
  const filteredFleet = displayFleet.filter((uav) => {
    const matchesSearch =
      uav.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uav.aircraft_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uav.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uav.engine_model.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'nominal') return uav.status === 'normal';
    if (filterStatus === 'warning') return uav.status === 'warning';
    if (filterStatus === 'critical') return uav.status === 'critical';
    return true;
  });

  // Calculate fleet-wide summary metrics
  const totalAirframes = displayFleet.length;
  const activeSorties = displayFleet.filter((u) => u.mission_phase !== 'landing').length;
  const totalAlerts = displayFleet.reduce((acc, u) => acc + u.alerts_count, 0);
  const avgHealth = Math.round(
    displayFleet.reduce((acc, u) => acc + u.overall_health_score, 0) / Math.max(1, displayFleet.length)
  );
  const degradedAirframes = displayFleet.filter((u) => u.status !== 'normal' || u.active_fault !== 'none').length;

  return (
    <div className="space-y-6">
      {/* 1. Tactical Fleet Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-500/20 pb-4 bg-slate-950/40 p-4 rounded-xl backdrop-blur-sm shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <Plane className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-cyan-200 to-sky-400 font-sans">
              Tactical Multi-UAV Fleet Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            AERIS Distributed Digital Twin Fleet Squadron • DRDO ADE MALE / Tactical UAV Operations
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/40 text-slate-200 flex items-center gap-2 shadow-sm">
            <span className="text-slate-400">ACTIVE FOCUS:</span>
            <strong className="text-cyan-400 font-bold">
              {displayFleet.find((u) => u.aircraft_id === activeUavId)?.callsign || 'Garuda-1'} ({activeUavId})
            </strong>
          </div>

          <button
            onClick={onNavigateToOverview}
            className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-bold transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            title="Open detailed telemetry dashboard for active UAV"
          >
            <span>ACTIVE TWIN DASHBOARD</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 2. Squadron Executive KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 font-mono">
        {/* Total Airframes */}
        <div className="eng-card p-3.5 space-y-1 bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-sans">
            <span>Fleet Squadron Size</span>
            <Plane size={15} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {totalAirframes} <span className="text-xs font-normal text-slate-500">AIRFRAMES</span>
          </div>
          <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-sans">
            <ShieldCheck size={11} /> 100% Digital Twin Synced
          </span>
        </div>

        {/* In-Flight Sorties */}
        <div className="eng-card p-3.5 space-y-1 bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-sans">
            <span>Airborne Sorties</span>
            <Activity size={15} className="text-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {activeSorties} <span className="text-xs font-normal text-slate-500">/ {totalAirframes} ACTIVE</span>
          </div>
          <span className="text-[10px] text-slate-400 font-sans">All sectors operational</span>
        </div>

        {/* Fleet Average Health */}
        <div className="eng-card p-3.5 space-y-1 bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-sans">
            <span>Squadron Health</span>
            <Gauge size={15} className="text-[#38bdf8]" />
          </div>
          <div className={`text-2xl font-bold font-mono ${
            avgHealth > 85 ? 'text-emerald-400' : avgHealth > 60 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {avgHealth}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden mt-1">
            <div
              className={`h-full transition-all duration-500 ${
                avgHealth > 85 ? 'bg-emerald-400' : avgHealth > 60 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${avgHealth}%` }}
            />
          </div>
        </div>

        {/* Active Fleet Alerts */}
        <div className="eng-card p-3.5 space-y-1 bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-sans">
            <span>Active Fleet Alerts</span>
            <ShieldAlert size={15} className={totalAlerts > 0 ? "text-rose-400 animate-bounce" : "text-slate-500"} />
          </div>
          <div className={`text-2xl font-bold font-mono ${totalAlerts > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {totalAlerts} <span className="text-xs font-normal text-slate-500">INCIDENTS</span>
          </div>
          <span className={`text-[10px] font-sans ${totalAlerts > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {totalAlerts > 0 ? '⚠ Attention Required' : '✓ No Critical Faults'}
          </span>
        </div>

        {/* Squadron Readiness Index */}
        <div className="eng-card p-3.5 space-y-1 bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-800 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-sans">
            <span>Readiness Status</span>
            <Sparkles size={15} className="text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400 font-mono uppercase tracking-tight">
            DEFCON 4 • OPTIMAL
          </div>
          <span className="text-[10px] text-slate-400 font-sans block truncate">
            {degradedAirframes === 0 ? 'All 5 Airframes Mission Capable' : `${degradedAirframes} Airframe Degraded`}
          </span>
        </div>
      </div>

      {/* 3. TACTICAL AIRSPACE RADAR & FORMATION MAP */}
      <div className="eng-panel font-mono text-xs">
        <div className="eng-header flex flex-wrap items-center justify-between gap-2">
          <span className="font-sans font-bold text-xs uppercase text-slate-200 tracking-wider flex items-center gap-2">
            <Compass size={15} className="text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
            TACTICAL SQUADRON FORMATION RADAR & AIRSPACE GEO-SECTORS
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            COORDINATE GRID: <strong className="text-cyan-400">INDIAN AIR DEFENSE SECTOR</strong>
          </span>
        </div>

        <div className="p-4 bg-[#050812] relative overflow-hidden rounded-b-xl border-t border-slate-800/80 min-h-[280px] flex flex-col justify-between">
          {/* Radar Background Grid (SVG) */}
          <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
              <circle cx="500" cy="200" r="120" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="500" cy="200" r="240" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="500" cy="200" r="360" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="200" x2="1000" y2="200" stroke="#38bdf8" strokeWidth="1" />
              <line x1="500" y1="0" x2="500" y2="400" stroke="#38bdf8" strokeWidth="1" />
            </svg>
          </div>

          {/* Airspace Geo-Sectors & UAV Blips Overlay */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-3">
            {displayFleet.map((uav, idx) => {
              const isSelected = uav.aircraft_id === activeUavId;
              const hasFault = uav.active_fault !== 'none';
              return (
                <div
                  key={uav.aircraft_id}
                  onClick={() => onSelectUav(uav.aircraft_id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-300 relative group ${
                    isSelected
                      ? 'bg-cyan-950/80 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/80 hover:bg-slate-850 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      VECTOR #{idx + 1}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      hasFault ? 'bg-rose-500 animate-ping' :
                      uav.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`} />
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-lg ${
                      isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      <Plane
                        size={16}
                        style={{ transform: `rotate(${(uav.coordinates?.heading_deg || 0) - 45}deg)` }}
                        className="transition-transform duration-500"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-100 font-sans tracking-tight">{uav.callsign}</h4>
                      <span className="text-[10px] text-cyan-400 font-mono">{uav.aircraft_id}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Sector:</span>
                      <span className="text-slate-200 font-bold truncate max-w-[100px]" title={uav.coordinates?.sector}>
                        {uav.coordinates?.sector || 'Border Vector'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alt / Speed:</span>
                      <span className="text-slate-200 font-bold">
                        {Math.round(uav.altitude_ft)} ft • {Math.round(uav.coordinates?.speed_knots || 120)} kts
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phase / Health:</span>
                      <span className={`font-bold uppercase ${
                        uav.overall_health_score > 80 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {uav.mission_phase} ({Math.round(uav.overall_health_score)}%)
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-2 text-center py-1 rounded bg-cyan-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase">
                      ✓ FOCUSED AIRFRAME
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Multi-UAV Fleet Card Matrix (Interactive Individual Controls) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 font-sans">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              Squadron Airframes & Digital Twins ({filteredFleet.length} of {displayFleet.length})
            </h2>
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter callsign, model, engine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 w-52"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-0.5 rounded-md transition ${filterStatus === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ALL
              </button>
              <button
                onClick={() => setFilterStatus('nominal')}
                className={`px-2.5 py-0.5 rounded-md transition ${filterStatus === 'nominal' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                NOMINAL
              </button>
              <button
                onClick={() => setFilterStatus('warning')}
                className={`px-2.5 py-0.5 rounded-md transition ${filterStatus === 'warning' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                WARNING
              </button>
            </div>
          </div>
        </div>

        {/* 5 Airframe Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFleet.map((uav) => {
            const isSelected = uav.aircraft_id === activeUavId;
            const isDegraded = uav.status !== 'normal' || uav.active_fault !== 'none';

            return (
              <div
                key={uav.aircraft_id}
                className={`eng-card p-4 space-y-3.5 transition-all duration-300 relative ${
                  isSelected
                    ? 'border-2 border-cyan-400 bg-gradient-to-br from-[#09152b] to-[#060b18] shadow-[0_0_24px_rgba(6,182,212,0.25)]'
                    : 'border-slate-800 bg-[#080d1a] hover:border-slate-700'
                }`}
              >
                {/* Airframe Title & Identification */}
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-slate-900 text-slate-400'
                    }`}>
                      <Plane size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-100 font-sans tracking-wide">
                          {uav.callsign}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-950 text-cyan-300 border border-slate-800 font-bold">
                          {uav.aircraft_id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">{uav.model_name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      uav.status === 'critical' || uav.active_fault !== 'none' ? 'eng-badge-critical' :
                      uav.status === 'warning' ? 'eng-badge-warning' : 'eng-badge-success'
                    }`}>
                      {uav.active_fault !== 'none' ? uav.active_fault : uav.status}
                    </span>
                    <span className="block text-[9px] font-mono text-slate-500 mt-0.5">
                      {uav.mission_id}
                    </span>
                  </div>
                </div>

                {/* Powerplant & Mission Specifications */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">Powerplant</span>
                    <strong className="text-slate-200 text-[11px] truncate block" title={uav.engine_model}>
                      {uav.engine_model}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">Flight Phase</span>
                    <strong className="text-cyan-400 text-[11px] uppercase block">
                      {uav.mission_phase}
                    </strong>
                  </div>
                </div>

                {/* Primary Telemetry Gauges Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">Engine Health</span>
                    <div className={`text-base font-bold ${
                      uav.overall_health_score > 80 ? 'text-emerald-400' :
                      uav.overall_health_score > 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {Math.round(uav.overall_health_score)}%
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">RPM Speed</span>
                    <div className="text-base font-bold text-slate-100">
                      {Math.round(uav.rpm)}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">Battery SOC</span>
                    <div className="text-base font-bold text-cyan-400">
                      {Math.round(uav.battery_soc)}%
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">Bus Voltage</span>
                    <div className="text-sm font-bold text-slate-200">
                      {uav.bus_voltage.toFixed(1)} V
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">Altitude</span>
                    <div className="text-sm font-bold text-slate-200">
                      {Math.round(uav.altitude_ft)} ft
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block font-sans">RUL Est.</span>
                    <div className="text-sm font-bold text-emerald-400">
                      {Math.round(uav.rul_hours || 1200)}h
                    </div>
                  </div>
                </div>

                {/* Active Fault Alert Banner (if fault present) */}
                {uav.active_fault !== 'none' && (
                  <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-mono flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={15} className="text-rose-400 shrink-0" />
                      <div>
                        <strong className="block uppercase text-[11px] font-bold">ACTIVE FAULT: {uav.active_fault}</strong>
                        <span className="text-[10px] text-rose-300/80">Severity: {(uav.fault_severity * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onClearFault(uav.aircraft_id)}
                      className="px-2 py-1 rounded bg-rose-900 hover:bg-rose-800 border border-rose-400/50 text-[10px] font-bold"
                    >
                      CLEAR
                    </button>
                  </div>
                )}

                {/* Action Control Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                  {isSelected ? (
                    <div className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 text-center font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm">
                      <ShieldCheck size={14} className="text-cyan-400" />
                      <span>CURRENTLY ACTIVE TWIN</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectUav(uav.aircraft_id)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-center font-bold text-[11px] transition shadow-sm"
                    >
                      SWITCH TO THIS TWIN
                    </button>
                  )}

                  {/* Phase Quick Dropdown */}
                  <select
                    value={uav.mission_phase}
                    onChange={(e) => onSetPhase(uav.aircraft_id, e.target.value as MissionPhase)}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                    title="Change mission phase for this UAV"
                  >
                    <option value="takeoff">Takeoff</option>
                    <option value="climb">Climb</option>
                    <option value="cruise">Cruise</option>
                    <option value="loiter">Loiter</option>
                    <option value="return">Return</option>
                    <option value="landing">Landing</option>
                  </select>

                  {/* Fault Trigger Button */}
                  <button
                    onClick={() => {
                      if (uav.active_fault !== 'none') {
                        onClearFault(uav.aircraft_id);
                      } else {
                        onInjectFault(uav.aircraft_id, 'overheating', 0.85);
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                      uav.active_fault !== 'none'
                        ? 'bg-rose-900 text-rose-200 hover:bg-rose-800 border border-rose-600'
                        : 'bg-slate-900 text-slate-300 hover:text-slate-100 border border-slate-700 hover:border-amber-500/60'
                    }`}
                    title={uav.active_fault !== 'none' ? "Clear Fault" : "Quick Inject Test Fault (Overheating)"}
                  >
                    {uav.active_fault !== 'none' ? "CLEAR FAULT" : "INJECT FAULT"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. MULTI-AIRFRAME TELEMETRY COMPARISON MATRIX TABLE */}
      <div className="eng-panel font-mono text-xs">
        <div className="eng-header flex items-center justify-between">
          <span className="font-sans font-bold text-xs uppercase text-slate-200 tracking-wider flex items-center gap-2">
            <Gauge size={14} className="text-cyan-400" />
            SQUADRON MULTI-AIRFRAME TELEMETRY COMPARISON MATRIX
          </span>
          <span className="text-[11px] text-slate-400">
            REAL-TIME SYNCHRONIZED ACROSS 5 DIGITAL TWINS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="eng-table">
            <thead>
              <tr>
                <th>AIRFRAME</th>
                <th>CALLSIGN</th>
                <th>POWERPLANT</th>
                <th>PHASE</th>
                <th>HEALTH</th>
                <th>RPM</th>
                <th>ALTITUDE</th>
                <th>BATTERY SOC</th>
                <th>BUS VOLTS</th>
                <th>FUEL (LPH)</th>
                <th>RUL EST.</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayFleet.map((uav) => {
                const isSelected = uav.aircraft_id === activeUavId;
                return (
                  <tr
                    key={uav.aircraft_id}
                    className={isSelected ? 'bg-cyan-950/30 font-semibold' : ''}
                  >
                    <td>
                      <span className="font-bold text-cyan-400">{uav.aircraft_id}</span>
                    </td>
                    <td className="text-slate-100 font-bold">{uav.callsign}</td>
                    <td className="text-slate-300">{uav.engine_model}</td>
                    <td>
                      <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                        {uav.mission_phase}
                      </span>
                    </td>
                    <td>
                      <span className={`font-bold ${
                        uav.overall_health_score > 80 ? 'text-emerald-400' :
                        uav.overall_health_score > 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {Math.round(uav.overall_health_score)}%
                      </span>
                    </td>
                    <td className="text-slate-200">{Math.round(uav.rpm)}</td>
                    <td className="text-slate-300">{Math.round(uav.altitude_ft)} ft</td>
                    <td className="text-cyan-300">{Math.round(uav.battery_soc)}%</td>
                    <td className="text-slate-200">{uav.bus_voltage.toFixed(1)} V</td>
                    <td className="text-slate-300">{uav.fuel_flow_lph.toFixed(1)}</td>
                    <td className="text-emerald-400 font-bold">{Math.round(uav.rul_hours || 1200)}h</td>
                    <td>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        uav.status === 'critical' || uav.active_fault !== 'none' ? 'eng-badge-critical' :
                        uav.status === 'warning' ? 'eng-badge-warning' : 'eng-badge-success'
                      }`}>
                        {uav.active_fault !== 'none' ? uav.active_fault : uav.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => onSelectUav(uav.aircraft_id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40'
                        }`}
                      >
                        {isSelected ? 'ACTIVE' : 'SWITCH'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

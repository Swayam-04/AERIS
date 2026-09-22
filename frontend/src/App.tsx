import React, { useEffect, useState, useRef } from 'react';
import { DigitalTwinState, FaultType, MissionPhase, UAVSummary, FleetSummaryResponse } from './types/telemetry';
import { ScreenId } from './components/Navigation';
import { TopStatusBar } from './components/TopStatusBar';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { FleetCommandView } from './views/FleetCommandView';
import { LiveTwinView } from './views/LiveTwinView';
import { TelemetryView } from './views/TelemetryView';
import { HealthView } from './views/HealthView';
import { FaultCenterView } from './views/FaultCenterView';
import { RULView } from './views/RULView';
import { MissionControlView } from './views/MissionControlView';
import { ReplayView } from './views/ReplayView';
import { WhatIfLabView } from './views/WhatIfLabView';
import { ReliabilityView } from './views/ReliabilityView';
import { EngineFaultMapView } from './views/EngineFaultMapView';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenId>('overview');
  const [selectedUavId, setSelectedUavId] = useState<string>('UAV-RUST-01');
  const [fleet, setFleet] = useState<UAVSummary[]>([]);
  const [twinState, setTwinState] = useState<DigitalTwinState | null>(null);
  const [history, setHistory] = useState<DigitalTwinState[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  
  // Layout States: Sidebar Collapse & Mobile Drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial fleet summary and history for selected UAV
  useEffect(() => {
    // 1. Fetch Fleet Summary
    fetch('/api/fleet/summary')
      .then((res) => res.json())
      .then((data: FleetSummaryResponse) => {
        if (data && data.fleet) {
          setFleet(data.fleet);
          if (data.active_uav_id) {
            setSelectedUavId(data.active_uav_id);
          }
        }
      })
      .catch((e) => console.error('Error loading fleet summary:', e));

    // 2. Fetch Historical Buffer for active UAV
    fetch(`/api/telemetry/history?uav_id=${selectedUavId}&limit=100`)
      .then((res) => res.json())
      .then((data: DigitalTwinState[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setHistory(data);
          setTwinState(data[data.length - 1]);
        }
      })
      .catch((e) => console.error('Error loading historical buffer:', e));
  }, []);

  // Connect WebSocket stream
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const state: DigitalTwinState = JSON.parse(event.data);
          
          // Update fleet summary if attached
          if (state.fleet_summary && Array.isArray(state.fleet_summary)) {
            setFleet(state.fleet_summary);
          }

          // If message is for currently selected UAV, update twin state and history
          if (!state.aircraft_id || state.aircraft_id === selectedUavId) {
            setTwinState(state);
            setHistory((prev) => {
              const next = [...prev, state];
              if (next.length > 500) next.shift();
              return next;
            });
          }
        } catch (e) {
          // ignore ping/pong
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Retry connection after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedUavId]);

  // Fast Active Airframe Switching Handler
  const handleSelectUav = async (uavId: string) => {
    setSelectedUavId(uavId);

    // 1. Notify Backend
    try {
      fetch(`/api/fleet/select/${uavId}`, { method: 'POST' })
        .then((res) => res.json())
        .then((updatedState: DigitalTwinState) => {
          if (updatedState) {
            setTwinState(updatedState);
          }
        })
        .catch((e) => console.error('Error switching active UAV on backend:', e));

      // 2. Fetch fresh history buffer for selected UAV
      const histRes = await fetch(`/api/fleet/${uavId}/history?limit=100`);
      const histData = await histRes.json();
      if (Array.isArray(histData) && histData.length > 0) {
        setHistory(histData);
        setTwinState(histData[histData.length - 1]);
      }

      // 3. Send WebSocket subscription message if open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'select_uav', uav_id: uavId }));
      }
    } catch (e) {
      console.error('Error executing UAV switch:', e);
    }
  };

  // Control handlers
  const handleInjectFault = async (fault: FaultType, severity: number, targetUavId?: string) => {
    const uav = targetUavId || selectedUavId;
    try {
      const res = await fetch(`/api/fleet/${uav}/fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uav_id: uav, fault_type: fault, severity }),
      });
      const updated = await res.json();
      if (uav === selectedUavId) {
        setTwinState(updated);
      }
      // Refresh fleet summary
      fetch('/api/fleet/summary')
        .then((r) => r.json())
        .then((d) => d.fleet && setFleet(d.fleet))
        .catch(() => {});
    } catch (e) {
      console.error('Fault injection error:', e);
    }
  };

  const handleClearFault = async (targetUavId?: string) => {
    const uav = targetUavId || selectedUavId;
    try {
      const res = await fetch(`/api/fleet/${uav}/fault/clear`, { method: 'POST' });
      const updated = await res.json();
      if (uav === selectedUavId) {
        setTwinState(updated);
      }
      // Refresh fleet summary
      fetch('/api/fleet/summary')
        .then((r) => r.json())
        .then((d) => d.fleet && setFleet(d.fleet))
        .catch(() => {});
    } catch (e) {
      console.error('Clear fault error:', e);
    }
  };

  const handleSetPhase = async (phase: MissionPhase, targetUavId?: string) => {
    const uav = targetUavId || selectedUavId;
    try {
      const res = await fetch(`/api/fleet/${uav}/phase?phase=${phase}`, { method: 'POST' });
      const updated = await res.json();
      if (uav === selectedUavId) {
        setTwinState(updated);
      }
      // Refresh fleet summary
      fetch('/api/fleet/summary')
        .then((r) => r.json())
        .then((d) => d.fleet && setFleet(d.fleet))
        .catch(() => {});
    } catch (e) {
      console.error('Set phase error:', e);
    }
  };

  const handleResetMission = async (targetUavId?: string) => {
    const uav = targetUavId || selectedUavId;
    try {
      const res = await fetch(`/api/fleet/${uav}/reset`, { method: 'POST' });
      const updated = await res.json();
      if (uav === selectedUavId) {
        setTwinState(updated);
        setHistory([updated]);
      }
      // Refresh fleet summary
      fetch('/api/fleet/summary')
        .then((r) => r.json())
        .then((d) => d.fleet && setFleet(d.fleet))
        .catch(() => {});
    } catch (e) {
      console.error('Reset mission error:', e);
    }
  };

  const handleSelectScreen = (screenId: ScreenId, presetMode?: string) => {
    setScreen(screenId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* 1. TOP STATUS BAR — Multi-UAV Selector Dropdown & Live Status */}
      <TopStatusBar
        state={twinState}
        wsConnected={wsConnected}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        selectedUavId={selectedUavId}
        fleet={fleet}
        onSelectUav={handleSelectUav}
        onNavigateToFleet={() => setScreen('fleet')}
      />

      {/* 2. MAIN LAYOUT: Left Sidebar + Center Content Area */}
      <div className="flex-1 flex relative">
        {/* Left Fixed Primary Navigation Sidebar */}
        <Sidebar
          currentScreen={screen}
          onSelectScreen={handleSelectScreen}
          state={twinState}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          selectedUavId={selectedUavId}
          fleet={fleet}
          onSelectUav={handleSelectUav}
        />

        {/* Center Main Application Content Area */}
        <main
          className={`flex-1 transition-all duration-300 min-h-[calc(100vh-3.5rem)] px-4 sm:px-6 lg:px-8 py-6 ${
            sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
          }`}
        >
          <div className="max-w-[1600px] mx-auto space-y-6">
            {screen === 'overview' && (
              <OverviewView
                state={twinState}
                history={history}
                onNavigateToFaults={() => setScreen('faults')}
                onNavigateToControl={() => setScreen('control')}
                onNavigateToEngineMap={() => setScreen('engine_fault_map')}
                onSetPhase={handleSetPhase}
              />
            )}

            {screen === 'fleet' && (
              <FleetCommandView
                fleet={fleet}
                activeUavId={selectedUavId}
                currentState={twinState}
                onSelectUav={handleSelectUav}
                onNavigateToTwin={() => setScreen('digital_twin')}
                onNavigateToOverview={() => setScreen('overview')}
                onNavigateToControl={() => setScreen('control')}
                onInjectFault={(uavId, fault, severity) => handleInjectFault(fault, severity, uavId)}
                onClearFault={(uavId) => handleClearFault(uavId)}
                onSetPhase={(uavId, phase) => handleSetPhase(phase, uavId)}
                onResetUav={(uavId) => handleResetMission(uavId)}
              />
            )}

            {screen === 'digital_twin' && <LiveTwinView state={twinState} onSetPhase={handleSetPhase} />}

            {screen === 'engine_fault_map' && (
              <EngineFaultMapView
                state={twinState}
                onInjectFault={handleInjectFault}
                onClearFault={handleClearFault}
                onNavigateToWhatIf={() => setScreen('whatif')}
                onNavigateToControl={() => setScreen('control')}
              />
            )}

            {screen === 'telemetry' && <TelemetryView state={twinState} history={history} />}

            {screen === 'health' && <HealthView state={twinState} history={history} />}

            {screen === 'faults' && (
              <FaultCenterView state={twinState} onNavigateToControl={() => setScreen('control')} />
            )}

            {screen === 'rul' && <RULView state={twinState} />}

            {screen === 'control' && (
              <MissionControlView
                state={twinState}
                onInjectFault={handleInjectFault}
                onClearFault={handleClearFault}
                onSetPhase={handleSetPhase}
                onResetMission={handleResetMission}
              />
            )}

            {screen === 'replay' && <ReplayView history={history} />}

            {screen === 'whatif' && <WhatIfLabView />}

            {screen === 'reliability' && <ReliabilityView state={twinState} />}
          </div>
        </main>
      </div>

      {/* Footer Bar */}
      <footer className={`w-full border-t border-slate-850 bg-[#050812] py-3.5 text-xs text-slate-500 transition-all duration-300 ${
        sidebarCollapsed ? 'md:pl-20' : 'md:pl-68'
      }`}>
        <div className="max-w-[1600px] mx-auto px-4 flex items-center justify-between font-mono">
          <span>AERIS Multi-UAV Fleet Command • {twinState?.callsign || 'Garuda-1'} ({selectedUavId})</span>
          <span>DRDO Tactical Aerospace Digital Twin Platform</span>
        </div>
      </footer>
    </div>
  );
};


import React, { useEffect, useState, useRef } from 'react';
import { DigitalTwinState, FaultType, MissionPhase } from './types/telemetry';
import { ScreenId } from './components/Navigation';
import { TopStatusBar } from './components/TopStatusBar';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { LiveTwinView } from './views/LiveTwinView';
import { TelemetryView } from './views/TelemetryView';
import { HealthView } from './views/HealthView';
import { FaultCenterView } from './views/FaultCenterView';
import { RULView } from './views/RULView';
import { MissionControlView } from './views/MissionControlView';
import { ReplayView } from './views/ReplayView';
import { WhatIfLabView } from './views/WhatIfLabView';
import { ReliabilityView } from './views/ReliabilityView';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenId>('overview');
  const [twinState, setTwinState] = useState<DigitalTwinState | null>(null);
  const [history, setHistory] = useState<DigitalTwinState[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  
  // Layout States: Sidebar Collapse & Mobile Drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial REST snapshot & historical buffer
  useEffect(() => {
    fetch('/api/telemetry/history?limit=100')
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
          setTwinState(state);
          setHistory((prev) => {
            const next = [...prev, state];
            if (next.length > 500) next.shift();
            return next;
          });
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
  }, []);

  // Control handlers
  const handleInjectFault = async (fault: FaultType, severity: number) => {
    try {
      const res = await fetch('/api/mission/fault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fault_type: fault, severity }),
      });
      const updated = await res.json();
      setTwinState(updated);
    } catch (e) {
      console.error('Fault injection error:', e);
    }
  };

  const handleClearFault = async () => {
    try {
      const res = await fetch('/api/mission/fault/clear', { method: 'POST' });
      const updated = await res.json();
      setTwinState(updated);
    } catch (e) {
      console.error('Clear fault error:', e);
    }
  };

  const handleSetPhase = async (phase: MissionPhase) => {
    try {
      const res = await fetch(`/api/mission/phase?phase=${phase}`, { method: 'POST' });
      const updated = await res.json();
      setTwinState(updated);
    } catch (e) {
      console.error('Set phase error:', e);
    }
  };

  const handleResetMission = async () => {
    try {
      const res = await fetch('/api/mission/reset', { method: 'POST' });
      const updated = await res.json();
      setTwinState(updated);
      setHistory([updated]);
    } catch (e) {
      console.error('Reset mission error:', e);
    }
  };

  const handleSelectScreen = (screenId: ScreenId, presetMode?: string) => {
    setScreen(screenId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* 1. TOP STATUS BAR — Status Information ONLY (No Nav Links) */}
      <TopStatusBar
        state={twinState}
        wsConnected={wsConnected}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
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
                onSetPhase={handleSetPhase}
              />
            )}

            {screen === 'digital_twin' && <LiveTwinView state={twinState} onSetPhase={handleSetPhase} />}

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
          <span>AERIS Engine Digital Twin — DRDO RUSTOM-1</span>
          <span>AERIS Navigation Pattern + Aerospace Digital Twin Identity</span>
        </div>
      </footer>
    </div>
  );
};

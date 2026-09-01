import React, { useState } from 'react';
import { DigitalTwinState, AlertItem } from '../types/telemetry';
import { ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight, Info } from 'lucide-react';

interface FaultCenterViewProps {
  state: DigitalTwinState | null;
  onNavigateToControl: () => void;
}

export const FaultCenterView: React.FC<FaultCenterViewProps> = ({ state, onNavigateToControl }) => {
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  if (!state) return null;

  const activeAlerts = state.alerts;
  const currentSelected = selectedAlert || activeAlerts[0] || null;

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162035] pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase font-sans tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Diagnostic Fault & Incident Terminal
          </h2>
          <p className="text-xs text-slate-400">Explainable multivariate evidence ranking and maintenance recommendations</p>
        </div>
        <button
          onClick={onNavigateToControl}
          className="px-3 py-1 rounded bg-[#0284c7] text-white font-bold text-xs hover:bg-[#0369a1] transition font-sans"
        >
          OPEN FAULT SIMULATOR ↗
        </button>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="eng-panel p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-sans uppercase">No Active Engine Faults Detected</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              All 9 core telemetry signals align with nominal physics baselines. Residual vector Mahalanobis distance D_M is within standard limits.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Incident Log Table (7 Cols) */}
          <div className="lg:col-span-7 eng-panel">
            <div className="eng-header">
              <span className="font-sans font-bold text-xs uppercase text-slate-200">
                ACTIVE INCIDENT LOG TABLE ({activeAlerts.length})
              </span>
            </div>

            <table className="eng-table">
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>SEVERITY</th>
                  <th>CANDIDATE FAULT</th>
                  <th>CONFIDENCE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {activeAlerts.map((alert) => {
                  const isSelected = currentSelected?.alert_id === alert.alert_id;
                  return (
                    <tr
                      key={alert.alert_id}
                      onClick={() => setSelectedAlert(alert)}
                      className={`cursor-pointer transition ${isSelected ? 'bg-[#0e1935] border-l-2 border-l-[#0284c7]' : ''}`}
                    >
                      <td className="text-slate-400">{alert.timestamp}</td>
                      <td>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          alert.severity === 'critical' ? 'eng-badge-critical' : 'eng-badge-warning'
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="font-bold text-slate-200">{alert.candidate_fault}</td>
                      <td className="text-[#38bdf8] font-bold">{Math.round(alert.confidence_pct)}%</td>
                      <td>
                        <button className="text-[10px] text-[#38bdf8] hover:underline">INSPECT ↗</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Fault Inspection & Evidence Panel (5 Cols) */}
          {currentSelected && (
            <div className="lg:col-span-5 eng-panel p-4 space-y-3">
              <div className="border-b border-[#162035] pb-2 flex items-center justify-between">
                <span className="font-sans font-bold text-xs uppercase text-slate-100">
                  INCIDENT DETAIL: {currentSelected.candidate_fault}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  currentSelected.severity === 'critical' ? 'eng-badge-critical' : 'eng-badge-warning'
                }`}>
                  {currentSelected.severity}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#0c1224] rounded border border-[#162035] space-y-1">
                  <span className="text-[10px] text-slate-500 font-sans font-bold uppercase">PHYSICAL SIGNAL EVIDENCE</span>
                  <p className="text-slate-200">{currentSelected.evidence_summary}</p>
                </div>

                <div className="p-2.5 bg-[#0c1224] rounded border border-[#162035] space-y-1">
                  <span className="text-[10px] text-slate-500 font-sans font-bold uppercase">CONTRIBUTING SIGNAL VECTOR</span>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {currentSelected.contributing_signals.map((sig) => (
                      <span key={sig} className="px-2 py-0.5 rounded bg-[#162035] text-[#38bdf8] text-[11px]">
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-[#09152b] rounded border border-[#163056] space-y-1">
                  <span className="text-[10px] text-[#38bdf8] font-sans font-bold uppercase">RECOMMENDED MAINTENANCE ACTION</span>
                  <p className="text-slate-200">{currentSelected.recommendation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Domain Explanatory Note */}
      <div className="eng-panel p-3 text-slate-400 flex items-start gap-2.5">
        <Info size={16} className="text-[#38bdf8] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-300 font-sans">Physics-Informed Diagnostic Principles</p>
          <p className="text-[11px] mt-0.5">
            Diagnostic alerts rely on vector residual divergence between physical thermodynamic models and telemetry signals.
            Confidence scores represent probabilistic candidate matching derived from historical fault signature datasets.
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { DigitalTwinState } from '../types/telemetry';
import { ShieldAlert, AlertTriangle, CheckCircle2, HelpCircle, FileText, ArrowRight } from 'lucide-react';

interface FaultCenterViewProps {
  state: DigitalTwinState | null;
  onNavigateToControl: () => void;
}

export const FaultCenterView: React.FC<FaultCenterViewProps> = ({ state, onNavigateToControl }) => {
  if (!state) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Diagnostic Fault & Alert Terminal
          </h2>
          <p className="text-xs text-slate-400">Explainable multivariate evidence ranking and maintenance recommendations</p>
        </div>
        <button
          onClick={onNavigateToControl}
          className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 transition"
        >
          Open Fault Injector →
        </button>
      </div>

      {/* Main Alert List */}
      <div className="space-y-4">
        {state.alerts.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">No Active Engine Fault Alerts</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Engine operating within normal physics parameters. All 9 core telemetry signals align with nominal baseline.
              </p>
            </div>
          </div>
        ) : (
          state.alerts.map((alert, idx) => (
            <div
              key={alert.alert_id}
              className={`glass-panel p-5 rounded-xl border space-y-4 ${
                alert.severity === 'critical' ? 'border-rose-500/60 bg-rose-950/20' : 'border-amber-500/60 bg-amber-950/20'
              }`}
            >
              {/* Alert Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500">#{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
                    <h3 className="text-base font-bold text-slate-100">{alert.candidate_fault}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase font-mono ${
                    alert.severity === 'critical' ? 'bg-rose-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-mono text-xs font-bold">
                    {alert.confidence_pct}% CONFIDENCE
                  </span>
                </div>
              </div>

              {/* Supporting Evidence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">
                    Physical Signal Evidence
                  </span>
                  <p className="text-slate-200 leading-relaxed">{alert.evidence_summary}</p>
                </div>

                <div className="space-y-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">
                    Contributing Signals
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {alert.contributing_signals.map((sig) => (
                      <span key={sig} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-[11px]">
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actionable Engineering Recommendation */}
              <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs flex items-start gap-2.5">
                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-cyan-300 uppercase tracking-wider block text-[10px]">
                    Actionable Maintenance Recommendation
                  </span>
                  <p className="text-slate-200">{alert.recommendation}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Domain Explanatory Note */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <HelpCircle size={18} className="text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-300">Physics-Informed Explainable AI Principles</p>
          <p className="mt-0.5">
            Diagnostic alerts rely on vector residual divergence between physical thermodynamic models and telemetry signals.
            Confidence scores represent probabilistic candidate matching rather than absolute certified failure states.
          </p>
        </div>
      </div>
    </div>
  );
};

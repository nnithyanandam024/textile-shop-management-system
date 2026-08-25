import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Check
} from 'lucide-react';
import { AiApi } from '../../../api/aiApi';

interface AnomalyDetailsModalProps {
  anomaly: any | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewed: () => void;
}

export const AnomalyDetailsModal: React.FC<AnomalyDetailsModalProps> = ({
  anomaly,
  isOpen,
  onClose,
  onReviewed
}) => {
  const [notes, setNotes] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');

  if (!isOpen || !anomaly) return null;

  const handleReview = async (action: 'acknowledge' | 'mark_under_review' | 'resolve' | 'dismiss') => {
    setLoadingAction(true);
    try {
      const res = await AiApi.reviewAnomaly({
        anomalyId: anomaly.id,
        action,
        reviewerName: 'Store Manager',
        notes: notes.trim() || `Action: ${action}`,
      });

      if (res.success) {
        setActionSuccess(`Anomaly status updated to: ${action.toUpperCase()}`);
        setTimeout(() => {
          setActionSuccess('');
          onReviewed();
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to review anomaly:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const isCritical = anomaly.severity === 'critical';
  const isHigh = anomaly.severity === 'high';
  const isMedium = anomaly.severity === 'medium';

  const severityColor = isCritical
    ? 'bg-rose-500 text-white'
    : isHigh
    ? 'bg-amber-500 text-white'
    : isMedium
    ? 'bg-blue-500 text-white'
    : 'bg-emerald-500 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between gap-4 shrink-0 shadow-md ${
          isCritical
            ? 'bg-gradient-to-r from-rose-700 to-rose-900 text-white'
            : isHigh
            ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-white'
            : 'bg-gradient-to-r from-[#2012ad] to-[#3a29d5] text-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${severityColor}`}>
                  {anomaly.severity} Priority
                </span>
                <span className="text-xs text-white/80 font-mono">ID: {anomaly.id}</span>
              </div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white mt-0.5">
                {anomaly.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] bg-[#f9fafc] text-xs">
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* 1. Evidence Metric Box */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              Statistical Evidence & Deviation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
                <span className="text-[10px] font-bold text-rose-700 uppercase">Detected Value</span>
                <p className="text-base font-black text-rose-900 mt-0.5">{anomaly.evidence?.detectedValue}</p>
                {anomaly.evidence?.deviationMultiplier && (
                  <span className="text-[10px] font-bold text-rose-600 mt-1 inline-block">
                    ⚡ {anomaly.evidence.deviationMultiplier}x baseline deviation
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Expected Store Baseline</span>
                <p className="text-base font-black text-slate-800 mt-0.5">{anomaly.evidence?.expectedBaseline}</p>
                <span className="text-[10px] text-slate-500 mt-1 inline-block">Typical operational range</span>
              </div>
            </div>

            {anomaly.evidence?.additionalContext && (
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                📋 {anomaly.evidence.additionalContext}
              </p>
            )}
          </div>

          {/* 2. AI Neutral Reasoning */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🤖</span>
              <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                AI Forensic Analysis
              </h3>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              {anomaly.aiExplanation}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-indigo-900 font-semibold bg-indigo-50/60 p-2.5 rounded-xl">
              <span className="text-indigo-600">👉</span>
              <span><strong>Recommended Next Step:</strong> {anomaly.suggestedAction}</span>
            </div>
          </div>

          {/* 3. Entity & Metadata */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 font-bold uppercase">Entity Reference:</span>
              <p className="font-bold text-slate-900 mt-0.5 font-mono">{anomaly.entityName || anomaly.entityId}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase">Timestamp Detected:</span>
              <p className="font-bold text-slate-900 mt-0.5">{new Date(anomaly.detectedAt).toLocaleString()}</p>
            </div>
          </div>

          {/* 4. Manager Review Action Panel */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
              Manager Audit & Review Decision
            </h3>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Investigation / Review Notes
              </label>
              <textarea
                rows={2}
                placeholder="Enter manager rationale, verified voucher numbers, or physical count confirmation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => handleReview('dismiss')}
                disabled={loadingAction}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Legitimate (Dismiss)</span>
              </button>

              <button
                onClick={() => handleReview('mark_under_review')}
                disabled={loadingAction}
                className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Flag Under Review</span>
              </button>

              <button
                onClick={() => handleReview('resolve')}
                disabled={loadingAction}
                className="py-2.5 bg-[#2012ad] hover:bg-[#1a0e90] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Resolve</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

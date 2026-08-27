import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  Eye
} from 'lucide-react';
import { AiApi } from '../../../api/aiApi';
import { AnomalyDetailsModal } from './AnomalyDetailsModal';

export const AiRiskMonitoringWidget: React.FC = () => {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const res = await AiApi.getRiskSummary();
      if (res.success && res.data) {
        setRiskData(res.data);
      }
    } catch (err) {
      console.error('Failed to load risk summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const anomalies = riskData?.recentAnomalies || [];
  const filtered = anomalies.filter((a: any) => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity.toLowerCase();
  });

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'high':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
      {/* 1. Header & Severity Summary Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                AI Anomaly & Operational Risk Monitor
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-rose-100 text-rose-800 rounded-full">
                Live Auditing
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Continuous heuristic auditing for unusual discounts, stock adjustments, and operational deviations
            </p>
          </div>
        </div>

        {/* Severity Count Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterSeverity('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterSeverity === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({anomalies.length})
          </button>
          <button
            onClick={() => setFilterSeverity('CRITICAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterSeverity === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            🔴 {riskData?.criticalCount || 0} Critical
          </button>
          <button
            onClick={() => setFilterSeverity('HIGH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterSeverity === 'HIGH'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            🟠 {riskData?.highCount || 0} High
          </button>
          <button
            onClick={() => setFilterSeverity('MEDIUM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterSeverity === 'MEDIUM'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            🟡 {riskData?.mediumCount || 0} Medium
          </button>

          <button
            onClick={fetchRiskData}
            title="Re-scan Anomalies"
            className="p-2 border border-slate-200 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2012ad]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Overall Store Risk Gauge */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Overall Operational Risk Status:</span>
            <span className="px-2 py-0.5 text-[11px] font-black bg-white/15 text-amber-300 rounded-md">
              {riskData?.riskLabel || 'Calculating Risk Index...'}
            </span>
          </div>
          <p className="text-xs text-indigo-100 font-medium">
            AI has flagged {riskData?.openCount || 0} deviations requiring manager sign-off or physical audit.
          </p>
        </div>

        <div className="flex items-baseline gap-2 shrink-0 bg-white/10 px-4 py-2 rounded-xl border border-white/15">
          <span className="text-2xl font-black text-amber-300">{riskData?.overallRiskScore || 24}</span>
          <span className="text-xs font-bold text-indigo-200">/ 100 Risk Index</span>
        </div>
      </div>

      {/* 3. Anomalies List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-500">
          <div className="w-7 h-7 border-3 border-[#2012ad] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-600">Running Multi-Domain Anomaly Diagnostics...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs font-medium">
          No active anomalies found for the selected severity level.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filtered.map((item: any) => (
            <div
              key={item.id}
              className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-lg border uppercase tracking-wider ${getSeverityStyle(item.severity)}`}>
                    {item.severity} Risk
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {item.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2012ad] transition-colors leading-snug line-clamp-2">
                  {item.title}
                </h3>

                {/* Evidence Comparison Snippet */}
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Detected:</span>
                    <p className="font-bold text-rose-700 truncate">{item.evidence?.detectedValue}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Baseline:</span>
                    <p className="font-bold text-slate-700 truncate">{item.evidence?.expectedBaseline}</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                  💡 {item.aiExplanation}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(item.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <button
                  onClick={() => setSelectedAnomaly(item)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-[#2012ad] text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Investigate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Investigation & Review Modal */}
      <AnomalyDetailsModal
        anomaly={selectedAnomaly}
        isOpen={!!selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        onReviewed={fetchRiskData}
      />
    </div>
  );
};

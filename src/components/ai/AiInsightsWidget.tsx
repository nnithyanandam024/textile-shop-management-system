import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Info, 
  Flame, 
  ShieldCheck, 
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { AiApi } from '../../api/aiApi';
import { useAuth } from '../../features/auth/AuthContext';

interface AiInsightsWidgetProps {
  onOpenDetailedAnalytics?: () => void;
}

export const AiInsightsWidget: React.FC<AiInsightsWidgetProps> = ({ onOpenDetailedAnalytics }) => {
  const { currentUser } = useAuth();
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check RBAC permission for sales analytics
  const role = (currentUser?.roleName || 'Cashier').toLowerCase();
  const isAuthorized = role === 'owner' || role === 'super_admin' || role === 'manager' || currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('sales.view');

  const fetchInsights = async (targetTimeframe: 'today' | 'week' | 'month') => {
    setLoading(true);
    try {
      const res = await AiApi.getSalesInsights(targetTimeframe);
      if (res.success && res.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load proactive AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchInsights(timeframe);
    }
  }, [timeframe, isAuthorized]);

  if (!isAuthorized) return null;

  const insights = analyticsData?.insights || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md shadow-slate-100 overflow-hidden">
      {/* Widget Header Toolbar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad] shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">AI Business Insights & Pulse</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-[#2012ad] rounded-full uppercase tracking-wider">
                Proactive
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Continuous intelligence detected from live store transactions & sales velocity
            </p>
          </div>
        </div>

        {/* Timeframe Tabs & Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center p-1 bg-slate-200/60 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeframe === 'today' ? 'bg-white text-[#2012ad] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeframe === 'week' ? 'bg-white text-[#2012ad] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeframe === 'month' ? 'bg-white text-[#2012ad] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              This Month
            </button>
          </div>

          <button
            onClick={() => fetchInsights(timeframe)}
            title="Refresh Insights"
            className="p-2 text-slate-500 hover:text-[#2012ad] hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2012ad]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Insight Cards Stream */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 animate-pulse space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-24 h-4 bg-slate-200 rounded" />
                  <div className="w-16 h-3 bg-slate-200 rounded" />
                </div>
                <div className="w-3/4 h-4 bg-slate-200 rounded" />
                <div className="w-full h-3 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No anomaly or notable sales patterns detected for this timeframe.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((item: any) => {
              const type = item.type;
              let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
              let icon = <Info className="w-4 h-4 text-slate-600" />;
              let borderColor = 'border-slate-200/80 hover:border-slate-300';

              if (type === 'trend') {
                badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
                icon = <TrendingUp className="w-4 h-4 text-emerald-600" />;
                borderColor = 'border-emerald-100 hover:border-emerald-200 bg-gradient-to-br from-emerald-50/20 to-white';
              } else if (type === 'opportunity') {
                badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200/80';
                icon = <Flame className="w-4 h-4 text-amber-600" />;
                borderColor = 'border-amber-100 hover:border-amber-200 bg-gradient-to-br from-amber-50/20 to-white';
              } else if (type === 'warning') {
                badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200/80';
                icon = <AlertTriangle className="w-4 h-4 text-rose-600" />;
                borderColor = 'border-rose-100 hover:border-rose-200 bg-gradient-to-br from-rose-50/20 to-white';
              } else if (type === 'recommendation') {
                badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
                icon = <Lightbulb className="w-4 h-4 text-[#2012ad]" />;
                borderColor = 'border-indigo-100 hover:border-indigo-200 bg-gradient-to-br from-indigo-50/20 to-white';
              }

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border ${borderColor} transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between`}
                >
                  <div className="space-y-2.5">
                    {/* Badge + Metric Indicator */}
                    <div className="flex items-center justify-between gap-2">
                      <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${badgeStyle}`}>
                        {icon}
                        <span>{type}</span>
                      </div>

                      {item.metricChange && (
                        <span className="text-xs font-black text-slate-900 bg-slate-100/90 px-2 py-0.5 rounded-md">
                          {item.metricChange}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  {/* Actionable Suggestion */}
                  {item.actionableRecommendation && (
                    <div className="mt-4 pt-3 border-t border-slate-100/80">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-700 flex items-start gap-2 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item.actionableRecommendation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Action to open Deep-Dive Analytics Explorer */}
        {onOpenDetailedAnalytics && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Statistical Confidence: <strong>High</strong> (Calculated from full transactional ledger)</span>
            </div>

            <button
              onClick={onOpenDetailedAnalytics}
              className="px-4 py-2 bg-[#2012ad] hover:bg-[#1a0e90] text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 self-start sm:self-center"
            >
              <span>Explore Category Velocity & Footfall Curves</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

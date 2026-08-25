import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight, 
  ShoppingBag, 
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AiApi } from '../../api/aiApi';
import { useAuth } from '../../features/auth/AuthContext';

interface DailySummaryBannerProps {
  onOpenAnalytics?: () => void;
}

export const DailySummaryBanner: React.FC<DailySummaryBannerProps> = ({ onOpenAnalytics }) => {
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restrict banner to Owner and Manager
  const role = (currentUser?.roleName || 'Cashier').toLowerCase();
  const isAuthorized = role === 'owner' || role === 'super_admin' || role === 'manager' || currentUser?.permissions?.includes('*');

  useEffect(() => {
    if (!isAuthorized) return;

    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const res = await AiApi.getDailySummary();
        if (isMounted && res.success && res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch daily executive summary:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, [isAuthorized]);

  if (!isAuthorized) return null;

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-r from-indigo-900/90 via-[#2012ad] to-purple-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-500/20 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10" />
            <div className="space-y-2">
              <div className="w-48 h-4 bg-white/20 rounded" />
              <div className="w-64 h-3 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const isGrowthUp = summary.growthDirection === 'higher';

  return (
    <div className="w-full bg-gradient-to-r from-[#1c1093] via-[#2415be] to-[#4331e8] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-indigo-400/20 relative overflow-hidden">
      {/* Background Subtle Glowing Accents */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Summary Title & Metrics */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">AI Executive Pulse</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-400 text-slate-950 rounded-full">
                  {summary.dateFormatted}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                Today’s Store Revenue: ₹{summary.totalRevenue?.toLocaleString()}
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ml-2.5 ${
                  isGrowthUp ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                }`}>
                  {isGrowthUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {summary.growthVsYesterdayPct}% vs yesterday
                </span>
              </h3>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs pt-1">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-200" />
              <span><strong>{summary.totalTransactions}</strong> Bills</span>
              <span className="text-indigo-300">•</span>
              <span>Avg: <strong>₹{summary.averageOrderValue}</strong></span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>Top Category: <strong>{summary.topPerformingCategory}</strong></span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Best Seller: <strong>{summary.bestSellingProduct}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Key Highlight / Action Item & Trigger */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 border-white/10 pt-4 lg:pt-0">
          {summary.criticalAttentionItems?.[0] && (
            <div className="flex items-start gap-2 bg-amber-400/10 border border-amber-400/20 rounded-xl p-2.5 text-xs text-amber-100 max-w-md">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span>{summary.criticalAttentionItems[0]}</span>
            </div>
          )}

          {onOpenAnalytics && (
            <button
              onClick={onOpenAnalytics}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-[#2012ad] font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 group shrink-0"
            >
              <span>Explore Full AI Analytics</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

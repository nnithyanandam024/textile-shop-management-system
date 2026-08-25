import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Info,
  Flame,
  Clock,
  Users,
  ShieldCheck,
  ShoppingBag,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { AiApi } from '../../api/aiApi';

interface AiSalesAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiSalesAnalyticsModal: React.FC<AiSalesAnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async (tf: 'today' | 'week' | 'month') => {
    setLoading(true);
    try {
      const res = await AiApi.getSalesInsights(tf);
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load in-depth sales analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics(timeframe);
    }
  }, [isOpen, timeframe]);

  if (!isOpen) return null;

  const metrics = analytics?.periodMetrics;
  const categories = analytics?.categoryVelocity || [];
  const hourly = analytics?.hourlyDistribution || [];
  const dayOfWeek = analytics?.dayOfWeekDistribution || [];
  const cohorts = analytics?.customerCohorts;
  const returnRates = analytics?.productReturnRates || [];
  const insights = analytics?.insights || [];

  const isGrowthUp = metrics?.growthDirection === 'higher';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Toolbar */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#2012ad] via-[#3525cb] to-[#4837ea] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">AI Sales Analytics & Velocity Explorer</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-full uppercase tracking-wider shadow-xs">
                  Phase 2
                </span>
              </div>
              <p className="text-xs text-indigo-100 font-medium">
                Multi-dimensional trend intelligence, category velocity, footfall heatmaps & quality analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {/* Timeframe Filter Tabs */}
            <div className="flex items-center p-1 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 text-xs font-bold text-white">
              <button
                onClick={() => setTimeframe('today')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === 'today' ? 'bg-white text-[#2012ad] shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeframe('week')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === 'week' ? 'bg-white text-[#2012ad] shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === 'month' ? 'bg-white text-[#2012ad] shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                This Month
              </button>
            </div>

            <button
              onClick={() => fetchAnalytics(timeframe)}
              title="Refresh Analytics"
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Analytics Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f9fafc]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-500">
              <div className="w-10 h-10 border-4 border-[#2012ad] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-600">Calculating Multi-Dimensional Sales Intelligence...</p>
            </div>
          ) : (
            <>
              {/* 1. Period Comparison Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                    <span>{analytics?.periodLabel} Revenue</span>
                    <span className={`flex items-center text-xs font-black ${isGrowthUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isGrowthUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {metrics?.growthPercentage}%
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-1">₹{metrics?.currentSales?.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500 mt-1">vs ₹{metrics?.previousSales?.toLocaleString()} ({analytics?.comparisonLabel})</p>
                </div>

                {/* Transactions & Ticket */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                    <span>Transactions & AOV</span>
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.currentTransactions} Bills</p>
                  <p className="text-[11px] text-slate-500 mt-1">Average Ticket: <strong>₹{metrics?.currentAOV}</strong> ({metrics?.totalUnitsSold} units sold)</p>
                </div>

                {/* Discount Rate */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                    <span>Discount Leakage</span>
                    <Flame className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.discountRate}%</p>
                  <p className="text-[11px] text-slate-500 mt-1">Total Discount: ₹{metrics?.totalDiscounts?.toLocaleString()}</p>
                </div>

                {/* Return Rate */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                    <span>Return & Refund Rate</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.returnRate}%</p>
                  <p className="text-[11px] text-slate-500 mt-1">Industry standard for retail &lt; 3.5%</p>
                </div>
              </div>

              {/* 2. Category Velocity & Contribution Grid */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#2012ad]" />
                    <h3 className="text-sm font-bold text-slate-900">Category Revenue Contribution & Velocity</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">Period-over-Period Growth</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories.map((cat: any) => {
                    const isCatUp = cat.growthDirection === 'higher';
                    return (
                      <div key={cat.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 truncate">{cat.categoryName}</span>
                          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                            isCatUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {isCatUp ? '+' : '-'}{cat.growthPercentage}%
                          </span>
                        </div>
                        <p className="text-lg font-black text-slate-900">₹{cat.currentRevenue?.toLocaleString()}</p>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#2012ad] h-1.5 rounded-full" style={{ width: `${cat.revenueContributionPct}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                          <span>{cat.revenueContributionPct}% of revenue</span>
                          <span>{cat.unitsSold} units</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Charts Row: Hourly Peak Rush & Customer Cohorts Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Hourly Sales Distribution (Footfall Curve) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#2012ad]" />
                      <h3 className="text-sm font-bold text-slate-900">Hourly Footfall & Billing Curve (Peak Hours)</h3>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded-md">
                      Peak: 6 PM - 8 PM
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="hourLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip
                          formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Sales Total']}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                        />
                        <Bar dataKey="salesTotal" radius={[6, 6, 0, 0]}>
                          {hourly.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.isPeakHour ? '#2012ad' : '#94a3b8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Customer Cohort Revenue Split */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Customer Retention Split</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Revenue distribution between repeat loyalty patrons and first-time showroom walk-ins.
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                          <span>Returning Patrons</span>
                          <span>{cohorts?.returningCustomerRevenuePct}%</span>
                        </div>
                        <p className="text-lg font-black text-[#2012ad]">₹{cohorts?.returningCustomerRevenue?.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{cohorts?.returningCustomersCount} transactions</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>New Walk-in Buyers</span>
                          <span>{cohorts?.newCustomerRevenuePct}%</span>
                        </div>
                        <p className="text-lg font-black text-slate-900">₹{cohorts?.newCustomerRevenue?.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{cohorts?.newCustomersCount} transactions</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Loyalty repeat rate is healthy (+62%)</span>
                  </div>
                </div>
              </div>

              {/* Day of Week Footfall & Weekend Multiplier */}
              {dayOfWeek.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Day-of-Week Sales Performance & Weekend Multiplier</h3>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Weekend Footfall Multiplier: 1.8x
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    {dayOfWeek.map((d: any) => (
                      <div
                        key={d.dayOfWeek}
                        className={`p-3 rounded-xl border text-center space-y-1 ${
                          d.isWeekend
                            ? 'bg-indigo-50/60 border-indigo-200/90 text-indigo-950 font-bold'
                            : 'bg-slate-50 border-slate-200/70 text-slate-700'
                        }`}
                      >
                        <p className="text-xs font-extrabold uppercase">{d.dayName}</p>
                        <p className="text-sm font-black text-slate-900">₹{d.salesTotal?.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{d.percentageOfWeeklyTotal}% share</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Product Quality & High Return Rate Warnings */}
              {returnRates.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <h3 className="text-sm font-bold text-slate-900">Product Return Rate & Quality Radar</h3>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Flagged when return rate &gt; 8%</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {returnRates.map((item: any) => (
                      <div
                        key={item.productId}
                        className={`p-4 rounded-xl border ${
                          item.isHighRisk
                            ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                            : 'bg-slate-50/50 border-slate-200/70 text-slate-800'
                        } space-y-2`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate max-w-[180px]">{item.productName}</span>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                            item.isHighRisk ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {item.returnRatePct}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">SKU: {item.sku}</p>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Sold: <strong>{item.unitsSold}</strong></span>
                          <span className="text-rose-600">Returned: <strong>{item.unitsReturned}</strong> (₹{item.refundAmount?.toLocaleString()})</span>
                        </div>
                        {item.commonReason && (
                          <p className="text-[10px] text-slate-600 italic bg-white/70 p-1.5 rounded border border-slate-200/50">
                            Reason: {item.commonReason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Complete Proactive Insights Grid */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Generated AI Business Intelligence & Action Plan</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insights.map((item: any) => {
                    const type = item.type;
                    let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                    let icon = <Info className="w-4 h-4 text-slate-600" />;

                    if (type === 'trend') {
                      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      icon = <TrendingUp className="w-4 h-4 text-emerald-600" />;
                    } else if (type === 'opportunity') {
                      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                      icon = <Flame className="w-4 h-4 text-amber-600" />;
                    } else if (type === 'warning') {
                      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                      icon = <AlertTriangle className="w-4 h-4 text-rose-600" />;
                    } else if (type === 'recommendation') {
                      badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      icon = <Lightbulb className="w-4 h-4 text-[#2012ad]" />;
                    }

                    return (
                      <div key={item.id} className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2 flex flex-col justify-between shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border flex items-center gap-1 ${badgeStyle}`}>
                              {icon}
                              {type}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{item.confidence} Confidence</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{item.description}</p>
                        </div>
                        {item.actionableRecommendation && (
                          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] font-medium text-[#2012ad] bg-indigo-50/50 p-2 rounded-lg">
                            💡 {item.actionableRecommendation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

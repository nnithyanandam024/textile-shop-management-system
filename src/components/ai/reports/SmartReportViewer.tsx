import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  Users,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  ShoppingBag,
  Tag
} from 'lucide-react';
import { AiApi } from '../../../api/aiApi';

export const SmartReportViewer: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = async (p: 'daily' | 'weekly' | 'monthly' = period) => {
    setLoading(true);
    try {
      const res = await AiApi.getSmartReport(p);
      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch (err) {
      console.error('Failed to load smart report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    const lines = [
      ['Texora Textile ERP - Smart Executive Business Report'],
      ['Report Type', report.periodLabel],
      ['Generated At', new Date(report.generatedAt).toLocaleString()],
      [''],
      ['Metric', 'Current Period', 'Percentage Change'],
      ['Total Revenue', `₹${report.sales?.totalRevenue}`, `${report.sales?.revenueComparison?.percentageChange}%`],
      ['Transactions', report.sales?.transactionCount, `${report.sales?.transactionsComparison?.percentageChange}%`],
      ['Average Order Value', `₹${report.sales?.averageOrderValue}`, `${report.sales?.aovComparison?.percentageChange}%`],
      [''],
      ['Category Revenue Breakdown'],
      ['Category', 'Revenue (₹)', 'Share (%)'],
      ...(report.categories || []).map((c: any) => [c.categoryName, c.revenue, `${c.revenueSharePercent}%`]),
      [''],
      ['Inventory Status'],
      ['Critical Reorder Count', report.inventory?.criticalReorderCount],
      ['Monitor Buffer Count', report.inventory?.monitorBufferCount],
      ['Dead Stock Capital Tied', `₹${report.inventory?.capitalTiedInDeadStock}`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${report.id || 'Business_Report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Period Selector Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2012ad] to-[#4c3ce6] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  AI Smart Executive Business Report
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-[#2012ad] text-white rounded-full">
                  Executive Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Automated multi-domain synthesis of sales, inventory ROP, demand forecasts, customer loyalty, and operational risk
              </p>
            </div>
          </div>
        </div>

        {/* Period Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === 'daily'
                  ? 'bg-white text-[#2012ad] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Summary
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === 'weekly'
                  ? 'bg-white text-[#2012ad] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Report
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === 'monthly'
                  ? 'bg-white text-[#2012ad] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Management
            </button>
          </div>

          <button
            onClick={handlePrint}
            title="Print or Export PDF"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Export Excel / CSV"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Excel/CSV</span>
          </button>

          <button
            onClick={() => fetchReport(period)}
            title="Re-generate Report"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2012ad]' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 bg-white rounded-3xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#2012ad] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-600">
            Synthesizing Sales, Inventory, Customer Loyalty, Forecasting & Risk Data...
          </p>
        </div>
      ) : !report ? (
        <div className="py-12 text-center text-slate-400 text-xs">Failed to generate report.</div>
      ) : (
        <div className="space-y-6 print:space-y-4">
          
          {/* 2. Executive Summary Hero Card */}
          <div className="p-6 bg-gradient-to-br from-[#1b0e8a] via-[#2413b8] to-[#3a28cf] rounded-3xl text-white shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                  {report.periodLabel}
                </span>
                <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
                  Executive Business Synthesis
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-black bg-white text-[#2012ad] rounded-xl shadow-xs">
                  {report.overallHealthLabel}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-indigo-100 font-medium leading-relaxed bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
              {report.executiveSummary}
            </p>
          </div>

          {/* 3. Key Financial & Sales KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Sales */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Total Revenue</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  ₹{report.sales?.totalRevenue?.toLocaleString()}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {report.sales?.revenueComparison?.percentageChange}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">vs previous period</p>
            </div>

            {/* Total Transactions */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Transactions</span>
                <ShoppingBag className="w-4 h-4 text-[#2012ad]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {report.sales?.transactionCount?.toLocaleString()}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{report.sales?.transactionsComparison?.percentageChange}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{report.sales?.unitsSold} units billed</p>
            </div>

            {/* Average Order Value */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Avg Order Value (AOV)</span>
                <Tag className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  ₹{report.sales?.averageOrderValue?.toLocaleString()}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{report.sales?.aovComparison?.percentageChange}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Avg ticket size per customer</p>
            </div>

            {/* Customer Retention */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Repeat Customer Share</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#2012ad]">
                  {report.customers?.repeatPurchaseRatePercent}%
                </span>
                <span className="text-xs font-bold text-slate-500">of shoppers</span>
              </div>
              <p className="text-[11px] text-slate-400">{report.customers?.returningRevenueSharePercent}% of total store revenue</p>
            </div>
          </div>

          {/* 4. Category Performance & Inventory Health (Two Column) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Category Revenue Breakdown */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Category Revenue Contribution
                </h4>
                <span className="text-[11px] text-slate-400 font-bold">5 Categories</span>
              </div>

              <div className="space-y-3.5">
                {(report.categories || []).map((cat: any) => (
                  <div key={cat.categoryId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{cat.categoryName}</span>
                      <span>₹{cat.revenue?.toLocaleString()} ({cat.revenueSharePercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#2012ad] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${cat.revenueSharePercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Inventory & Dead Stock Capital Status */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Inventory Health & Capital Buffer
                </h4>
                <span className="text-[11px] text-slate-400 font-bold">165 Total SKUs</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Critical Reorder</span>
                  <p className="text-xl font-black text-rose-900 mt-0.5">{report.inventory?.criticalReorderCount} SKUs</p>
                  <span className="text-[10px] text-rose-600 mt-1 inline-block">Supply &le; lead time</span>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-800 uppercase">Monitor Buffer</span>
                  <p className="text-xl font-black text-amber-900 mt-0.5">{report.inventory?.monitorBufferCount} SKUs</p>
                  <span className="text-[10px] text-amber-700 mt-1 inline-block">Supply &le; 14 days</span>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Healthy Inventory</span>
                  <p className="text-xl font-black text-emerald-900 mt-0.5">{report.inventory?.healthyStockCount} SKUs</p>
                  <span className="text-[10px] text-emerald-700 mt-1 inline-block">Stable (&gt; 30d buffer)</span>
                </div>

                <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-800 uppercase">Dead Stock Blocked</span>
                  <p className="text-xl font-black text-purple-900 mt-0.5">₹{report.inventory?.capitalTiedInDeadStock?.toLocaleString()}</p>
                  <span className="text-[10px] text-purple-700 mt-1 inline-block">{report.inventory?.deadStockCount} stagnant SKUs</span>
                </div>
              </div>
            </div>

          </div>

          {/* 5. 30-Day Demand Forecast Projections */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2012ad]" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  AI 30-Day Category Demand Projections
                </h4>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Predictive Intelligence
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(report.forecast || []).map((f: any) => (
                <div key={f.categoryName} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-white text-[#2012ad] rounded shadow-2xs">
                      {f.confidence} Confidence
                    </span>
                    <span className={`text-xs font-black ${f.growthPercentage >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {f.growthPercentage >= 0 ? `+${f.growthPercentage}%` : `${f.growthPercentage}%`}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 pt-1">{f.categoryName}</h5>
                  <p className="text-[11px] text-slate-500 font-medium">Expected demand: ~{f.expected30DayDemandUnits} units</p>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Prioritized Recommended Action Items Checklist */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Prioritized Manager Action Items & Next Steps
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {report.actionItems?.length || 0} Action Items
              </span>
            </div>

            <div className="space-y-3">
              {(report.actionItems || []).map((item: any) => {
                const isHigh = item.priority === 'HIGH';
                const isMed = item.priority === 'MEDIUM';
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isMed
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {item.priority} Priority
                        </span>
                        <span className="text-xs font-bold text-slate-900">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">[{item.department}]</span>
                      </div>
                      <p className="text-xs text-slate-600">{item.description}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[11px] font-bold text-[#2012ad] bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 inline-block">
                        👉 {item.suggestedAction}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

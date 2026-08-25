import React from 'react';
import {
  X,
  Bot,
  TrendingUp,
  Clock,
  Truck,
  ShieldCheck,
  Package,
  Sparkles,
  FilePlus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface ProductForecastModalProps {
  forecast: any | null;
  isOpen: boolean;
  onClose: () => void;
  onCreatePurchaseDraft?: (item: any) => void;
}

export const ProductForecastModal: React.FC<ProductForecastModalProps> = ({
  forecast,
  isOpen,
  onClose,
  onCreatePurchaseDraft
}) => {
  if (!isOpen || !forecast) return null;

  const isCritical = forecast.stockRiskLevel === 'critical';
  const isMonitor = forecast.stockRiskLevel === 'monitor';
  const isDead = forecast.stockRiskLevel === 'dead_stock';

  // Prepare chart timeline data
  const chartData = forecast.demandTimeline?.map((item: any) => ({
    label: item.weekLabel,
    date: item.dateLabel,
    actual: item.actualUnits !== undefined ? item.actualUnits : null,
    projected: item.projectedUnits !== undefined ? item.projectedUnits : null,
  })) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#2012ad] via-[#3525cb] to-[#4837ea] text-white flex items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">{forecast.productName}</h2>
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                  isCritical
                    ? 'bg-rose-500 text-white'
                    : isMonitor
                    ? 'bg-amber-400 text-slate-950'
                    : isDead
                    ? 'bg-purple-600 text-white'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {forecast.stockRiskLevel?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-indigo-100 font-mono mt-0.5">
                SKU: {forecast.sku} • {forecast.categoryName} • Size: {forecast.size || 'Standard'}
              </p>
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
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] bg-[#f9fafc]">
          
          {/* Key Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Current Stock</span>
                <Package className="w-4 h-4 text-[#2012ad]" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{forecast.currentStock} Units</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Min Threshold: {forecast.minimumStock}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Days of Supply</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className={`text-2xl font-black mt-1 ${forecast.daysOfSupplyRemaining <= 7 ? 'text-rose-600' : 'text-slate-900'}`}>
                {forecast.daysOfSupplyRemaining > 90 ? '> 90d' : `${forecast.daysOfSupplyRemaining} Days`}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Velocity: ~{forecast.averageDailyDemand} units/day</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>30-Day Demand</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">~{forecast.forecast30Days} Units</p>
              <p className="text-[11px] text-slate-500 mt-0.5">7-Day Demand: ~{forecast.forecast7Days} Units</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Lead Time & ROP</span>
                <Truck className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{forecast.leadTimeDays} Days</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Reorder Point: {forecast.smartReorderPoint} units</p>
            </div>
          </div>

          {/* Demand Curve Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2012ad]" />
                <h3 className="text-sm font-bold text-slate-900">Historical Sales Series vs 4-Week AI Forecast</h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-slate-400" /> Actual Past Sales
                </span>
                <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                  <span className="w-3 h-3 rounded-full bg-[#2012ad]" /> AI Projected Demand
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2012ad" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2012ad" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="Actual Sales (Units)"
                    stroke="#64748b"
                    strokeWidth={2}
                    fill="url(#actualGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    name="AI Forecast (Units)"
                    stroke="#2012ad"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    fill="url(#projectedGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Recommendation & Action Plan Card */}
          <div className="p-5 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-indigo-50/20 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#2012ad]" />
                <h4 className="text-sm font-bold text-slate-900">AI Restock Assessment & Reasoning</h4>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Confidence: <strong className="text-slate-900 uppercase">{forecast.confidence}</strong></span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {forecast.aiExplanation}
            </p>

            <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-[#2012ad] font-semibold">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{forecast.actionableSuggestion}</span>
            </div>

            {/* Supplier & Action Button */}
            <div className="pt-3 border-t border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                <span>Supplier: <strong>{forecast.supplierName || 'Primary Mill'}</strong> • Purchase Unit Price: <strong>₹{forecast.purchasePrice?.toLocaleString()}</strong></span>
              </div>

              {forecast.recommendedOrderQuantity > 0 && (
                <button
                  onClick={() => {
                    if (onCreatePurchaseDraft) onCreatePurchaseDraft(forecast);
                    onClose();
                  }}
                  className="px-4 py-2 bg-[#2012ad] hover:bg-[#1a0e90] text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 self-start sm:self-center"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Create Purchase Draft ({forecast.recommendedOrderQuantity} units)</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Package,
  Sparkles,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { AiApi } from '../../../api/aiApi';
import { ProductForecastModal } from './ProductForecastModal';

interface AiInventoryIntelligenceProps {
  onDraftPurchaseOrder?: (variant: any) => void;
}

export const AiInventoryIntelligence: React.FC<AiInventoryIntelligenceProps> = ({ onDraftPurchaseOrder }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'MONITOR' | 'DEAD_STOCK'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedForecast, setSelectedForecast] = useState<any | null>(null);

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const res = await AiApi.getInventoryIntelligence();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load AI inventory intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const forecasts = data?.allForecasts || [];
  const deadStock = data?.deadStockList || [];

  const filteredForecasts = forecasts.filter((f: any) => {
    const matchesSearch =
      f.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.categoryName?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'CRITICAL') return f.stockRiskLevel === 'critical';
    if (filter === 'MONITOR') return f.stockRiskLevel === 'monitor';
    if (filter === 'DEAD_STOCK') return f.stockRiskLevel === 'dead_stock';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Executive Inventory Health & Capital Risk Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Reorders */}
        <div
          onClick={() => setFilter('CRITICAL')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'CRITICAL'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30'
              : 'bg-white border-slate-200/80 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Critical Reorder</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{data?.criticalReorderCount || 0}</span>
            <span className="text-xs font-semibold text-rose-600">Variants Out/Depleting</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Est. Replenishment: ₹{data?.urgentReordersEstimatedCost?.toLocaleString() || 0}</p>
        </div>

        {/* Monitor Stock */}
        <div
          onClick={() => setFilter('MONITOR')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'MONITOR'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Monitor Buffer</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{data?.monitorCount || 0}</span>
            <span className="text-xs font-semibold text-amber-600">Supply &le; 14 Days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Approaching supplier lead-time</p>
        </div>

        {/* Healthy Stock */}
        <div
          onClick={() => setFilter('ALL')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Healthy Inventory</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{data?.healthyCount || 0}</span>
            <span className="text-xs font-semibold text-emerald-600">Stable Buffer (&gt; 30d)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{data?.totalVariantsAnalyzed || 0} Total Active SKUs</p>
        </div>

        {/* Dead Stock Capital */}
        <div
          onClick={() => setFilter('DEAD_STOCK')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'DEAD_STOCK'
              ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/30'
              : 'bg-white border-slate-200/80 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Dead / Stagnant Stock</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">{data?.deadStockCount || 0}</span>
            <span className="text-xs font-semibold text-purple-600">Tied Capital</span>
          </div>
          <p className="text-[11px] text-purple-900 font-bold mt-1">₹{data?.capitalTiedInDeadStock?.toLocaleString() || 0} Blocked</p>
        </div>
      </div>

      {/* 2. Top Urgent AI Reorder Recommendations Banner */}
      {data?.topReorderRecommendations?.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-[#1c1093] to-[#3928cf] rounded-2xl text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight text-white">AI Urgent Restock Actions Needed</h3>
                <p className="text-xs text-indigo-200 font-medium">
                  Products with high sales velocity approaching imminent stockout within lead time
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-400 text-slate-950 rounded-full">
              {data.topReorderRecommendations.length} Action Items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {data.topReorderRecommendations.slice(0, 2).map((rec: any) => (
              <div key={rec.variantId} className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3">
                <div className="space-y-1 truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">{rec.productName}</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-rose-500 text-white rounded">
                      {rec.daysOfSupply}d left
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-100">
                    Stock: <strong>{rec.currentStock}</strong> • Suggested Order: <strong>{rec.suggestedReorderQuantity} units</strong> (₹{rec.estimatedCost?.toLocaleString()})
                  </p>
                </div>

                <button
                  onClick={() => {
                    const matched = forecasts.find((f: any) => f.variantId === rec.variantId);
                    if (matched) setSelectedForecast(matched);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#2012ad] text-xs font-bold rounded-lg shadow-sm shrink-0 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Forecast</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Toolbar & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'ALL' ? 'bg-[#2012ad] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All AI Forecasts ({forecasts.length})
          </button>
          <button
            onClick={() => setFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'CRITICAL' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            🔴 Reorder Needed ({data?.criticalReorderCount || 0})
          </button>
          <button
            onClick={() => setFilter('MONITOR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'MONITOR' ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            🟡 Monitor Buffer ({data?.monitorCount || 0})
          </button>
          <button
            onClick={() => setFilter('DEAD_STOCK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'DEAD_STOCK' ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            🐢 Dead Stock ({deadStock.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 w-48 sm:w-60"
            />
          </div>

          <button
            onClick={fetchIntelligence}
            title="Refresh Intelligence"
            className="p-2 border border-slate-200 text-slate-600 hover:text-[#2012ad] rounded-xl hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2012ad]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Forecast List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <div className="w-8 h-8 border-3 border-[#2012ad] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600">Simulating 30-Day Product Demand & Reorder Buffers...</p>
          </div>
        ) : filteredForecasts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No products match the selected AI filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Product & SKU</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Velocity (Rate)</th>
                  <th className="py-3.5 px-4">Days of Supply</th>
                  <th className="py-3.5 px-4">30-Day Forecast</th>
                  <th className="py-3.5 px-4">Reorder Point</th>
                  <th className="py-3.5 px-4">Status & Action</th>
                  <th className="py-3.5 px-4 text-right">Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredForecasts.map((f: any) => {
                  const isCrit = f.stockRiskLevel === 'critical';
                  const isMon = f.stockRiskLevel === 'monitor';
                  const isD = f.stockRiskLevel === 'dead_stock';

                  return (
                    <tr key={f.variantId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-snug">{f.productName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{f.sku} • {f.categoryName}</div>
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {f.currentStock} <span className="text-[10px] font-normal text-slate-500">units</span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        ~{f.averageDailyDemand} <span className="text-[10px] font-normal text-slate-500">/ day</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          f.daysOfSupplyRemaining <= 7
                            ? 'bg-rose-100 text-rose-700'
                            : f.daysOfSupplyRemaining <= 14
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {f.daysOfSupplyRemaining > 90 ? '> 90 days' : `${f.daysOfSupplyRemaining} days`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-[#2012ad]">
                        ~{f.forecast30Days} <span className="text-[10px] font-normal text-slate-500">units</span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {f.smartReorderPoint} <span className="text-[10px] text-slate-500">ROP</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          isCrit
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isMon
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : isD
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {f.stockRiskLevel?.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedForecast(f)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-[#2012ad] text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Forecast</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Drill-Down Product Demand Forecast Modal */}
      <ProductForecastModal
        forecast={selectedForecast}
        isOpen={!!selectedForecast}
        onClose={() => setSelectedForecast(null)}
        onCreatePurchaseDraft={(item) => {
          if (onDraftPurchaseOrder) onDraftPurchaseOrder(item);
        }}
      />
    </div>
  );
};

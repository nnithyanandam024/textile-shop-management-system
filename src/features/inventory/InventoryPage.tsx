import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, AlertCircle, CheckCircle2, Search, RefreshCw, Layers, History, LayoutGrid, List, Sparkles } from 'lucide-react';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { StockHistoryModal } from './StockHistoryModal';
import { AiInventoryIntelligence } from '../../components/ai/inventory/AiInventoryIntelligence';

interface Variant {
  id: number;
  product_id: number;
  product_name?: string;
  category_name?: string;
  brand_name?: string;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  purchase_price: number;
  selling_price: number;
  minimum_stock: number;
  current_stock: number;
  is_active: number;
}

interface Metrics {
  totalVariants: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const InventoryPage: React.FC = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalVariants: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW' | 'OUT' | 'AI_FORECAST'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [selectedVariantForAdjust, setSelectedVariantForAdjust] = useState<Variant | null>(null);
  const [selectedVariantForHistory, setSelectedVariantForHistory] = useState<Variant | null>(null);
  const [showFullHistory, setShowFullHistory] = useState<boolean>(false);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.inventory) {
        const vList = await window.api.variants.getAll();
        const mData = await window.api.inventory.getMetrics();
        setVariants(vList);
        setMetrics(mData);
      }
    } catch (err) {
      console.error('Failed to fetch inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const filteredVariants = variants.filter((v) => {
    const matchesSearch =
      (v.product_name && v.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.barcode && v.barcode.includes(searchTerm)) ||
      (v.color && v.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.size && v.size.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'LOW') {
      return v.current_stock > 0 && v.current_stock <= v.minimum_stock;
    }
    if (activeTab === 'OUT') {
      return v.current_stock === 0;
    }
    return true;
  });

  const getStatusBadge = (current: number, min: number) => {
    if (current === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <AlertCircle className="w-3 h-3" />
          Out of Stock
        </span>
      );
    }
    if (current <= min) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3" />
          Low ({current}/{min})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
        <CheckCircle2 className="w-3 h-3" />
        Normal
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2012ad]">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Inventory & Stock Movements</h1>
            <p className="text-xs font-medium text-slate-500">Track real-time stock levels, low stock alerts, and audit ledgers</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFullHistory(true)}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center gap-2"
          >
            <History className="w-4 h-4 text-[#2012ad]" />
            <span>Full Audit Ledger</span>
          </button>
          <button
            onClick={fetchInventoryData}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Variants</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalVariants}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-[#2012ad] rounded-2xl flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stock Units</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalStockUnits}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{metrics.lowStockCount}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Out of Stock</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{metrics.outOfStockCount}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs, Search & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'ALL' ? 'bg-white text-[#2012ad] shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Stock Items ({metrics.totalVariants})
          </button>
          <button
            onClick={() => setActiveTab('LOW')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'LOW' ? 'bg-white text-amber-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Low Stock ({metrics.lowStockCount})
          </button>
          <button
            onClick={() => setActiveTab('OUT')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'OUT' ? 'bg-white text-red-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Out of Stock ({metrics.outOfStockCount})
          </button>
          <button
            onClick={() => setActiveTab('AI_FORECAST')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'AI_FORECAST'
                ? 'bg-gradient-to-r from-[#2012ad] to-[#4331e8] text-white shadow-sm font-bold'
                : 'text-indigo-700 hover:text-indigo-900 font-semibold'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>🤖 AI Demand & Reorder</span>
          </button>
        </div>

        {/* Live Search & View Mode Switcher */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search SKU, Barcode, Product..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-[#2012ad] shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-[#2012ad] shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Display: AI Demand Forecasting Tab vs Normal Stock Tables */}
      {activeTab === 'AI_FORECAST' ? (
        <AiInventoryIntelligence />
      ) : loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-[#2012ad] mx-auto mb-2" />
          <span className="text-sm font-medium">Loading inventory data...</span>
        </div>
      ) : filteredVariants.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Inventory Items Found</h3>
          <p className="text-xs text-slate-400 mt-1">Try switching tabs or adjusting search term.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVariants.map((v) => {
            const stockPercent = Math.min(100, Math.round((v.current_stock / (v.minimum_stock * 2 || 10)) * 100));
            const isOut = v.current_stock === 0;
            const isLow = v.current_stock > 0 && v.current_stock <= v.minimum_stock;

            return (
              <div
                key={v.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* SKU & Status Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold text-[11px] rounded-lg border border-slate-200/60">
                      {v.sku}
                    </span>
                    {getStatusBadge(v.current_stock, v.minimum_stock)}
                  </div>

                  {/* Product Title */}
                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-[#2012ad] transition-colors mt-1">
                    {v.product_name}
                  </h3>

                  {/* Category & Brand Subtitle */}
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    {v.category_name || 'General'} • {v.brand_name || 'Generic'}
                  </p>

                  {/* Color & Size Tag */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {v.color && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50/70 text-[#2012ad] border border-indigo-100/60">
                        {v.color}
                      </span>
                    )}
                    {v.size && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                        {v.size}
                      </span>
                    )}
                  </div>

                  {/* Stock Level Gauge / Visual Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In-Stock</span>
                      <span className={`font-extrabold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                        {v.current_stock} Units
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOut ? 'bg-red-500 w-full opacity-40' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: isOut ? '100%' : `${Math.max(8, stockPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-medium">
                      <span>Min threshold: {v.minimum_stock}</span>
                      <span>Barcode: {v.barcode || '—'}</span>
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Selling Price</span>
                      <span className="font-extrabold text-[#2012ad] text-sm">₹{v.selling_price.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-400 block">Purchase Cost</span>
                      <span className="font-semibold text-slate-600">₹{v.purchase_price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedVariantForAdjust(v)}
                    className="flex-1 py-2 bg-[#2012ad] hover:bg-[#1a0e91] active:bg-[#150b74] text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => setSelectedVariantForHistory(v)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all shrink-0"
                    title="View Variant Audit History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6 w-[20%]">SKU / Barcode</th>
                  <th className="py-3.5 px-6 w-[24%]">Product Name</th>
                  <th className="py-3.5 px-6 w-[16%]">Color / Size</th>
                  <th className="py-3.5 px-6 w-[12%]">Selling Price</th>
                  <th className="py-3.5 px-6 w-[12%]">Current In-Stock</th>
                  <th className="py-3.5 px-6 w-[12%]">Stock Status</th>
                  <th className="py-3.5 px-6 w-[16%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredVariants.map((v) => (
                  <tr key={v.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div>{v.sku}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{v.barcode || 'No Barcode'}</div>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      <div className="line-clamp-1">{v.product_name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{v.category_name}</div>
                    </td>
                    <td className="py-4 px-6 text-xs font-medium text-slate-700 whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{v.color || '—'}</span> / {v.size || '—'}
                    </td>
                    <td className="py-4 px-6 font-bold text-[#2012ad] whitespace-nowrap">₹{v.selling_price.toLocaleString()}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`text-sm font-extrabold ${v.current_stock === 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {v.current_stock} units
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">{getStatusBadge(v.current_stock, v.minimum_stock)}</td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedVariantForAdjust(v)}
                          className="px-3.5 py-1.5 bg-[#2012ad] hover:bg-[#1a0e91] active:bg-[#150b74] text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                        >
                          Adjust Stock
                        </button>
                        <button
                          onClick={() => setSelectedVariantForHistory(v)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all inline-flex items-center justify-center shadow-2xs"
                          title="View Variant Audit History"
                        >
                          <History className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={!!selectedVariantForAdjust}
        variant={selectedVariantForAdjust}
        onClose={() => setSelectedVariantForAdjust(null)}
        onSuccess={() => fetchInventoryData()}
      />

      {/* Single Variant History Modal */}
      <StockHistoryModal
        isOpen={!!selectedVariantForHistory}
        variantId={selectedVariantForHistory?.id}
        sku={selectedVariantForHistory?.sku}
        onClose={() => setSelectedVariantForHistory(null)}
      />

      {/* Full Audit History Modal */}
      <StockHistoryModal
        isOpen={showFullHistory}
        onClose={() => setShowFullHistory(false)}
      />
    </div>
  );
};

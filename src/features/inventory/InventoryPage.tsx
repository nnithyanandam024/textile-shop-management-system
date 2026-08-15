import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, AlertCircle, CheckCircle2, Search, RefreshCw, Layers, History } from 'lucide-react';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { StockHistoryModal } from './StockHistoryModal';

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
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
          <AlertCircle className="w-3.5 h-3.5" />
          OUT OF STOCK
        </span>
      );
    }
    if (current <= min) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5" />
          LOW STOCK ({current}/{min})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        NORMAL
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2818cf]">
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
            <History className="w-4 h-4 text-[#2818cf]" />
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
          <div className="w-12 h-12 bg-indigo-50 text-[#2818cf] rounded-2xl flex items-center justify-center">
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

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ALL' ? 'bg-white text-[#2818cf] shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Stock Items ({metrics.totalVariants})
          </button>
          <button
            onClick={() => setActiveTab('LOW')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'LOW' ? 'bg-white text-amber-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚠ Low Stock ({metrics.lowStockCount})
          </button>
          <button
            onClick={() => setActiveTab('OUT')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'OUT' ? 'bg-white text-red-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Out of Stock ({metrics.outOfStockCount})
          </button>
        </div>

        {/* Live Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKU, Barcode, Product Name, Size, Color..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2818cf]"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2818cf] mx-auto mb-2" />
            <span className="text-sm font-medium">Loading inventory data...</span>
          </div>
        ) : filteredVariants.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Inventory Items Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try switching tabs or adjusting search term.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">SKU / Barcode</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Color / Size</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Current In-Stock</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredVariants.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">
                    <div>{v.sku}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{v.barcode || 'No Barcode'}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    <div>{v.product_name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{v.category_name}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">
                    {v.color || '—'} / {v.size || '—'}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">₹{v.selling_price}</td>
                  <td className="px-6 py-4">
                    <span className={`text-base font-extrabold ${v.current_stock === 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {v.current_stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(v.current_stock, v.minimum_stock)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedVariantForAdjust(v)}
                      className="px-3 py-1.5 bg-[#2818cf] hover:bg-[#2012ad] text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                    >
                      Adjust Stock
                    </button>
                    <button
                      onClick={() => setSelectedVariantForHistory(v)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-all"
                      title="View Variant History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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

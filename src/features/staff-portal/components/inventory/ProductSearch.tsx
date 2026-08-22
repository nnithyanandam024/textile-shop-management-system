import React from 'react';
import { Search, Barcode, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { StockStatusType } from '../../services/staffInventoryService';

interface ProductSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  statusFilter: 'ALL' | StockStatusType;
  onStatusFilterChange: (status: 'ALL' | StockStatusType) => void;
  totalResults: number;
  searching?: boolean;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  totalResults,
  searching,
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4 select-none">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by Product Name, SKU, Barcode, Category, Color, Size..."
          className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf] transition-all"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
          <Barcode className="w-5 h-5" />
        </div>
      </div>

      {/* Filter Tabs & Results Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-[#2818cf] text-white shadow-md shadow-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stock
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('IN_STOCK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              statusFilter === 'IN_STOCK'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>In Stock</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('LOW_STOCK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              statusFilter === 'LOW_STOCK'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('OUT_OF_STOCK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              statusFilter === 'OUT_OF_STOCK'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Out of Stock</span>
          </button>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {searching ? (
            <span className="text-[#2818cf]">Searching items...</span>
          ) : (
            <span>Showing <strong className="text-slate-900">{totalResults}</strong> matching {totalResults === 1 ? 'item' : 'items'}</span>
          )}
        </div>
      </div>
    </div>
  );
};

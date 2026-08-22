import React from 'react';
import { Search, Barcode, RotateCw } from 'lucide-react';

interface POSProductSearchProps {
  query: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  searching?: boolean;
}

export const POSProductSearch: React.FC<POSProductSearchProps> = ({
  query,
  onSearchChange,
  onRefresh,
  searching,
}) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3 select-none">
      {/* Search & Barcode Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by Product Name, SKU, Color, Size, or Scan Barcode..."
          className="w-full pl-11 pr-24 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[#2012ad] text-[10px] font-extrabold font-mono pointer-events-none">
          <Barcode className="w-3.5 h-3.5" />
          <span>Scanner Ready</span>
        </div>
      </div>

      {/* Refresh Catalog Button */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={searching}
        className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-slate-600 hover:text-slate-900 transition-colors shrink-0"
        title="Refresh Product Catalog"
      >
        <RotateCw className={`w-4 h-4 ${searching ? 'animate-spin text-[#2012ad]' : ''}`} />
      </button>
    </div>
  );
};

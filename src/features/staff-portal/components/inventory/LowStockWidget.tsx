import React from 'react';
import { StaffProductListItem } from '../../services/staffInventoryService';
import { AlertTriangle, ClipboardCheck, ArrowRight } from 'lucide-react';

interface LowStockWidgetProps {
  lowStockItems: StaffProductListItem[];
  onCountStock: (product: StaffProductListItem) => void;
  onViewAll: () => void;
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({
  lowStockItems,
  onCountStock,
  onViewAll,
}) => {
  if (lowStockItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50/50 rounded-3xl p-5 sm:p-6 border border-amber-200/80 shadow-xs space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-amber-950 tracking-tight">
              Low Stock Warnings & Reorder Alerts
            </h3>
            <p className="text-[11px] font-semibold text-amber-800/80">
              {lowStockItems.length} {lowStockItems.length === 1 ? 'product' : 'products'} at or below minimum threshold
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-amber-900 hover:text-amber-700 flex items-center gap-1 transition-colors"
        >
          <span>Filter Low Stock</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Items Scroll/List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {lowStockItems.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-white/90 rounded-2xl border border-amber-200/60 shadow-xs flex items-center justify-between gap-3"
          >
            <div className="space-y-0.5 min-w-0">
              <h4 className="font-extrabold text-slate-900 line-clamp-1">{item.productName}</h4>
              <p className="text-[11px] text-slate-500 font-mono">
                {item.sku} {item.color ? `• ${item.color}` : ''}
              </p>
              <p className="text-[10px] font-bold text-amber-700">
                Min Level: {item.minimumStock} pcs
              </p>
            </div>

            <div className="text-right shrink-0 space-y-1.5">
              <strong className="text-base font-extrabold text-amber-600 font-mono block">
                {item.currentStock} pcs
              </strong>
              <button
                type="button"
                onClick={() => onCountStock(item)}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-extrabold transition-all inline-flex items-center gap-1"
              >
                <ClipboardCheck className="w-3 h-3" />
                <span>Count</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

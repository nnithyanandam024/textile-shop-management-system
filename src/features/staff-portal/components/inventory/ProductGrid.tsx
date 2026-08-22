import React from 'react';
import { StaffProductListItem } from '../../services/staffInventoryService';
import { Package, Eye, ClipboardCheck, ArrowRightLeft } from 'lucide-react';

interface ProductGridProps {
  products: StaffProductListItem[];
  onViewDetails: (variantId: number) => void;
  onCountStock: (product: StaffProductListItem) => void;
  onTransfer: (product: StaffProductListItem) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onViewDetails,
  onCountStock,
  onTransfer,
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-800">No matching products found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto font-semibold">
          Try adjusting your search criteria, checking the SKU or barcode, or changing the stock filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 select-none">
      {products.map((p) => {
        const isLowStock = p.status === 'LOW_STOCK';
        const isOutOfStock = p.status === 'OUT_OF_STOCK';

        return (
          <div
            key={p.id}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            {/* Top Row: Category & Status Badge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-700 uppercase tracking-wider">
                  {p.categoryName || 'General'}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    isOutOfStock
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isLowStock
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                </span>
              </div>

              {/* Product Title */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                  {p.productName}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-semibold font-mono">
                  <span>SKU: {p.sku}</span>
                  {p.barcode && <span className="text-slate-400">| #{p.barcode}</span>}
                </div>
              </div>

              {/* Attributes Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                {p.brandName && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600 font-bold">
                    {p.brandName}
                  </span>
                )}
                {p.color && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50/60 border border-indigo-100 text-indigo-700 font-bold">
                    {p.color}
                  </span>
                )}
                {p.size && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-50/60 border border-purple-100 text-purple-700 font-bold">
                    {p.size}
                  </span>
                )}
              </div>
            </div>

            {/* Middle Row: Stock Level & Price */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Stock
                </span>
                <div className="flex items-baseline gap-1.5">
                  <strong className="text-lg font-extrabold text-slate-900 font-mono">
                    {p.currentStock}
                  </strong>
                  <span className="text-xs font-semibold text-slate-500">pcs</span>
                  {isLowStock && (
                    <span className="text-[10px] font-extrabold text-amber-600">
                      (Min: {p.minimumStock})
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Price
                </span>
                <strong className="text-base font-extrabold text-[#2818cf] font-mono">
                  ₹{p.sellingPrice.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Bottom Row: Actions */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onViewDetails(p.id)}
                className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                title="View Full Details"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Details</span>
              </button>

              <button
                type="button"
                onClick={() => onCountStock(p)}
                className="px-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#2818cf] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                title="Count Stock"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Count</span>
              </button>

              <button
                type="button"
                onClick={() => onTransfer(p)}
                disabled={p.currentStock <= 0}
                className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Request Transfer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Transfer</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

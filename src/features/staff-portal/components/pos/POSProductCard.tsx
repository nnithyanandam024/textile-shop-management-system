import React from 'react';
import { StaffPOSProductItem } from '../../services/staffPOSService';
import { Plus } from 'lucide-react';

interface POSProductCardProps {
  product: StaffPOSProductItem;
  onAddToCart: (product: StaffPOSProductItem) => void;
}

export const POSProductCard: React.FC<POSProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = product.status === 'OUT_OF_STOCK';
  const isLowStock = product.status === 'LOW_STOCK';

  return (
    <div
      onClick={() => !isOutOfStock && onAddToCart(product)}
      className={`bg-white rounded-2xl p-4 border border-slate-200/80 transition-all flex flex-col justify-between space-y-3 select-none ${
        isOutOfStock
          ? 'opacity-50 cursor-not-allowed bg-slate-50/50'
          : 'hover:border-[#2012ad] hover:shadow-md cursor-pointer group'
      }`}
    >
      {/* Top Details */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100 text-slate-600 uppercase tracking-wider">
            {product.categoryName || 'Saree'}
          </span>

          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
              isOutOfStock
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isLowStock
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : `${product.currentStock} in stock`}
          </span>
        </div>

        <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1 group-hover:text-[#2012ad] transition-colors">
          {product.productName}
        </h4>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <span>{product.sku}</span>
          {product.color && <span className="text-slate-400">• {product.color}</span>}
          {product.size && <span className="text-slate-400">• {product.size}</span>}
        </div>
      </div>

      {/* Bottom Price & Add Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Price
          </span>
          <strong className="text-sm font-extrabold text-[#2012ad] font-mono">
            ₹{product.sellingPrice.toLocaleString('en-IN')}
          </strong>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="p-1.5 bg-indigo-50 hover:bg-[#2012ad] text-[#2012ad] hover:text-white rounded-xl transition-all shadow-xs group-hover:bg-[#2012ad] group-hover:text-white disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

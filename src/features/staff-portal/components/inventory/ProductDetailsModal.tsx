import React from 'react';
import { StaffProductDetailsItem } from '../../services/staffInventoryService';
import { X, Package, ClipboardCheck, ArrowRightLeft, Clock } from 'lucide-react';

interface ProductDetailsModalProps {
  product: StaffProductDetailsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCountStock: (product: StaffProductDetailsItem) => void;
  onTransfer: (product: StaffProductDetailsItem) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onCountStock,
  onTransfer,
}) => {
  if (!isOpen || !product) return null;

  const isLowStock = product.status === 'LOW_STOCK';
  const isOutOfStock = product.status === 'OUT_OF_STOCK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200/80 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">{product.productName}</h3>
              <p className="text-xs font-semibold text-slate-500 font-mono">
                SKU: {product.sku} {product.barcode ? `| Barcode: ${product.barcode}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar text-xs">
          {/* Stock Availability Hero Badge */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Stock Availability
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <strong className="text-2xl font-extrabold text-slate-900 font-mono">
                  {product.currentStock}
                </strong>
                <span className="text-xs font-bold text-slate-500">Pieces in Main Shop</span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  isOutOfStock
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : isLowStock
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock Alert' : 'In Stock'}
              </span>
              <p className="text-[10px] font-bold text-slate-400">Reorder Threshold: {product.minimumStock} pcs</p>
            </div>
          </div>

          {/* Product Specifications Matrix */}
          <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</span>
              <p className="font-extrabold text-slate-900 mt-0.5">{product.categoryName || 'General Category'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Brand / Label</span>
              <p className="font-extrabold text-slate-900 mt-0.5">{product.brandName || 'In-House'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Color & Pattern</span>
              <p className="font-extrabold text-slate-900 mt-0.5">
                {product.color || 'Standard'} {product.pattern ? `(${product.pattern})` : ''}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Size Specification</span>
              <p className="font-extrabold text-slate-900 mt-0.5">{product.size || 'Free Size'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fabric Material</span>
              <p className="font-bold text-slate-700 mt-0.5">{product.material || 'Cotton Fabric'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selling Price</span>
              <p className="font-extrabold text-[#2012ad] font-mono text-sm mt-0.5">
                ₹{product.sellingPrice.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Recent Stock Movement History */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Recent Stock Movement Audit</span>
            </h4>

            {product.recentMovements.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 rounded-xl text-slate-400 font-semibold">
                No recent stock movements recorded for this variant.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {product.recentMovements.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-50/50 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">{m.transactionType}</span>
                        <span className="text-[10px] text-slate-400">{m.createdAt}</span>
                      </div>
                      {m.notes && <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{m.notes}</p>}
                    </div>

                    <div className="text-right font-mono font-extrabold">
                      <span className={m.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {m.quantity >= 0 ? `+${m.quantity}` : m.quantity} pcs
                      </span>
                      <p className="text-[10px] text-slate-400">({m.previousQuantity} → {m.newQuantity})</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onCountStock(product);
              }}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#2012ad] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Count Stock</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onTransfer(product);
              }}
              disabled={product.currentStock <= 0}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Request Transfer</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

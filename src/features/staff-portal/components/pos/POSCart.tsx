import React from 'react';
import { StaffPOSCartItem } from '../../services/staffPOSService';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

interface POSCartProps {
  cart: StaffPOSCartItem[];
  onUpdateQuantity: (variantId: number, qty: number) => void;
  onRemoveItem: (variantId: number) => void;
  onClearCart: () => void;
}

export const POSCart: React.FC<POSCartProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center space-y-3 select-none">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2818cf] flex items-center justify-center mx-auto">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-slate-800">Shopping Cart is Empty</h4>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">
            Scan an item barcode or click a product from the catalog to start billing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-900">Current Cart Items</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2818cf]/10 text-[#2818cf]">
            {cart.reduce((sum, i) => sum + i.quantity, 0)} units
          </span>
        </div>

        <button
          type="button"
          onClick={onClearCart}
          className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
        >
          Clear Cart
        </button>
      </div>

      {/* Cart Items List */}
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar p-1">
        {cart.map((item) => (
          <div key={item.variantId} className="p-3.5 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-3">
            {/* Item Title & Specs */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <h5 className="text-xs font-extrabold text-slate-900 truncate">{item.productName}</h5>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <span>{item.sku}</span>
                {item.color && <span>• {item.color}</span>}
                {item.size && <span>• {item.size}</span>}
              </div>
              <div className="text-[10px] font-bold text-slate-600 font-mono">
                ₹{item.unitPrice.toLocaleString('en-IN')} each
              </div>
            </div>

            {/* Stepper & Line Total */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Stepper */}
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                  className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Decrease Quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-2.5 text-xs font-extrabold text-slate-900 font-mono">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                  disabled={item.quantity >= item.availableStock}
                  className="p-1 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-30"
                  title="Increase Quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Line Price */}
              <div className="text-right min-w-16">
                <div className="text-xs font-extrabold text-slate-900 font-mono">
                  ₹{item.lineTotal.toLocaleString('en-IN')}
                </div>
                {item.lineDiscount > 0 && (
                  <span className="text-[9px] font-bold text-emerald-600 block">
                    -₹{item.lineDiscount}
                  </span>
                )}
              </div>

              {/* Delete Item */}
              <button
                type="button"
                onClick={() => onRemoveItem(item.variantId)}
                className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remove Item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

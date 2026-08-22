import React from 'react';
import { PauseCircle, ArrowRight, Layers } from 'lucide-react';

interface POSCartSummaryProps {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemsCount: number;
  heldCount: number;
  onHoldSale: () => void;
  onOpenPaymentModal: () => void;
  onOpenHeldModal: () => void;
}

export const POSCartSummary: React.FC<POSCartSummaryProps> = ({
  subtotal,
  discount,
  tax,
  total,
  itemsCount,
  heldCount,
  onHoldSale,
  onOpenPaymentModal,
  onOpenHeldModal,
}) => {
  const isCartEmpty = itemsCount === 0;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 select-none">
      {/* Price breakdown */}
      <div className="space-y-2 text-xs border-b border-slate-100 pb-3.5">
        <div className="flex items-center justify-between text-slate-600 font-semibold">
          <span>Subtotal ({itemsCount} items)</span>
          <span className="font-extrabold text-slate-900 font-mono">
            ₹{subtotal.toLocaleString('en-IN')}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-emerald-600 font-semibold">
            <span>Discount Applied</span>
            <span className="font-extrabold font-mono">
              -₹{discount.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-600 font-semibold">
          <span>Tax / GST</span>
          <span className="font-extrabold text-slate-900 font-mono">
            +₹{tax.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Net Payable */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Net Payable Total
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            ₹{total.toLocaleString('en-IN')}
          </span>
        </div>

        {heldCount > 0 && (
          <button
            type="button"
            onClick={onOpenHeldModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-extrabold hover:bg-amber-100 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>{heldCount} Held</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <button
          type="button"
          disabled={isCartEmpty}
          onClick={onHoldSale}
          className="col-span-1 py-3 px-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
        >
          <PauseCircle className="w-4 h-4 text-slate-400" />
          <span>Hold</span>
        </button>

        <button
          type="button"
          disabled={isCartEmpty}
          onClick={onOpenPaymentModal}
          className="col-span-2 py-3 px-4 rounded-2xl bg-[#2012ad] hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-40"
        >
          <span>Proceed to Pay</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

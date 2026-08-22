import React from 'react';
import { Tag, ShieldAlert } from 'lucide-react';

interface POSDiscountPanelProps {
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  onDiscountTypeChange: (type: 'PERCENT' | 'FIXED') => void;
  onDiscountValueChange: (val: number) => void;
  subtotal: number;
}

export const POSDiscountPanel: React.FC<POSDiscountPanelProps> = ({
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  subtotal,
}) => {
  const calculatedDiscount =
    discountType === 'PERCENT'
      ? Math.round((subtotal * discountValue) / 100)
      : Math.min(discountValue, subtotal);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3 select-none">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#2012ad]" />
          <span>Bill Discount</span>
        </label>

        {/* Type Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[10px] font-extrabold">
          <button
            type="button"
            onClick={() => onDiscountTypeChange('PERCENT')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              discountType === 'PERCENT'
                ? 'bg-white text-[#2012ad] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            % Percent
          </button>
          <button
            type="button"
            onClick={() => onDiscountTypeChange('FIXED')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              discountType === 'FIXED'
                ? 'bg-white text-[#2012ad] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ₹ Fixed
          </button>
        </div>
      </div>

      {/* Discount Input & Live Preview */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="number"
            min="0"
            max={discountType === 'PERCENT' ? 100 : subtotal}
            value={discountValue || ''}
            onChange={(e) => onDiscountValueChange(Math.max(0, Number(e.target.value)))}
            placeholder="0"
            className="w-full pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] transition-all font-mono"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
            {discountType === 'PERCENT' ? '%' : '₹'}
          </span>
        </div>

        <div className="px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-right min-w-28">
          <span className="text-[9px] font-bold text-emerald-700 block uppercase tracking-wider">
            Savings
          </span>
          <span className="text-xs font-extrabold text-emerald-800 font-mono">
            -₹{calculatedDiscount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
        <ShieldAlert className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Floor staff discount is policy-capped at 5% max.</span>
      </div>
    </div>
  );
};

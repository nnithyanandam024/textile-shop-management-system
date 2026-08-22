import React, { useState, useEffect } from 'react';
import { StaffProductListItem, StaffProductDetailsItem } from '../../services/staffInventoryService';
import { X, ClipboardCheck, AlertCircle, ShieldAlert } from 'lucide-react';

interface StockCountModalProps {
  product: StaffProductListItem | StaffProductDetailsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitCount: (input: {
    product_variant_id: number;
    physical_quantity: number;
    reason: string;
    location_name?: string;
  }) => Promise<any>;
}

export const StockCountModal: React.FC<StockCountModalProps> = ({
  product,
  isOpen,
  onClose,
  onSubmitCount,
}) => {
  const [physicalQty, setPhysicalQty] = useState<number>(0);
  const [reason, setReason] = useState('Periodic Shelf Audit');
  const [customNotes, setCustomNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setPhysicalQty(product.currentStock);
      setReason('Periodic Shelf Audit');
      setCustomNotes('');
      setError(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const systemQty = product.currentStock;
  const difference = physicalQty - systemQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (physicalQty < 0) {
      setError('Physical quantity cannot be negative.');
      return;
    }

    const finalReason = customNotes.trim() ? `${reason}: ${customNotes.trim()}` : reason;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmitCount({
        product_variant_id: product.id,
        physical_quantity: physicalQty,
        reason: finalReason,
        location_name: product.locationName || 'Main Shop',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit stock count.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Physical Stock Count</h3>
              <p className="text-xs font-semibold text-slate-500 font-mono">
                {product.productName} ({product.sku})
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Comparison Matrix */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                System Quantity
              </span>
              <p className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                {systemQty} <span className="text-xs font-semibold text-slate-500">pcs</span>
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Difference
              </span>
              <p
                className={`text-2xl font-extrabold font-mono mt-0.5 ${
                  difference === 0
                    ? 'text-emerald-600'
                    : difference < 0
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              >
                {difference === 0 ? '0' : difference > 0 ? `+${difference}` : difference}{' '}
                <span className="text-xs font-semibold text-slate-500">pcs</span>
              </p>
            </div>
          </div>

          {/* Physical Count Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              Verified Physical Quantity on Shelf <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              value={physicalQty}
              onChange={(e) => setPhysicalQty(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            />
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              Reason / Observation Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            >
              <option value="Periodic Shelf Audit">Periodic Shelf Audit</option>
              <option value="Damaged / Defective Garment">Damaged / Defective Garment</option>
              <option value="Missing / Unaccounted Discrepancy">Missing / Unaccounted Discrepancy</option>
              <option value="Mislabeled Tag / Wrong SKU">Mislabeled Tag / Wrong SKU</option>
              <option value="Customer Return Replacement">Customer Return Replacement</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Custom Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              Additional Notes & Shelf Location
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Aisle 3, Rack B — Box found unsealed"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            />
          </div>

          {/* Safety Rule Callout */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-[11px] font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Submitting this count creates a pending adjustment verification. Live inventory quantities will not change until authorized by a manager.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Count for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { StaffProductListItem, StaffProductDetailsItem } from '../../services/staffInventoryService';
import { X, ArrowRightLeft, AlertCircle, ShieldAlert } from 'lucide-react';

interface StockMovementModalProps {
  product: StaffProductListItem | StaffProductDetailsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitTransfer: (input: {
    product_variant_id: number;
    from_location: string;
    to_location: string;
    quantity: number;
    reason: string;
  }) => Promise<any>;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  product,
  isOpen,
  onClose,
  onSubmitTransfer,
}) => {
  const [fromLocation, setFromLocation] = useState('Main Shop');
  const [toLocation, setToLocation] = useState('Warehouse');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Branch replenishment');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFromLocation('Main Shop');
      setToLocation('Warehouse');
      setQuantity(Math.min(1, product.currentStock));
      setReason('Branch replenishment');
      setError(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Transfer quantity must be at least 1.');
      return;
    }
    if (quantity > product.currentStock) {
      setError(`Cannot transfer more than available stock (${product.currentStock} pcs).`);
      return;
    }
    if (fromLocation.trim().toLowerCase() === toLocation.trim().toLowerCase()) {
      setError('Source and destination locations cannot be identical.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmitTransfer({
        product_variant_id: product.id,
        from_location: fromLocation,
        to_location: toLocation,
        quantity,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit transfer request.');
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
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Stock Transfer Request</h3>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Stock Banner */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <span className="font-bold text-slate-600">Available Stock for Transfer:</span>
            <strong className="text-sm font-extrabold text-[#2818cf] font-mono">
              {product.currentStock} pcs
            </strong>
          </div>

          {/* From & To Location Matrix */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700">From Location</label>
              <select
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="Main Shop">Main Shop</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Branch 02">Branch 02</option>
                <option value="Floor Rack A">Floor Rack A</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700">To Destination</label>
              <select
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="Warehouse">Warehouse</option>
                <option value="Branch 02">Branch 02</option>
                <option value="Main Shop">Main Shop</option>
                <option value="Front Display Rack">Front Display Rack</option>
              </select>
            </div>
          </div>

          {/* Transfer Quantity */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              Quantity to Transfer <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={product.currentStock}
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            />
          </div>

          {/* Transfer Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              Transfer Purpose / Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Replenish Branch 02 weekend showcase display"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            />
          </div>

          {/* Safety Notice */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-[11px] font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Transfer requests are submitted to management for approval and stock reservation before dispatch.
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
              className="px-4 py-2 bg-[#2818cf] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Request Stock Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

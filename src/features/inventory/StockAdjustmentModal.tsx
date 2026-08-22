import React, { useState } from 'react';
import { X, Boxes, AlertCircle, Loader2 } from 'lucide-react';

interface VariantRow {
  id: number;
  product_name?: string;
  sku: string;
  color?: string;
  size?: string;
  current_stock: number;
}

interface StockAdjustmentModalProps {
  isOpen: boolean;
  variant: VariantRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  variant,
  onClose,
  onSuccess,
}) => {
  const [actionType, setActionType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [movementType, setMovementType] = useState<'ADJUSTMENT' | 'DAMAGE' | 'PURCHASE' | 'RETURN'>('ADJUSTMENT');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen || !variant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (!notes.trim()) {
      setError('Please enter a reason or notes for this stock movement.');
      return;
    }

    const qtyChange = actionType === 'ADD' ? quantity : -quantity;

    // Front-end negative stock check
    if (actionType === 'DEDUCT' && variant.current_stock < quantity) {
      setError(`Insufficient stock. Current available stock is ${variant.current_stock}.`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (window.api && window.api.inventory) {
        const res = await window.api.inventory.adjust({
          product_variant_id: variant.id,
          quantity_change: qtyChange,
          transaction_type: movementType,
          notes: notes.trim(),
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to adjust stock.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Stock adjustment error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative animate-scale-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2012ad]">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Stock Adjustment</h3>
            <p className="text-xs font-medium text-slate-500">
              SKU: <span className="font-mono text-slate-800">{variant.sku}</span> ({variant.color} / {variant.size})
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">Current In-Stock Quantity:</span>
            <span className="text-sm font-bold text-slate-900">{variant.current_stock} units</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActionType('ADD')}
              className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                actionType === 'ADD'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              + Add Stock
            </button>
            <button
              type="button"
              onClick={() => setActionType('DEDUCT')}
              className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                actionType === 'DEDUCT'
                  ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              - Deduct Stock
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Movement Category</label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
            >
              <option value="ADJUSTMENT">Manual Stock Adjustment / Audit</option>
              <option value="DAMAGE">Damaged / Defective Stock</option>
              <option value="PURCHASE">Purchase Order Inward</option>
              <option value="RETURN">Customer Return Inward</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Quantity Units *</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Reason / Reference Notes *</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Audit correction, water damaged saree, stock inward..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Adjustment</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

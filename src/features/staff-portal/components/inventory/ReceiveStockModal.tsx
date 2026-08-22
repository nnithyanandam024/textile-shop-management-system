import React, { useState, useEffect } from 'react';
import { StaffPOReceivingItem } from '../../services/staffInventoryService';
import { X, PackageCheck, AlertCircle, ShieldAlert } from 'lucide-react';

interface ReceiveStockModalProps {
  po: StaffPOReceivingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReceiving: (input: {
    purchase_id: number;
    notes?: string;
    items: Array<{ product_variant_id: number; received_quantity: number; notes?: string }>;
  }) => Promise<any>;
}

export const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({
  po,
  isOpen,
  onClose,
  onSubmitReceiving,
}) => {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
  const [reportNotes, setReportNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (po) {
      const initQty: Record<number, number> = {};
      const initNotes: Record<number, string> = {};
      po.items.forEach((item) => {
        initQty[item.productVariantId] = item.orderedQuantity;
        initNotes[item.productVariantId] = '';
      });
      setQuantities(initQty);
      setItemNotes(initNotes);
      setReportNotes('');
      setError(null);
    }
  }, [po, isOpen]);

  if (!isOpen || !po) return null;

  const handleQtyChange = (variantId: number, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [variantId]: val < 0 ? 0 : val,
    }));
  };

  const handleNoteChange = (variantId: number, text: string) => {
    setItemNotes((prev) => ({
      ...prev,
      [variantId]: text,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const itemsPayload = po.items.map((item) => ({
        product_variant_id: item.productVariantId,
        received_quantity: quantities[item.productVariantId] ?? item.orderedQuantity,
        notes: itemNotes[item.productVariantId] || undefined,
      }));

      await onSubmitReceiving({
        purchase_id: po.id,
        notes: reportNotes.trim() || undefined,
        items: itemsPayload,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit receiving report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200/80 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Stock Receiving & Inward Verification</h3>
              <p className="text-xs font-semibold text-slate-500 font-mono">
                PO: {po.purchaseNumber} — Supplier: {po.supplierName}
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

        {/* Scrollable Items Table */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Items Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Item / SKU</th>
                  <th className="py-2.5 px-3 text-center">Ordered</th>
                  <th className="py-2.5 px-3 text-center">Received Qty</th>
                  <th className="py-2.5 px-3 text-center">Difference</th>
                  <th className="py-2.5 px-3">Item Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {po.items.map((item) => {
                  const recQty = quantities[item.productVariantId] ?? item.orderedQuantity;
                  const diff = recQty - item.orderedQuantity;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 block font-extrabold">{item.productName}</strong>
                        <span className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-700">
                        {item.orderedQuantity}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          required
                          value={recQty}
                          onChange={(e) => handleQtyChange(item.productVariantId, Number(e.target.value))}
                          className="w-20 px-2.5 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-mono font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600"
                        />
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-extrabold">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] ${
                            diff === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : diff < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {diff === 0 ? 'Exact' : diff > 0 ? `+${diff}` : diff}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <input
                          type="text"
                          placeholder="Condition notes..."
                          value={itemNotes[item.productVariantId] || ''}
                          onChange={(e) => handleNoteChange(item.productVariantId, e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Overall Report Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              Receiving Notes & Delivery Package Condition
            </label>
            <textarea
              rows={2}
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="e.g. Inward consignment received via BlueDart courier. 1 carton box damaged in transit."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600"
            />
          </div>

          {/* Safety Notice */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2.5 text-purple-900 text-[11px] font-semibold">
            <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <span>
              Submitting this receiving report submits an inward log for manager review. Live stock is updated once verified.
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
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-200 disabled:opacity-50"
            >
              {submitting ? 'Submitting Report...' : 'Submit Receiving Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

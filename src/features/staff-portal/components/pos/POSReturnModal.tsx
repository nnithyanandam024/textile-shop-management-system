import React, { useState } from 'react';
import { staffPOSService, StaffPOSInvoiceData } from '../../services/staffPOSService';
import { X, RotateCcw, Search, AlertCircle } from 'lucide-react';

interface POSReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessReturn: (input: {
    saleId: number;
    items: Array<{ saleItemId: number; variantId: number; quantity: number; reason: string; condition?: string }>;
    notes?: string;
  }) => Promise<any>;
}

export const POSReturnModal: React.FC<POSReturnModalProps> = ({
  isOpen,
  onClose,
  onProcessReturn,
}) => {
  const [invoiceIdInput, setInvoiceIdInput] = useState('');
  const [invoice, setInvoice] = useState<StaffPOSInvoiceData | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<number, { quantity: number; reason: string; condition: string }>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const saleId = Number(invoiceIdInput.trim());
      if (!saleId || isNaN(saleId)) {
        throw new Error('Please enter a numeric Sale / Invoice ID (e.g. 1).');
      }
      const data = await staffPOSService.getSaleInvoice(saleId);
      setInvoice(data);

      const initialSelected: Record<number, { quantity: number; reason: string; condition: string }> = {};
      data.items.forEach((item) => {
        initialSelected[item.id] = { quantity: 0, reason: 'CUSTOMER_CHANGED_MIND', condition: 'GOOD' };
      });
      setSelectedItems(initialSelected);
    } catch (err: any) {
      setError(err.message || 'Invoice lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: number, maxQty: number, qty: number) => {
    const safeQty = Math.max(0, Math.min(qty, maxQty));
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: safeQty },
    }));
  };

  const handleSubmitReturn = async () => {
    if (!invoice) return;
    setError(null);

    const returnItems: Array<{ saleItemId: number; variantId: number; quantity: number; reason: string; condition?: string }> = [];
    invoice.items.forEach((item) => {
      const sel = selectedItems[item.id];
      if (sel && sel.quantity > 0) {
        returnItems.push({
          saleItemId: item.id,
          variantId: item.variantId,
          quantity: sel.quantity,
          reason: sel.reason,
          condition: sel.condition,
        });
      }
    });

    if (returnItems.length === 0) {
      setError('Please select at least one item to return with quantity > 0.');
      return;
    }

    setSubmitting(true);
    try {
      await onProcessReturn({
        saleId: invoice.id,
        items: returnItems,
        notes: notes || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Return processing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Process Sales Return</h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Look up invoice, select items, and refund
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invoice Search Input */}
        <form onSubmit={handleSearchInvoice} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={invoiceIdInput}
              onChange={(e) => setInvoiceIdInput(e.target.value)}
              placeholder="Enter Sale ID (e.g. 1)"
              className="w-full pl-3.5 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !invoiceIdInput.trim()}
            className="px-4 py-2 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loading ? 'Finding...' : 'Find'}</span>
          </button>
        </form>

        {/* Invoice Item Selection */}
        {invoice && (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex justify-between">
              <span className="font-extrabold text-slate-800">{invoice.invoiceNumber}</span>
              <span className="text-slate-500">{invoice.customerName}</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto custom-scrollbar">
              {invoice.items.map((item) => {
                const sel = selectedItems[item.id] || { quantity: 0, reason: 'CUSTOMER_CHANGED_MIND', condition: 'GOOD' };
                return (
                  <div key={item.id} className="py-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900">{item.productName}</span>
                        <span className="text-slate-400 text-[10px] block">Bought: {item.quantity} units @ ₹{item.unitPrice}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-500">Return Qty:</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={sel.quantity}
                          onChange={(e) => handleQuantityChange(item.id, item.quantity, Number(e.target.value))}
                          className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 font-mono text-center"
                        />
                      </div>
                    </div>

                    {sel.quantity > 0 && (
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <select
                          value={sel.reason}
                          onChange={(e) =>
                            setSelectedItems((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], reason: e.target.value },
                            }))
                          }
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                        >
                          <option value="CUSTOMER_CHANGED_MIND">Customer Changed Mind</option>
                          <option value="WRONG_SIZE">Wrong Size</option>
                          <option value="WRONG_PRODUCT">Wrong Product</option>
                          <option value="DEFECT">Defect / Damaged</option>
                          <option value="OTHER">Other Reason</option>
                        </select>

                        <select
                          value={sel.condition}
                          onChange={(e) =>
                            setSelectedItems((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], condition: e.target.value },
                            }))
                          }
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                        >
                          <option value="GOOD">Good (Restock Inventory)</option>
                          <option value="DAMAGED">Damaged (Do Not Restock)</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Return Notes */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-extrabold text-slate-600">Return Reason / Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Exchanged for different size"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-extrabold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          {invoice && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitReturn}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-40"
            >
              {submitting ? 'Processing...' : 'Confirm Return & Refund'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

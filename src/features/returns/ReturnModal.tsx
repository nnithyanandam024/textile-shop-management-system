import React, { useState } from 'react';
import { X, Search, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [saleData, setSaleData] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<Record<number, { qty: number; condition: 'RESALABLE' | 'DAMAGED' }>>({});
  const [reason, setReason] = useState<string>('Wrong Size');
  const [refundMethod, setRefundMethod] = useState<string>('CASH');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return;

    setError('');
    setLoading(true);

    try {
      if (window.api && window.api.sales) {
        const sales = await window.api.sales.getAll();
        const found = sales.find((s: any) => s.invoice_number.toLowerCase() === invoiceNumber.trim().toLowerCase());
        
        if (!found) {
          setError(`Invoice number "${invoiceNumber}" not found.`);
          setSaleData(null);
        } else {
          const details = await window.api.sales.getDetails(found.id);
          if (details.success && details.data) {
            setSaleData(details.data);
            // Initialize return item map
            const itemMap: Record<number, { qty: number; condition: 'RESALABLE' | 'DAMAGED' }> = {};
            details.data.items.forEach((it: any) => {
              itemMap[it.id] = { qty: 0, condition: 'RESALABLE' };
            });
            setReturnItems(itemMap);
          } else {
            setError('Failed to load invoice items.');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invoice search error.');
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (saleItemId: number, maxQty: number, val: number) => {
    const validQty = Math.max(0, Math.min(maxQty, val));
    setReturnItems((prev) => ({
      ...prev,
      [saleItemId]: { ...prev[saleItemId], qty: validQty },
    }));
  };

  const handleConditionChange = (saleItemId: number, condition: 'RESALABLE' | 'DAMAGED') => {
    setReturnItems((prev) => ({
      ...prev,
      [saleItemId]: { ...prev[saleItemId], condition },
    }));
  };

  const calculateTotalRefund = () => {
    if (!saleData) return 0;
    return saleData.items.reduce((sum: number, it: any) => {
      const itemConfig = returnItems[it.id];
      if (itemConfig && itemConfig.qty > 0) {
        return sum + itemConfig.qty * it.unit_price;
      }
      return sum;
    }, 0);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleData) return;

    const itemsToReturn = saleData.items
      .filter((it: any) => returnItems[it.id]?.qty > 0)
      .map((it: any) => ({
        sale_item_id: it.id,
        product_variant_id: it.product_variant_id,
        quantity: returnItems[it.id].qty,
        unit_price: it.unit_price,
        condition: returnItems[it.id].condition,
        reason,
      }));

    if (itemsToReturn.length === 0) {
      setError('Please select at least one item quantity to return.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (window.api && window.api.returns) {
        const res = await window.api.returns.create({
          sale_id: saleData.sale.id,
          items: itemsToReturn,
          refund_method: refundMethod,
          reason,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to process return.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Return processing error.');
    } finally {
      setLoading(false);
    }
  };

  const totalRefund = calculateTotalRefund();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative flex flex-col max-h-[88vh] animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2818cf]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Process Sales Return</h3>
              <p className="text-xs text-slate-500 font-medium">Return sold items by invoice, restore inventory stock, and issue customer refunds</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoice Search Form */}
        <form onSubmit={handleSearchInvoice} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Enter Original Invoice Number (e.g. INV-2026-000001)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find Invoice'}
          </button>
        </form>

        {saleData && (
          <form onSubmit={handleSubmitReturn} className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">Invoice: {saleData.sale.invoice_number}</span>
                <span className="text-slate-500 ml-2">({new Date(saleData.sale.sale_date).toLocaleDateString()})</span>
              </div>
              <span className="font-extrabold text-[#2818cf]">Original Total: ₹{saleData.sale.total}</span>
            </div>

            {/* Itemized Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase sticky top-0">
                  <tr>
                    <th className="p-2.5">Product SKU</th>
                    <th className="p-2.5">Sold Qty</th>
                    <th className="p-2.5">Return Qty</th>
                    <th className="p-2.5">Condition</th>
                    <th className="p-2.5">Unit Price</th>
                    <th className="p-2.5 text-right">Line Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {saleData.items.map((it: any) => (
                    <tr key={it.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{it.sku || 'Item'}</td>
                      <td className="p-2.5 font-bold text-slate-700">{it.quantity}</td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min={0}
                          max={it.quantity}
                          value={returnItems[it.id]?.qty || 0}
                          onChange={(e) => handleQtyChange(it.id, it.quantity, Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-extrabold text-slate-900"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={returnItems[it.id]?.condition || 'RESALABLE'}
                          onChange={(e) => handleConditionChange(it.id, e.target.value as any)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-[11px]"
                        >
                          <option value="RESALABLE">RESALABLE (Restock)</option>
                          <option value="DAMAGED">DAMAGED (Log Only)</option>
                        </select>
                      </td>
                      <td className="p-2.5 font-semibold">₹{it.unit_price}</td>
                      <td className="p-2.5 text-right font-extrabold text-[#2818cf]">
                        ₹{(returnItems[it.id]?.qty || 0) * it.unit_price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Refund Options & Submit */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Wrong Size">Wrong Size</option>
                    <option value="Defective">Defective</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Customer Changed Mind">Customer Changed Mind</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Refund Mode</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI</option>
                    <option value="STORE_CREDIT">STORE CREDIT</option>
                  </select>
                </div>
              </div>

              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Refund</p>
                  <p className="text-xl font-extrabold text-[#2818cf]">₹{totalRefund}</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || totalRefund === 0}
                  className="px-5 py-2.5 bg-[#2818cf] hover:bg-[#2012ad] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#2818cf]/20 transition-all flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Process Return</span>}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

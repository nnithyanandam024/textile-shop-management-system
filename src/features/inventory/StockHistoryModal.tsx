import React, { useState, useEffect } from 'react';
import { X, History, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StockTx {
  id: number;
  product_variant_id: number;
  sku?: string;
  product_name?: string;
  transaction_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  notes?: string;
  created_at: string;
}

interface StockHistoryModalProps {
  isOpen: boolean;
  variantId?: number;
  sku?: string;
  onClose: () => void;
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  isOpen,
  variantId,
  sku,
  onClose,
}) => {
  const [history, setHistory] = useState<StockTx[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, variantId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.inventory) {
        const data = await window.api.inventory.getHistory(variantId);
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch stock history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative flex flex-col max-h-[85vh] animate-scale-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2012ad]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Stock Movement History</h3>
            <p className="text-xs text-slate-500">
              {sku ? `Ledger trail for SKU: ${sku}` : 'Full System Stock Movement Audit Log'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 border border-slate-200 rounded-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-[#2012ad] mx-auto mb-2" />
              <span className="text-xs font-medium">Loading ledger transactions...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              No stock transactions recorded yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase sticky top-0">
                <tr>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">SKU / Product</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Change Qty</th>
                  <th className="p-3">Stock Audit (Before → After)</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((tx) => {
                  const isPositive = tx.quantity > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-500">{new Date(tx.created_at).toLocaleString()}</td>
                      <td className="p-3 font-medium text-slate-800">
                        <div className="font-mono font-bold text-slate-900">{tx.sku || 'Variant'}</div>
                        <div className="text-[10px] text-slate-400">{tx.product_name}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold uppercase text-slate-700">
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="p-3 font-bold">
                        <span className={`inline-flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isPositive ? `+${tx.quantity}` : tx.quantity}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        {tx.previous_quantity} → <span className="font-bold text-slate-900">{tx.new_quantity}</span>
                      </td>
                      <td className="p-3 text-slate-600 italic">{tx.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="pt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { RotateCcw, ArrowLeftRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ReturnModal } from './ReturnModal';
import { ExchangeModal } from './ExchangeModal';

interface ReturnRecord {
  id: number;
  return_number: string;
  invoice_number: string;
  customer_name?: string;
  return_date: string;
  refund_amount: number;
  refund_method: string;
  reason?: string;
}

export const ReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [showExchangeModal, setShowExchangeModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');

  const fetchReturns = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.returns) {
        const list = await window.api.returns.getAll();
        setReturns(list);
      }
    } catch (err) {
      console.error('Failed to fetch returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2818cf]">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Sales Returns & Product Exchanges</h1>
            <p className="text-xs font-medium text-slate-500">Process sales returns by invoice, restock resalable inventory, handle damaged stock, and complete product exchanges</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReturns}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all"
            title="Refresh Returns"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowExchangeModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Product Exchange</span>
          </button>
          <button
            onClick={() => setShowReturnModal(true)}
            className="px-4 py-2.5 bg-[#2818cf] hover:bg-[#2012ad] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2818cf]/20 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Process Return</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Returns History Directory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2818cf] mx-auto mb-2" />
            <span className="text-sm font-medium">Loading returns history...</span>
          </div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No sales returns processed yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Return #</th>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Refund Amount</th>
                <th className="px-6 py-4">Refund Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {returns.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.return_number}</td>
                  <td className="px-6 py-4 font-mono text-slate-700">{r.invoice_number}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{r.customer_name || 'Walk-in Customer'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(r.return_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-extrabold text-[#2818cf]">₹{r.refund_amount}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-bold">
                      {r.refund_method}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Return Modal */}
      <ReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSuccess={() => {
          setSuccess('Sales return processed successfully and inventory updated!');
          fetchReturns();
        }}
      />

      {/* Exchange Modal */}
      <ExchangeModal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        onSuccess={() => {
          setSuccess('Product exchange completed successfully!');
          fetchReturns();
        }}
      />
    </div>
  );
};

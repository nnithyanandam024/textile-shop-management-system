import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, RefreshCw, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { InvoiceModal } from '../pos/InvoiceModal';

interface Sale {
  id: number;
  invoice_number: string;
  customer_name?: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  status: string;
  created_by_name?: string;
}

export const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const fetchSales = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.sales) {
        const list = await window.api.sales.getAll();
        setSales(list);
      }
    } catch (err) {
      console.error('Failed to fetch sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleCancelSale = async (saleId: number, invoiceNo: string) => {
    if (!window.confirm(`Are you sure you want to cancel invoice ${invoiceNo}? This will reverse inventory stock.`)) return;

    setError('');
    setSuccess('');
    try {
      if (window.api && window.api.sales) {
        const res = await window.api.sales.cancel(saleId);
        if (res.success) {
          setSuccess(`Invoice ${invoiceNo} cancelled successfully. Inventory restored.`);
          fetchSales();
        } else {
          setError(res.error || 'Failed to cancel sale.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Sale cancellation error.');
    }
  };

  const filteredSales = sales.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.invoice_number.toLowerCase().includes(term) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2012ad]">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Sales History & Invoice Directory</h1>
            <p className="text-xs font-medium text-slate-500">View past sales invoices, reprint receipts, and process returns</p>
          </div>
        </div>

        <button
          onClick={fetchSales}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all self-start sm:self-auto"
          title="Refresh Sales History"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="font-bold text-red-500">×</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-700 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="font-bold text-emerald-500">×</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Invoice Number or Customer Name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2012ad] mx-auto mb-2" />
            <span className="text-sm font-medium">Loading sales history...</span>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No sales invoices found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Grand Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{s.invoice_number}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {new Date(s.sale_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {s.customer_name || 'Walk-in Customer'}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-[#2012ad]">
                    ₹{s.total.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    {s.status === 'COMPLETED' ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                        COMPLETED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
                        CANCELLED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedSaleId(s.id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#2012ad] border border-indigo-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                    {s.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleCancelSale(s.id, s.invoice_number)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoice Modal Viewer */}
      <InvoiceModal
        isOpen={!!selectedSaleId}
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
        onNewSale={() => setSelectedSaleId(null)}
      />
    </div>
  );
};

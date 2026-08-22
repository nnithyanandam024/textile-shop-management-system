import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, RefreshCw, Eye, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PurchaseModal } from './PurchaseModal';

interface Purchase {
  id: number;
  purchase_number: string;
  supplier_id: number;
  supplier_name?: string;
  purchase_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  notes?: string;
}

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.purchases) {
        const list = await window.api.purchases.getAll();
        setPurchases(list);
      }
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleCancelPurchase = async (purchaseId: number) => {
    if (!window.confirm('Are you sure you want to cancel this purchase order? Stock will be reversed.')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      if (window.api && window.api.purchases) {
        const res = await window.api.purchases.cancel(purchaseId);
        if (res.success) {
          setSuccess('Purchase order cancelled and stock reversed successfully.');
          fetchPurchases();
        } else {
          setError(res.error || 'Failed to cancel purchase.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error cancelling purchase.');
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.purchase_number.toLowerCase().includes(term) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2012ad]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Purchase Inward Orders</h1>
            <p className="text-xs font-medium text-slate-500">Record stock inward from vendors, manage purchase invoices, and track supplier payables</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPurchases}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all"
            title="Refresh Purchases"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="px-4 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Inward</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Purchase # or Supplier Name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
          />
        </div>
      </div>

      {/* Purchases Directory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2012ad] mx-auto mb-2" />
            <span className="text-sm font-medium">Loading purchase history...</span>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No purchase records found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Purchase #</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPurchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{p.purchase_number}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{p.supplier_name || 'Vendor'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(p.purchase_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-extrabold text-[#2012ad]">₹{p.total}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        p.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedPurchase(p)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {p.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelPurchase(p.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs transition-all"
                        title="Cancel Purchase Order"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Purchase Inward Wizard Modal */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={() => {
          setSuccess('Purchase inward order saved and stock increased successfully!');
          fetchPurchases();
        }}
      />

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Purchase Order: {selectedPurchase.purchase_number}</h3>
            <p className="text-xs text-slate-500 font-mono mb-4">Supplier: {selectedPurchase.supplier_name || 'Vendor'}</p>
            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
              <div className="flex justify-between"><span className="text-slate-500">Date:</span><span className="font-bold">{new Date(selectedPurchase.purchase_date).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Subtotal:</span><span className="font-bold">₹{selectedPurchase.subtotal}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Discount:</span><span className="font-bold">₹{selectedPurchase.discount}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Grand Total:</span><span className="font-bold text-[#2012ad]">₹{selectedPurchase.total}</span></div>
            </div>
            <button onClick={() => setSelectedPurchase(null)} className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

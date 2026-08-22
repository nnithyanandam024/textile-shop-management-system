import React, { useState, useEffect } from 'react';
import { X, Building2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SupplierProfileModalProps {
  isOpen: boolean;
  supplierId: number | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const SupplierProfileModal: React.FC<SupplierProfileModalProps> = ({
  isOpen,
  supplierId,
  onClose,
  onRefresh,
}) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<string>('BANK_TRANSFER');

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (isOpen && supplierId) {
      fetchProfile();
    }
  }, [isOpen, supplierId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.suppliers) {
        const res = await window.api.suppliers.getProfile(supplierId!);
        if (res.success) {
          setProfileData(res);
        }
      }
    } catch (err) {
      console.error('Failed to load supplier profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !supplierId) return null;

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    setError('');
    try {
      if (window.api && window.api.suppliers) {
        const res = await window.api.suppliers.makePayment({
          supplierId,
          amount: payAmount,
          paymentMethod: payMode,
        });

        if (res.success) {
          setSuccess(`Payment of ₹${payAmount} made successfully.`);
          setShowPayModal(false);
          setPayAmount(0);
          fetchProfile();
          onRefresh();
        } else {
          setError(res.error || 'Failed to make payment.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Payment error.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative flex flex-col max-h-[85vh] animate-scale-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1">
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2012ad] mx-auto mb-2" />
            <span className="text-xs font-medium">Loading supplier profile...</span>
          </div>
        ) : !profileData ? (
          <div className="p-8 text-center text-red-600 text-xs font-bold">Failed to load profile.</div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2012ad]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{profileData.supplier.company_name}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Code: {profileData.supplier.supplier_code} | Contact: {profileData.supplier.contact_person || 'N/A'} ({profileData.supplier.phone || 'No Phone'})
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            {/* Profile Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Purchase Orders</p>
                <p className="text-base font-extrabold text-slate-900">{profileData.purchases.length}</p>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-[#2012ad] uppercase">Make Supplier Payout</p>
                  <button
                    onClick={() => setShowPayModal(true)}
                    className="mt-1 px-3 py-1 bg-[#2012ad] text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    + Record Payout
                  </button>
                </div>
              </div>
            </div>

            {/* Purchase Orders Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl mb-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase sticky top-0">
                  <tr>
                    <th className="p-2.5">Purchase Order #</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Total Cost</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profileData.purchases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">No purchase order history for this supplier.</td>
                    </tr>
                  ) : (
                    profileData.purchases.map((po: any) => (
                      <tr key={po.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{po.purchase_number}</td>
                        <td className="p-2.5 text-slate-500">{new Date(po.purchase_date).toLocaleDateString()}</td>
                        <td className="p-2.5 font-extrabold text-[#2012ad]">₹{po.total}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Make Payment Modal Overlay */}
            {showPayModal && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
                  <h4 className="text-base font-bold text-slate-900 mb-3">Record Supplier Payment</h4>
                  <form onSubmit={handleMakePayment} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount Paid (₹) *</label>
                      <input
                        type="number"
                        min={1}
                        value={payAmount}
                        onChange={(e) => setPayAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method</label>
                      <select
                        value={payMode}
                        onChange={(e) => setPayMode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        <option value="BANK_TRANSFER">BANK TRANSFER</option>
                        <option value="CASH">CASH</option>
                        <option value="UPI">UPI / QR</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setShowPayModal(false)} className="w-1/2 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">Cancel</button>
                      <button type="submit" className="w-1/2 py-2 bg-[#2012ad] text-white text-xs font-bold rounded-xl shadow-md">Confirm Payout</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

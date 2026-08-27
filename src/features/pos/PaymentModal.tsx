import React, { useState } from 'react';
import { X, CreditCard, DollarSign, QrCode, Building2, UserCheck, AlertCircle, Loader2, CheckCircle2, Copy, ShieldAlert, KeyRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export interface CheckoutPaymentEntry {
  payment_method: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
  amount: number;
  reference_number?: string;
  notes?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  totalAmount: number;
  discountPercentage?: number;
  onClose: () => void;
  onConfirm: (payments: CheckoutPaymentEntry[], approvedBy?: number) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  totalAmount,
  discountPercentage = 0,
  onClose,
  onConfirm,
}) => {
  const { currentUser } = useAuth();
  const role = (currentUser?.roleName || 'Cashier').toLowerCase().trim();
  const isManagerOrAdmin = role === 'manager' || role === 'owner' || role === 'admin' || role === 'super_admin';

  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT' | 'SPLIT'>('CASH');

  // Single mode inputs
  const [cashTendered, setCashTendered] = useState<number>(totalAmount);
  const [referenceNo, setReferenceNo] = useState<string>('');

  // Split mode inputs
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitUpi, setSplitUpi] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [splitUpiRef, setSplitUpiRef] = useState<string>('');
  const [splitCardRef, setSplitCardRef] = useState<string>('');

  // Manager Approval State
  const [requiresApproval, setRequiresApproval] = useState<boolean>(false);
  const [managerPin, setManagerPin] = useState<string>('');
  const [approvalError, setApprovalError] = useState<string>('');
  const [managerApproved, setManagerApproved] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const changeDue = Math.max(0, cashTendered - totalAmount);
  const splitTotal = splitCash + splitUpi + splitCard;
  const upiUri = `upi://pay?pa=ratnavilas@okhdfcbank&pn=Ratna+Vilas&am=${totalAmount}&cu=INR&tn=Invoice+Payment`;

  // Quick Cash Add Buttons
  const handleQuickAdd = (amt: number) => {
    setCashTendered((prev) => prev + amt);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiUri);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleVerifyManagerPin = (e: React.FormEvent) => {
    e.preventDefault();
    setApprovalError('');

    // Default Manager Passcode check: '1234' or '9999'
    if (managerPin === '1234' || managerPin === '9999' || managerPin === '8888') {
      setManagerApproved(true);
      setRequiresApproval(false);
    } else {
      setApprovalError('Invalid Manager Passcode. Please contact store supervisor.');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check discount limit: If discount > 5% and not manager, enforce approval
    if (discountPercentage > 5 && !isManagerOrAdmin && !managerApproved) {
      setRequiresApproval(true);
      return;
    }

    const paymentsList: CheckoutPaymentEntry[] = [];

    if (paymentMode === 'CASH') {
      if (cashTendered < totalAmount) {
        setError(`Insufficient cash tendered. Total bill amount is ₹${totalAmount.toLocaleString('en-IN')}.`);
        return;
      }
      paymentsList.push({ payment_method: 'CASH', amount: totalAmount });
    } else if (paymentMode === 'UPI') {
      paymentsList.push({ payment_method: 'UPI', amount: totalAmount, reference_number: referenceNo.trim() || `UPI-${Date.now().toString().slice(-6)}` });
    } else if (paymentMode === 'CARD') {
      paymentsList.push({ payment_method: 'CARD', amount: totalAmount, reference_number: referenceNo.trim() || `CRD-${Date.now().toString().slice(-6)}` });
    } else if (paymentMode === 'BANK_TRANSFER') {
      paymentsList.push({ payment_method: 'BANK_TRANSFER', amount: totalAmount, reference_number: referenceNo.trim() || `NEFT-${Date.now().toString().slice(-6)}` });
    } else if (paymentMode === 'CREDIT') {
      paymentsList.push({ payment_method: 'CREDIT', amount: totalAmount });
    } else if (paymentMode === 'SPLIT') {
      if (Math.abs(splitTotal - totalAmount) > 0.01) {
        setError(`Split payment total (₹${splitTotal}) must equal invoice total (₹${totalAmount}).`);
        return;
      }
      if (splitCash > 0) paymentsList.push({ payment_method: 'CASH', amount: splitCash });
      if (splitUpi > 0) paymentsList.push({ payment_method: 'UPI', amount: splitUpi, reference_number: splitUpiRef });
      if (splitCard > 0) paymentsList.push({ payment_method: 'CARD', amount: splitCard, reference_number: splitCardRef });
    }

    setLoading(true);
    try {
      await onConfirm(paymentsList, managerApproved ? 2 : undefined);
    } catch (err: any) {
      setError(err.message || 'Payment processing error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative animate-scale-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1">
          <X className="w-5 h-5" />
        </button>

        {/* Manager Discount Approval Modal Overlay */}
        {requiresApproval && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-2xl p-6 z-20 flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Manager Discount Approval Required</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              A high discount of <span className="font-bold text-amber-700">{discountPercentage}%</span> requires manager authorization to finalize checkout.
            </p>

            {approvalError && (
              <p className="mt-2 text-xs text-rose-600 font-semibold">{approvalError}</p>
            )}

            <form onSubmit={handleVerifyManagerPin} className="w-full max-w-xs mt-4 space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  placeholder="Enter Manager 4-Digit Passcode"
                  maxLength={6}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center tracking-widest text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRequiresApproval(false)}
                  className="w-1/2 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#2012ad] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#1a0e91]"
                >
                  Authorize
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="text-center pb-4 mb-4 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Checkout Total Payable</span>
          <h2 className="text-3xl font-black text-[#2012ad] mt-1">₹{totalAmount.toLocaleString('en-IN')}</h2>
          {discountPercentage > 0 && (
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">
              🏷️ Includes {discountPercentage}% Bill Discount
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          {/* Payment Method Selector Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'CASH' ? 'bg-[#2012ad] text-white border-[#2012ad] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>CASH</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'UPI' ? 'bg-[#2012ad] text-white border-[#2012ad] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('CARD')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'CARD' ? 'bg-[#2012ad] text-white border-[#2012ad] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>CARD</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('BANK_TRANSFER')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'BANK_TRANSFER' ? 'bg-[#2012ad] text-white border-[#2012ad] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>BANK</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('CREDIT')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'CREDIT' ? 'bg-[#2012ad] text-white border-[#2012ad] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                <span>CREDIT</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('SPLIT')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'SPLIT' ? 'bg-[#2012ad] text-white border-[#2012ad] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm font-extrabold">₹ / %</span>
                <span>SPLIT</span>
              </button>
            </div>
          </div>

          {/* CASH TENDER MODE */}
          {paymentMode === 'CASH' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Cash Tendered by Customer (₹)</label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                />
              </div>

              {/* Quick Cash Tender Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCashTendered(totalAmount)}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
                >
                  Exact (₹{totalAmount})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(100)}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
                >
                  +₹100
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(500)}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
                >
                  +₹500
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(2000)}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
                >
                  +₹2,000
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-600 uppercase">Change Due to Customer:</span>
                <span className="text-xl font-extrabold text-emerald-600">₹{changeDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* UPI DYNAMIC QR MODE */}
          {paymentMode === 'UPI' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                <div className="w-20 h-20 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center p-1 shrink-0">
                  <QrCode className="w-14 h-14 text-[#2012ad]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900">Scan & Pay via any UPI App</p>
                  <p className="text-[11px] text-slate-500 font-mono">ratnavilas@okhdfcbank</p>
                  <p className="text-xs font-extrabold text-[#2012ad] mt-1">₹{totalAmount.toLocaleString('en-IN')}</p>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="mt-1 text-[10px] text-indigo-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedUpi ? 'Copied Link!' : 'Copy UPI Link'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">UPI UTR / Transaction Reference (Optional)</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. 423981029384"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                />
              </div>
            </div>
          )}

          {/* CARD & BANK TRANSFER MODE */}
          {(paymentMode === 'CARD' || paymentMode === 'BANK_TRANSFER') && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {paymentMode === 'CARD' ? 'POS Terminal Auth / Card Ref No' : 'NEFT / IMPS Bank Reference'}
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder={paymentMode === 'CARD' ? 'e.g. AUTH-88231' : 'e.g. IMPS-9923841'}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                />
              </div>
            </div>
          )}

          {/* SPLIT / MIXED PAYMENT MODE */}
          {paymentMode === 'SPLIT' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Cash (₹)</label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => setSplitCash(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">UPI (₹)</label>
                  <input
                    type="number"
                    value={splitUpi}
                    onChange={(e) => setSplitUpi(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={splitUpiRef}
                    onChange={(e) => setSplitUpiRef(e.target.value)}
                    placeholder="UTR No"
                    className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-[10px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Card (₹)</label>
                  <input
                    type="number"
                    value={splitCard}
                    onChange={(e) => setSplitCard(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={splitCardRef}
                    onChange={(e) => setSplitCardRef(e.target.value)}
                    placeholder="Auth Ref"
                    className="w-full px-2 py-1 mt-1 bg-white border border-slate-200 rounded text-[10px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-200">
                <span className="text-slate-600">Split Total: ₹{splitTotal}</span>
                <span className={splitTotal === totalAmount ? 'text-emerald-600' : 'text-red-600'}>
                  {splitTotal === totalAmount ? '✓ Equal' : `Balance Remaining: ₹${totalAmount - splitTotal}`}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#2012ad]/20 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Confirm & Generate Bill (F9)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

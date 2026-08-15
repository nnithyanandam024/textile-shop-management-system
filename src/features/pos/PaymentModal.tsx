import React, { useState } from 'react';
import { X, CreditCard, DollarSign, QrCode, Building2, UserCheck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  totalAmount: number;
  onClose: () => void;
  onConfirm: (payments: { payment_method: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT'; amount: number; reference_number?: string }[]) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  totalAmount,
  onClose,
  onConfirm,
}) => {
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT' | 'SPLIT'>('CASH');

  // Single mode inputs
  const [cashTendered, setCashTendered] = useState<number>(totalAmount);
  const [referenceNo, setReferenceNo] = useState<string>('');

  // Split mode inputs
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitUpi, setSplitUpi] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [splitUpiRef] = useState<string>('');
  const [splitCardRef] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const changeDue = Math.max(0, cashTendered - totalAmount);
  const splitTotal = splitCash + splitUpi + splitCard;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const paymentsList: { payment_method: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT'; amount: number; reference_number?: string }[] = [];

    if (paymentMode === 'CASH') {
      if (cashTendered < totalAmount) {
        setError(`Insufficient cash tendered. Total bill amount is ₹${totalAmount}.`);
        return;
      }
      paymentsList.push({ payment_method: 'CASH', amount: totalAmount });
    } else if (paymentMode === 'UPI') {
      paymentsList.push({ payment_method: 'UPI', amount: totalAmount, reference_number: referenceNo.trim() });
    } else if (paymentMode === 'CARD') {
      paymentsList.push({ payment_method: 'CARD', amount: totalAmount, reference_number: referenceNo.trim() });
    } else if (paymentMode === 'BANK_TRANSFER') {
      paymentsList.push({ payment_method: 'BANK_TRANSFER', amount: totalAmount, reference_number: referenceNo.trim() });
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
      await onConfirm(paymentsList);
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

        <div className="text-center pb-4 mb-4 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Checkout Total Amount</span>
          <h2 className="text-3xl font-extrabold text-[#2818cf] mt-1">₹{totalAmount.toLocaleString('en-IN')}</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCheckoutSubmit} className="space-y-5">
          {/* Payment Method Selector Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'CASH' ? 'bg-[#2818cf] text-white border-[#2818cf] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>CASH</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'UPI' ? 'bg-[#2818cf] text-white border-[#2818cf] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('CARD')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'CARD' ? 'bg-[#2818cf] text-white border-[#2818cf] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>CARD</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('BANK_TRANSFER')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'BANK_TRANSFER' ? 'bg-[#2818cf] text-white border-[#2818cf] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>BANK</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('CREDIT')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'CREDIT' ? 'bg-[#2818cf] text-white border-[#2818cf] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                <span>CREDIT</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('SPLIT')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'SPLIT' ? 'bg-[#2818cf] text-white border-[#2818cf] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base font-extrabold">₹ / %</span>
                <span>SPLIT</span>
              </button>
            </div>
          </div>

          {/* Single Mode Inputs */}
          {paymentMode === 'CASH' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Cash Tendered by Customer (₹)</label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2818cf]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <span className="text-xs font-semibold text-slate-600 uppercase">Change Due to Customer:</span>
                <span className="text-xl font-extrabold text-emerald-600">₹{changeDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {(paymentMode === 'UPI' || paymentMode === 'CARD' || paymentMode === 'BANK_TRANSFER') && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Transaction Reference / UTR Number</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. UPI123456789 or TXN98765"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2818cf]"
                />
              </div>
            </div>
          )}

          {paymentMode === 'SPLIT' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Cash Amount (₹)</label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => setSplitCash(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">UPI Amount (₹)</label>
                  <input
                    type="number"
                    value={splitUpi}
                    onChange={(e) => setSplitUpi(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Card Amount (₹)</label>
                  <input
                    type="number"
                    value={splitCard}
                    onChange={(e) => setSplitCard(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-200">
                <span className="text-slate-600">Split Sum: ₹{splitTotal}</span>
                <span className={splitTotal === totalAmount ? 'text-emerald-600' : 'text-red-600'}>
                  {splitTotal === totalAmount ? '✓ Equal' : `Diff: ₹${totalAmount - splitTotal}`}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3 bg-[#2818cf] hover:bg-[#2012ad] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2818cf]/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Complete Checkout & Print (F9)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Banknote, QrCode, CreditCard, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface POSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onCompleteSale: (payments: Array<{ method: string; amount: number; referenceNumber?: string }>, notes?: string) => Promise<void>;
}

export const POSPaymentModal: React.FC<POSPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onCompleteSale,
}) => {
  const [method, setMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(totalAmount);
  const [upiRef, setUpiRef] = useState<string>('');
  const [cardRef, setCardRef] = useState<string>('');
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitUpi, setSplitUpi] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCashTendered(totalAmount);
      setSplitCash(Math.floor(totalAmount / 2));
      setSplitUpi(totalAmount - Math.floor(totalAmount / 2));
      setError(null);
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;

  const changeAmount = method === 'CASH' ? Math.max(0, cashTendered - totalAmount) : 0;
  const splitTotal = splitCash + splitUpi;
  const splitBalance = totalAmount - splitTotal;

  const handleProcessPayment = async () => {
    setError(null);
    setSubmitting(true);
    try {
      let payments: Array<{ method: string; amount: number; referenceNumber?: string }> = [];

      if (method === 'CASH') {
        if (cashTendered < totalAmount) {
          throw new Error(`Tendered amount (₹${cashTendered}) cannot be less than total (₹${totalAmount}).`);
        }
        payments = [{ method: 'CASH', amount: cashTendered }];
      } else if (method === 'UPI') {
        payments = [{ method: 'UPI', amount: totalAmount, referenceNumber: upiRef || `UPI-${Date.now().toString().slice(-6)}` }];
      } else if (method === 'CARD') {
        payments = [{ method: 'CARD', amount: totalAmount, referenceNumber: cardRef || `TXN-${Date.now().toString().slice(-6)}` }];
      } else if (method === 'SPLIT') {
        if (splitTotal !== totalAmount) {
          throw new Error(`Split sum (₹${splitTotal}) must exactly match total payable (₹${totalAmount}).`);
        }
        if (splitCash > 0) payments.push({ method: 'CASH', amount: splitCash });
        if (splitUpi > 0) payments.push({ method: 'UPI', amount: splitUpi, referenceNumber: upiRef || undefined });
      }

      await onCompleteSale(payments, notes || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Payment & Billing</h3>
            <p className="text-xs text-slate-400 font-semibold">
              Select customer tender method and confirm sale
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Total Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider block">
              Total Amount Due
            </span>
            <span className="text-2xl font-black font-mono">
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">
              Payment Status
            </span>
            <span className="text-xs font-extrabold text-emerald-400">Ready to Settle</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'CASH', label: 'Cash', icon: Banknote },
            { id: 'UPI', label: 'UPI / QR', icon: QrCode },
            { id: 'CARD', label: 'Card', icon: CreditCard },
            { id: 'SPLIT', label: 'Split', icon: Layers },
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id as any)}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'border-[#2818cf] bg-indigo-50/70 text-[#2818cf] shadow-xs'
                    : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-extrabold">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Payment Details Form */}
        <div className="space-y-4 pt-1">
          {method === 'CASH' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Cash Received / Tendered</label>
                <input
                  type="number"
                  value={cashTendered || ''}
                  onChange={(e) => setCashTendered(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-base font-extrabold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf] transition-all"
                />
              </div>

              {/* Quick Cash Chips */}
              <div className="flex flex-wrap gap-2">
                {[totalAmount, Math.ceil(totalAmount / 100) * 100, Math.ceil(totalAmount / 500) * 500, Math.ceil(totalAmount / 1000) * 1000]
                  .filter((v, idx, arr) => arr.indexOf(v) === idx && v >= totalAmount)
                  .map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setCashTendered(amount)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold font-mono transition-colors"
                    >
                      ₹{amount.toLocaleString('en-IN')}
                    </button>
                  ))}
              </div>

              {/* Change calculation */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-800">Change Due to Customer</span>
                <span className="text-base font-black text-emerald-900 font-mono">
                  ₹{changeAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {method === 'UPI' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>UPI QR Scanned & Authorized</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600">UPI Transaction ID / Ref (Optional)</label>
                <input
                  type="text"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="e.g. UPI89234710238"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold font-mono text-slate-900 focus:outline-none focus:border-[#2818cf]"
                />
              </div>
            </div>
          )}

          {method === 'CARD' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600">POS Terminal Slip / Approval Code (Optional)</label>
                <input
                  type="text"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  placeholder="e.g. APP98214"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold font-mono text-slate-900 focus:outline-none focus:border-[#2818cf]"
                />
              </div>
            </div>
          )}

          {method === 'SPLIT' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600">Cash Amount</label>
                  <input
                    type="number"
                    value={splitCash || ''}
                    onChange={(e) => setSplitCash(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600">UPI / Card Amount</label>
                  <input
                    type="number"
                    value={splitUpi || ''}
                    onChange={(e) => setSplitUpi(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold font-mono"
                  />
                </div>
              </div>

              <div className={`p-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between ${
                splitBalance === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}>
                <span>Remaining Balance</span>
                <span className="font-mono">₹{splitBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-600">Sale Notes / Customer Remark (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Festival offer applied"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2818cf]"
            />
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-extrabold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={submitting || (method === 'SPLIT' && splitBalance !== 0)}
            onClick={handleProcessPayment}
            className="px-6 py-2.5 rounded-2xl bg-[#2818cf] hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-40"
          >
            {submitting ? 'Processing Transaction...' : `Complete Sale (₹${totalAmount.toLocaleString('en-IN')})`}
          </button>
        </div>
      </div>
    </div>
  );
};

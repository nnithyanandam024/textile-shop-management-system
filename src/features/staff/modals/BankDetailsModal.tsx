import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, CreditCard, ShieldCheck } from 'lucide-react';

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffId: number;
  existingBank?: any;
}

export const BankDetailsModal: React.FC<BankDetailsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffId,
  existingBank,
}) => {
  const [bankName, setBankName] = useState('');
  const [holderName, setHolderName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingBank) {
      setBankName(existingBank.bank_name || '');
      setHolderName(existingBank.account_holder_name || '');
      setAccNumber(existingBank.account_number_encrypted || '');
      setIfsc(existingBank.ifsc || '');
      setPaymentMethod(existingBank.payment_method || 'Bank Transfer');
    } else {
      setBankName('');
      setHolderName('');
      setAccNumber('');
      setIfsc('');
      setPaymentMethod('Bank Transfer');
    }
    setError('');
  }, [existingBank, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!bankName.trim()) {
      setError('Bank name is required.');
      return;
    }
    if (!holderName.trim()) {
      setError('Account holder name is required.');
      return;
    }
    if (!accNumber.trim()) {
      setError('Account number is required.');
      return;
    }
    if (!/^\d{8,20}$/.test(accNumber.trim())) {
      setError('Account number must contain 8 to 20 numeric digits.');
      return;
    }
    if (!ifsc.trim()) {
      setError('IFSC code is required.');
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
      setError('Invalid IFSC code format (e.g. SBIN0001234).');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.staff) {
        const res = await window.api.staff.saveBankDetails('', {
          staff_id: staffId,
          bank_name: bankName.trim(),
          account_holder_name: holderName.trim(),
          account_number: accNumber.trim(),
          ifsc: ifsc.trim().toUpperCase(),
          payment_method: paymentMethod,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to save bank details.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bank & Payroll Account Setup</h3>
              <p className="text-xs text-slate-500">Configure sensitive bank payout account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-semibold flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Bank account data is encrypted & masked for non-authorized personnel.</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <Input
            label="Bank Name *"
            placeholder="e.g. State Bank of India, HDFC Bank"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
          />

          <Input
            label="Account Holder Name *"
            placeholder="Name as per bank records"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            required
          />

          <Input
            label="Bank Account Number *"
            type="password"
            placeholder="Enter full account number"
            value={accNumber}
            onChange={(e) => setAccNumber(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="IFSC Code *"
              placeholder="e.g. SBIN0001234"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Default Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Bank Setup
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, HandCoins, AlertCircle } from 'lucide-react';

interface IssueAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: any[];
}

export const IssueAdvanceModal: React.FC<IssueAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
}) => {
  const [staffId, setStaffId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number>(10000);
  const [advanceDate, setAdvanceDate] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(2000);
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStaffId(staffList.length > 0 ? staffList[0].id : '');
      setAmount(10000);
      setAdvanceDate(new Date().toISOString().split('T')[0]);
      setMonthlyInstallment(2000);
      setReason('');
      setError('');
    }
  }, [isOpen, staffList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId) {
      setError('Please select a staff member.');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Advance amount must be greater than 0.');
      return;
    }
    if (!monthlyInstallment || monthlyInstallment <= 0) {
      setError('Monthly installment must be greater than 0.');
      return;
    }
    if (!reason.trim()) {
      setError('Please state a reason for this salary advance.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.advance) {
        const res = await window.api.advance.issue({
          staff_id: Number(staffId),
          amount: Number(amount),
          advance_date: advanceDate,
          monthly_installment: Number(monthlyInstallment),
          reason: reason.trim(),
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to issue salary advance.');
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
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <HandCoins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Issue Salary Advance Loan</h3>
              <p className="text-xs text-slate-500">Record loan advance & monthly payroll deduction terms</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Employee *</label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(Number(e.target.value))}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            >
              <option value="">Select Staff...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.staff_code} — {s.first_name} {s.last_name || ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Advance Amount (₹) *"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
            <Input
              label="Advance Date *"
              type="date"
              value={advanceDate}
              onChange={(e) => setAdvanceDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Monthly Payroll Deduction Installment (₹) *"
            type="number"
            value={monthlyInstallment}
            onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason for Advance *</label>
            <textarea
              rows={2}
              placeholder="e.g. Medical emergency advance, personal loan"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Issue Advance
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, SlidersHorizontal, AlertCircle } from 'lucide-react';

interface AdjustBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: any[];
  leaveTypes: any[];
  initialStaffId?: number;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  leaveTypes,
  initialStaffId,
}) => {
  const [staffId, setStaffId] = useState<number | ''>('');
  const [leaveTypeId, setLeaveTypeId] = useState<number | ''>('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [adjustmentDays, setAdjustmentDays] = useState<number>(1);
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStaffId(initialStaffId || (staffList.length > 0 ? staffList[0].id : ''));
      setLeaveTypeId(leaveTypes.length > 0 ? leaveTypes[0].id : '');
      setYear(new Date().getFullYear());
      setAdjustmentDays(1);
      setReason('');
      setError('');
    }
  }, [isOpen, initialStaffId, staffList, leaveTypes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId) {
      setError('Please select a staff member.');
      return;
    }
    if (!leaveTypeId) {
      setError('Please select a leave type.');
      return;
    }
    if (adjustmentDays === 0) {
      setError('Adjustment days cannot be 0.');
      return;
    }
    if (!reason.trim()) {
      setError('Please state a reason for this leave balance adjustment.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.leave) {
        const res = await window.api.leave.adjustBalance({
          staff_id: Number(staffId),
          leave_type_id: Number(leaveTypeId),
          year: Number(year),
          adjustment_days: Number(adjustmentDays),
          reason: reason.trim(),
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to adjust balance.');
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
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Adjust Staff Leave Balance</h3>
              <p className="text-xs text-slate-500">Manual credit (+), debit (-) or special entitlement adjustment</p>
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Staff Member *</label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(Number(e.target.value))}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            >
              <option value="">Select Employee...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.staff_code} — {s.first_name} {s.last_name || ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Leave Type *</label>
              <select
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="">Select Type...</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.leave_code} — {lt.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Leave Year *"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              required
            />
          </div>

          <Input
            label="Adjustment Days (+ / -) *"
            type="number"
            step="0.5"
            placeholder="e.g. +2 for credit, -1 for debit"
            value={adjustmentDays}
            onChange={(e) => setAdjustmentDays(Number(e.target.value))}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Adjustment Reason *</label>
            <textarea
              rows={2}
              placeholder="e.g. Special entitlement granted by Owner, balance correction"
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
              Apply Adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, TrendingUp, AlertCircle } from 'lucide-react';

interface AppraisalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: any[];
  cycleList: any[];
}

export const AppraisalModal: React.FC<AppraisalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  cycleList,
}) => {
  const [staffId, setStaffId] = useState<number | ''>('');
  const [cycleId, setCycleId] = useState<number | ''>('');
  const [incrementType, setIncrementType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT' | 'NO_INCREMENT'>('PERCENTAGE');
  const [incrementValue, setIncrementValue] = useState<number>(8);
  const [incentiveAmount, setIncentiveAmount] = useState<number>(5000);
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStaffId(staffList.length > 0 ? staffList[0].id : '');
      setCycleId(cycleList.length > 0 ? cycleList[0].id : '');
      setIncrementType('PERCENTAGE');
      setIncrementValue(8);
      setIncentiveAmount(5000);
      setReason('Consistently exceeds sales targets and attendance metrics (Score: 91%)');
      setError('');
    }
  }, [isOpen, staffList, cycleList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId || !cycleId) {
      setError('Please select staff member and appraisal cycle.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.performance) {
        const res = await window.api.performance.submitAppraisal({
          staff_id: Number(staffId),
          cycle_id: Number(cycleId),
          recommended_increment_type: incrementType,
          recommended_increment_value: Number(incrementValue),
          recommended_incentive: Number(incentiveAmount),
          reason: reason.trim(),
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to submit appraisal recommendation.');
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Appraisal Recommendation</h3>
              <p className="text-xs text-slate-500">Recommend salary increment % and performance incentive</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Employee *</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              >
                <option value="">Select Staff...</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.staff_code} — {s.first_name} {s.last_name || ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Appraisal Cycle *</label>
              <select
                value={cycleId}
                onChange={(e) => setCycleId(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              >
                <option value="">Select Cycle...</option>
                {cycleList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Increment Type *</label>
              <select
                value={incrementType}
                onChange={(e) => setIncrementType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              >
                <option value="PERCENTAGE">PERCENTAGE (%)</option>
                <option value="FIXED_AMOUNT">FIXED AMOUNT (₹)</option>
                <option value="NO_INCREMENT">NO INCREMENT</option>
              </select>
            </div>

            {incrementType !== 'NO_INCREMENT' && (
              <Input
                label={incrementType === 'PERCENTAGE' ? 'Increment Value (%) *' : 'Increment Amount (₹) *'}
                type="number"
                value={incrementValue}
                onChange={(e) => setIncrementValue(Number(e.target.value))}
                required
              />
            )}
          </div>

          <Input
            label="Recommended Performance Incentive (₹)"
            type="number"
            value={incentiveAmount}
            onChange={(e) => setIncentiveAmount(Number(e.target.value))}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Justification & Reason *</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Submit Recommendation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { StaffLeaveTypeOption, StaffLeaveBalanceItem } from '../../services/staffLeaveService';
import { Plus, X, Calendar, AlertCircle, Check } from 'lucide-react';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    duration_type?: 'FULL_DAY' | 'HALF_DAY';
    session?: 'MORNING' | 'AFTERNOON';
    reason: string;
    attachment_path?: string;
  }) => Promise<boolean>;
  leaveTypes: StaffLeaveTypeOption[];
  balances: StaffLeaveBalanceItem[];
  isSubmitting: boolean;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  leaveTypes,
  balances,
  isSubmitting,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [leaveTypeId, setLeaveTypeId] = useState<number>(leaveTypes[0]?.id || 1);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [durationType, setDurationType] = useState<'FULL_DAY' | 'HALF_DAY'>('FULL_DAY');
  const [session, setSession] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Calculate duration automatically
  const calculatedDuration = useMemo(() => {
    if (durationType === 'HALF_DAY') return 0.5;
    if (!startDate || !endDate) return 0;
    if (startDate > endDate) return 0;
    try {
      const [y1, m1, d1] = startDate.split('-').map(Number);
      const [y2, m2, d2] = endDate.split('-').map(Number);
      const date1 = new Date(y1, m1 - 1, d1);
      const date2 = new Date(y2, m2 - 1, d2);
      const diffTime = Math.abs(date2.getTime() - date1.getTime());
      return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch {
      return 0;
    }
  }, [startDate, endDate, durationType]);

  const selectedBalance = useMemo(() => {
    return balances.find((b) => b.leaveTypeId === leaveTypeId);
  }, [balances, leaveTypeId]);

  const isBalanceInsufficient = useMemo(() => {
    if (!selectedBalance) return false;
    return selectedBalance.isPaid && calculatedDuration > selectedBalance.availableDays;
  }, [selectedBalance, calculatedDuration]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError('Please select start and end dates.');
      return;
    }
    if (startDate > endDate) {
      setError('End date cannot be earlier than start date.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the leave application.');
      return;
    }
    if (isBalanceInsufficient) {
      setError(`You do not have enough leave balance. Available: ${selectedBalance?.availableDays} days, Requested: ${calculatedDuration} days.`);
      return;
    }

    const ok = await onSubmit({
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: durationType === 'HALF_DAY' ? startDate : endDate,
      duration_type: durationType,
      session: durationType === 'HALF_DAY' ? session : undefined,
      reason: reason.trim(),
    });

    if (ok) {
      setReason('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center mx-auto mb-2 font-bold">
            <Plus className="w-6 h-6" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900">Apply For Leave</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Submit formal leave request for manager approval
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Leave Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(Number(e.target.value))}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white cursor-pointer"
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>

            {/* Selected Type Live Balance Badge */}
            {selectedBalance && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 font-semibold">Available Quota:</span>
                <span className={`font-extrabold ${selectedBalance.availableDays > 0 ? 'text-[#2012ad]' : 'text-rose-600'}`}>
                  {selectedBalance.availableDays} Days
                </span>
              </div>
            )}
          </div>

          {/* Full Day vs Half Day */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Duration Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDurationType('FULL_DAY')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  durationType === 'FULL_DAY'
                    ? 'bg-[#2012ad] text-white border-[#2012ad] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Full Day
              </button>
              <button
                type="button"
                onClick={() => setDurationType('HALF_DAY')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  durationType === 'HALF_DAY'
                    ? 'bg-[#2012ad] text-white border-[#2012ad] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Half Day (0.5)
              </button>
            </div>
          </div>

          {/* Half Day Session Selector */}
          {durationType === 'HALF_DAY' && (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5">
              <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider block">
                Select Half Day Session
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSession('MORNING')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    session === 'MORNING'
                      ? 'bg-white text-[#2012ad] border-[#2012ad] shadow-xs'
                      : 'bg-transparent text-slate-600 border-slate-200 hover:bg-white/50'
                  }`}
                >
                  Morning Session
                </button>
                <button
                  type="button"
                  onClick={() => setSession('AFTERNOON')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    session === 'AFTERNOON'
                      ? 'bg-white text-[#2012ad] border-[#2012ad] shadow-xs'
                      : 'bg-transparent text-slate-600 border-slate-200 hover:bg-white/50'
                  }`}
                >
                  Afternoon Session
                </button>
              </div>
            </div>
          )}

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                From Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (durationType === 'HALF_DAY') setEndDate(e.target.value);
                  }}
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white"
                />
              </div>
            </div>

            {durationType === 'FULL_DAY' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  To Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Duration
                </label>
                <div className="py-2 px-3 bg-slate-100 rounded-xl text-xs font-extrabold text-slate-700 text-center">
                  0.5 Day (Half Day)
                </div>
              </div>
            )}
          </div>

          {/* Automatic Duration Summary Pill */}
          {durationType === 'FULL_DAY' && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Total Calculated Duration:</span>
              <span className="font-extrabold text-[#2012ad] font-mono">
                {calculatedDuration} {calculatedDuration === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          )}

          {/* Insufficient Balance Warning */}
          {isBalanceInsufficient && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                You do not have enough leave balance. Available: {selectedBalance?.availableDays} days, Requested: {calculatedDuration} days.
              </span>
            </div>
          )}

          {/* Reason Textarea */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Leave <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain context for your leave (e.g. Family function, Medical emergency)..."
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isBalanceInsufficient}
              className="flex-1 py-3 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

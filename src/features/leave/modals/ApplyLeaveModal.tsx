import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: any[];
  leaveTypes: any[];
  initialStaffId?: number;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  leaveTypes,
  initialStaffId,
}) => {
  const [staffId, setStaffId] = useState<number | ''>('');
  const [leaveTypeId, setLeaveTypeId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationType, setDurationType] = useState<'FULL_DAY' | 'HALF_DAY'>('FULL_DAY');
  const [session, setSession] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStaffId(initialStaffId || (staffList.length > 0 ? staffList[0].id : ''));
      setLeaveTypeId(leaveTypes.length > 0 ? leaveTypes[0].id : '');
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setDurationType('FULL_DAY');
      setSession('MORNING');
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
    if (!startDate || !endDate) {
      setError('Please select start and end dates.');
      return;
    }
    if (startDate > endDate) {
      setError('Start date cannot be later than end date.');
      return;
    }
    if (!reason.trim()) {
      setError('Please state a reason for this leave request.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.leave) {
        const res = await window.api.leave.apply({
          staff_id: Number(staffId),
          leave_type_id: Number(leaveTypeId),
          start_date: startDate,
          end_date: durationType === 'HALF_DAY' ? startDate : endDate,
          duration_type: durationType,
          session: durationType === 'HALF_DAY' ? session : undefined,
          reason: reason.trim(),
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to submit leave request.');
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
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Apply for Leave</h3>
              <p className="text-xs text-slate-500">Submit employee leave request for approval</p>
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
                  {s.staff_code} — {s.first_name} {s.last_name || ''} ({s.department_name || 'Staff'})
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
                    {lt.leave_code} — {lt.name} ({lt.paid ? 'Paid' : 'Unpaid'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration *</label>
              <select
                value={durationType}
                onChange={(e) => setDurationType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY">Half Day (0.5)</option>
              </select>
            </div>
          </div>

          {durationType === 'FULL_DAY' ? (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date *"
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); }}
                required
              />
              <Input
                label="End Date *"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Leave Date *"
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setEndDate(e.target.value); }}
                required
              />
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Half Day Session *</label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
                >
                  <option value="MORNING">Morning Session</option>
                  <option value="AFTERNOON">Afternoon Session</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason for Leave *</label>
            <textarea
              rows={3}
              placeholder="e.g. Family function, personal medical appointment"
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
              Submit Leave Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

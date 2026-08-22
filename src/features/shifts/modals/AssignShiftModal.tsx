import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, UserCheck, AlertCircle } from 'lucide-react';

interface AssignShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: any[];
  shiftTemplates: any[];
  initialStaffId?: number;
}

export const AssignShiftModal: React.FC<AssignShiftModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  shiftTemplates,
  initialStaffId,
}) => {
  const [staffId, setStaffId] = useState<number | ''>('');
  const [shiftTemplateId, setShiftTemplateId] = useState<number | ''>('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStaffId(initialStaffId || (staffList.length > 0 ? staffList[0].id : ''));
      setShiftTemplateId(shiftTemplates.length > 0 ? shiftTemplates[0].id : '');
      const today = new Date().toISOString().split('T')[0];
      setEffectiveFrom(today);
      setReason('');
      setError('');
    }
  }, [isOpen, initialStaffId, staffList, shiftTemplates]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId) {
      setError('Please select a staff member.');
      return;
    }
    if (!shiftTemplateId) {
      setError('Please select a shift template.');
      return;
    }
    if (!effectiveFrom) {
      setError('Please select an effective start date.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.shifts) {
        const res = await window.api.shifts.assignStaff({
          staff_id: Number(staffId),
          shift_template_id: Number(shiftTemplateId),
          effective_from: effectiveFrom,
          reason: reason.trim() || undefined,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to assign shift.');
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
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Assign Shift to Employee</h3>
              <p className="text-xs text-slate-500">Update active shift assignment preserving historical logs</p>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            >
              <option value="">Select Employee...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.staff_code} — {s.first_name} {s.last_name || ''} ({s.department_name || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Shift Template *</label>
            <select
              value={shiftTemplateId}
              onChange={(e) => setShiftTemplateId(Number(e.target.value))}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            >
              <option value="">Select Shift...</option>
              {shiftTemplates.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.shift_code} — {st.name} ({st.start_time} - {st.end_time})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Effective From Date *"
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            required
          />

          <Input
            label="Reason / Notes"
            placeholder="e.g. Internal roster change, promotions"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Assign Shift
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface ShiftOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: any[];
  shiftTemplates: any[];
}

export const ShiftOverrideModal: React.FC<ShiftOverrideModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  shiftTemplates,
}) => {
  const [staffId, setStaffId] = useState<number | ''>('');
  const [overrideDate, setOverrideDate] = useState('');
  const [shiftTemplateId, setShiftTemplateId] = useState<number | ''>('');
  const [isWeekOff, setIsWeekOff] = useState(false);
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStaffId(staffList.length > 0 ? staffList[0].id : '');
      setShiftTemplateId(shiftTemplates.length > 0 ? shiftTemplates[0].id : '');
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      setOverrideDate(tomorrow);
      setIsWeekOff(false);
      setReason('');
      setError('');
    }
  }, [isOpen, staffList, shiftTemplates]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId) {
      setError('Please select a staff member.');
      return;
    }
    if (!overrideDate) {
      setError('Please select override date.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason for this temporary shift change.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.shifts) {
        const res = await window.api.shifts.createOverride({
          staff_id: Number(staffId),
          override_date: overrideDate,
          shift_template_id: isWeekOff ? undefined : Number(shiftTemplateId),
          is_week_off: isWeekOff,
          reason: reason.trim(),
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to create shift override.');
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
              <h3 className="text-base font-bold text-slate-900">Create Temporary Shift Override</h3>
              <p className="text-xs text-slate-500">Single-day shift swap or special week-off override</p>
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

          <Input
            label="Override Date *"
            type="date"
            value={overrideDate}
            onChange={(e) => setOverrideDate(e.target.value)}
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_week_off_override"
              checked={isWeekOff}
              onChange={(e) => setIsWeekOff(e.target.checked)}
              className="w-4 h-4 text-[#2818cf] rounded border-slate-300 focus:ring-[#2818cf]"
            />
            <label htmlFor="is_week_off_override" className="text-xs font-bold text-slate-800 cursor-pointer">
              Mark as Special Week-Off Day
            </label>
          </div>

          {!isWeekOff && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Temporary Override Shift *</label>
              <select
                value={shiftTemplateId}
                onChange={(e) => setShiftTemplateId(Number(e.target.value))}
                required={!isWeekOff}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="">Select Shift...</option>
                {shiftTemplates.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.shift_code} — {st.name} ({st.start_time} - {st.end_time})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Override Reason *</label>
            <textarea
              rows={2}
              placeholder="e.g. Festival peak coverage, colleague shift swap"
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
              Create Shift Override
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

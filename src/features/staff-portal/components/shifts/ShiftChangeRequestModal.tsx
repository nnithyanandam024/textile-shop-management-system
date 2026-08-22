import React, { useState, useEffect } from 'react';
import { StaffShiftItem, ShiftTemplateOption } from '../../services/staffShiftService';
import { CalendarCheck, X, Check, AlertCircle, Calendar } from 'lucide-react';

interface ShiftChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: {
    target_date: string;
    requested_shift_template_id?: number;
    is_requested_week_off?: boolean;
    reason: string;
  }) => Promise<boolean>;
  prefilledShift?: StaffShiftItem | null;
  templates: ShiftTemplateOption[];
  isSubmitting: boolean;
}

export const ShiftChangeRequestModal: React.FC<ShiftChangeRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prefilledShift,
  templates,
  isSubmitting,
}) => {
  const [targetDate, setTargetDate] = useState(() => prefilledShift?.date || new Date().toISOString().slice(0, 10));
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(templates[0]?.id);
  const [isWeekOff, setIsWeekOff] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledShift) {
      setTargetDate(prefilledShift.date);
    }
  }, [prefilledShift]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetDate) {
      setError('Please select a target shift date.');
      return;
    }
    if (!isWeekOff && !selectedTemplateId) {
      setError('Please select your preferred shift template or toggle Week Off.');
      return;
    }
    if (!reason.trim()) {
      setError('Please describe why you are requesting this schedule adjustment.');
      return;
    }

    const ok = await onSubmit({
      target_date: targetDate,
      requested_shift_template_id: isWeekOff ? undefined : selectedTemplateId,
      is_requested_week_off: isWeekOff,
      reason: reason.trim(),
    });

    if (ok) {
      setReason('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center mx-auto mb-2">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900">Request Shift Change</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Submit a schedule adjustment for management review & approval
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Target Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Shift Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white"
              />
            </div>
          </div>

          {/* Week Off Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Request as Weekly Off</span>
              <span className="text-[11px] text-slate-500 font-medium">Request this day to be an off day</span>
            </div>
            <input
              type="checkbox"
              checked={isWeekOff}
              onChange={(e) => setIsWeekOff(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 text-[#2012ad] rounded border-slate-300 focus:ring-[#2012ad]"
            />
          </div>

          {/* Preferred Shift Template */}
          {!isWeekOff && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Requested Shift Timing <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white cursor-pointer"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.startTime} – {t.endTime})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason / Explanation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Provide context for this schedule request (e.g. University exam, Personal emergency)..."
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
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5"
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

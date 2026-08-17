import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, Clock, AlertCircle } from 'lucide-react';

interface ShiftTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  templateToEdit?: any;
}

export const ShiftTemplateModal: React.FC<ShiftTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  templateToEdit,
}) => {
  const [shiftCode, setShiftCode] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [graceMinutes, setGraceMinutes] = useState(10);
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [minimumWorkMinutes, setMinimumWorkMinutes] = useState(480);
  const [isOvernight, setIsOvernight] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (templateToEdit) {
        setShiftCode(templateToEdit.shift_code || '');
        setName(templateToEdit.name || '');
        setStartTime(templateToEdit.start_time || '09:00');
        setEndTime(templateToEdit.end_time || '18:00');
        setGraceMinutes(templateToEdit.grace_minutes ?? 10);
        setBreakMinutes(templateToEdit.break_minutes ?? 60);
        setMinimumWorkMinutes(templateToEdit.minimum_work_minutes ?? 480);
        setIsOvernight(!!templateToEdit.is_overnight);
      } else {
        setShiftCode('');
        setName('');
        setStartTime('09:00');
        setEndTime('18:00');
        setGraceMinutes(10);
        setBreakMinutes(60);
        setMinimumWorkMinutes(480);
        setIsOvernight(false);
      }
      setError('');
    }
  }, [isOpen, templateToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Shift name is required.');
      return;
    }
    if (startTime === endTime && !isOvernight) {
      setError('Shift start time and end time cannot be identical.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.shifts) {
        if (templateToEdit) {
          const res = await window.api.shifts.updateTemplate(templateToEdit.id, {
            name: name.trim(),
            start_time: startTime,
            end_time: endTime,
            grace_minutes: Number(graceMinutes),
            break_minutes: Number(breakMinutes),
            minimum_work_minutes: Number(minimumWorkMinutes),
            is_overnight: isOvernight,
          });

          if (res.success) {
            onSuccess();
            onClose();
          } else {
            setError(res.error || 'Failed to update shift template.');
          }
        } else {
          const res = await window.api.shifts.createTemplate({
            shift_code: shiftCode.trim().toUpperCase() || 'CUSTOM',
            name: name.trim(),
            start_time: startTime,
            end_time: endTime,
            grace_minutes: Number(graceMinutes),
            break_minutes: Number(breakMinutes),
            minimum_work_minutes: Number(minimumWorkMinutes),
            is_overnight: isOvernight,
          });

          if (res.success) {
            onSuccess();
            onClose();
          } else {
            setError(res.error || 'Failed to create shift template.');
          }
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
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {templateToEdit ? 'Edit Shift Template' : 'Add New Shift Template'}
              </h3>
              <p className="text-xs text-slate-500">Configure operating timings, grace period and break rules</p>
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

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Input
                label="Shift Code *"
                placeholder="e.g. MORNING"
                value={shiftCode}
                onChange={(e) => setShiftCode(e.target.value.toUpperCase())}
                disabled={!!templateToEdit}
                required
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Shift Name *"
                placeholder="e.g. Morning Shift"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time *"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time *"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Grace (Mins)"
              type="number"
              value={graceMinutes}
              onChange={(e) => setGraceMinutes(Number(e.target.value))}
            />
            <Input
              label="Break (Mins)"
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
            />
            <Input
              label="Full Work (Mins)"
              type="number"
              value={minimumWorkMinutes}
              onChange={(e) => setMinimumWorkMinutes(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_overnight"
              checked={isOvernight}
              onChange={(e) => setIsOvernight(e.target.checked)}
              className="w-4 h-4 text-[#2818cf] rounded border-slate-300 focus:ring-[#2818cf]"
            />
            <label htmlFor="is_overnight" className="text-xs font-bold text-slate-800 cursor-pointer">
              Overnight Shift (Spans midnight to next day)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              {templateToEdit ? 'Save Changes' : 'Create Shift Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

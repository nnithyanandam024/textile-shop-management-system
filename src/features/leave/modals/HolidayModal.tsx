import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const HolidayModal: React.FC<HolidayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [type, setType] = useState<'PUBLIC' | 'SHOP' | 'OPTIONAL' | 'SPECIAL'>('PUBLIC');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setHolidayDate(new Date().toISOString().split('T')[0]);
      setType('PUBLIC');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Holiday name is required.');
      return;
    }
    if (!holidayDate) {
      setError('Holiday date is required.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.leave) {
        const res = await window.api.leave.createHoliday({
          name: name.trim(),
          holiday_date: holidayDate,
          type,
          description: description.trim() || undefined,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to add holiday.');
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
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Shop Holiday</h3>
              <p className="text-xs text-slate-500">Configure store public and festival holidays</p>
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

          <Input
            label="Holiday Name *"
            placeholder="e.g. Independence Day, Diwali"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Holiday Date *"
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Holiday Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              >
                <option value="PUBLIC">National Public Holiday</option>
                <option value="SHOP">Shop Festival Holiday</option>
                <option value="OPTIONAL">Optional Holiday</option>
                <option value="SPECIAL">Special Event</option>
              </select>
            </div>
          </div>

          <Input
            label="Description / Notes"
            placeholder="e.g. Annual store celebration day"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Holiday
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

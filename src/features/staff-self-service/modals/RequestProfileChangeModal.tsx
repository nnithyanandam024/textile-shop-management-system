import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, UserCheck, AlertCircle } from 'lucide-react';

interface RequestProfileChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentValues: {
    phone?: string;
    department?: string;
    designation?: string;
    bank_account?: string;
  };
}

export const RequestProfileChangeModal: React.FC<RequestProfileChangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentValues,
}) => {
  const [fieldName, setFieldName] = useState('phone');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newValue.trim() || !reason.trim()) {
      setError('New value and justification reason are required.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.selfService) {
        const oldVal = (currentValues as any)[fieldName] || 'N/A';
        const res = await window.api.selfService.requestProfileChange({
          field_name: fieldName,
          old_value: String(oldVal),
          new_value: newValue.trim(),
          reason: reason.trim(),
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to submit profile change request.');
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
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Profile Change</h3>
              <p className="text-xs text-slate-500">Submit protected information update to management</p>
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Field</label>
            <select
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            >
              <option value="phone">Primary Phone Number</option>
              <option value="department">Department Transfer</option>
              <option value="designation">Designation Update</option>
              <option value="bank_account">Bank Account / Salary Details</option>
              <option value="emergency_contact">Emergency Contact Person</option>
            </select>
          </div>

          <Input
            label="Requested New Value *"
            placeholder="Enter requested value..."
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason for Request *</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="Explain why this profile change is required..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

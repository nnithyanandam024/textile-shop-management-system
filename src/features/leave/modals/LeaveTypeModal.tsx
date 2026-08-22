import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, Layers, AlertCircle } from 'lucide-react';

interface LeaveTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  typeToEdit?: any;
}

export const LeaveTypeModal: React.FC<LeaveTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  typeToEdit,
}) => {
  const [leaveCode, setLeaveCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [paid, setPaid] = useState(true);
  const [annualAllocation, setAnnualAllocation] = useState(12);
  const [carryForwardAllowed, setCarryForwardAllowed] = useState(false);
  const [maxCarryForward, setMaxCarryForward] = useState(0);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (typeToEdit) {
        setLeaveCode(typeToEdit.leave_code || '');
        setName(typeToEdit.name || '');
        setDescription(typeToEdit.description || '');
        setPaid(!!typeToEdit.paid);
        setAnnualAllocation(typeToEdit.annual_allocation ?? 12);
        setCarryForwardAllowed(!!typeToEdit.carry_forward_allowed);
        setMaxCarryForward(typeToEdit.max_carry_forward ?? 0);
        setMaxConsecutiveDays(typeToEdit.max_consecutive_days ?? 5);
      } else {
        setLeaveCode('');
        setName('');
        setDescription('');
        setPaid(true);
        setAnnualAllocation(12);
        setCarryForwardAllowed(false);
        setMaxCarryForward(0);
        setMaxConsecutiveDays(5);
      }
      setError('');
    }
  }, [isOpen, typeToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Leave type name is required.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.leave) {
        if (typeToEdit) {
          const res = await window.api.leave.updateType(typeToEdit.id, {
            name: name.trim(),
            description: description.trim() || undefined,
            paid,
            annual_allocation: Number(annualAllocation),
            carry_forward_allowed: carryForwardAllowed,
            max_carry_forward: Number(maxCarryForward),
            max_consecutive_days: Number(maxConsecutiveDays),
          });

          if (res.success) {
            onSuccess();
            onClose();
          } else {
            setError(res.error || 'Failed to update leave type.');
          }
        } else {
          const res = await window.api.leave.createType({
            leave_code: leaveCode.trim().toUpperCase() || 'CUSTOM',
            name: name.trim(),
            description: description.trim() || undefined,
            paid,
            annual_allocation: Number(annualAllocation),
            carry_forward_allowed: carryForwardAllowed,
            max_carry_forward: Number(maxCarryForward),
            max_consecutive_days: Number(maxConsecutiveDays),
          });

          if (res.success) {
            onSuccess();
            onClose();
          } else {
            setError(res.error || 'Failed to create leave type.');
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
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {typeToEdit ? 'Edit Leave Type Policy' : 'Create Leave Type Policy'}
              </h3>
              <p className="text-xs text-slate-500">Define annual quotas, paid status & carry forward rules</p>
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
            <Input
              label="Code *"
              placeholder="e.g. CL"
              value={leaveCode}
              onChange={(e) => setLeaveCode(e.target.value.toUpperCase())}
              disabled={!!typeToEdit}
              required
            />
            <div className="col-span-2">
              <Input
                label="Leave Name *"
                placeholder="e.g. Casual Leave"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <Input
            label="Description"
            placeholder="e.g. Casual personal time off"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Paid Status *</label>
              <select
                value={paid ? 'PAID' : 'UNPAID'}
                onChange={(e) => setPaid(e.target.value === 'PAID')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              >
                <option value="PAID">Paid Leave</option>
                <option value="UNPAID">Unpaid (Loss of Pay)</option>
              </select>
            </div>

            <Input
              label="Annual Quota (Days)"
              type="number"
              value={annualAllocation}
              onChange={(e) => setAnnualAllocation(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="carry_forward_allowed"
              checked={carryForwardAllowed}
              onChange={(e) => setCarryForwardAllowed(e.target.checked)}
              className="w-4 h-4 text-[#2012ad] rounded border-slate-300 focus:ring-[#2012ad]"
            />
            <label htmlFor="carry_forward_allowed" className="text-xs font-bold text-slate-800 cursor-pointer">
              Allow Carry Forward to Next Leave Year
            </label>
          </div>

          {carryForwardAllowed && (
            <Input
              label="Max Carry Forward Days"
              type="number"
              value={maxCarryForward}
              onChange={(e) => setMaxCarryForward(Number(e.target.value))}
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              {typeToEdit ? 'Save Policy Changes' : 'Create Leave Type'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

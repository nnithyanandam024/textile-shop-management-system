import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, DollarSign, AlertCircle } from 'lucide-react';

interface AssignSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: any[];
  initialStaffId?: number;
}

export const AssignSalaryModal: React.FC<AssignSalaryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  initialStaffId,
}) => {
  const [staffId, setStaffId] = useState<number | ''>('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [basicSalary, setBasicSalary] = useState<number>(20000);
  const [hraPercentage, setHraPercentage] = useState<number>(20);
  const [transportAllowance, setTransportAllowance] = useState<number>(1000);
  const [specialAllowance, setSpecialAllowance] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStaffId(initialStaffId || (staffList.length > 0 ? staffList[0].id : ''));
      setEffectiveFrom(new Date().toISOString().split('T')[0]);
      setBasicSalary(20000);
      setHraPercentage(20);
      setTransportAllowance(1000);
      setSpecialAllowance(0);
      setError('');
    }
  }, [isOpen, initialStaffId, staffList]);

  if (!isOpen) return null;

  const calculatedHra = Math.round((basicSalary * hraPercentage) / 100);
  const totalGross = basicSalary + calculatedHra + transportAllowance + specialAllowance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId) {
      setError('Please select a staff member.');
      return;
    }
    if (!basicSalary || basicSalary <= 0) {
      setError('Basic salary must be greater than 0.');
      return;
    }
    if (!effectiveFrom) {
      setError('Effective from date is required.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.salary) {
        // Fetch components for HRA, Transport, Special
        const res = await window.api.salary.assignStructure({
          staff_id: Number(staffId),
          effective_from: effectiveFrom,
          basic_salary: Number(basicSalary),
          allowances: [
            { component_id: 2, calculation_method: 'PERCENTAGE_OF_BASIC', value: Number(hraPercentage) }, // HRA
            { component_id: 3, calculation_method: 'FIXED', value: Number(transportAllowance) }, // Transport
            { component_id: 4, calculation_method: 'FIXED', value: Number(specialAllowance) }, // Special
          ],
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to assign salary structure.');
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
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Assign / Revise Salary Structure</h3>
              <p className="text-xs text-slate-500">Configure employee basic pay and monthly allowances</p>
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

          <Input
            label="Effective From Date *"
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Basic Salary (₹) *"
              type="number"
              value={basicSalary}
              onChange={(e) => setBasicSalary(Number(e.target.value))}
              required
            />
            <Input
              label="HRA (% of Basic)"
              type="number"
              value={hraPercentage}
              onChange={(e) => setHraPercentage(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Transport Allowance (₹)"
              type="number"
              value={transportAllowance}
              onChange={(e) => setTransportAllowance(Number(e.target.value))}
            />
            <Input
              label="Special Allowance (₹)"
              type="number"
              value={specialAllowance}
              onChange={(e) => setSpecialAllowance(Number(e.target.value))}
            />
          </div>

          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Calculated Gross Monthly Salary:</span>
            <span className="text-base text-[#2818cf]">₹{totalGross.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Structure
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

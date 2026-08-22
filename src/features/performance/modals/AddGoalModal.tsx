import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, Award, AlertCircle } from 'lucide-react';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: any[];
  cycleList: any[];
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  cycleList,
}) => {
  const [staffId, setStaffId] = useState<number | ''>('');
  const [cycleId, setCycleId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('SALES');
  const [targetValue, setTargetValue] = useState<number>(500000);
  const [unit, setUnit] = useState('₹');
  const [weight, setWeight] = useState<number>(20);
  const [priority, setPriority] = useState('HIGH');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStaffId(staffList.length > 0 ? staffList[0].id : '');
      setCycleId(cycleList.length > 0 ? cycleList[0].id : '');
      setTitle('');
      setCategory('SALES');
      setTargetValue(500000);
      setUnit('₹');
      setWeight(20);
      setPriority('HIGH');
      setError('');
    }
  }, [isOpen, staffList, cycleList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId) {
      setError('Please select a staff member.');
      return;
    }
    if (!title.trim()) {
      setError('Goal title is required.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.performance) {
        const res = await window.api.performance.createGoal({
          staff_id: Number(staffId),
          cycle_id: cycleId ? Number(cycleId) : undefined,
          title: title.trim(),
          category,
          target_value: Number(targetValue),
          unit,
          weight: Number(weight),
          priority,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to add staff goal.');
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
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Staff Goal</h3>
              <p className="text-xs text-slate-500">Assign measurable target & priority to staff member</p>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            >
              <option value="">Select Staff...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.staff_code} — {s.first_name} {s.last_name || ''}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Goal Title *"
            placeholder="e.g. Increase Monthly Textile Sales"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              >
                <option value="SALES">SALES</option>
                <option value="CUSTOMER_SERVICE">CUSTOMER_SERVICE</option>
                <option value="ATTENDANCE">ATTENDANCE</option>
                <option value="INVENTORY">INVENTORY</option>
                <option value="BILLING">BILLING</option>
                <option value="TEAMWORK">TEAMWORK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Target *"
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              required
            />
            <Input
              label="Unit *"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            />
            <Input
              label="Weight (%) *"
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Add Goal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

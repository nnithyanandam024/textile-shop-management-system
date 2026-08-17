import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, BadgeCheck } from 'lucide-react';

interface DesignationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  designation?: any;
  departments: any[];
}

export const DesignationModal: React.FC<DesignationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  designation,
  departments,
}) => {
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (designation) {
      setName(designation.name || '');
      setDepartmentId(designation.department_id || '');
      setDescription(designation.description || '');
    } else {
      setName('');
      setDepartmentId(departments.length > 0 ? departments[0].id : '');
      setDescription('');
    }
    setError('');
  }, [designation, isOpen, departments]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Designation title is required.');
      return;
    }
    if (!departmentId) {
      setError('Please select a department.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.designation) {
        let res;
        if (designation) {
          res = await window.api.designation.update('', designation.id, {
            name: name.trim(),
            department_id: Number(departmentId),
            description: description.trim(),
          });
        } else {
          res = await window.api.designation.create('', {
            name: name.trim(),
            department_id: Number(departmentId),
            description: description.trim(),
          });
        }

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to save designation.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
              <BadgeCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {designation ? 'Edit Designation' : 'Add New Designation'}
              </h3>
              <p className="text-xs text-slate-500">Configure role title & department hierarchy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <Input
            label="Designation Title *"
            placeholder="e.g. Sales Executive, Store Manager"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Department *</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(Number(e.target.value))}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf] transition-all"
            >
              <option value="">Select Department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="Brief role responsibilities & scope"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 p-3 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf] transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              {designation ? 'Update Designation' : 'Create Designation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

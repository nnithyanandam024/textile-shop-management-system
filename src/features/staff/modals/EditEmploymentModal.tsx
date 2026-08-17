import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, Briefcase } from 'lucide-react';

interface EditEmploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff: any;
  departments: any[];
  designations: any[];
  allStaff: any[];
}

export const EditEmploymentModal: React.FC<EditEmploymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staff,
  departments,
  designations,
  allStaff,
}) => {
  const [joiningDate, setJoiningDate] = useState('');
  const [confirmationDate, setConfirmationDate] = useState('');
  const [exitDate, setExitDate] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [designationId, setDesignationId] = useState<number | ''>('');
  const [managerId, setManagerId] = useState<number | ''>('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [status, setStatus] = useState('ACTIVE');
  const [workLocation, setWorkLocation] = useState('Main Store');
  const [availableDesignations, setAvailableDesignations] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (staff) {
      setJoiningDate(staff.joining_date || '');
      setConfirmationDate(staff.confirmation_date || '');
      setExitDate(staff.exit_date || '');
      setDepartmentId(staff.department_id || '');
      setDesignationId(staff.designation_id || '');
      setManagerId(staff.manager_id || '');
      setEmploymentType(staff.employment_type || 'FULL_TIME');
      setStatus(staff.status || 'ACTIVE');
      setWorkLocation(staff.work_location || 'Main Store');
    }
    setError('');
  }, [staff, isOpen]);

  useEffect(() => {
    if (departmentId) {
      const filtered = designations.filter((d) => d.department_id === Number(departmentId));
      setAvailableDesignations(filtered);
      if (designationId && !filtered.some((d) => d.id === Number(designationId))) {
        setDesignationId(filtered.length > 0 ? filtered[0].id : '');
      }
    } else {
      setAvailableDesignations([]);
      setDesignationId('');
    }
  }, [departmentId, designations]);

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!joiningDate) {
      setError('Joining date is required.');
      return;
    }
    if (!departmentId) {
      setError('Department is required.');
      return;
    }
    if (!designationId) {
      setError('Designation is required.');
      return;
    }
    if (managerId && Number(managerId) === staff.id) {
      setError('Staff member cannot report to themselves.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.staff) {
        const res = await window.api.staff.update('', staff.id, {
          joining_date: joiningDate,
          confirmation_date: confirmationDate || undefined,
          exit_date: exitDate || undefined,
          department_id: Number(departmentId),
          designation_id: Number(designationId),
          manager_id: managerId ? Number(managerId) : undefined,
          employment_type: employmentType,
          status,
          work_location: workLocation,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to update employment details.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const possibleManagers = allStaff.filter((s) => s.id !== staff.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200/80 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Employment Details</h3>
              <p className="text-xs text-slate-500">{staff.staff_code} — Dept, Designation, Manager & Status</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Department *</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Designation *</label>
              <select
                value={designationId}
                onChange={(e) => setDesignationId(Number(e.target.value))}
                required
                disabled={!departmentId}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf] disabled:opacity-50"
              >
                <option value="">Select Designation...</option>
                {availableDesignations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Reporting Manager</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            >
              <option value="">No Reporting Manager</option>
              {possibleManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name || ''} ({m.staff_code} - {m.designation_name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="TEMPORARY">Temporary</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Employment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>

          <Input
            label="Work Location"
            value={workLocation}
            onChange={(e) => setWorkLocation(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <Input
              label="Joining Date *"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              required
            />
            <Input
              label="Confirmation Date"
              type="date"
              value={confirmationDate}
              onChange={(e) => setConfirmationDate(e.target.value)}
            />
            <Input
              label="Exit Date"
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Employment Info
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

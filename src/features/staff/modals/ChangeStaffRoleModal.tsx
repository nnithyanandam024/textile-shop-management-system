import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';

interface ChangeStaffRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff: any;
  roles: any[];
}

export const ChangeStaffRoleModal: React.FC<ChangeStaffRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staff,
  roles,
}) => {
  const [roleId, setRoleId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (staff && staff.user_id) {
      // Find roleId for existing staff user
      const foundRole = roles.find((r) => r.name === staff.role_name);
      setRoleId(foundRole ? foundRole.id : '');
      setIsActive(staff.user_is_active !== undefined ? staff.user_is_active : 1);
    }
    setError('');
  }, [staff, roles, isOpen]);

  if (!isOpen || !staff || !staff.user_id) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!roleId) {
      setError('Please select a role.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.users) {
        const res = await window.api.users.update(staff.user_id, {
          role_id: Number(roleId),
          is_active: isActive,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to update user account role.');
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
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Manage Application Access</h3>
              <p className="text-xs text-slate-500">@{staff.username} — {staff.first_name} {staff.last_name || ''}</p>
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned System Role *</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.is_system_role ? '(System Role)' : '(Custom Role)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">User Account Login Status</label>
            <select
              value={isActive}
              onChange={(e) => setIsActive(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            >
              <option value={1}>ACTIVE — Can log into application</option>
              <option value={0}>DISABLED — Access blocked</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Access Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

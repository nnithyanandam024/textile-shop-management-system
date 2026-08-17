import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, UserPlus, ShieldCheck } from 'lucide-react';

interface CreateStaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff: any;
  roles: any[];
}

export const CreateStaffLoginModal: React.FC<CreateStaffLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staff,
  roles,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (staff) {
      const suggestedUsername = `${staff.first_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.${staff.staff_code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      setUsername(suggestedUsername);
      setPassword('');
      setConfirmPassword('');
      if (roles.length > 0) {
        // Default to Cashier or second role
        const cashier = roles.find((r) => r.name === 'Cashier') || roles[0];
        setRoleId(cashier.id);
      }
    }
    setError('');
  }, [staff, roles, isOpen]);

  useEffect(() => {
    if (roleId && window.api?.roles) {
      window.api.roles.getRolePermissions(Number(roleId)).then((perms) => {
        setSelectedRolePermissions(perms || []);
      });
    } else {
      setSelectedRolePermissions([]);
    }
  }, [roleId]);

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!roleId) {
      setError('Please select a system or custom role.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.users) {
        const fullName = `${staff.first_name} ${staff.last_name || ''}`.trim();
        const res = await window.api.users.createStaffLogin(staff.id, {
          username: username.trim().toLowerCase(),
          password,
          display_name: fullName,
          role_id: Number(roleId),
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to create staff login account.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === Number(roleId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Staff Login Account</h3>
              <p className="text-xs text-slate-500">{staff.staff_code} — {staff.first_name} {staff.last_name || ''}</p>
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

          <Input
            label="Username *"
            placeholder="e.g. arun.cashier"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password *"
              type="password"
              placeholder="At least 6 chars"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm Password *"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Assign Role *</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            >
              <option value="">Select Role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.is_system_role ? '(System Role)' : '(Custom Role)'}
                </option>
              ))}
            </select>
          </div>

          {/* Role Permissions Summary Preview Box */}
          {selectedRole && (
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2818cf]" />
                  {selectedRole.name} Permissions Summary
                </span>
                <span className="text-[10px] font-extrabold text-[#2818cf] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 font-mono">
                  {selectedRolePermissions.length} Granted
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">{selectedRole.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedRolePermissions.slice(0, 10).map((code) => (
                  <span key={code} className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 rounded-md">
                    ✓ {code}
                  </span>
                ))}
                {selectedRolePermissions.length > 10 && (
                  <span className="px-2 py-0.5 bg-slate-200 text-[10px] font-bold text-slate-600 rounded-md">
                    +{selectedRolePermissions.length - 10} more...
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Create Login Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

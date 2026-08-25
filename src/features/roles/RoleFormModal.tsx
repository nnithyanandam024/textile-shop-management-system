import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { PERMISSION_CATALOG } from '../../auth/permissionCatalog';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role?: any;
  allPermissions: any[];
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  role,
  allPermissions,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role) {
      setName(role.name || '');
      setDescription(role.description || '');
      if (window.api?.roles) {
        window.api.roles.getRolePermissions(role.id).then((perms) => {
          setSelectedPermissions(perms || []);
        });
      }
    } else {
      setName('');
      setDescription('');
      setSelectedPermissions([]);
    }
    setError('');
  }, [role, isOpen]);

  if (!isOpen) return null;

  // Use allPermissions or PERMISSION_CATALOG
  const sourcePermissions = allPermissions && allPermissions.length > 0 ? allPermissions : PERMISSION_CATALOG;

  // Group permissions by module
  const groupedPermissions: Record<string, any[]> = {};
  sourcePermissions.forEach((p) => {
    const mod = p.module || 'General';
    if (!groupedPermissions[mod]) groupedPermissions[mod] = [];
    groupedPermissions[mod].push(p);
  });

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleGroup = (moduleName: string) => {
    const groupCodes = groupedPermissions[moduleName].map((p) => p.code);
    const allSelected = groupCodes.every((code) => selectedPermissions.includes(code));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((c) => !groupCodes.includes(c)));
    } else {
      const combined = new Set([...selectedPermissions, ...groupCodes]);
      setSelectedPermissions(Array.from(combined));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Role name is required.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.roles) {
        let res;
        if (role) {
          res = await window.api.roles.update(role.id, {
            name: name.trim(),
            description: description.trim(),
            permissions: selectedPermissions,
          });
        } else {
          res = await window.api.roles.create({
            name: name.trim(),
            description: description.trim(),
            permissions: selectedPermissions,
          });
        }

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to save role.');
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {role ? `Edit Role Matrix: ${role.name}` : 'Create Custom System Role'}
              </h3>
              <p className="text-xs text-slate-500">Configure role name and granular permission checkboxes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Role Name *"
              placeholder="e.g. Senior Cashier, Floor Supervisor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={role?.is_system_role === 1}
              required
            />
            <Input
              label="Description"
              placeholder="Brief summary of privileges"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Module Permission Matrix ({selectedPermissions.length} selected)
              </h4>
              <button
                type="button"
                onClick={() => {
                  if (selectedPermissions.length === allPermissions.length) {
                    setSelectedPermissions([]);
                  } else {
                    setSelectedPermissions(allPermissions.map((p) => p.code));
                  }
                }}
                className="text-xs font-bold text-[#2012ad] hover:underline"
              >
                {selectedPermissions.length === allPermissions.length ? 'Deselect All' : 'Select All Permissions'}
              </button>
            </div>

            {/* Grouped Permission Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                const groupCodes = perms.map((p) => p.code);
                const allInGroup = groupCodes.every((c) => selectedPermissions.includes(c));

                return (
                  <div key={moduleName} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-900">{moduleName}</span>
                      <button
                        type="button"
                        onClick={() => toggleGroup(moduleName)}
                        className="text-[11px] font-bold text-[#2012ad] hover:underline flex items-center gap-1"
                      >
                        {allInGroup ? <CheckSquare className="w-3.5 h-3.5 text-[#2012ad]" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                        Toggle All
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {perms.map((p) => {
                        const isChecked = selectedPermissions.includes(p.code);
                        return (
                          <label key={p.code} className="flex items-start gap-2 cursor-pointer hover:bg-white p-1 rounded-lg transition-all">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(p.code)}
                              className="w-4 h-4 mt-0.5 rounded text-[#2012ad] border-slate-300 focus:ring-[#2012ad]"
                            />
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{p.code}</p>
                              {p.description && <p className="text-[10px] text-slate-400">{p.description}</p>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              {role ? 'Save Role Matrix' : 'Create Custom Role'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

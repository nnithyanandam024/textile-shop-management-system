import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RoleFormModal } from './RoleFormModal';
import { ShieldCheck, Plus, Edit2, Trash2, Users, AlertCircle } from 'lucide-react';

export const RoleListPage: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);

  // Delete modal state
  const [deletingRole, setDeletingRole] = useState<any | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchRolesData = async () => {
    setLoading(true);
    try {
      if (window.api?.roles) {
        const rList = await window.api.roles.getAll();
        setRoles(rList || []);
        const perms = await window.api.roles.getAllPermissions();
        setAllPermissions(perms || []);
      }
    } catch (err) {
      console.error('Failed to load roles list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (role: any) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRole) return;
    setDeleteError(null);
    try {
      if (window.api?.roles) {
        const res = await window.api.roles.delete(deletingRole.id);
        if (res.success) {
          setDeletingRole(null);
          fetchRolesData();
        } else {
          setDeleteError(res.error || 'Failed to delete role.');
        }
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Action failed.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf] shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Roles & Access Control</h1>
            <p className="text-xs font-semibold text-slate-500">Configure system roles & granular permission matrices</p>
          </div>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
          Create Custom Role
        </Button>
      </div>

      {/* Roles Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-medium">
          Loading system roles and permissions...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <Card key={role.id} className="space-y-4 flex flex-col justify-between hover:shadow-lg transition-all border border-slate-200/80">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{role.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          role.is_system_role === 1
                            ? 'bg-indigo-50 text-[#2818cf] border border-indigo-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {role.is_system_role === 1 ? 'System Role' : 'Custom Role'}
                      </span>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {role.user_count || 0} User(s)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(role)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#2818cf] hover:bg-indigo-50 transition-all"
                    title="Edit Role Matrix"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                  {role.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(role)}>
                  Configure Matrix
                </Button>

                {role.is_system_role === 0 && (
                  <button
                    onClick={() => setDeletingRole(role)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Delete Custom Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Role Form Modal */}
      <RoleFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchRolesData}
        role={selectedRole}
        allPermissions={allPermissions}
      />

      {/* Delete Confirmation Modal */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Custom Role?</h3>
                <p className="text-xs text-slate-500">{deletingRole.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              Are you sure you want to delete custom role <span className="font-bold">{deletingRole.name}</span>? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeletingRole(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete}>
                Delete Role
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

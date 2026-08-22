import React, { useState, useEffect } from 'react';
import { Users, UserPlus, CheckCircle2, XCircle, AlertCircle, RefreshCw, Loader2, KeyRound } from 'lucide-react';

interface UserRow {
  id: number;
  username: string;
  display_name: string;
  role_id: number;
  role_name?: string;
  is_active: number;
  last_login_at?: string;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  // Add User Form
  const [newDisplayName, setNewDisplayName] = useState<string>('');
  const [newUsername, setNewUsername] = useState<string>('');
  const [newRoleId, setNewRoleId] = useState<number>(2); // Default Manager
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Reset Password Form
  const [resetPass, setResetPass] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.users) {
        const data = await window.api.users.getAll();
        setUsers(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim() || !newUsername.trim() || !newPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setActionLoading(true);

    try {
      const res = await window.api.users.create({
        display_name: newDisplayName.trim(),
        username: newUsername.trim(),
        role_id: newRoleId,
        password: newPassword,
      });

      if (res.success) {
        setSuccess(`User '${newUsername}' created successfully.`);
        setShowAddModal(false);
        setNewDisplayName('');
        setNewUsername('');
        setNewPassword('');
        setConfirmPassword('');
        fetchUsers();
      } else {
        setError(res.error || 'Failed to create user.');
      }
    } catch (err: any) {
      setError(err.message || 'Create user error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserRow) => {
    setError('');
    const newStatus = user.is_active === 1 ? 0 : 1;
    try {
      const res = await window.api.users.update(user.id, { is_active: newStatus });
      if (res.success) {
        setSuccess(`User '${user.username}' status updated.`);
        fetchUsers();
      } else {
        setError(res.error || 'Failed to update user status.');
      }
    } catch (err: any) {
      setError(err.message || 'Update status error.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPass || resetPass.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setActionLoading(true);

    try {
      const res = await window.api.users.resetPassword(selectedUser.id, resetPass);
      if (res.success) {
        setSuccess(`Password for '${selectedUser.username}' reset successfully.`);
        setShowResetModal(false);
        setResetPass('');
        setSelectedUser(null);
      } else {
        setError(res.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      setError(err.message || 'Reset password error.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (roleName?: string) => {
    switch (roleName) {
      case 'Owner':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">Owner</span>;
      case 'Manager':
        return <span className="px-2.5 py-1 bg-indigo-50 text-[#2012ad] border border-indigo-200 rounded-full text-xs font-semibold">Manager</span>;
      case 'Cashier':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">Cashier</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold">{roleName || 'Staff'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2012ad]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">User & Role Management</h1>
            <p className="text-xs font-medium text-slate-500">Manage store access accounts and role permissions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all"
            title="Refresh Users"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-700 text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#2012ad] mb-2" />
            <span className="text-sm font-medium">Loading user directory...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Display Name</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{user.display_name}</td>
                  <td className="px-6 py-4 font-mono text-slate-600">@{user.username}</td>
                  <td className="px-6 py-4">{getRoleBadge(user.role_name)}</td>
                  <td className="px-6 py-4">
                    {user.is_active === 1 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowResetModal(true);
                      }}
                      className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-[#2012ad] rounded-lg border border-slate-200 transition-all"
                      title="Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        user.is_active === 1
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {user.is_active === 1 ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Account</h3>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Display Name *</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Username *</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. ramesh_cashier"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Assigned Role *</label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                >
                  <option value={1}>Owner (Full Control)</option>
                  <option value={2}>Manager (Operations)</option>
                  <option value={3}>Cashier (POS Billing)</option>
                  <option value={4}>Inventory Staff (Stock Operations)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4">Reset password for <span className="font-semibold text-slate-800">@{selectedUser.username}</span></p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">New Temporary Password</label>
                <input
                  type="password"
                  value={resetPass}
                  onChange={(e) => setResetPass(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Reset Password</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

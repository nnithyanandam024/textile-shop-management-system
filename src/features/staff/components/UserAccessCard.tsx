import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ShieldCheck, UserPlus, Lock, Key } from 'lucide-react';

interface UserAccessCardProps {
  staff: any;
  onCreateLogin: () => void;
  onChangeRole: () => void;
  onResetPassword: () => void;
}

export const UserAccessCard: React.FC<UserAccessCardProps> = ({
  staff,
  onCreateLogin,
  onChangeRole,
  onResetPassword,
}) => {
  return (
    <Card className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Application Access & Security</h3>
            <p className="text-xs text-slate-500">System login account, assigned role & permissions</p>
          </div>
        </div>

        <div>
          {staff.username ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" icon={<Key className="w-3.5 h-3.5" />} onClick={onResetPassword}>
                Reset Password
              </Button>
              <Button variant="outline" icon={<ShieldCheck className="w-3.5 h-3.5" />} onClick={onChangeRole}>
                Manage Role & Status
              </Button>
            </div>
          ) : (
            <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={onCreateLogin}>
              Create Login Account
            </Button>
          )}
        </div>
      </div>

      {!staff.username ? (
        <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No Login Account Linked</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            This employee does not currently have access to log into Ratna Vilas Management Software. Click "Create Login Account" to assign a username and role.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-semibold text-slate-700">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
            <p className="text-slate-400 uppercase tracking-wider text-[10px]">Username</p>
            <p className="text-sm font-extrabold text-[#2012ad] font-mono">@{staff.username}</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
            <p className="text-slate-400 uppercase tracking-wider text-[10px]">Assigned Role</p>
            <p className="text-sm font-bold text-slate-900">{staff.role_name || 'Staff User'}</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
            <p className="text-slate-400 uppercase tracking-wider text-[10px]">Account Access Status</p>
            <span
              className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                staff.user_is_active === 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              ● {staff.user_is_active === 0 ? 'DISABLED' : 'ACTIVE'}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

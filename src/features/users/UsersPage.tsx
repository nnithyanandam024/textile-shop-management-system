import React from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { UserCheck } from 'lucide-react';

export const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">User Management & Permissions</h2>
        <p className="text-xs text-slate-400">Admin, Manager, Cashier, and Inventory staff role-based access controls</p>
      </div>

      <Card>
        <EmptyState
          icon={<UserCheck className="w-8 h-8" />}
          title="User Access Control Architecture Ready"
          description="Local user authentication, password management, and fine-grained role permissions will be configured here."
        />
      </Card>
    </div>
  );
};

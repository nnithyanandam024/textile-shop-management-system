import React from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Users } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Customer Management</h2>
        <p className="text-xs text-slate-400">Customer profiles, purchase history, and outstanding credit balances</p>
      </div>

      <Card>
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="Customer Directory Module Ready"
          description="Customer registration, credit management, and transaction history tracking will be enabled in future phases."
        />
      </Card>
    </div>
  );
};

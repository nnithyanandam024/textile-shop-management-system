import React from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Truck } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Supplier Management</h2>
        <p className="text-xs text-slate-400">Textile wholesalers, manufacturers, contact details & ledger balances</p>
      </div>

      <Card>
        <EmptyState
          icon={<Truck className="w-8 h-8" />}
          title="Supplier Management Module Ready"
          description="Supplier directory, payables tracking, and purchase order linking will be populated here."
        />
      </Card>
    </div>
  );
};

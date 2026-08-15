import React from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PackagePlus } from 'lucide-react';

export const PurchasesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Purchase Orders & Stock Inward</h2>
        <p className="text-xs text-slate-400">Record supplier purchases, cost prices, and automatic stock inwarding</p>
      </div>

      <Card>
        <EmptyState
          icon={<PackagePlus className="w-8 h-8" />}
          title="Purchase Entry Module Ready"
          description="Purchase invoice creation, cost calculation, and automatic stock addition will be handled here."
        />
      </Card>
    </div>
  );
};

import React from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Boxes } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Inventory Management</h2>
        <p className="text-xs text-slate-400">Stock movements, adjustments, low-stock alerts, and audits</p>
      </div>

      <Card>
        <EmptyState
          icon={<Boxes className="w-8 h-8" />}
          title="Inventory Module Architecture Ready"
          description="Stock tracking, automatic deduction on sales, replenishment alerts, and stock history will be implemented in subsequent phases."
        />
      </Card>
    </div>
  );
};

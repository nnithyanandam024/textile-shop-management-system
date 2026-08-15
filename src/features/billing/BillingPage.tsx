import React from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ShoppingCart } from 'lucide-react';

export const BillingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">POS / Billing Terminal</h2>
        <p className="text-xs text-slate-400">Barcode scan, quick product lookup, discount, split payments & thermal printing</p>
      </div>

      <Card>
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8" />}
          title="POS Billing Terminal Shell Ready"
          description="Barcode scanning, cart operations, discount logic, tax calculation, and thermal/standard printing will be integrated in future phases."
        />
      </Card>
    </div>
  );
};

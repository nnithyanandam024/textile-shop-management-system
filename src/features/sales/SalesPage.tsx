import React from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Receipt } from 'lucide-react';

export const SalesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Sales History & Invoices</h2>
        <p className="text-xs text-slate-400">View past sales, reprint invoices, export PDFs, and process refunds</p>
      </div>

      <Card>
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title="Sales History Module Ready"
          description="Sales transaction lookup, PDF invoice generation, and transaction details will be loaded here."
        />
      </Card>
    </div>
  );
};

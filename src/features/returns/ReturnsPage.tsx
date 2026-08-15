import React from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Undo2 } from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Returns & Exchanges</h2>
        <p className="text-xs text-slate-400">Process customer returns, size exchanges, price differences & damaged stock</p>
      </div>

      <Card>
        <EmptyState
          icon={<Undo2 className="w-8 h-8" />}
          title="Returns & Exchange Workflow Ready"
          description="Invoice-linked item returns, size/color replacement exchanges, and stock adjustments will be handled here."
        />
      </Card>
    </div>
  );
};

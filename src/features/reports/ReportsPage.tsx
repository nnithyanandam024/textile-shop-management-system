import React from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Reports & Analytics</h2>
        <p className="text-xs text-slate-400">Sales summaries, revenue analysis, gross profit, inventory valuation & tax reports</p>
      </div>

      <Card>
        <EmptyState
          icon={<BarChart3 className="w-8 h-8" />}
          title="Reporting Engine Architecture Ready"
          description="Interactive Recharts charts, daily/monthly sales reports, category metrics, and financial reporting will be integrated in future phases."
        />
      </Card>
    </div>
  );
};

import React from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DatabaseBackup } from 'lucide-react';

export const BackupPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Backup & Restore</h2>
        <p className="text-xs text-slate-400">Manual database backups, automated update backups, and point-in-time recovery</p>
      </div>

      <Card>
        <EmptyState
          icon={<DatabaseBackup className="w-8 h-8" />}
          title="Backup & Recovery Architecture Ready"
          description="One-click SQLite database exports, backup verification, and automatic pre-update safety snapshots will be managed here."
        />
      </Card>
    </div>
  );
};

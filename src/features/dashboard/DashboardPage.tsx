import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SystemInfo } from '../../../electron/preload/index';
import { Cpu, HardDrive, CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    if (window.api?.app) {
      window.api.app.getSystemInfo().then(setSystemInfo).catch(console.error);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-brand-900/90 via-slate-900 to-slate-900 p-6 rounded-2xl border border-brand-500/30 flex items-center justify-between shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="success">Phase 1 Initialized</Badge>
            <span className="text-xs text-slate-400">Windows Desktop Architecture</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Textile Shop Management System</h2>
          <p className="text-sm text-slate-300">
            System core successfully initialized. React, TypeScript, Electron, Tailwind CSS & SQLite are operational.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <Button variant="primary" icon={<ShieldCheck className="w-4 h-4" />}>
            System Ready
          </Button>
        </div>
      </div>

      {/* Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card title="React + Vite UI" subtitle="Renderer Engine">
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-400">React 18</span>
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-400 mt-2">Tailwind CSS + Lucide Icons</p>
        </Card>

        <Card title="Electron Desktop" subtitle="Runtime Framework">
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-brand-400">v{systemInfo?.electronVersion || '34.2'}</span>
            <Cpu className="w-6 h-6 text-brand-400" />
          </div>
          <p className="text-xs text-slate-400 mt-2">Platform: {systemInfo?.platform || 'win32'}</p>
        </Card>

        <Card title="SQLite Database" subtitle="Local Persistence">
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-sky-400">Better-SQLite3</span>
            <HardDrive className="w-6 h-6 text-sky-400" />
          </div>
          <p className="text-xs text-slate-400 mt-2">WAL Mode & Auto Migration</p>
        </Card>

        <Card title="Node.js Core" subtitle="Main Process Engine">
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-purple-400">v{systemInfo?.nodeVersion || '22.x'}</span>
            <Terminal className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-xs text-slate-400 mt-2">Memory: {systemInfo?.freeMemMB}MB / {systemInfo?.totalMemMB}MB</p>
        </Card>
      </div>

      {/* Database Location Info */}
      <Card title="System Paths & Security Verification">
        <div className="space-y-3 text-sm">
          <div className="flex flex-col sm:flex-row justify-between p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Database File Path:</span>
            <code className="text-brand-300 text-xs font-mono break-all">{systemInfo?.dbPath || 'Loading...'}</code>
          </div>
          <div className="flex flex-col sm:flex-row justify-between p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Backup Storage Directory:</span>
            <code className="text-emerald-300 text-xs font-mono break-all">{systemInfo?.backupPath || 'Loading...'}</code>
          </div>
        </div>
      </Card>
    </div>
  );
};

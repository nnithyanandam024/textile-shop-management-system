import React, { useState, useEffect } from 'react';
import { ShieldCheck, HardDrive, Activity, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const fetchHealth = async () => {
    try {
      if (window.api && window.api.system) {
        const res = await window.api.system.getHealth();
        setHealth(res);
      }
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleRunIntegrityCheck = async () => {
    setChecking(true);
    setMessage('');
    try {
      if (window.api && window.api.system) {
        const res = await window.api.system.checkIntegrity();
        if (res.healthy && res.foreignKeysOk) {
          setMessage('SQLite quick_check & foreign_key_check passed 100% cleanly!');
        } else {
          setMessage('Warning: Integrity check reported potential database issues!');
        }
        fetchHealth();
      }
    } catch (err: any) {
      setMessage(err.message || 'Integrity check failed.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">System Health & Security Diagnostics</h1>
            <p className="text-xs font-medium text-slate-500">Local SQLite integrity, WAL durability mode, foreign key enforcement, and database health status</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunIntegrityCheck}
            disabled={checking}
            className="px-4 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>Run Integrity Check</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">SQLITE INTEGRITY</span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-extrabold text-slate-900">
              {health?.integrityPassed ? 'PASSED ✓' : 'FAILED ⚠'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">PRAGMA quick_check</p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <Lock className="w-5 h-5 text-[#2012ad]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">FOREIGN KEYS</span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-extrabold text-slate-900">
              {health?.foreignKeysOk || health?.foreignKeysPassed ? 'ENABLED ✓' : 'CHECK FAILED'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">PRAGMA foreign_key_check</p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <HardDrive className="w-5 h-5 text-sky-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">DATABASE SIZE</span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-extrabold text-slate-900">
              {health?.sizeBytes ? (health.sizeBytes / 1024 / 1024).toFixed(2) + ' MB' : '0 MB'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{health?.tablesCount || 0} Tables Active</p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <Activity className="w-5 h-5 text-amber-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">LAST BACKUP</span>
          </div>
          <div className="mt-3">
            <p className="text-sm font-extrabold text-slate-900">
              {health?.lastBackupDate ? new Date(health.lastBackupDate).toLocaleDateString() : 'No Backups'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Automated Retention</p>
          </div>
        </Card>
      </div>

      {/* Database Details */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Database Storage Configuration</h3>
        
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
            <span className="font-semibold text-slate-700">Live Database File Location:</span>
            <span className="font-mono font-bold text-slate-900">{health?.databasePath || 'Loading...'}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
            <span className="font-semibold text-slate-700">Persistent Backups Directory:</span>
            <span className="font-mono font-bold text-slate-900">{health?.backupDirectory || 'Loading...'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { DatabaseBackup, RefreshCw, AlertTriangle, CheckCircle2, Trash2, Loader2, FileCode } from 'lucide-react';

interface BackupItem {
  id: string;
  filename: string;
  filepath: string;
  sizeBytes: number;
  sha256: string;
  status: 'VERIFIED' | 'FAILED';
  isEmergency: boolean;
  createdAt: string;
}

export const BackupPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [selectedRestoreBackup, setSelectedRestoreBackup] = useState<BackupItem | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.backup) {
        const list = await window.api.backup.list();
        setBackups(list);
      }
    } catch (err) {
      console.error('Failed to load backups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setMessage(null);
    setActionLoading(true);
    try {
      if (window.api && window.api.backup) {
        const res = await window.api.backup.create();
        if (res.success) {
          setMessage({ type: 'success', text: `Backup created and verified successfully! (SHA256: ${res.sha256?.substring(0, 12)}...)` });
          fetchBackups();
        } else {
          setMessage({ type: 'error', text: res.error || 'Backup creation failed.' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Backup error.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyBackup = async (filename: string) => {
    setMessage(null);
    try {
      if (window.api && window.api.backup) {
        const res = await window.api.backup.verify(filename);
        if (res.valid) {
          setMessage({ type: 'success', text: `Backup file ${filename} passed SQLite integrity check!` });
        } else {
          setMessage({ type: 'error', text: `Backup file ${filename} failed integrity check!` });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Verification error.' });
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete backup file ${filename}?`)) return;

    setMessage(null);
    try {
      if (window.api && window.api.backup) {
        const res = await window.api.backup.delete(filename);
        if (res.success) {
          setMessage({ type: 'success', text: `Backup ${filename} deleted.` });
          fetchBackups();
        } else {
          setMessage({ type: 'error', text: res.error || 'Delete failed.' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Delete error.' });
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedRestoreBackup) return;

    setMessage(null);
    setActionLoading(true);
    try {
      if (window.api && window.api.backup) {
        const res = await window.api.backup.restore(selectedRestoreBackup.filename);
        if (res.success) {
          setMessage({ type: 'success', text: `Database restored from ${selectedRestoreBackup.filename} successfully!` });
          setSelectedRestoreBackup(null);
          fetchBackups();
        } else {
          setMessage({ type: 'error', text: res.error || 'Restore failed.' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Restore error.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2012ad]">
            <DatabaseBackup className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Database Backup & Disaster Recovery</h1>
            <p className="text-xs font-medium text-slate-500">SHA-256 checksummed backups, automatic retention rotation, and fail-safe restore with emergency snapshots</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBackups}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all"
            title="Refresh Backups"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2012ad]' : ''}`} />
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={actionLoading}
            className="px-4 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseBackup className="w-4 h-4" />}
            <span>Backup Now</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Backups Directory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">Backups Directory ({backups.length})</h3>
          <span className="text-[11px] font-bold text-slate-400 uppercase">RETENTION: LAST 10 BACKUPS</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2012ad] mx-auto mb-2" />
            <span className="text-sm font-medium">Scanning backups directory...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No backups generated yet. Click "Backup Now" above.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Filename</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">SHA-256 Hash</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-slate-400" />
                      <span className="font-mono font-bold text-slate-900">{b.filename}</span>
                      {b.isEmergency && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                          EMERGENCY
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(b.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">{(b.sizeBytes / 1024 / 1024).toFixed(2)} MB</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400" title={b.sha256}>
                    {b.sha256.substring(0, 14)}...
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        b.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleVerifyBackup(b.filename)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-all"
                      title="Run Integrity Check"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => setSelectedRestoreBackup(b)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-[#2012ad] border border-indigo-200 rounded text-xs font-bold transition-all"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(b.filename)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-all"
                      title="Delete Backup"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {selectedRestoreBackup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative animate-scale-up space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Confirm Database Restore</h3>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <p className="font-bold">Target Backup: {selectedRestoreBackup.filename}</p>
              <p className="text-amber-800">
                An <strong>Emergency Safety Snapshot</strong> of your current database will be created automatically before restoring. Post-restore integrity verification will execute immediately.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRestoreBackup(null)}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={actionLoading}
                className="w-1/2 py-2.5 bg-[#2012ad] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Execute Restore</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

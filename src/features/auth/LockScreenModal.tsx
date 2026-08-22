import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Lock, LogOut, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export const LockScreenModal: React.FC = () => {
  const { currentUser, unlockScreen, logout } = useAuth();
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await unlockScreen(password);
      if (!res.success) {
        setError(res.error || 'Invalid password.');
      }
    } catch (err: any) {
      setError(err.message || 'Unlock error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-6 text-center relative">
        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#2012ad]">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900">Session Locked</h2>
        <p className="text-sm font-medium text-slate-500 mt-1 mb-6">
          Logged in as <span className="font-semibold text-slate-800">{currentUser?.displayName}</span> ({currentUser?.roleName})
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs text-left">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to unlock"
              autoFocus
              className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Unlock Screen</span>}
          </button>
        </form>

        <button
          type="button"
          onClick={() => logout()}
          className="mt-4 text-xs font-semibold text-slate-500 hover:text-red-600 inline-flex items-center gap-1 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Switch Account / Logout</span>
        </button>
      </div>
    </div>
  );
};

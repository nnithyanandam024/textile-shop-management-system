import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { DemoCredentialsHelper } from '../../components/ui/DemoCredentialsHelper';
import { getDefaultRouteForUser } from '../../auth/permissions';
import { StorageManager } from '../../utils/storage';
import { Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username or Staff ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await login(username.trim(), password);
      if (res.success) {
        const user = StorageManager.getCurrentUser();
        const targetRoute = getDefaultRouteForUser(user);
        navigate(targetRoute, { replace: true });
      } else {
        setError(res.error || 'Invalid username/staff ID or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f9fafc] flex flex-col justify-center items-center p-4 py-8 relative select-none overflow-y-auto">
      {/* Background Subtle Gradient Canvas Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 my-auto relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-white border border-amber-200/90 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md overflow-hidden p-1">
            <img src="/logo.png" alt="ரத்னா விலாஸ்" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">ரத்னா விலாஸ்</h1>
          <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider mt-0.5">Ratna Vilas • பட்டு &amp; ஜவுளி மாளிகை</p>
          <p className="text-xs text-slate-500 font-medium mt-1">வணக்கம்! உங்கள் கணக்கில் உள்நுழையவும்</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-3 text-red-700 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Username or Staff ID
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. admin, STF-0001, arun.cashier"
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2012ad] focus:bg-white transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your password"
                disabled={loading}
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2012ad] focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#2012ad] hover:bg-[#1a0e91] active:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Login to System</span>
            )}
          </button>
        </form>

        {/* Quick Demo Login Credentials Helper */}
        <DemoCredentialsHelper
          onSelect={(uname, pw) => {
            setUsername(uname);
            setPassword(pw);
            setError('');
          }}
        />

        {/* Footer info */}
        <div className="mt-5 text-center text-xs text-slate-400 font-medium border-t border-slate-100 pt-3">
          Texora Retail & POS Software • Version 0.1.0
        </div>
      </div>
    </div>
  );
};

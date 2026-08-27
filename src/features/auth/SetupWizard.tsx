import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Store, User, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const SetupWizard: React.FC = () => {
  const { checkAuth } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [shopName, setShopName] = useState<string>('My Textile Store');
  const [shopAddress, setShopAddress] = useState<string>('');
  const [shopPhone, setShopPhone] = useState<string>('');
  const [gstNumber, setGstNumber] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setError('Please enter your shop name.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) {
      setError('Please enter the owner name.');
      return;
    }
    if (!username.trim()) {
      setError('Please enter an admin username.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (window.api && window.api.auth) {
        const res = await window.api.auth.firstTimeSetup({
          shopName: shopName.trim(),
          shopAddress: shopAddress.trim(),
          shopPhone: shopPhone.trim(),
          gstNumber: gstNumber.trim(),
          ownerName: ownerName.trim(),
          adminUsername: username.trim(),
          adminPassword: password,
        });

        if (res.success) {
          await checkAuth();
        } else {
          setError(res.error || 'Failed to complete setup.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Setup error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafc] flex flex-col justify-center items-center p-4 relative">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 1 ? 'bg-[#2012ad] text-white' : 'bg-emerald-500 text-white'}`}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-sm font-semibold text-slate-800">Shop Setup</span>
          </div>

          <div className="w-12 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 2 ? 'bg-[#2012ad] text-white' : 'bg-slate-100 text-slate-400'}`}>
              2
            </div>
            <span className="text-sm font-semibold text-slate-800">Owner Account</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            <div className="text-center mb-6">
              <Store className="w-10 h-10 text-[#2012ad] mx-auto mb-2" />
              <h2 className="text-xl font-bold text-slate-900">Welcome to Ratna Vilas (ரத்னா விலாஸ்)</h2>
              <p className="text-sm text-slate-500">Configure your textile shop business details</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Shop Name *</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Royal Textile & Saree Store"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Shop Address</label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Street address, City"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                <input
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">GST Number</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="33AAAAA0000A1Z5"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-4 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all"
            >
              Continue to Owner Setup →
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinish} className="space-y-4">
            <div className="text-center mb-6">
              <User className="w-10 h-10 text-[#2012ad] mx-auto mb-2" />
              <h2 className="text-xl font-bold text-slate-900">Create Administrator Account</h2>
              <p className="text-sm text-slate-500">Set up the primary Owner account for Ratna Vilas</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Owner Display Name *</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Nithyanandam (Store Owner)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Admin Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Complete Setup</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

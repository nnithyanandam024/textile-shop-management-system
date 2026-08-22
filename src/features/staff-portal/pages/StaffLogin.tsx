import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../hooks/useStaffAuth';
import { staffAuthService } from '../services/staffAuthService';
import { DemoCredentialsHelper } from '../../../components/ui/DemoCredentialsHelper';
import { User, Lock, Eye, EyeOff, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

export const StaffLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentStaffUser, login } = useStaffAuth();

  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    // If already logged in as staff, redirect to dashboard
    if (currentStaffUser) {
      const from = (location.state as any)?.from?.pathname || '/staff/dashboard';
      navigate(from, { replace: true });
    } else {
      // Check for remembered employee ID
      const savedId = staffAuthService.getRememberedEmployeeId();
      if (savedId) {
        setEmployeeId(savedId);
        setRememberMe(true);
      }
    }
  }, [currentStaffUser, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedId = employeeId.trim();
    const trimmedPw = password.trim();

    // Client-side validations
    if (!trimmedId && !trimmedPw) {
      setError('Please enter your Employee ID and Password.');
      return;
    }
    if (!trimmedId) {
      setError('Employee ID is required.');
      return;
    }
    if (!trimmedPw) {
      setError('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(trimmedId, trimmedPw, rememberMe);
      if (result.success) {
        const from = (location.state as any)?.from?.pathname || '/staff/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Invalid Employee ID or Password.');
      }
    } catch (err: any) {
      setError('Unable to connect to the system. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/40 flex items-center justify-center p-4 selection:bg-[#2012ad] selection:text-white">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-10 relative overflow-hidden">
          {/* Top Brand Decorative Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#2012ad]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-[#2012ad] text-white shadow-lg shadow-[#2012ad]/25 mb-4 transform hover:scale-105 transition-transform">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              TEXTILE SHOP
            </h1>
            <p className="text-xs font-bold text-[#2012ad] tracking-wide mt-0.5">
              Staff Management System
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600">Staff Portal Login</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200 shadow-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Employee ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your employee ID (e.g. STF001)"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white transition-all disabled:opacity-50"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 rounded text-[#2012ad] border-slate-300 focus:ring-[#2012ad] cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-bold text-[#2012ad] hover:text-indigo-700 hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold tracking-wider uppercase transition-all duration-200 shadow-lg shadow-[#2012ad]/25 hover:shadow-indigo-600/35 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>LOGGING IN...</span>
                  </>
                ) : (
                  <span>LOGIN</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Login Credentials Helper */}
          <DemoCredentialsHelper
            onSelect={(id, pw) => {
              setEmployeeId(id);
              setPassword(pw);
              setError('');
            }}
          />
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-[11px] font-semibold text-slate-500">
            Store Staff Access Portal • Version 1.0
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Forgot Staff Password?</h3>
              <p className="text-xs font-semibold text-slate-600 mt-2 leading-relaxed">
                For security reasons, password resets must be authorized by your store manager or administrative supervisor.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] font-bold text-slate-700">
              Please contact your Branch Manager or HR department to request a password reset.
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

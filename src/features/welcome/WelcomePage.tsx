import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [skipWelcome, setSkipWelcome] = useState<boolean>(() => {
    return localStorage.getItem('skip_welcome_screen') === 'true';
  });

  const handleToggleSkipWelcome = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSkipWelcome(checked);
    localStorage.setItem('skip_welcome_screen', checked ? 'true' : 'false');
  };

  return (
    <div className="min-h-screen w-full bg-[#f9fafc] flex flex-col justify-between items-center p-4 py-8 relative select-none overflow-y-auto">
      {/* Background Subtle Dot Canvas Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      {/* Top Header Badge */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Online</span>
        </div>

        <span className="text-xs font-medium text-slate-400">
          ரத்னா விலாஸ் • Ratna Vilas
        </span>
      </div>

      {/* Main Minimalist Welcome Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 my-auto relative z-10">
        {/* Brand Logo & Name Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-white border border-amber-200/90 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md overflow-hidden p-1">
            <img
              src="/logo.png"
              alt="ரத்னா விலாஸ்"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            ரத்னா விலாஸ்
          </h1>
          <p className="text-xs font-bold text-amber-800 tracking-wide mt-0.5">
            பட்டு & ஜவுளி மாளிகை
          </p>
        </div>

        {/* Welcoming Message */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2012ad] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>வணக்கம்! வரவேற்பதில் மகிழ்ச்சி அடைகிறோம்</span>
          </div>
          <p className="text-sm text-slate-600 font-medium">
            ஜவுளி கடை விற்பனை, பில்லிங் மற்றும் பணியாளர் மேலாண்மை தளம்
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          id="welcome-login-btn"
          type="button"
          onClick={() => navigate('/login')}
          className="w-full py-3.5 px-4 bg-[#2012ad] hover:bg-[#1a0e91] active:bg-[#150b78] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>கணக்கில் உள்நுழைக (Sign In)</span>
        </button>
      </div>

      {/* Bottom Option */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-center px-2">
        <label className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            id="skip-welcome-checkbox"
            checked={skipWelcome}
            onChange={handleToggleSkipWelcome}
            className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-[#2012ad] focus:ring-[#2012ad]"
          />
          <span>நேரடியாக உள்நுழைவு பக்கம் செல்லவும் (Auto Skip)</span>
        </label>
      </div>
    </div>
  );
};

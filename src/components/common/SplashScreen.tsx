import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 1100,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(current);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onFinish();
        }, 250);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [durationMs, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f9fafc] text-slate-900 transition-opacity duration-250 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Dot Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center animate-fade-in">
        {/* Brand Logo Box */}
        <div className="w-24 h-24 bg-white border border-amber-200/90 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-slate-200/60 p-2 transform hover:scale-105 transition-transform">
          <img
            src="/logo.png"
            alt="ரத்னா விலாஸ்"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Brand Typography */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-0.5">
          ரத்னா விலாஸ்
        </h1>
        <p className="text-xs font-bold text-amber-800 tracking-wide mb-6">
          பட்டு & ஜவுளி மாளிகை
        </p>

        {/* Progress Bar (Blue / Amber Accent) */}
        <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-[#2012ad] rounded-full transition-all duration-75 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[11px] font-semibold text-slate-400">
          துவங்குகிறது... (Starting...)
        </p>
      </div>
    </div>
  );
};

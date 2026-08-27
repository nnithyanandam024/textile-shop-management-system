import React from 'react';

interface LoomLoaderProps {
  message?: string;
  subMessage?: string;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const LoomLoader: React.FC<LoomLoaderProps> = ({
  message = 'தகவல்கள் ஏற்றப்படுகிறது...',
  subMessage = 'ரத்னா விலாஸ் மேலாண்மை மென்பொருள்',
  progress,
  size = 'md',
}) => {
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
      {/* Brand Logo Spinner */}
      <div className="relative mb-4 flex items-center justify-center">
        <div
          className={`relative rounded-2xl bg-white border border-amber-200/90 p-2 shadow-lg shadow-slate-200 flex items-center justify-center ${
            isLg ? 'w-20 h-20' : isSm ? 'w-12 h-12 p-1.5' : 'w-16 h-16'
          }`}
        >
          <img
            src="/logo.png"
            alt="Loading"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Primary Tamil Message */}
      <h3 className={`font-bold text-slate-800 ${isLg ? 'text-base' : isSm ? 'text-xs' : 'text-sm'}`}>
        {message}
      </h3>

      {/* Subtitle Message */}
      {subMessage && (
        <p className="text-xs text-slate-500 font-medium mt-1">
          {subMessage}
        </p>
      )}

      {/* Progress Bar (Blue) */}
      <div className="w-48 sm:w-56 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-4 relative">
        {progress !== undefined ? (
          <div
            className="h-full bg-[#2012ad] rounded-full transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        ) : (
          <div className="h-full w-20 bg-[#2012ad] rounded-full absolute animate-[shimmer_1.4s_infinite]" />
        )}
      </div>
    </div>
  );
};

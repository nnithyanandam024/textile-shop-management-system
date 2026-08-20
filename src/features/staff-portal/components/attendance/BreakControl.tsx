import React, { useState } from 'react';
import { Coffee, Play } from 'lucide-react';

interface BreakControlProps {
  isOnBreak: boolean;
  canStartBreak: boolean;
  canEndBreak: boolean;
  totalBreakMinutes: number;
  breakStart: string | null;
  onStartBreak: () => Promise<boolean>;
  onEndBreak: () => Promise<boolean>;
  isLoading: boolean;
}

export const BreakControl: React.FC<BreakControlProps> = ({
  isOnBreak,
  canStartBreak,
  canEndBreak,
  totalBreakMinutes,
  breakStart,
  onStartBreak,
  onEndBreak,
  isLoading,
}) => {
  const [showConfirm, setShowConfirm] = useState<'START' | 'END' | null>(null);

  const handleConfirmAction = async () => {
    if (showConfirm === 'START') {
      const ok = await onStartBreak();
      if (ok) setShowConfirm(null);
    } else if (showConfirm === 'END') {
      const ok = await onEndBreak();
      if (ok) setShowConfirm(null);
    }
  };

  if (!canStartBreak && !canEndBreak) {
    return null;
  }

  return (
    <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-amber-950">
              {isOnBreak ? 'Current Break in Progress' : 'Break Time Control'}
            </h4>
            <p className="text-[11px] font-semibold text-amber-800/80">
              {isOnBreak
                ? `Started at ${breakStart || 'recently'} • Total accumulated: ${totalBreakMinutes} mins`
                : `Total break logged today: ${totalBreakMinutes} mins`}
            </p>
          </div>
        </div>

        <div>
          {canStartBreak && (
            <button
              type="button"
              onClick={() => setShowConfirm('START')}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Coffee className="w-4 h-4" />
              <span>Start Break</span>
            </button>
          )}

          {canEndBreak && (
            <button
              type="button"
              onClick={() => setShowConfirm('END')}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 animate-pulse"
            >
              <Play className="w-4 h-4" />
              <span>End Break & Resume Work</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              {showConfirm === 'START' ? <Coffee className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {showConfirm === 'START' ? 'Start Official Break?' : 'End Break & Resume Work?'}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {showConfirm === 'START'
                  ? 'Your live working timer will be paused until you resume.'
                  : 'Your live working timer will resume recording active store hours.'}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(null)}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isLoading}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  showConfirm === 'START'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                }`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <span>{showConfirm === 'START' ? 'Confirm Break' : 'Resume Work'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Clock, PauseCircle, PlayCircle } from 'lucide-react';

interface WorkingTimerProps {
  seconds: number;
  isOnBreak: boolean;
  isWorking: boolean;
}

export const WorkingTimer: React.FC<WorkingTimerProps> = ({
  seconds,
  isOnBreak,
  isWorking,
}) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const formattedHrs = String(hrs).padStart(2, '0');
  const formattedMins = String(mins).padStart(2, '0');
  const formattedSecs = String(secs).padStart(2, '0');

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-md relative overflow-hidden select-none">
      {/* Background ambient glow */}
      {isWorking && !isOnBreak && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex items-center gap-3 relative z-10">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isOnBreak
              ? 'bg-amber-500/20 text-amber-400'
              : isWorking
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 animate-pulse'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {isOnBreak ? (
            <PauseCircle className="w-5 h-5" />
          ) : isWorking ? (
            <PlayCircle className="w-5 h-5" />
          ) : (
            <Clock className="w-5 h-5" />
          )}
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            {isOnBreak ? 'Timer Paused (Break)' : isWorking ? 'Live Working Time' : 'Total Work Time'}
          </span>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {formattedHrs}:{formattedMins}:{formattedSecs}
            </span>
            <span className="text-xs font-bold text-slate-400">
              ({hrs}h {mins}m)
            </span>
          </div>
        </div>
      </div>

      {/* Status indicator pill */}
      <div className="relative z-10 hidden sm:block">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
            isOnBreak
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : isWorking
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {isOnBreak ? '☕ On Break' : isWorking ? '● In Session' : 'Shift Completed'}
        </span>
      </div>
    </div>
  );
};

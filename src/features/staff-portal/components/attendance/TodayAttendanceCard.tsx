import React, { useState } from 'react';
import { TodayAttendance } from '../../services/staffAttendanceService';
import { getStatusConfig } from '../../utils/attendanceStatus';
import { WorkingTimer } from './WorkingTimer';
import { BreakControl } from './BreakControl';
import {
  LogIn,
  LogOut,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface TodayAttendanceCardProps {
  today: TodayAttendance;
  liveSeconds: number;
  onCheckIn: () => Promise<boolean>;
  onCheckOut: () => Promise<boolean>;
  onStartBreak: () => Promise<boolean>;
  onEndBreak: () => Promise<boolean>;
  onRequestCorrectionClick: () => void;
  isLoading: boolean;
}

export const TodayAttendanceCard: React.FC<TodayAttendanceCardProps> = ({
  today,
  liveSeconds,
  onCheckIn,
  onCheckOut,
  onStartBreak,
  onEndBreak,
  onRequestCorrectionClick,
  isLoading,
}) => {
  const [confirmModal, setConfirmModal] = useState<'CHECK_IN' | 'CHECK_OUT' | null>(null);

  const statusCfg = getStatusConfig(today.status);
  const isWorking = today.status === 'WORKING';
  const isCompleted = today.status === 'COMPLETED';

  const handleConfirmSubmit = async () => {
    if (confirmModal === 'CHECK_IN') {
      const ok = await onCheckIn();
      if (ok) setConfirmModal(null);
    } else if (confirmModal === 'CHECK_OUT') {
      const ok = await onCheckOut();
      if (ok) setConfirmModal(null);
    }
  };

  const formatTimeDisplay = (timeStr: string | null) => {
    if (!timeStr) return '—';
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedH = h % 12 || 12;
      return `${String(formattedH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative select-none space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Today's Attendance
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.badgeClass}`}
            >
              {statusCfg.label}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Shift: {today.shiftName} ({formatTimeDisplay(today.scheduledStart)} – {formatTimeDisplay(today.scheduledEnd)})</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onRequestCorrectionClick}
          className="text-xs font-bold text-slate-500 hover:text-[#2818cf] transition-colors flex items-center gap-1 self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Need Correction?</span>
        </button>
      </div>

      {/* Late Arrival Banner */}
      {today.isLate && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs font-semibold animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Late Arrival Recorded: </span>
            <span>
              Scheduled at {formatTimeDisplay(today.scheduledStart)}, checked in at {formatTimeDisplay(today.checkIn)} (Late by {today.lateMinutes} mins).
            </span>
          </div>
        </div>
      )}

      {/* Early Exit Banner */}
      {today.isEarlyExit && (
        <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-2.5 text-orange-900 text-xs font-semibold animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Early Check-Out Recorded: </span>
            <span>
              Shift ended at {formatTimeDisplay(today.scheduledEnd)}, checked out early at {formatTimeDisplay(today.checkOut)} (Early by {today.earlyExitMinutes} mins).
            </span>
          </div>
        </div>
      )}

      {/* Live Timer Banner (when checked in) */}
      {(isWorking || today.isOnBreak || isCompleted) && (
        <WorkingTimer
          seconds={liveSeconds}
          isOnBreak={today.isOnBreak}
          isWorking={isWorking}
        />
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            Check-In Time
          </span>
          <div className="flex items-center gap-1.5">
            <LogIn className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-extrabold text-slate-900">
              {formatTimeDisplay(today.checkIn)}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            Check-Out Time
          </span>
          <div className="flex items-center gap-1.5">
            <LogOut className="w-4 h-4 text-rose-600" />
            <p className="text-sm font-extrabold text-slate-900">
              {formatTimeDisplay(today.checkOut)}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            Break Taken
          </span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-extrabold text-slate-900">
              {today.totalBreakMinutes}m
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            Working Time
          </span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#2818cf]" />
            <p className="text-sm font-extrabold text-slate-900">
              {Math.floor(liveSeconds / 3600)}h {Math.floor((liveSeconds % 3600) / 60)}m
            </p>
          </div>
        </div>
      </div>

      {/* Break Controls */}
      {(today.canStartBreak || today.canEndBreak) && (
        <BreakControl
          isOnBreak={today.isOnBreak}
          canStartBreak={today.canStartBreak}
          canEndBreak={today.canEndBreak}
          totalBreakMinutes={today.totalBreakMinutes}
          breakStart={today.breakStart}
          onStartBreak={onStartBreak}
          onEndBreak={onEndBreak}
          isLoading={isLoading}
        />
      )}

      {/* Main Action Buttons */}
      <div className="pt-2">
        {today.canCheckIn && (
          <button
            type="button"
            onClick={() => setConfirmModal('CHECK_IN')}
            disabled={isLoading}
            className="w-full py-4 bg-[#2818cf] hover:bg-indigo-700 text-white rounded-2xl text-sm font-extrabold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-98"
          >
            <LogIn className="w-5 h-5" />
            <span>CONFIRM & CHECK IN NOW</span>
          </button>
        )}

        {today.canCheckOut && (
          <button
            type="button"
            onClick={() => setConfirmModal('CHECK_OUT')}
            disabled={isLoading}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-sm font-extrabold transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 active:scale-98"
          >
            <LogOut className="w-5 h-5" />
            <span>CHECK OUT & COMPLETE ATTENDANCE</span>
          </button>
        )}

        {isCompleted && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-emerald-800 font-extrabold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Attendance Completed For Today</span>
            </div>
            <p className="text-xs font-semibold text-emerald-700">
              Check-in at {formatTimeDisplay(today.checkIn)} • Check-out at {formatTimeDisplay(today.checkOut)} • Total worked: {Math.floor(liveSeconds / 3600)}h {Math.floor((liveSeconds % 3600) / 60)}m
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                confirmModal === 'CHECK_IN'
                  ? 'bg-indigo-50 text-[#2818cf]'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {confirmModal === 'CHECK_IN' ? <LogIn className="w-6 h-6" /> : <LogOut className="w-6 h-6" />}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {confirmModal === 'CHECK_IN' ? 'Confirm Check-In' : 'Confirm Check-Out'}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {confirmModal === 'CHECK_IN'
                  ? 'Your official check-in timestamp will be securely recorded.'
                  : `Are you sure you want to check out? Total recorded work time is ${Math.floor(liveSeconds / 3600)}h ${Math.floor((liveSeconds % 3600) / 60)}m.`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isLoading}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  confirmModal === 'CHECK_IN'
                    ? 'bg-[#2818cf] hover:bg-indigo-700 shadow-indigo-200'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                }`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <span>{confirmModal === 'CHECK_IN' ? 'Confirm Check-In' : 'Confirm Check-Out'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

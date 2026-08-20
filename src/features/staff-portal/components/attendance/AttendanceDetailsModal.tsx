import React from 'react';
import { AttendanceHistoryItem } from '../../services/staffAttendanceService';
import { getStatusConfig } from '../../utils/attendanceStatus';
import {
  Calendar,
  LogIn,
  LogOut,
  Coffee,
  AlertTriangle,
  HelpCircle,
  X,
} from 'lucide-react';

interface AttendanceDetailsModalProps {
  record: AttendanceHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestCorrection: (record: AttendanceHistoryItem) => void;
}

export const AttendanceDetailsModal: React.FC<AttendanceDetailsModalProps> = ({
  record,
  isOpen,
  onClose,
  onRequestCorrection,
}) => {
  if (!isOpen || !record) return null;

  const statusCfg = getStatusConfig(record.status);

  const formatTime = (timeStr: string | null | undefined) => {
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

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative select-none space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2818cf] flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {formatDate(record.attendanceDate)}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.badgeClass}`}
              >
                {statusCfg.label}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {record.shiftName || 'Morning Shift'}
              </span>
            </div>
          </div>
        </div>

        {/* Late / Early Exit Notices */}
        {record.lateMinutes > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Late by {record.lateMinutes} minutes (Scheduled start: {formatTime(record.scheduledStart)})</span>
          </div>
        )}

        {record.earlyExitMinutes > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2 text-orange-900 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <span>Early exit by {record.earlyExitMinutes} minutes (Scheduled end: {formatTime(record.scheduledEnd)})</span>
          </div>
        )}

        {/* Timings Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Scheduled Shift
            </span>
            <p className="font-bold text-slate-800">
              {formatTime(record.scheduledStart)} – {formatTime(record.scheduledEnd)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Total Working Hours
            </span>
            <p className="font-extrabold text-[#2818cf] font-mono">
              {record.formattedHours}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Actual Check-In
            </span>
            <p className="font-extrabold text-emerald-700 flex items-center gap-1">
              <LogIn className="w-3.5 h-3.5" />
              {formatTime(record.checkIn)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Actual Check-Out
            </span>
            <p className="font-extrabold text-rose-700 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" />
              {formatTime(record.checkOut)}
            </p>
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              Break Taken:
            </span>
            <span className="font-bold text-slate-800">
              {record.totalBreakMinutes} minutes
            </span>
          </div>
        </div>

        {/* Correction Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestCorrection(record);
            }}
            className="w-full py-3 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-[#2818cf] border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Submit Correction Request for this Date</span>
          </button>
        </div>
      </div>
    </div>
  );
};

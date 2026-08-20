import React from 'react';
import { StaffShiftItem } from '../../services/staffShiftService';
import { getShiftStatusConfig } from '../../utils/shiftStatus';
import {
  Calendar,
  Clock,
  MapPin,
  Coffee,
  Building,
  AlertTriangle,
  ArrowRightLeft,
  CalendarCheck,
  X,
} from 'lucide-react';

interface ShiftDetailsModalProps {
  shift: StaffShiftItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestChange: (shift: StaffShiftItem) => void;
  onRequestSwap: (shift: StaffShiftItem) => void;
}

export const ShiftDetailsModal: React.FC<ShiftDetailsModalProps> = ({
  shift,
  isOpen,
  onClose,
  onRequestChange,
  onRequestSwap,
}) => {
  if (!isOpen || !shift) return null;

  const statusCfg = getShiftStatusConfig(shift.status);

  const formatTime = (timeStr: string) => {
    if (!timeStr || timeStr === '—') return '—';
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
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative space-y-4">
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
              {formatDate(shift.date)}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.badgeClass}`}
              >
                {statusCfg.label}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {shift.shiftName}
              </span>
            </div>
          </div>
        </div>

        {/* Override Note */}
        {shift.isOverride && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Shift Override: {shift.overrideReason || 'Management schedule adjustment'}</span>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Start Time
            </span>
            <p className="font-extrabold text-slate-900 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              {formatTime(shift.startTime)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              End Time
            </span>
            <p className="font-extrabold text-slate-900 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              {formatTime(shift.endTime)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Break Schedule
            </span>
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
              {formatTime(shift.breakStart)} – {formatTime(shift.breakEnd)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Grace Period
            </span>
            <p className="font-bold text-slate-800">
              {shift.graceMinutes} mins
            </p>
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Work Location:
            </span>
            <span className="font-bold text-slate-800">
              {shift.workLocation}
            </span>
          </div>

          <div className="col-span-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Department:
            </span>
            <span className="font-bold text-slate-800">
              {shift.departmentName}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {!shift.isHoliday && !shift.isWeekOff && !shift.isLeave && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestSwap(shift);
              }}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Swap Shift</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestChange(shift);
              }}
              className="py-2.5 bg-[#2818cf] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Request Change</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

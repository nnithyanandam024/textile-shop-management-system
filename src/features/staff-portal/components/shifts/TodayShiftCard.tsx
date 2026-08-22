import React from 'react';
import { StaffShiftItem } from '../../services/staffShiftService';
import { getShiftStatusConfig } from '../../utils/shiftStatus';
import {
  Calendar,
  Clock,
  MapPin,
  Coffee,
  AlertTriangle,
  ArrowRightLeft,
  CalendarCheck,
  PartyPopper,
  FileText,
  Sunrise,
} from 'lucide-react';

interface TodayShiftCardProps {
  shift: StaffShiftItem;
  onRequestChange: () => void;
  onRequestSwap: () => void;
}

export const TodayShiftCard: React.FC<TodayShiftCardProps> = ({
  shift,
  onRequestChange,
  onRequestSwap,
}) => {
  const statusCfg = getShiftStatusConfig(shift.status);

  const formatTimeDisplay = (timeStr: string) => {
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

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative select-none space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center font-bold">
            <Sunrise className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Today's Shift Schedule
              </h2>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold border ${statusCfg.badgeClass}`}
              >
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {shift.dayName}, {shift.date}
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        {!shift.isHoliday && !shift.isWeekOff && !shift.isLeave && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onRequestSwap}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Swap Shift</span>
            </button>

            <button
              type="button"
              onClick={onRequestChange}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#2012ad] border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-[#2012ad]" />
              <span>Request Change</span>
            </button>
          </div>
        )}
      </div>

      {/* Special State Banners */}
      {shift.isHoliday && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-3 text-sky-900">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold shrink-0">
            <PartyPopper className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold">{shift.holidayName || 'Store Holiday'}</h4>
            <p className="text-xs font-semibold text-sky-700 mt-0.5">
              Store is officially closed for holiday. No work session scheduled today.
            </p>
          </div>
        </div>
      )}

      {shift.isWeekOff && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 text-slate-700">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold">Weekly Off Day</h4>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              You have no scheduled shift for today. Enjoy your day off!
            </p>
          </div>
        </div>
      )}

      {shift.isLeave && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-3 text-purple-900">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold">{shift.leaveTypeName || 'Approved Leave'}</h4>
            <p className="text-xs font-semibold text-purple-700 mt-0.5">
              Your leave has been approved by management.
            </p>
          </div>
        </div>
      )}

      {/* Override Notice */}
      {shift.isOverride && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Shift Schedule Override: </span>
            <span>
              Management updated your shift for today. {shift.overrideReason ? `(${shift.overrideReason})` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Normal Shift Timings & Location Grid */}
      {!shift.isHoliday && !shift.isWeekOff && !shift.isLeave && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] font-extrabold text-indigo-200 uppercase tracking-widest block">
                Assigned Shift Type
              </span>
              <h3 className="text-xl font-extrabold tracking-tight">
                {shift.shiftName}
              </h3>
              <p className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-300" />
                <span>{shift.workLocation} • {shift.departmentName}</span>
              </p>
            </div>

            <div className="relative z-10 flex items-baseline gap-2 font-mono">
              <span className="text-2xl font-extrabold tracking-tight text-white">
                {formatTimeDisplay(shift.startTime)}
              </span>
              <span className="text-slate-400 font-bold">to</span>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                {formatTimeDisplay(shift.endTime)}
              </span>
            </div>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Expected Start
              </span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-extrabold text-slate-900">
                  {formatTimeDisplay(shift.startTime)}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Expected End
              </span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-600" />
                <p className="text-sm font-extrabold text-slate-900">
                  {formatTimeDisplay(shift.endTime)}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Break Window
              </span>
              <div className="flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-extrabold text-slate-900">
                  {formatTimeDisplay(shift.breakStart)} – {formatTimeDisplay(shift.breakEnd)}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Grace Period
              </span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#2012ad]" />
                <p className="text-sm font-extrabold text-slate-900">
                  {shift.graceMinutes} mins
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

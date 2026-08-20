import React from 'react';
import { WeeklyScheduleData, StaffShiftItem } from '../../services/staffShiftService';
import { getShiftStatusConfig } from '../../utils/shiftStatus';
import { CalendarDays, Clock } from 'lucide-react';

interface WeeklyScheduleProps {
  schedule: WeeklyScheduleData | null;
  onSelectDay: (shift: StaffShiftItem) => void;
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  schedule,
  onSelectDay,
}) => {
  if (!schedule || !schedule.days.length) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  const formatShortTime = (timeStr: string) => {
    if (!timeStr || timeStr === '—') return '—';
    try {
      const [h] = timeStr.split(':').map(Number);
      const ampm = h >= 12 ? 'pm' : 'am';
      const shortH = h % 12 || 12;
      return `${shortH}${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2818cf] flex items-center justify-center font-bold">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Weekly Schedule
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              {schedule.weekStart} to {schedule.weekEnd}
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
        {schedule.days.map((day) => {
          const isToday = day.date === todayStr;
          const statusCfg = getShiftStatusConfig(day.status);

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.02] hover:shadow-sm active:scale-95 flex flex-col justify-between h-32 relative ${
                isToday
                  ? 'border-[#2818cf] bg-indigo-50/50 ring-2 ring-[#2818cf]/20'
                  : `${statusCfg.bgLight} ${statusCfg.borderColor}`
              }`}
            >
              {/* Day & Date Header */}
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-extrabold uppercase ${
                      isToday ? 'text-[#2818cf]' : 'text-slate-500'
                    }`}
                  >
                    {day.shortDayName}
                  </span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2818cf] animate-ping" />
                  )}
                </div>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {day.date.slice(8, 10)} {new Date(day.date).toLocaleString('en-US', { month: 'short' })}
                </p>
              </div>

              {/* Shift Timing / Off Info */}
              <div className="space-y-1">
                {day.isWeekOff ? (
                  <span className="text-[11px] font-extrabold text-slate-500 block">
                    🌿 Week Off
                  </span>
                ) : day.isHoliday ? (
                  <span className="text-[11px] font-extrabold text-sky-700 block truncate">
                    🎉 Holiday
                  </span>
                ) : day.isLeave ? (
                  <span className="text-[11px] font-extrabold text-purple-700 block truncate">
                    📝 Leave
                  </span>
                ) : (
                  <>
                    <p className="text-[11px] font-bold text-slate-800 truncate">
                      {day.shiftName}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 font-mono">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      <span>
                        {formatShortTime(day.startTime)}–{formatShortTime(day.endTime)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Status pill */}
              <div className="pt-1">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${statusCfg.badgeClass}`}
                >
                  <span className={`w-1 h-1 rounded-full ${statusCfg.dotClass}`} />
                  <span>{statusCfg.label}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

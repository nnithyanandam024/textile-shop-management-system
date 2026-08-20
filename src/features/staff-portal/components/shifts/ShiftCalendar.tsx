import React from 'react';
import { MonthlyScheduleData, StaffShiftItem } from '../../services/staffShiftService';
import { getShiftStatusConfig } from '../../utils/shiftStatus';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface ShiftCalendarProps {
  monthlySchedule: MonthlyScheduleData | null;
  selectedMonth: string;
  onMonthChange: (newMonth: string) => void;
  onSelectDay: (shift: StaffShiftItem) => void;
}

export const ShiftCalendar: React.FC<ShiftCalendarProps> = ({
  monthlySchedule,
  selectedMonth,
  onMonthChange,
  onSelectDay,
}) => {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const handlePrevMonth = () => {
    const prevDate = new Date(year, month - 2, 1);
    const yyyy = prevDate.getFullYear();
    const mm = String(prevDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${yyyy}-${mm}`);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(year, month, 1);
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${yyyy}-${mm}`);
  };

  if (!monthlySchedule) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  // Map days
  const dayMap = new Map<string, StaffShiftItem>();
  monthlySchedule.days.forEach((d) => {
    dayMap.set(d.date, d);
  });

  // Calculate calendar grid (Monday = 1, Sunday = 7)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  const days: Array<{ dayNum: number; dateStr: string; shift?: StaffShiftItem; isToday: boolean } | null> = [];

  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dayNum: d,
      dateStr,
      shift: dayMap.get(dateStr),
      isToday: dateStr === todayStr,
    });
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Calendar Header & Month Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2818cf] flex items-center justify-center font-bold">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Monthly Shift Roster
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Complete calendar breakdown of work shifts & scheduled off days
            </p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-extrabold text-slate-800 min-w-[120px] text-center">
            {monthlySchedule.month}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-[11px] font-extrabold text-slate-400 uppercase py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="h-16 rounded-2xl bg-slate-50/40" />;
          }

          const statusCfg = cell.shift ? getShiftStatusConfig(cell.shift.status) : null;

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => cell.shift && onSelectDay(cell.shift)}
              className={`h-16 rounded-2xl p-1.5 border flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-sm active:scale-95 text-left relative ${
                cell.isToday
                  ? 'border-[#2818cf] bg-indigo-50/40 ring-2 ring-[#2818cf]/20'
                  : cell.shift
                  ? `${statusCfg?.bgLight} ${statusCfg?.borderColor}`
                  : 'bg-white border-slate-100'
              }`}
            >
              {/* Date Num & Symbol */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    cell.isToday ? 'text-[#2818cf] font-extrabold' : 'text-slate-700'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {cell.shift && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[9px] font-extrabold ${statusCfg?.badgeClass}`}
                  >
                    {cell.shift.symbol}
                  </span>
                )}
              </div>

              {/* Bottom Row */}
              <div className="text-[10px] truncate">
                {cell.shift ? (
                  <span className={`font-bold ${statusCfg?.textColor}`}>
                    {cell.shift.isWeekOff
                      ? 'Off'
                      : cell.shift.isHoliday
                      ? 'Holiday'
                      : cell.shift.isLeave
                      ? 'Leave'
                      : cell.shift.startTime}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend Bar */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800">M</span>
          <span>Morning Shift</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">E</span>
          <span>Evening Shift</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-800">OFF</span>
          <span>Weekly Off</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-800">H</span>
          <span>Store Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">L</span>
          <span>Approved Leave</span>
        </div>
      </div>
    </div>
  );
};

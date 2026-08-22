import React from 'react';
import { AttendanceHistoryItem } from '../../services/staffAttendanceService';
import { getStatusConfig } from '../../utils/attendanceStatus';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface AttendanceCalendarProps {
  selectedMonth: string; // 'YYYY-MM'
  onMonthChange: (newMonth: string) => void;
  history: AttendanceHistoryItem[];
  onDateClick: (dateStr: string) => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  selectedMonth,
  onMonthChange,
  history,
  onDateClick,
}) => {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

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

  // Build map of dates to history record
  const recordMap = new Map<string, AttendanceHistoryItem>();
  history.forEach((h) => {
    recordMap.set(h.attendanceDate, h);
  });

  // Calculate calendar grid (Monday = 1, Sunday = 7)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 is Sun, 1 is Mon
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // 0 for Mon, 6 for Sun
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  const todayStr = new Date().toISOString().slice(0, 10);

  const days: Array<{ dayNum: number; dateStr: string; record?: AttendanceHistoryItem; isToday: boolean } | null> = [];

  // Leading empty cells
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }

  // Month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dayNum: d,
      dateStr,
      record: recordMap.get(dateStr),
      isToday: dateStr === todayStr,
    });
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Calendar Header & Month Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2012ad] flex items-center justify-center font-bold">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Attendance Calendar
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Click any date to inspect shift timings & details
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
          <span className="text-xs font-extrabold text-slate-800 min-w-[110px] text-center">
            {monthName}
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
          <div
            key={day}
            className="text-[11px] font-extrabold text-slate-400 uppercase py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="h-14 rounded-2xl bg-slate-50/40" />;
          }

          const statusCfg = cell.record ? getStatusConfig(cell.record.status) : null;
          const isWeekend = (idx % 7 === 5) || (idx % 7 === 6);

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onDateClick(cell.dateStr)}
              className={`h-14 rounded-2xl p-1.5 border flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-sm active:scale-95 text-left relative ${
                cell.isToday
                  ? 'border-[#2012ad] bg-indigo-50/40 ring-2 ring-[#2012ad]/20'
                  : cell.record
                  ? `${statusCfg?.bgLight} ${statusCfg?.borderColor}`
                  : isWeekend
                  ? 'bg-slate-50 border-slate-100'
                  : 'bg-white border-slate-100 hover:border-slate-300'
              }`}
            >
              {/* Top Row: Date Num + Today indicator */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    cell.isToday
                      ? 'text-[#2012ad] font-extrabold'
                      : 'text-slate-700'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {cell.record && (
                  <span
                    className={`w-2 h-2 rounded-full ${statusCfg?.dotClass}`}
                    title={`Status: ${statusCfg?.label}`}
                  />
                )}
              </div>

              {/* Bottom Row: Working Hours / Status Label */}
              <div className="text-[10px] truncate">
                {cell.record ? (
                  <span className={`font-bold ${statusCfg?.textColor}`}>
                    {cell.record.workedMinutes > 0
                      ? `${(cell.record.workedMinutes / 60).toFixed(1)}h`
                      : statusCfg?.label}
                  </span>
                ) : isWeekend ? (
                  <span className="text-slate-300 font-semibold">Off</span>
                ) : (
                  <span className="text-slate-300 font-semibold">—</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend Bar */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Present / Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Late Arrival</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Absent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Approved Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span>Weekly Off</span>
        </div>
      </div>
    </div>
  );
};

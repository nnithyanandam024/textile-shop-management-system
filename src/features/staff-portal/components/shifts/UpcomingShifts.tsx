import React from 'react';
import { StaffShiftItem } from '../../services/staffShiftService';
import { getShiftStatusConfig } from '../../utils/shiftStatus';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';

interface UpcomingShiftsProps {
  shifts: StaffShiftItem[];
  onSelectShift: (shift: StaffShiftItem) => void;
}

export const UpcomingShifts: React.FC<UpcomingShiftsProps> = ({
  shifts,
  onSelectShift,
}) => {
  const getRelativeLabel = (dateStr: string, idx: number) => {
    if (idx === 0) return 'Tomorrow';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr || timeStr === '—') return '—';
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const shortH = h % 12 || 12;
      return `${String(shortH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2012ad] flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Upcoming Shifts
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Next 7 scheduled working days and assignments
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {shifts.map((shift, idx) => {
          const statusCfg = getShiftStatusConfig(shift.status);

          return (
            <div
              key={shift.date}
              onClick={() => onSelectShift(shift)}
              className="p-3.5 bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-center shadow-xs shrink-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">
                    {shift.shortDayName}
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {shift.date.slice(8, 10)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      {getRelativeLabel(shift.date, idx)}
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded-md text-[10px] font-bold border ${statusCfg.badgeClass}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mt-0.5">
                    {!shift.isWeekOff && !shift.isHoliday && !shift.isLeave && (
                      <>
                        <span className="flex items-center gap-1 text-indigo-700 font-bold font-mono">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {shift.workLocation}
                        </span>
                      </>
                    )}

                    {shift.isWeekOff && <span>🌿 Weekly Off</span>}
                    {shift.isHoliday && <span>🎉 {shift.holidayName || 'Store Holiday'}</span>}
                    {shift.isLeave && <span>📝 {shift.leaveTypeName || 'Approved Leave'}</span>}
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

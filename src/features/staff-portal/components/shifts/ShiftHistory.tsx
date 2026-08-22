import React from 'react';
import { StaffShiftItem } from '../../services/staffShiftService';
import { getShiftStatusConfig } from '../../utils/shiftStatus';
import { History, Eye, Clock } from 'lucide-react';

interface ShiftHistoryProps {
  shifts: StaffShiftItem[];
  onSelectShift: (shift: StaffShiftItem) => void;
}

export const ShiftHistory: React.FC<ShiftHistoryProps> = ({
  shifts,
  onSelectShift,
}) => {
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
        day: '2-digit',
        month: 'short',
        weekday: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Shift History Log
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Historical record of past scheduled shifts and completions
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      {shifts.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <History className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-600">No shift history found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Shift Type</th>
                <th className="pb-3 px-3">Scheduled Time</th>
                <th className="pb-3 px-3">Location</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map((row) => {
                const statusCfg = getShiftStatusConfig(row.status);

                return (
                  <tr
                    key={row.date}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectShift(row)}
                  >
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>

                    <td className="py-3 px-3 font-extrabold text-slate-800 whitespace-nowrap">
                      {row.shiftName}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap font-mono">
                      {!row.isWeekOff && !row.isHoliday && !row.isLeave ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatTime(row.startTime)} – {formatTime(row.endTime)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-semibold whitespace-nowrap">
                      {row.workLocation}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                        <span>{statusCfg.label}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectShift(row);
                        }}
                        className="p-1 text-slate-400 hover:text-[#2012ad] transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { AttendanceHistoryItem } from '../../services/staffAttendanceService';
import { getStatusConfig } from '../../utils/attendanceStatus';
import { History, Eye, HelpCircle } from 'lucide-react';

interface AttendanceHistoryProps {
  history: AttendanceHistoryItem[];
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onViewDetails: (dateStr: string) => void;
  onRequestCorrection: (record: AttendanceHistoryItem) => void;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  history,
  statusFilter,
  onStatusFilterChange,
  onViewDetails,
  onRequestCorrection,
}) => {
  const formatTime = (timeStr: string | null) => {
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
        month: 'short',
        weekday: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2012ad] flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Attendance History
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Detailed log of daily clock-in/out records
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="pl-3 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late Arrival</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="HOLIDAY">Holiday</option>
              <option value="WEEK_OFF">Weekly Off</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {history.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <History className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-600">No attendance records found for this filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Check In</th>
                <th className="pb-3 px-3">Check Out</th>
                <th className="pb-3 px-3">Worked Time</th>
                <th className="pb-3 px-3">Break</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((row) => {
                const statusCfg = getStatusConfig(row.status);

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onViewDetails(row.attendanceDate)}
                  >
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {formatDate(row.attendanceDate)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                        <span>{statusCfg.label}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {formatTime(row.checkIn)}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {formatTime(row.checkOut)}
                    </td>

                    <td className="py-3 px-3 font-extrabold text-slate-900 whitespace-nowrap font-mono">
                      {row.formattedHours}
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-semibold whitespace-nowrap">
                      {row.totalBreakMinutes > 0 ? `${row.totalBreakMinutes}m` : '—'}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onViewDetails(row.attendanceDate)}
                          className="p-1 text-slate-400 hover:text-[#2012ad] transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestCorrection(row)}
                          className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                          title="Request Correction"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>
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

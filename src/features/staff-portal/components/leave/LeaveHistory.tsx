import React from 'react';
import { LeaveHistoryData, StaffLeaveRequestItem } from '../../services/staffLeaveService';
import { getLeaveStatusConfig } from '../../utils/leaveStatus';
import { History, Eye } from 'lucide-react';

interface LeaveHistoryProps {
  history: LeaveHistoryData | null;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onSelectRequest: (req: StaffLeaveRequestItem) => void;
}

export const LeaveHistory: React.FC<LeaveHistoryProps> = ({
  history,
  selectedYear,
  onYearChange,
  onSelectRequest,
}) => {
  if (!history) return null;

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Group requests by month
  const groupedByMonth: Record<number, StaffLeaveRequestItem[]> = {};
  history.requests.forEach((r) => {
    try {
      const m = parseInt(r.startDate.split('-')[1], 10);
      if (!groupedByMonth[m]) groupedByMonth[m] = [];
      groupedByMonth[m].push(r);
    } catch {
      // fallback
    }
  });

  const totalApprovedDays = Object.values(history.summaryByMonth).reduce((sum, val) => sum + val, 0);

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
              Annual Leave History & Utilization
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Total Approved Time Off: <strong className="text-[#2818cf]">{totalApprovedDays} Days</strong> in {selectedYear}
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-1.5">
          {yearOptions.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => onYearChange(yr)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedYear === yr
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Breakdown List */}
      {history.requests.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <History className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-600">No leave applications found for {selectedYear}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {monthNames.map((mName, idx) => {
            const mNum = idx + 1;
            const items = groupedByMonth[mNum];
            if (!items || items.length === 0) return null;

            return (
              <div
                key={mName}
                className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    {mName} {selectedYear}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    {items.length} {items.length === 1 ? 'Application' : 'Applications'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {items.map((r) => {
                    const statusCfg = getLeaveStatusConfig(r.status);

                    return (
                      <div
                        key={r.id}
                        onClick={() => onSelectRequest(r)}
                        className="p-3 bg-white border border-slate-100 hover:border-slate-200 rounded-xl flex items-center justify-between text-xs cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-[11px] text-slate-700">
                            {r.startDate.slice(8, 10)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">{r.leaveName}</span>
                              <span className="text-slate-400 font-semibold">•</span>
                              <span className="text-slate-600 font-semibold font-mono">
                                {r.durationDays} {r.durationDays === 1 ? 'Day' : 'Days'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                              {r.reason}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.badgeClass}`}
                          >
                            {statusCfg.label}
                          </span>
                          <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

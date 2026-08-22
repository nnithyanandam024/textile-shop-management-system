import React from 'react';
import { StaffLeaveBalanceItem } from '../../services/staffLeaveService';
import { Plus, Clock, FileText, HeartPulse, Sparkles, Briefcase } from 'lucide-react';

interface LeaveBalanceCardsProps {
  balances: StaffLeaveBalanceItem[];
  onApplyLeave: () => void;
  onRequestPermission: () => void;
}

export const LeaveBalanceCards: React.FC<LeaveBalanceCardsProps> = ({
  balances,
  onApplyLeave,
  onRequestPermission,
}) => {
  const getLeaveIcon = (code: string) => {
    switch (code.toUpperCase()) {
      case 'SL':
        return <HeartPulse className="w-5 h-5 text-rose-600" />;
      case 'EL':
      case 'AL':
        return <Sparkles className="w-5 h-5 text-amber-600" />;
      case 'CL':
        return <Briefcase className="w-5 h-5 text-[#2012ad]" />;
      default:
        return <FileText className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getLeaveTheme = (code: string) => {
    switch (code.toUpperCase()) {
      case 'SL':
        return {
          bgBadge: 'bg-rose-50 text-rose-700 border-rose-200',
          accent: 'text-rose-600',
          border: 'border-rose-100 hover:border-rose-200',
        };
      case 'EL':
      case 'AL':
        return {
          bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
          accent: 'text-amber-600',
          border: 'border-amber-100 hover:border-amber-200',
        };
      case 'CL':
        return {
          bgBadge: 'bg-indigo-50 text-[#2012ad] border-indigo-200',
          accent: 'text-[#2012ad]',
          border: 'border-indigo-100 hover:border-indigo-200',
        };
      default:
        return {
          bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          accent: 'text-emerald-600',
          border: 'border-emerald-100 hover:border-emerald-200',
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-5">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              My Leave & Permission Balances
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-[#2012ad] border border-indigo-200">
              {new Date().getFullYear()} Policy
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Real-time quota tracking. Pending requests do not permanently deduct until approved.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onRequestPermission}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Request Permission</span>
          </button>

          <button
            type="button"
            onClick={onApplyLeave}
            className="px-3.5 py-2 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => {
          const theme = getLeaveTheme(b.leaveCode);

          return (
            <div
              key={b.leaveTypeId}
              className={`p-5 rounded-2xl border ${theme.border} bg-white shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                    {getLeaveIcon(b.leaveCode)}
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">
                      {b.leaveName}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      Code: {b.leaveCode}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${theme.bgBadge}`}>
                  {b.allocatedDays} Total
                </span>
              </div>

              {/* Balance Big Metric */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold tracking-tight ${theme.accent}`}>
                    {b.availableDays}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ {b.allocatedDays} Days Available</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      b.leaveCode === 'SL' ? 'bg-rose-500' : b.leaveCode === 'CL' ? 'bg-[#2012ad]' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, (b.availableDays / (b.allocatedDays || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Sub-breakdown Row */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-[10px]">
                <div>
                  <span className="text-slate-400 font-bold block">Used</span>
                  <strong className="text-slate-800 font-extrabold">{b.usedDays} d</strong>
                </div>
                <div>
                  <span className="text-amber-500 font-bold block">Pending</span>
                  <strong className="text-amber-600 font-extrabold">{b.pendingDays} d</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Remaining</span>
                  <strong className="text-slate-800 font-extrabold">{b.remainingAfterPending} d</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

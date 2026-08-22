import React from 'react';
import { StaffOvertimeSummary } from '../../services/staffPayrollService';
import { Clock, ShieldCheck } from 'lucide-react';

interface OvertimeSummaryProps {
  overtime: StaffOvertimeSummary | null;
}

export const OvertimeSummary: React.FC<OvertimeSummaryProps> = ({ overtime }) => {
  if (!overtime) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2012ad] flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Approved Overtime Pay
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Computed strictly from manager-approved attendance logs
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-[#2012ad] border border-indigo-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Approved</span>
        </span>
      </div>

      {/* Overtime Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Approved OT Hours
          </span>
          <strong className="text-xl font-extrabold text-slate-900 font-mono">
            {overtime.approvedHours}h
          </strong>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Overtime Multiplier / Rate
          </span>
          <strong className="text-xl font-extrabold text-slate-900 font-mono">
            1.5x (₹{Math.round(overtime.hourlyRate * 1.5)}/hr)
          </strong>
        </div>

        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1">
          <span className="text-[10px] font-bold text-[#2012ad] uppercase tracking-wider block">
            Overtime Compensation
          </span>
          <strong className="text-xl font-extrabold text-[#2012ad] font-mono">
            ₹{overtime.overtimeAmount.toLocaleString('en-IN')}
          </strong>
        </div>
      </div>
    </div>
  );
};

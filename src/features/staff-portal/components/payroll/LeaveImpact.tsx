import React from 'react';
import { StaffLeaveImpactSummary } from '../../services/staffPayrollService';
import { Calendar } from 'lucide-react';

interface LeaveImpactProps {
  leaveImpact: StaffLeaveImpactSummary | null;
}

export const LeaveImpact: React.FC<LeaveImpactProps> = ({ leaveImpact }) => {
  if (!leaveImpact) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Leave Policy & Payroll Impact
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Approved paid leaves protect your compensation; loss-of-pay leaves are deducted per daily basic rate
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
          Daily Rate: ₹{leaveImpact.dailyRate.toLocaleString('en-IN')}/d
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Paid Leave Days
            </span>
            <strong className="text-xl font-extrabold text-emerald-900 font-mono">
              {leaveImpact.paidLeaveDays} Days
            </strong>
          </div>
          <span className="text-[11px] font-bold text-emerald-600">₹0 Deducted</span>
        </div>

        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Unpaid Leave Days
            </span>
            <strong className="text-xl font-extrabold text-amber-900 font-mono">
              {leaveImpact.unpaidLeaveDays} Days
            </strong>
          </div>
          <span className="text-[11px] font-bold text-amber-600">Loss of Pay</span>
        </div>

        <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
              Salary Deduction
            </span>
            <strong className="text-xl font-extrabold text-rose-900 font-mono">
              -₹{leaveImpact.unpaidLeaveDeduction.toLocaleString('en-IN')}
            </strong>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {leaveImpact.unpaidLeaveDays} × ₹{leaveImpact.dailyRate}
          </span>
        </div>
      </div>
    </div>
  );
};

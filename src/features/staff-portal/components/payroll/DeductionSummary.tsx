import React from 'react';
import { StaffPayrollDetails } from '../../services/staffPayrollService';
import { MinusCircle } from 'lucide-react';

interface DeductionSummaryProps {
  payroll: StaffPayrollDetails | null;
}

export const DeductionSummary: React.FC<DeductionSummaryProps> = ({ payroll }) => {
  if (!payroll) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <MinusCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Payroll Deductions Breakdown
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Recoveries, unpaid leaves, and statutory adjustments for the period
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
          Total: -₹{payroll.totalDeductions.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Deductions List */}
      {payroll.deductions.length === 0 && payroll.totalDeductions === 0 ? (
        <div className="p-6 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs font-bold text-slate-600">No deductions applied for this payroll period.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 text-xs">
          {payroll.deductions.map((d, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="font-bold text-slate-800">{d.name}</span>
                <span className="text-[10px] font-mono text-slate-400">({d.code})</span>
              </div>
              <strong className="font-extrabold text-rose-600 font-mono">
                -₹{d.amount.toLocaleString('en-IN')}
              </strong>
            </div>
          ))}

          {/* Unpaid Leave Deduction fallback if not already listed */}
          {payroll.leaveImpact.unpaidLeaveDeduction > 0 &&
            !payroll.deductions.some((d) => d.code === 'UNPAID_LEAVE') && (
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="font-bold text-slate-800">Unpaid Leave Deduction</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({payroll.leaveImpact.unpaidLeaveDays} Days @ ₹{payroll.leaveImpact.dailyRate}/day)
                  </span>
                </div>
                <strong className="font-extrabold text-rose-600 font-mono">
                  -₹{payroll.leaveImpact.unpaidLeaveDeduction.toLocaleString('en-IN')}
                </strong>
              </div>
            )}

          {/* Total Row */}
          <div className="pt-3 flex items-center justify-between text-xs font-extrabold text-slate-900 bg-rose-50/40 p-2.5 rounded-xl border border-rose-100">
            <span>Total Deductions:</span>
            <span className="text-rose-700 text-sm font-mono">
              -₹{payroll.totalDeductions.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

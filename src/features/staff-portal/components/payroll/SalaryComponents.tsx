import React from 'react';
import { StaffPayrollDetails } from '../../services/staffPayrollService';
import { Wallet } from 'lucide-react';

interface SalaryComponentsProps {
  payroll: StaffPayrollDetails | null;
}

export const SalaryComponents: React.FC<SalaryComponentsProps> = ({ payroll }) => {
  if (!payroll) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Salary Components & Earnings
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Breakdown of basic salary, fixed allowances, approved overtime, and incentives
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Gross: ₹{payroll.grossEarnings.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Component Items List */}
      <div className="divide-y divide-slate-100 text-xs">
        {payroll.earnings.map((e, idx) => (
          <div key={idx} className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-800">{e.name}</span>
              <span className="text-[10px] font-mono text-slate-400">({e.code})</span>
            </div>
            <strong className="font-extrabold text-slate-900 font-mono">
              ₹{e.amount.toLocaleString('en-IN')}
            </strong>
          </div>
        ))}

        {/* Overtime Earning Row if present */}
        {payroll.overtimeAmount > 0 && !payroll.earnings.some((e) => e.code === 'OVERTIME') && (
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-800">Approved Overtime Pay</span>
              <span className="text-[10px] font-mono text-slate-400">({payroll.overtimeHours}h @ ₹{payroll.overtimeSummary.hourlyRate * 1.5}/hr)</span>
            </div>
            <strong className="font-extrabold text-emerald-600 font-mono">
              +₹{payroll.overtimeAmount.toLocaleString('en-IN')}
            </strong>
          </div>
        )}

        {/* Incentives Earning Row if present */}
        {payroll.incentiveSummary.totalIncentives > 0 && !payroll.earnings.some((e) => e.code === 'INCENTIVE') && (
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-800">Approved Performance Incentives</span>
            </div>
            <strong className="font-extrabold text-amber-600 font-mono">
              +₹{payroll.incentiveSummary.totalIncentives.toLocaleString('en-IN')}
            </strong>
          </div>
        )}

        {/* Total Gross Row */}
        <div className="pt-3 flex items-center justify-between text-xs font-extrabold text-slate-900 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
          <span>Total Gross Earnings:</span>
          <span className="text-emerald-700 text-sm font-mono">
            ₹{payroll.grossEarnings.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};

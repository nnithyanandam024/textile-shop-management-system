import React from 'react';
import { StaffPayrollDetails } from '../../services/staffPayrollService';
import { FileText, ChevronDown } from 'lucide-react';

interface SalaryOverviewProps {
  payroll: StaffPayrollDetails | null;
  periods: Array<{ id: number; name: string; year: number; month: number; status: string }>;
  selectedPeriodId?: number;
  onSelectPeriod: (periodId: number) => void;
  onViewPayslip: () => void;
}

export const SalaryOverview: React.FC<SalaryOverviewProps> = ({
  payroll,
  periods,
  selectedPeriodId,
  onSelectPeriod,
  onViewPayslip,
}) => {
  if (!payroll) return null;

  const isFinalized = payroll.status === 'APPROVED' || payroll.status === 'LOCKED' || payroll.status === 'PAID';

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-6">
      {/* Header Row with Title & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              My Payroll & Compensation
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                isFinalized
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isFinalized ? 'Finalized' : 'Current Estimate'}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Verified salary calculations, earnings, allowances, deductions, and downloadable payslips
          </p>
        </div>

        {/* Period Selector & View Payslip Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {periods.length > 0 && (
            <div className="relative">
              <select
                value={selectedPeriodId || periods[0]?.id}
                onChange={(e) => onSelectPeriod(Number(e.target.value))}
                className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] cursor-pointer"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <button
            type="button"
            onClick={onViewPayslip}
            className="px-4 py-2 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Payslip</span>
          </button>
        </div>
      </div>

      {/* Net Salary Main Highlight Card */}
      <div className="bg-linear-to-br from-[#1e147e] via-[#2012ad] to-[#4338ca] rounded-2xl p-6 text-white shadow-lg shadow-indigo-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Net Take-Home Salary
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-white/10 text-white border border-white/20">
              {payroll.periodName}
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans">
            ₹{payroll.netSalary.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-indigo-100/80 font-semibold">
            Credited via Bank Transfer / Direct Salary Settlement
          </p>
        </div>

        {/* Breakdown Summary Mini-Badges inside Hero Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 z-10 text-xs">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] font-bold text-indigo-200 block">Gross Earnings</span>
            <strong className="text-sm font-extrabold text-white">
              ₹{payroll.grossEarnings.toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] font-bold text-indigo-200 block">Deductions</span>
            <strong className="text-sm font-extrabold text-rose-200">
              -₹{payroll.totalDeductions.toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] font-bold text-indigo-200 block">Overtime Pay</span>
            <strong className="text-sm font-extrabold text-emerald-200">
              +₹{payroll.overtimeAmount.toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] font-bold text-indigo-200 block">Incentives</span>
            <strong className="text-sm font-extrabold text-amber-200">
              +₹{payroll.incentiveSummary.totalIncentives.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

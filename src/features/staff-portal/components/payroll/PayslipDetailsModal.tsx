import React from 'react';
import { StaffPayrollDetails } from '../../services/staffPayrollService';
import { Printer, X, Receipt } from 'lucide-react';

interface PayslipDetailsModalProps {
  payroll: StaffPayrollDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayslipDetailsModal: React.FC<PayslipDetailsModalProps> = ({
  payroll,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !payroll) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200/80 overflow-hidden print:shadow-none print:border-none print:w-full print:p-0 max-h-[90vh] flex flex-col">
        {/* Modal Top Action Bar (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Official Payslip Statement</h3>
              <p className="text-xs font-semibold text-slate-500">
                {payroll.staffCode} — {payroll.staffName} ({payroll.periodName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Payslip Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900 font-sans overflow-y-auto custom-scrollbar">
          {/* Shop Branding Header */}
          <div className="text-center border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-extrabold text-[#2012ad] tracking-wider uppercase">
              TEXORA TEXTILE HUB
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Official Employee Salary Payment Advice & Tax Summary
            </p>
          </div>

          {/* Employee & Period Details Matrix */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Employee Code & Name
              </span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                {payroll.staffCode} — {payroll.staffName}
              </p>

              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-2.5">
                Department & Designation
              </span>
              <p className="font-bold text-slate-700 mt-0.5">
                {payroll.departmentName} ({payroll.designationName})
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Payroll Period
              </span>
              <p className="font-extrabold text-[#2012ad] text-sm mt-0.5">
                {payroll.periodName}
              </p>

              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-2.5">
                Attendance Summary
              </span>
              <p className="font-bold text-slate-700 mt-0.5">
                Present: {payroll.attendanceImpact.presentDays}d | Unpaid: {payroll.attendanceImpact.unpaidLeaveDays}d | OT: {payroll.overtimeHours}h
              </p>
            </div>
          </div>

          {/* Earnings vs Deductions Side-by-Side Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Earnings Table */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-emerald-50/20 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-2 mb-3">
                  Earnings Breakdown
                </h4>
                <div className="space-y-2 text-xs">
                  {payroll.earnings.map((e, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold">{e.name}</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ₹{e.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}

                  {payroll.overtimeAmount > 0 && !payroll.earnings.some((e) => e.code === 'OVERTIME') && (
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold">Approved Overtime Pay</span>
                      <span className="font-bold text-emerald-600 font-mono">
                        +₹{payroll.overtimeAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {payroll.incentiveSummary.totalIncentives > 0 && !payroll.earnings.some((e) => e.code === 'INCENTIVE') && (
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold">Performance Incentives</span>
                      <span className="font-bold text-amber-600 font-mono">
                        +₹{payroll.incentiveSummary.totalIncentives.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center font-extrabold text-slate-900 text-xs mt-4">
                <span>Gross Earnings:</span>
                <span className="text-emerald-700 font-mono text-sm">
                  ₹{payroll.grossEarnings.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Deductions Table */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-rose-50/20 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-800 border-b border-slate-200 pb-2 mb-3">
                  Deductions Breakdown
                </h4>
                <div className="space-y-2 text-xs">
                  {payroll.deductions.map((d, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold">{d.name}</span>
                      <span className="font-bold text-rose-600 font-mono">
                        -₹{d.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}

                  {payroll.leaveImpact.unpaidLeaveDeduction > 0 && !payroll.deductions.some((d) => d.code === 'UNPAID_LEAVE') && (
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold">Unpaid Leave Deduction</span>
                      <span className="font-bold text-rose-600 font-mono">
                        -₹{payroll.leaveImpact.unpaidLeaveDeduction.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {payroll.deductions.length === 0 && payroll.totalDeductions === 0 && (
                    <p className="text-[11px] text-slate-400 font-semibold italic">No deductions applied</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center font-extrabold text-slate-900 text-xs mt-4">
                <span>Total Deductions:</span>
                <span className="text-rose-700 font-mono text-sm">
                  -₹{payroll.totalDeductions.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Net Salary Bottom Badge Box */}
          <div className="p-4 bg-linear-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Net Take-Home Salary Payable
              </span>
              <p className="text-xs text-slate-600 font-semibold">
                Gross Earnings minus Applicable Deductions
              </p>
            </div>
            <strong className="text-2xl font-extrabold text-[#2012ad] font-mono">
              ₹{payroll.netSalary.toLocaleString('en-IN')}
            </strong>
          </div>

          {/* Footer Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
            <div>
              <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
              <span className="font-bold">Employee Signature</span>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
              <span className="font-bold">Authorized Employer Signature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

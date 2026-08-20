import React from 'react';
import { StaffPayrollHistoryItem } from '../../services/staffPayrollService';
import { FileText, Eye, CheckCircle2, History } from 'lucide-react';

interface PayslipHistoryProps {
  history: StaffPayrollHistoryItem[];
  onViewPayslip: (recordId: number) => void;
}

export const PayslipHistory: React.FC<PayslipHistoryProps> = ({ history, onViewPayslip }) => {
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
              Payslip History & Past Statements
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Access previous approved salary statements and payment receipts
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-400">
          {history.length} {history.length === 1 ? 'Statement' : 'Statements'}
        </span>
      </div>

      {/* History Table */}
      {history.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-600">No finalized payslips available yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="pb-3 px-3">Payroll Period</th>
                <th className="pb-3 px-3">Gross Earnings</th>
                <th className="pb-3 px-3">Deductions</th>
                <th className="pb-3 px-3">Net Take-Home</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                    {h.periodName}
                  </td>

                  <td className="py-3 px-3 font-bold text-slate-700 font-mono whitespace-nowrap">
                    ₹{h.grossEarnings.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3 font-bold text-rose-600 font-mono whitespace-nowrap">
                    -₹{h.totalDeductions.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3 font-extrabold text-[#2818cf] font-mono whitespace-nowrap">
                    ₹{h.netSalary.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{h.status}</span>
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onViewPayslip(h.id)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Payslip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

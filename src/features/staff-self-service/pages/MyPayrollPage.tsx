import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DollarSign, Printer, Download, Eye, FileText } from 'lucide-react';

export const MyPayrollPage: React.FC = () => {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const fetchPayroll = async () => {
    try {
      if (window.api?.selfService) {
        const records = await window.api.selfService.getPayroll();
        setPayrolls(records || []);
      }
    } catch (err) {
      console.error('Failed to load payroll:', err);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Payroll & Payslips</h1>
            <p className="text-xs font-semibold text-slate-500">Private salary history, itemized monthly breakdown & payslip downloads</p>
          </div>
        </div>
      </div>

      {/* Salary Records Table */}
      <Card className="space-y-4">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Salary Payslip History</h3>
          <span className="text-[11px] font-semibold text-slate-500">{payrolls.length} payslips</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Basic Salary</th>
                <th className="py-3 px-4">Allowances</th>
                <th className="py-3 px-4">Incentives</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No finalized payslip records available yet
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.month} {p.year}</td>
                    <td className="py-3 px-4 font-mono">₹{p.basic_salary?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600">+₹{p.allowances?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600">+₹{p.incentives?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4 font-mono text-rose-600">-₹{p.deductions?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4 font-extrabold text-[#2818cf] text-sm">₹{p.net_salary?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="outline" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => setSelectedPayslip(p)}>
                        View Payslip
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payslip Detail Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2818cf]" />
                <h3 className="text-base font-bold text-slate-900">Payslip — {selectedPayslip.month} {selectedPayslip.year}</h3>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                <div className="flex justify-between font-bold border-b border-slate-200/80 pb-2">
                  <span>Basic Salary</span>
                  <span>₹{selectedPayslip.basic_salary?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Allowances</span>
                  <span>+₹{selectedPayslip.allowances?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Overtime & Incentives</span>
                  <span>+₹{selectedPayslip.incentives?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600 border-b border-slate-200/80 pb-2">
                  <span>Tax & Deductions</span>
                  <span>-₹{selectedPayslip.deductions?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#2818cf] pt-1">
                  <span>Net Salary Payable</span>
                  <span>₹{selectedPayslip.net_salary?.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
                  Print
                </Button>
                <Button variant="primary" icon={<Download className="w-4 h-4" />} onClick={() => setSelectedPayslip(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

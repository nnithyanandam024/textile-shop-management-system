import React from 'react';
import { Button } from '../../../components/ui/Button';
import { X, Printer, Receipt } from 'lucide-react';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  periodName?: string;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  record,
  periodName,
}) => {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const lineItems = record.line_items || [];
  const earnings = lineItems.filter((i: any) => i.type === 'EARNING');
  const deductions = lineItems.filter((i: any) => i.type === 'DEDUCTION');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200/80 overflow-hidden print:shadow-none print:border-none print:w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Employee Payslip</h3>
              <p className="text-xs text-slate-500">
                {record.staff_code} — {record.first_name} {record.last_name || ''} ({periodName || 'Monthly Payroll'})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              Print Payslip
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Payslip Print Container */}
        <div className="p-8 space-y-6 text-slate-900 font-sans">
          {/* Shop Branding */}
          <div className="text-center border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-extrabold text-[#2012ad] tracking-wider uppercase">ரத்னா விலாஸ் (RATNA VILAS)</h1>
            <p className="text-xs text-amber-800 font-extrabold uppercase mt-0.5">பட்டு &amp; ஜவுளி மாளிகை • SILKS &amp; TEXTILES</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Official Employee Salary Payment Advice</p>
          </div>

          {/* Employee & Period Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <p className="text-slate-500">Employee Code & Name:</p>
              <p className="font-extrabold text-slate-900 text-sm">{record.staff_code} — {record.first_name} {record.last_name || ''}</p>
              <p className="text-slate-500 mt-2">Department & Designation:</p>
              <p className="font-semibold text-slate-800">{record.department_name || 'Staff'} ({record.designation_name || 'Associate'})</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Payroll Period:</p>
              <p className="font-extrabold text-[#2012ad] text-sm">{periodName || 'Monthly Payroll'}</p>
              <p className="text-slate-500 mt-2">Attendance Summary:</p>
              <p className="font-semibold text-slate-800">
                Present: {record.present_days}d | Unpaid Leave: {record.unpaid_leave_days}d | OT: {record.overtime_hours}h
              </p>
            </div>
          </div>

          {/* Earnings & Deductions Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Earnings Column */}
            <div className="border border-slate-200 rounded-xl p-4 bg-emerald-50/20">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-2 mb-3">
                Earnings Breakdown
              </h4>
              <div className="space-y-2 text-xs">
                {earnings.map((e: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span>{e.component_name}</span>
                    <span className="font-bold text-slate-900">₹{e.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900 text-xs">
                  <span>Gross Earnings:</span>
                  <span className="text-emerald-700">₹{record.gross_earnings.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-slate-200 rounded-xl p-4 bg-rose-50/20">
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800 border-b border-slate-200 pb-2 mb-3">
                Deductions Breakdown
              </h4>
              <div className="space-y-2 text-xs">
                {deductions.length === 0 ? (
                  <p className="text-slate-400 italic">No deductions applied</p>
                ) : (
                  deductions.map((d: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700">
                      <span>{d.component_name}</span>
                      <span className="font-bold text-rose-700">-₹{d.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900 text-xs">
                  <span>Total Deductions:</span>
                  <span className="text-rose-700">₹{record.total_deductions.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary Summary Box */}
          <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Net Take-Home Salary</span>
              <p className="text-xs text-slate-500 font-semibold">Credited to employee salary bank account</p>
            </div>
            <span className="text-2xl font-extrabold text-[#2012ad]">₹{record.net_salary.toLocaleString()}</span>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs text-slate-500 font-semibold">
            <div className="text-center pt-8 border-t border-dashed border-slate-300">
              Employee Signature
            </div>
            <div className="text-center pt-8 border-t border-dashed border-slate-300">
              Authorized Signature (Employer)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

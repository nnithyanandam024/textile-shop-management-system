import React from 'react';
import { StaffSalaryRevisionItem } from '../../services/staffPayrollService';
import { TrendingUp, Calendar, ArrowRight } from 'lucide-react';

interface SalaryHistoryProps {
  salaryHistory: StaffSalaryRevisionItem[];
}

export const SalaryHistory: React.FC<SalaryHistoryProps> = ({ salaryHistory }) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Salary History & Increment Timeline
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Audit log of base compensation revisions, increments, and role appraisals
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-400">
          {salaryHistory.length} {salaryHistory.length === 1 ? 'Revision' : 'Revisions'}
        </span>
      </div>

      {/* Timeline items */}
      {salaryHistory.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-600">Initial salary structure active. No revisions logged.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {salaryHistory.map((sh) => (
            <div
              key={sh.id}
              className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-extrabold text-slate-900">
                    Effective From: {sh.effectiveFrom} {sh.effectiveTo ? `to ${sh.effectiveTo}` : '(Current)'}
                  </span>
                  <span
                    className={`px-2 py-0.2 rounded-md text-[10px] font-extrabold ${
                      sh.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {sh.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">{sh.reason || 'Appraisal / Compensation Adjustment'}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block">Basic Salary</span>
                  <strong className="text-xs font-extrabold text-slate-800 font-mono">
                    ₹{sh.basicSalary.toLocaleString('en-IN')}
                  </strong>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />

                <div className="text-right bg-white px-3 py-1.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-indigo-900 block">Gross Package</span>
                  <strong className="text-sm font-extrabold text-[#2012ad] font-mono">
                    ₹{sh.grossSalary.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

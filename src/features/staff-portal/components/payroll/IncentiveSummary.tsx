import React from 'react';
import { StaffIncentiveSummary } from '../../services/staffPayrollService';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface IncentiveSummaryProps {
  incentives: StaffIncentiveSummary | null;
}

export const IncentiveSummary: React.FC<IncentiveSummaryProps> = ({ incentives }) => {
  if (!incentives || incentives.items.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Performance & Sales Incentives
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Rewards for sales volume, attendance consistency, and target achievements
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
          Total: +₹{incentives.totalIncentives.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-2.5">
        {incentives.items.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900">{item.incentiveType}</span>
                {item.targetAchievement && (
                  <span className="px-2 py-0.2 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    {item.targetAchievement}% Target Met
                  </span>
                )}
              </div>
              {item.reason && (
                <p className="text-[11px] text-slate-500 font-semibold">{item.reason}</p>
              )}
            </div>

            <div className="text-right">
              <span className="text-sm font-extrabold text-amber-600 font-mono block">
                +₹{item.amount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Approved</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

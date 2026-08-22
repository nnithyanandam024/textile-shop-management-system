import React from 'react';
import { StaffInventoryHistoryItem } from '../../services/staffInventoryService';
import { History, ClipboardCheck, ArrowRightLeft, PackageCheck } from 'lucide-react';

interface InventoryHistoryProps {
  history: StaffInventoryHistoryItem[];
}

export const InventoryHistory: React.FC<InventoryHistoryProps> = ({ history }) => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Inventory Activity & Movement Ledger
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Audit log of physical stock counts, receiving verification logs, and transfer requests
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-400">
          {history.length} {history.length === 1 ? 'Activity' : 'Activities'}
        </span>
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <History className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-600">No recent inventory operations logged.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((h, idx) => {
            let Icon = ClipboardCheck;
            let iconBg = 'bg-indigo-50 text-[#2818cf]';
            if (h.type === 'TRANSFER_REQUEST') {
              Icon = ArrowRightLeft;
              iconBg = 'bg-emerald-50 text-emerald-700';
            } else if (h.type === 'RECEIVING_REPORT') {
              Icon = PackageCheck;
              iconBg = 'bg-purple-50 text-purple-700';
            }

            return (
              <div
                key={`${h.type}-${h.id}-${idx}`}
                className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-900 truncate">{h.title}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold truncate">{h.details}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700 block">
                    {h.status}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{h.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

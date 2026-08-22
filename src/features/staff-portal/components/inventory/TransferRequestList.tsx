import React from 'react';
import { StaffTransferRequestItem } from '../../services/staffInventoryService';
import { ArrowRightLeft, Clock, CheckCircle2, XCircle, Truck } from 'lucide-react';

interface TransferRequestListProps {
  transfers: StaffTransferRequestItem[];
}

export const TransferRequestList: React.FC<TransferRequestListProps> = ({ transfers }) => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              My Stock Transfer Requests
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Track multi-location store stock movements, approvals, and dispatch progress
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-400">
          {transfers.length} {transfers.length === 1 ? 'Request' : 'Requests'}
        </span>
      </div>

      {/* Table */}
      {transfers.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <ArrowRightLeft className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-600">No transfer requests logged yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <th className="pb-2.5 px-3">Product / SKU</th>
                <th className="pb-2.5 px-3">Movement Route</th>
                <th className="pb-2.5 px-3 text-center">Quantity</th>
                <th className="pb-2.5 px-3">Purpose / Reason</th>
                <th className="pb-2.5 px-3">Status</th>
                <th className="pb-2.5 px-3 text-right">Requested Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((t) => {
                let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                let Icon = Clock;
                if (t.status === 'APPROVED' || t.status === 'RECEIVED') {
                  badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  Icon = CheckCircle2;
                } else if (t.status === 'IN_TRANSIT') {
                  badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  Icon = Truck;
                } else if (t.status === 'REJECTED' || t.status === 'CANCELLED') {
                  badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  Icon = XCircle;
                }

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <strong className="text-slate-900 block font-extrabold">{t.productName}</strong>
                      <span className="text-[10px] font-mono text-slate-400">SKU: {t.sku}</span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {t.fromLocation} → <strong className="text-slate-900">{t.toLocation}</strong>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-extrabold text-[#2012ad]">
                      {t.quantity} pcs
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-semibold max-w-xs truncate">
                      {t.reason}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeClass}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{t.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                      {t.createdAt}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

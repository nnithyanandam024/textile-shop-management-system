import React from 'react';
import { StaffCustomerReturnItem } from '../../services/staffCustomerService';
import { RotateCcw, AlertCircle } from 'lucide-react';

interface CustomerReturnsTabProps {
  returns: StaffCustomerReturnItem[];
}

export const CustomerReturnsTab: React.FC<CustomerReturnsTabProps> = ({ returns }) => {
  if (returns.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs text-center space-y-2 select-none">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <RotateCcw className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-extrabold text-slate-800">No Returns Recorded</h4>
        <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
          This customer has never processed any product returns or exchanges.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
        <h4 className="text-xs font-extrabold text-slate-900">Returns & Exchanges Ledger</h4>
        <span className="text-[11px] font-bold text-slate-400 font-mono">
          {returns.length} Return Entries
        </span>
      </div>

      {/* Returns List */}
      <div className="divide-y divide-slate-100">
        {returns.map((ret) => (
          <div key={ret.id} className="p-6 space-y-3 hover:bg-slate-50/50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 font-mono">
                      {ret.returnNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                      {ret.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Invoice: <span className="font-mono text-slate-600">{ret.invoiceNumber}</span> • {new Date(ret.returnDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-rose-600 font-mono">
                  -₹{ret.refundAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Refund Issued</span>
              </div>
            </div>

            {/* Returned Items */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
              {ret.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{item.productName}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-600 border border-slate-200/80">
                      Qty: {item.quantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500">Reason: {item.reason.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      item.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.condition === 'GOOD' ? 'Restocked' : 'Damaged'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {ret.reason && (
              <p className="text-[11px] text-slate-500 italic flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Remarks: "{ret.reason}"</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

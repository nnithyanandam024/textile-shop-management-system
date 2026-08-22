import React, { useState } from 'react';
import { StaffCustomerPurchaseItem } from '../../services/staffCustomerService';
import { FileText, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';

interface CustomerPurchaseHistoryTabProps {
  purchases: StaffCustomerPurchaseItem[];
}

export const CustomerPurchaseHistoryTab: React.FC<CustomerPurchaseHistoryTabProps> = ({
  purchases,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs text-center space-y-2 select-none">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-extrabold text-slate-800">No Purchase History Yet</h4>
        <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
          This customer has not made any completed sales orders yet. New completed POS invoices will automatically appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
        <h4 className="text-xs font-extrabold text-slate-900">Invoices & Billing History</h4>
        <span className="text-[11px] font-bold text-slate-400 font-mono">
          {purchases.length} Completed Invoices
        </span>
      </div>

      {/* Invoices List */}
      <div className="divide-y divide-slate-100">
        {purchases.map((sale) => {
          const isExpanded = expandedId === sale.id;
          return (
            <div key={sale.id} className="transition-colors hover:bg-slate-50/50">
              <div
                onClick={() => toggleExpand(sale.id)}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900 font-mono">
                        {sale.invoiceNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {sale.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(sale.saleDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      • {sale.itemsCount} items
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 font-mono block">
                      ₹{sale.total.toLocaleString('en-IN')}
                    </span>
                    {sale.discount > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold font-mono">
                        Saved ₹{sale.discount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable Line Items Table */}
              {isExpanded && (
                <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 text-xs">
                  <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">Item Description</th>
                          <th className="px-4 py-2.5">SKU</th>
                          <th className="px-4 py-2.5 text-center">Qty</th>
                          <th className="px-4 py-2.5 text-right">Unit Price</th>
                          <th className="px-4 py-2.5 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {sale.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2.5 font-bold text-slate-900">
                              {item.productName}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                              {item.sku}
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono">{item.quantity}</td>
                            <td className="px-4 py-2.5 text-right font-mono">
                              ₹{item.unitPrice.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-2.5 text-right font-black font-mono text-slate-900">
                              ₹{item.total.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { StaffPOSCustomerItem } from '../../services/staffPOSService';
import { User, Plus, History, Phone } from 'lucide-react';

interface POSCustomerSelectorProps {
  customers: StaffPOSCustomerItem[];
  selectedCustomer: StaffPOSCustomerItem | null;
  customerHistory: { orderCount: number; lifetimeSpend: number; lastPurchaseDate?: string } | null;
  onSelectCustomer: (customer: StaffPOSCustomerItem) => void;
  onOpenNewCustomerModal: () => void;
}

export const POSCustomerSelector: React.FC<POSCustomerSelectorProps> = ({
  customers,
  selectedCustomer,
  customerHistory,
  onSelectCustomer,
  onOpenNewCustomerModal,
}) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3 select-none">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#2818cf]" />
          <span>Customer Information</span>
        </label>

        <button
          type="button"
          onClick={onOpenNewCustomerModal}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-[#2818cf] rounded-xl text-[11px] font-extrabold transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Customer Selection Dropdown */}
      <div className="relative">
        <select
          value={selectedCustomer?.id || ''}
          onChange={(e) => {
            const found = customers.find((c) => c.id === Number(e.target.value));
            if (found) onSelectCustomer(found);
          }}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf] transition-all cursor-pointer"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.phone ? `(${c.phone})` : ''} - {c.customer_code}
            </option>
          ))}
        </select>
      </div>

      {/* Customer Summary Chip */}
      {selectedCustomer && (
        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between text-[11px]">
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-800">{selectedCustomer.name}</span>
            {selectedCustomer.phone && (
              <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                <Phone className="w-2.5 h-2.5 text-slate-400" />
                <span>{selectedCustomer.phone}</span>
              </div>
            )}
          </div>

          {customerHistory && customerHistory.orderCount > 0 && (
            <div className="flex items-center gap-2 text-right">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">
                  {customerHistory.orderCount} Orders
                </span>
                <span className="text-[11px] font-extrabold text-[#2818cf] font-mono">
                  ₹{customerHistory.lifetimeSpend.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

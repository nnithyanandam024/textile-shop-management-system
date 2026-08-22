import React from 'react';
import { StaffCustomerListItem } from '../../services/staffCustomerService';
import { User, Phone, ArrowRight, Award } from 'lucide-react';

interface CustomerListTableProps {
  customers: StaffCustomerListItem[];
  onSelectCustomer: (customerId: number) => void;
  loading?: boolean;
}

export const CustomerListTable: React.FC<CustomerListTableProps> = ({
  customers,
  onSelectCustomer,
  loading,
}) => {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'GOLD':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'SILVER':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="h-12 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs text-center space-y-2 select-none">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-extrabold text-slate-800">No Customers Found</h4>
        <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
          Try searching with a different name or mobile number, or click "+ New Customer" to register a new shopper.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
        <h4 className="text-xs font-extrabold text-slate-900">Registered Customer Master</h4>
        <span className="text-[11px] font-bold text-slate-400 font-mono">
          {customers.length} Profiles
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Customer Name & Code</th>
              <th className="px-6 py-3.5">Contact Mobile</th>
              <th className="px-6 py-3.5">Total Spend</th>
              <th className="px-6 py-3.5">Orders</th>
              <th className="px-6 py-3.5">Loyalty Tier</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {customers.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelectCustomer(c.id)}
                className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
              >
                {/* Name & Code */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#2012ad] font-extrabold text-xs flex items-center justify-center shrink-0">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block group-hover:text-[#2012ad] transition-colors">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.customerCode}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Mobile */}
                <td className="px-6 py-4">
                  {c.phone ? (
                    <div className="flex items-center gap-1.5 text-slate-600 font-mono text-xs">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>

                {/* Total Spend */}
                <td className="px-6 py-4 font-black text-slate-900 font-mono text-xs">
                  ₹{c.totalPurchases.toLocaleString('en-IN')}
                </td>

                {/* Orders */}
                <td className="px-6 py-4 text-slate-600 font-mono">
                  {c.ordersCount} Orders
                </td>

                {/* Loyalty Tier */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider flex items-center gap-1 ${getTierColor(
                        c.tier
                      )}`}
                    >
                      <Award className="w-3 h-3" />
                      <span>{c.tier}</span>
                    </span>
                    <span className="text-[11px] font-extrabold text-[#2012ad] font-mono">
                      {c.loyaltyPoints} pts
                    </span>
                  </div>
                </td>

                {/* Action */}
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCustomer(c.id);
                    }}
                    className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-[#2012ad] rounded-xl transition-colors inline-flex items-center gap-1 text-[11px] font-extrabold"
                  >
                    <span>Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

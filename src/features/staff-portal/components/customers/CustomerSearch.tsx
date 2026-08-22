import React from 'react';
import { Search, UserPlus } from 'lucide-react';

interface CustomerSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  tierFilter: string;
  onTierFilterChange: (tier: string) => void;
  onOpenAddModal: () => void;
}

export const CustomerSearch: React.FC<CustomerSearchProps> = ({
  query,
  onQueryChange,
  tierFilter,
  onTierFilterChange,
  onOpenAddModal,
}) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by Name, Mobile (e.g. 9876543210 / +91), or Customer ID..."
          className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] transition-all"
        />
      </div>

      {/* Tier Filters & Add Customer Button */}
      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        {/* Tier Pills */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-2xl text-[11px] font-extrabold text-slate-600">
          {[
            { id: 'ALL', label: 'All Tiers' },
            { id: 'BRONZE', label: 'Bronze' },
            { id: 'SILVER', label: 'Silver' },
            { id: 'GOLD', label: 'Gold' },
            { id: 'PLATINUM', label: 'Platinum' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTierFilterChange(t.id)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                tierFilter === t.id
                  ? 'bg-white text-[#2012ad] shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Add Customer Button */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-4 py-2.5 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>
    </div>
  );
};

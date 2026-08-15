import React from 'react';
import { Search, Bell, History, User } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between shrink-0 select-none z-10">
      {/* Search Input Bar */}
      <div className="relative w-96">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search inventory, POs, or staff..."
          className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/30 focus:border-[#2818cf] transition-colors"
        />
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-5">
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
          <History className="w-5 h-5" />
        </button>

        <button className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-full transition-colors">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

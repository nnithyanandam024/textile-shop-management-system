import React, { useState } from 'react';
import { KeyRound, ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react';

interface DemoAccount {
  label: string;
  role: string;
  badgeBg: string;
  badgeText: string;
  username: string;
  employeeId?: string;
  password: string;
  description: string;
}

interface DemoCredentialsHelperProps {
  onSelect: (identifier: string, password: string) => void;
  portalType?: 'STAFF' | 'ADMIN';
}

export const DemoCredentialsHelper: React.FC<DemoCredentialsHelperProps> = ({
  onSelect,
  portalType = 'STAFF',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const staffAccounts: DemoAccount[] = [
    {
      label: 'Arun Kumar',
      role: 'Senior Staff',
      badgeBg: 'bg-indigo-50 text-[#2818cf] border-indigo-100',
      badgeText: 'STF001 / STF-0002',
      username: 'arun.cashier',
      employeeId: 'STF001',
      password: 'password123',
      description: 'Senior Sales Associate • Main Storefront',
    },
    {
      label: 'Priya Sharma',
      role: 'Sales Executive',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      badgeText: 'STF-0003',
      username: 'priya.sales',
      employeeId: 'STF-0003',
      password: 'password123',
      description: 'Women Wear Floor Staff',
    },
    {
      label: 'Rajesh Kumar',
      role: 'Store Manager',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-100',
      badgeText: 'STF-0001',
      username: 'manager',
      employeeId: 'STF-0001',
      password: 'password123',
      description: 'Store Operations Supervisor',
    },
    {
      label: 'Karthik Raja',
      role: 'Inventory Staff',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
      badgeText: 'STF-0004',
      username: 'karthik.inventory',
      employeeId: 'STF-0004',
      password: 'password123',
      description: 'Stock & Warehouse Specialist',
    },
    {
      label: 'Anitha Ramesh',
      role: 'HR & Accounts',
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-100',
      badgeText: 'STF-0005',
      username: 'anitha.hr',
      employeeId: 'STF-0005',
      password: 'password123',
      description: 'People Operations & Payroll',
    },
  ];

  const adminAccounts: DemoAccount[] = [
    {
      label: 'Store Administrator',
      role: 'Super Owner',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-100',
      badgeText: 'Owner',
      username: 'admin',
      password: 'password123',
      description: 'Full administrative store access',
    },
    {
      label: 'Rajesh Kumar',
      role: 'Branch Manager',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-100',
      badgeText: 'Manager',
      username: 'manager',
      password: 'password123',
      description: 'Sales, Inventory, and Purchases',
    },
    {
      label: 'Arun Kumar',
      role: 'Head Cashier',
      badgeBg: 'bg-indigo-50 text-[#2818cf] border-indigo-100',
      badgeText: 'Cashier',
      username: 'arun.cashier',
      password: 'password123',
      description: 'POS Terminal & Customer Registry',
    },
    {
      label: 'Karthik Raja',
      role: 'Inventory Specialist',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
      badgeText: 'Inventory Staff',
      username: 'karthik.inventory',
      password: 'password123',
      description: 'Stock adjustments and receipts',
    },
  ];

  const activeAccounts = portalType === 'STAFF' ? staffAccounts : adminAccounts;

  const handleFill = (acc: DemoAccount, index: number) => {
    const id = portalType === 'STAFF' ? (acc.employeeId || acc.username) : acc.username;
    onSelect(id, acc.password);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="w-full mt-6 bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden transition-all duration-200 select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#2818cf]" />
          <span className="text-xs font-extrabold text-slate-800 tracking-tight">
            Demo Login Accounts
          </span>
          <span className="text-[10px] font-bold bg-indigo-50 text-[#2818cf] px-1.5 py-0.2 rounded border border-indigo-100">
            Password: password123
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="p-3 pt-1 border-t border-slate-200/70 space-y-2 animate-in fade-in duration-150">
          <p className="text-[11px] font-semibold text-slate-500 px-1">
            Click any account below to auto-fill credentials:
          </p>

          <div className="grid grid-cols-1 gap-1.5">
            {activeAccounts.map((acc, index) => (
              <div
                key={index}
                onClick={() => handleFill(acc, index)}
                className="p-2.5 bg-white hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900 group-hover:text-[#2818cf] transition-colors truncate">
                      {acc.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${acc.badgeBg}`}
                    >
                      {acc.badgeText}
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                    {acc.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFill(acc, index);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-[#2818cf] text-slate-700 hover:text-white rounded-lg text-[10px] font-bold transition-all shrink-0 flex items-center gap-1"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Filled!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-fill</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

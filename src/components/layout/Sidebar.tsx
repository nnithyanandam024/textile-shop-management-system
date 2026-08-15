import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Shirt,
  Boxes,
  ShoppingCart,
  Receipt,
  Users,
  Truck,
  PackagePlus,
  Undo2,
  BarChart3,
  UserCheck,
  Settings,
  DatabaseBackup,
  Scissors,
  PlusCircle,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'POS / Billing', path: '/billing', icon: <ShoppingCart className="w-5 h-5" /> },
  { name: 'Products', path: '/products', icon: <Shirt className="w-5 h-5" /> },
  { name: 'Inventory', path: '/inventory', icon: <Boxes className="w-5 h-5" /> },
  { name: 'Sales History', path: '/sales', icon: <Receipt className="w-5 h-5" /> },
  { name: 'Customers', path: '/customers', icon: <Users className="w-5 h-5" /> },
  { name: 'Suppliers', path: '/suppliers', icon: <Truck className="w-5 h-5" /> },
  { name: 'Purchases', path: '/purchases', icon: <PackagePlus className="w-5 h-5" /> },
  { name: 'Returns & Exchange', path: '/returns', icon: <Undo2 className="w-5 h-5" /> },
  { name: 'Reports & Analytics', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
  { name: 'User Management', path: '/users', icon: <UserCheck className="w-5 h-5" /> },
  { name: 'Backup & Restore', path: '/backup', icon: <DatabaseBackup className="w-5 h-5" /> },
  { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-screen shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#2818cf] flex items-center justify-center text-white shadow-sm">
          <Scissors className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm text-slate-900 leading-tight">TextileShop POS</h1>
          <p className="text-[11px] text-slate-400 font-medium">Management System</p>
        </div>
      </div>

      {/* Quick Action POS Button */}
      <div className="px-4 py-3.5">
        <NavLink
          to="/billing"
          className="w-full bg-[#2818cf] hover:bg-[#2011ba] text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="text-xs">Quick Billing / POS</span>
        </NavLink>
      </div>

      {/* Complete 13 Navigation Links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50/80 text-[#2818cf] border-l-[3px] border-[#2818cf]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Version Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400 flex items-center justify-between font-medium">
        <span>TextileShop v0.1.0</span>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="System Ready" />
      </div>
    </aside>
  );
};

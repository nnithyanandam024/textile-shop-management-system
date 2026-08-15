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
  Scissors
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
          <Scissors className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-100 leading-tight">TextileShop POS</h1>
          <p className="text-[11px] text-slate-400">Management System</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Version Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-500 flex items-center justify-between">
        <span>v0.1.0 (Phase 1)</span>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Database Connected" />
      </div>
    </aside>
  );
};

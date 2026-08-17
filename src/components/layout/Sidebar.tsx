import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Receipt,
  Users,
  Building2,
  Truck,
  RotateCcw,
  BarChart3,
  UserCheck,
  Database,
  Settings,
  Users2,
  Briefcase,
  BadgeCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  permission?: string;
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { name: 'Products', path: '/products', icon: Package, permission: 'products.view' },
  { name: 'Inventory', path: '/inventory', icon: Boxes, permission: 'inventory.view' },
  { name: 'POS Billing', path: '/billing', icon: ShoppingCart, permission: 'billing.create' },
  { name: 'Sales History', path: '/sales', icon: Receipt, permission: 'sales.view' },
  { name: 'Customers', path: '/customers', icon: Users, permission: 'customers.view' },
  { name: 'Suppliers', path: '/suppliers', icon: Truck, permission: 'suppliers.view' },
  { name: 'Purchases', path: '/purchases', icon: Building2, permission: 'purchases.view' },
  { name: 'Returns', path: '/returns', icon: RotateCcw, permission: 'returns.create' },
  { name: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports.view' },
];

const staffNavItems: NavItem[] = [
  { name: 'Staff', path: '/staff', icon: Users2, permission: 'staff.view' },
  { name: 'Departments', path: '/staff/departments', icon: Briefcase, permission: 'staff.organization' },
  { name: 'Designations', path: '/staff/designations', icon: BadgeCheck, permission: 'staff.organization' },
  { name: 'Roles & Access', path: '/roles', icon: ShieldCheck, permission: 'role.view' },
];

const systemNavItems: NavItem[] = [
  { name: 'Users & Roles', path: '/users', icon: UserCheck, permission: 'users.view' },
  { name: 'Backup & Restore', path: '/backup', icon: Database, permission: 'backup.create' },
  { name: 'Settings', path: '/settings', icon: Settings, permission: 'settings.view' },
];

export const Sidebar: React.FC = () => {
  const { hasPermission } = useAuth();

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => !item.permission || hasPermission(item.permission));

  const filteredMain = filterItems(mainNavItems);
  const filteredStaff = filterItems(staffNavItems);
  const filteredSystem = filterItems(systemNavItems);

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen select-none shrink-0 shadow-sm">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200/80">
        <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2818cf] shadow-sm">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">TEXORA</h1>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Textile Manager</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {filteredMain.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50/80 text-[#2818cf] shadow-sm border border-indigo-100/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}

        {filteredStaff.length > 0 && (
          <>
            <div className="pt-3 pb-1 px-3.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff Management</p>
            </div>
            {filteredStaff.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50/80 text-[#2818cf] shadow-sm border border-indigo-100/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
          </>
        )}

        <div className="pt-3 pb-1 px-3.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System</p>
        </div>
        {filteredSystem.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50/80 text-[#2818cf] shadow-sm border border-indigo-100/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Version */}
      <div className="p-4 border-t border-slate-100 text-center text-[10px] font-medium text-slate-400">
        Texora Retail v0.1.0
      </div>
    </aside>
  );
};

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Shirt,
  ArrowLeftRight,
  Users,
  ShoppingBag,
  BarChart3,
  Settings,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Inventory', path: '/inventory', icon: <Boxes className="w-5 h-5" /> },
  { name: 'Products', path: '/products', icon: <Shirt className="w-5 h-5" /> },
  { name: 'Stock Movements', path: '/sales', icon: <ArrowLeftRight className="w-5 h-5" /> },
  { name: 'Staff', path: '/users', icon: <Users className="w-5 h-5" /> },
  { name: 'Purchase Orders', path: '/purchases', icon: <ShoppingBag className="w-5 h-5" /> },
  { name: 'Reports', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-screen shrink-0 select-none z-20">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-[#2818cf] tracking-tight">Texora</h1>
      </div>

      {/* Primary Action Button */}
      <div className="px-4 py-4">
        <button className="w-full bg-[#2818cf] hover:bg-[#2011ba] text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.98]">
          <PlusCircle className="w-4 h-4" />
          <span className="text-sm">Quick Audit</span>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50/80 text-[#2818cf] font-semibold border-l-[3px] border-[#2818cf]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
              isActive ? 'bg-indigo-50/80 text-[#2818cf] font-semibold' : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </NavLink>

        <a
          href="#support"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Support</span>
        </a>
      </div>
    </aside>
  );
};

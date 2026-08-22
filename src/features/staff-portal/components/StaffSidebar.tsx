import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useStaffAuth } from '../hooks/useStaffAuth';
import { LogoutDialog } from './LogoutDialog';
import { checkPermissionMatch } from '../../../auth/permissions';
import {
  LayoutDashboard,
  User,
  CalendarCheck,
  Clock,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
  permission?: string;
  isPhase1Active?: boolean;
}

const navItems: SidebarItem[] = [
  { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard, permission: 'DASHBOARD_VIEW', isPhase1Active: true },
  { name: 'POS & Billing', path: '/staff/pos', icon: ShoppingCart, permission: 'POS_VIEW', isPhase1Active: true },
  { name: 'My Sales', path: '/staff/sales', icon: TrendingUp, permission: 'SALES_VIEW_SELF', isPhase1Active: true },
  { name: 'Customers', path: '/staff/customers', icon: Users, permission: 'CUSTOMER_VIEW', isPhase1Active: true },
  { name: 'My Inventory', path: '/staff/inventory', icon: Package, permission: 'INVENTORY_VIEW', isPhase1Active: true },
  { name: 'Attendance', path: '/staff/attendance', icon: CalendarCheck, permission: 'ATTENDANCE_VIEW_SELF', isPhase1Active: true },
  { name: 'My Shifts', path: '/staff/shifts', icon: Clock, permission: 'SHIFT_VIEW', isPhase1Active: true },
  { name: 'My Leave', path: '/staff/leave', icon: Calendar, permission: 'LEAVE_VIEW_SELF', isPhase1Active: true },
  { name: 'My Payroll', path: '/staff/payroll', icon: DollarSign, permission: 'PAYROLL_VIEW_SELF', isPhase1Active: true },
  { name: 'Reports', path: '/staff/reports', icon: BarChart3, permission: 'REPORT_VIEW', isPhase1Active: true },
  { name: 'Notifications', path: '/staff/notifications', icon: Bell, permission: 'COMMUNICATION_VIEW', isPhase1Active: true },
  { name: 'Settings', path: '/staff/settings', icon: Settings, permission: 'SETTINGS_VIEW', isPhase1Active: true },
  { name: 'My Profile', path: '/staff/profile', icon: User, permission: 'STAFF_VIEW_PROFILE', isPhase1Active: true },
];

export const StaffSidebar: React.FC = () => {
  const { currentStaffUser, logout } = useStaffAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    if (!currentStaffUser?.permissions) return true; // fallback
    return checkPermissionMatch(currentStaffUser.permissions, item.permission);
  });

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setIsLogoutDialogOpen(false);
    }
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen select-none shrink-0 shadow-sm">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200/80">
          <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2012ad] shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">TEXORA</h1>
            <p className="text-[10px] font-semibold text-[#2012ad] uppercase tracking-widest">Staff Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          <div className="pb-1 px-3.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Workspace</p>
          </div>

          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50/90 text-[#2012ad] shadow-sm border border-indigo-100/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Logout Button */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => setIsLogoutDialogOpen(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
};

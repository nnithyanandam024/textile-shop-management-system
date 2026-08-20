import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useStaffAuth } from '../hooks/useStaffAuth';
import { LogoutDialog } from './LogoutDialog';
import {
  LayoutDashboard,
  User,
  CalendarCheck,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Award,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
  isPhase1Active?: boolean;
}

const navItems: SidebarItem[] = [
  { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard, isPhase1Active: true },
  { name: 'My Profile', path: '/staff/profile', icon: User, isPhase1Active: true },
  { name: 'Attendance', path: '/self-service/attendance', icon: CalendarCheck, isPhase1Active: true },
  { name: 'My Shifts', path: '/self-service/shifts', icon: Clock, isPhase1Active: true },
  { name: 'My Leave', path: '/self-service/leave', icon: Calendar, isPhase1Active: true },
  { name: 'My Payroll', path: '/self-service/payroll', icon: DollarSign, isPhase1Active: true },
  { name: 'Documents', path: '/self-service/documents', icon: FileText, isPhase1Active: true },
  { name: 'Performance', path: '/self-service/performance', icon: Award, isPhase1Active: true },
  { name: 'Notifications', path: '/self-service/notifications', icon: Bell, isPhase1Active: true },
  { name: 'Messages', path: '/self-service/notifications', icon: MessageSquare, isPhase1Active: true },
  { name: 'Settings', path: '/self-service/settings', icon: Settings, isPhase1Active: true },
];

export const StaffSidebar: React.FC = () => {
  const { logout } = useStaffAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
          <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2818cf] shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">TEXORA</h1>
            <p className="text-[10px] font-semibold text-[#2818cf] uppercase tracking-widest">Staff Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          <div className="pb-1 px-3.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Workspace</p>
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50/90 text-[#2818cf] shadow-sm border border-indigo-100/80 font-bold'
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

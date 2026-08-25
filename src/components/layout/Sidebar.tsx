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
  CalendarCheck,
  Clock,
  Calendar,
  DollarSign,
  Award,
  FileText,
  Bell,
  Home,
  User,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  permission?: string;
  badge?: string;
}

interface NavSection {
  id: string;
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();

  const roleName = (currentUser?.roleName || '').toLowerCase();
  const isOwner =
    currentUser?.roleId === 1 ||
    roleName.includes('owner') ||
    roleName.includes('admin') ||
    roleName.includes('super');

  // --- Section 1: Main Store Operations ---
  const mainNavItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { name: 'Business AI', path: '/business-ai', icon: Sparkles, badge: 'AI' },
    { name: 'POS Billing', path: '/billing', icon: ShoppingCart, permission: 'billing.create' },
    { name: 'Sales History', path: '/sales', icon: Receipt, permission: 'sales.view' },
    { name: 'Customers', path: '/customers', icon: Users, permission: 'customers.view' },
    { name: 'Products', path: '/products', icon: Package, permission: 'products.view' },
    { name: 'Categories & Brands', path: '/categories', icon: Layers, permission: 'products.manage' },
    { name: 'Inventory', path: '/inventory', icon: Boxes, permission: 'inventory.view' },
    { name: 'Suppliers', path: '/suppliers', icon: Truck, permission: 'suppliers.view' },
    { name: 'Purchases (GRN)', path: '/purchases', icon: Building2, permission: 'purchases.view' },
    { name: 'Sales Returns', path: '/returns', icon: RotateCcw, permission: 'returns.create' },
    { name: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports.view' },
  ];

  // --- Section 2: Staff & HR Governance ---
  const staffNavItems: NavItem[] = [
    { name: 'Staff Directory', path: '/staff', icon: Users2, permission: 'staff.view' },
    { name: 'Attendance', path: '/staff/attendance', icon: CalendarCheck, permission: 'attendance.view' },
    { name: 'Shifts', path: '/staff/shifts', icon: Clock, permission: 'shift.view' },
    { name: 'Leave Approvals', path: '/staff/leave', icon: Calendar, permission: 'leave.view' },
    { name: 'Payroll & Salaries', path: '/staff/payroll', icon: DollarSign, permission: 'payroll.view' },
    { name: 'Departments', path: '/staff/departments', icon: Briefcase, permission: 'staff.organization' },
    { name: 'Designations', path: '/staff/designations', icon: BadgeCheck, permission: 'staff.organization' },
    { name: 'Staff Documents', path: '/staff/documents', icon: FileText, permission: 'documents.view' },
    { name: 'Notice Board', path: '/staff/communication', icon: Bell, permission: 'communication.view' },
    { name: 'Performance KPIs', path: '/staff/performance', icon: Award, permission: 'performance.view' },
  ];

  // --- Section 3: System Administration ---
  const systemNavItems: NavItem[] = [
    { name: 'Roles & Access', path: '/roles', icon: ShieldCheck, permission: 'role.view' },
    { name: 'Users & Accounts', path: '/users', icon: UserCheck, permission: 'users.view' },
    { name: 'Backup & Restore', path: '/backup', icon: Database, permission: 'backup.create' },
    { name: 'System Health', path: '/health', icon: Activity, permission: 'settings.view' },
    { name: 'Settings', path: '/settings', icon: Settings, permission: 'settings.view' },
  ];

  // --- Section 4: Employee Self-Service (for staff employees only) ---
  const selfServiceNavItems: NavItem[] = [
    { name: 'My Workspace', path: '/self-service/dashboard', icon: Home, permission: 'self.profile.view' },
    { name: 'My Profile', path: '/self-service/profile', icon: User, permission: 'self.profile.view' },
    { name: 'My Attendance', path: '/self-service/attendance', icon: CalendarCheck, permission: 'self.attendance.view' },
    { name: 'My Shifts', path: '/self-service/shifts', icon: Clock, permission: 'self.shift.view' },
    { name: 'My Leave', path: '/self-service/leave', icon: Calendar, permission: 'self.leave.view' },
    { name: 'My Payslips', path: '/self-service/payroll', icon: DollarSign, permission: 'self.payroll.view' },
    { name: 'My Documents', path: '/self-service/documents', icon: FileText, permission: 'self.documents.view' },
  ];

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => !item.permission || hasPermission(item.permission));

  const filteredMain = filterItems(mainNavItems);
  const filteredStaff = filterItems(staffNavItems);
  const filteredSystem = isOwner
    ? systemNavItems // Owner has full access to all system tools
    : filterItems(systemNavItems);
  const filteredSelfService = !isOwner ? filterItems(selfServiceNavItems) : [];

  const sections: NavSection[] = [
    ...(filteredSelfService.length > 0
      ? [{ id: 'self_service', title: 'My Workspace', items: filteredSelfService }]
      : []),
    ...(filteredMain.length > 0
      ? [{ id: 'main', items: filteredMain }]
      : []),
    ...(filteredStaff.length > 0
      ? [{ id: 'staff', title: 'Staff Management', items: filteredStaff }]
      : []),
    ...(filteredSystem.length > 0
      ? [{ id: 'system', title: 'System', items: filteredSystem }]
      : []),
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen select-none shrink-0 shadow-sm">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2012ad] shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">TEXORA</h1>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Textile Manager</p>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-[#2012ad] border border-indigo-100 uppercase">
          {currentUser?.roleName || 'Staff'}
        </span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {sections.map((section, sIdx) => (
          <div key={section.id} className={sIdx > 0 ? 'pt-1' : ''}>
            {section.title && (
              <div className="px-3 pb-1.5 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </p>
              </div>
            )}

            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50/90 text-[#2012ad] shadow-sm border border-indigo-100/90 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-[#2012ad]">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};


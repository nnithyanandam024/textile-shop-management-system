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
import { checkPermissionMatch } from '../../auth/permissions';

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

  const roleName = (currentUser?.roleName || '').toLowerCase().trim();
  const permissions = currentUser?.permissions || [];

  const isOwnerOrAdmin =
    currentUser?.roleId === 1 ||
    roleName.includes('owner') ||
    roleName.includes('admin') ||
    roleName.includes('super');

  const isManager = roleName.includes('manager');
  const isSupervisor = roleName.includes('supervisor') || roleName.includes('lead') || roleName.includes('floor');
  const isCashier = roleName.includes('cashier') || roleName.includes('billing');
  const isStaff = !isOwnerOrAdmin && !isManager && !isSupervisor && !isCashier;

  // Helper to check permissions
  const can = (permCode: string) => {
    if (isOwnerOrAdmin) return true;
    return hasPermission(permCode) || checkPermissionMatch(permissions, permCode);
  };

  // --- Dynamic Section Generation based on Role and Permissions ---
  const sections: NavSection[] = [];

  // ==========================================
  // SECTION 1: ROLE-SPECIFIC PRIMARY OPERATIONS
  // ==========================================
  const storeOpsItems: NavItem[] = [];

  // 1. Dashboard (Exposed to Admin, Manager, Supervisor, Cashier)
  if (!isStaff && can('dashboard.view')) {
    let dashName = 'Executive Dashboard';
    if (isManager) dashName = 'Management Dashboard';
    else if (isSupervisor) dashName = 'Operations Dashboard';
    else if (isCashier) dashName = 'Billing Dashboard';

    storeOpsItems.push({
      name: dashName,
      path: '/dashboard',
      icon: LayoutDashboard,
    });
  }

  // 2. Business AI (Exposed to Admin, Manager, and Supervisor only)
  if ((isOwnerOrAdmin || isManager || isSupervisor) && can('ai.assistant.use')) {
    storeOpsItems.push({
      name: 'Business AI',
      path: '/business-ai',
      icon: Sparkles,
      badge: 'AI',
    });
  }

  // 3. POS Billing Terminal (Exposed to Cashier, Supervisor, Manager, Admin)
  if (!isStaff && can('billing.create')) {
    storeOpsItems.push({
      name: 'POS Billing',
      path: '/billing',
      icon: ShoppingCart,
      badge: 'POS',
    });
  }

  // 4. Sales History (Exposed to Cashier, Supervisor, Manager, Admin)
  if (!isStaff && can('sales.view')) {
    storeOpsItems.push({
      name: 'Sales History',
      path: '/sales',
      icon: Receipt,
    });
  }

  // 5. Products Catalog (Exposed to All Roles)
  if (can('products.view')) {
    storeOpsItems.push({
      name: 'Products',
      path: '/products',
      icon: Package,
    });
  }

  // 6. Categories & Brands (Exposed to Admin & Manager only)
  if ((isOwnerOrAdmin || isManager) && can('products.manage')) {
    storeOpsItems.push({
      name: 'Categories & Brands',
      path: '/categories',
      icon: Layers,
    });
  }

  // 7. Inventory (Exposed to Staff, Supervisor, Manager, Admin)
  if (can('inventory.view')) {
    storeOpsItems.push({
      name: isStaff ? 'Assigned Stock' : 'Inventory',
      path: '/inventory',
      icon: Boxes,
    });
  }

  // 8. Customers Directory (Exposed to All Roles)
  if (can('customers.view')) {
    storeOpsItems.push({
      name: 'Customers',
      path: '/customers',
      icon: Users,
    });
  }

  // 9. Suppliers & Mills (Exposed to Admin & Manager only)
  if ((isOwnerOrAdmin || isManager) && can('suppliers.view')) {
    storeOpsItems.push({
      name: 'Suppliers',
      path: '/suppliers',
      icon: Truck,
    });
  }

  // 10. Purchases / GRN Inwarding (Exposed to Admin & Manager only)
  if ((isOwnerOrAdmin || isManager) && can('purchases.view')) {
    storeOpsItems.push({
      name: 'Purchases (GRN)',
      path: '/purchases',
      icon: Building2,
    });
  }

  // 11. Sales Returns (Exposed to Cashier, Supervisor, Manager, Admin)
  if (!isStaff && can('returns.create')) {
    storeOpsItems.push({
      name: 'Sales Returns',
      path: '/returns',
      icon: RotateCcw,
    });
  }

  // 12. Reports & Analytics (Exposed to Supervisor, Manager, Admin only)
  if (!isStaff && !isCashier && can('reports.view')) {
    storeOpsItems.push({
      name: 'Reports',
      path: '/reports',
      icon: BarChart3,
    });
  }

  if (storeOpsItems.length > 0) {
    sections.push({
      id: 'main_ops',
      title: isStaff ? 'Store Operations' : 'Main Operations',
      items: storeOpsItems,
    });
  }

  // ==========================================
  // SECTION 2: STAFF & HR MANAGEMENT (Admin, Manager, Supervisor)
  // ==========================================
  const staffGovernanceItems: NavItem[] = [];

  if (isOwnerOrAdmin || isManager || isSupervisor) {
    if (can('staff.view')) {
      staffGovernanceItems.push({ name: 'Staff Directory', path: '/staff', icon: Users2 });
    }
    if (can('attendance.view')) {
      staffGovernanceItems.push({ name: 'Attendance Roster', path: '/staff/attendance', icon: CalendarCheck });
    }
    if (can('shift.view')) {
      staffGovernanceItems.push({ name: 'Shifts & Rosters', path: '/staff/shifts', icon: Clock });
    }
    if (isOwnerOrAdmin || isManager) {
      if (can('leave.view')) {
        staffGovernanceItems.push({ name: 'Leave Approvals', path: '/staff/leave', icon: Calendar });
      }
      if (isOwnerOrAdmin && can('payroll.view')) {
        staffGovernanceItems.push({ name: 'Payroll & Salaries', path: '/staff/payroll', icon: DollarSign });
      }
      if (can('staff.organization')) {
        staffGovernanceItems.push({ name: 'Departments', path: '/staff/departments', icon: Briefcase });
        staffGovernanceItems.push({ name: 'Designations', path: '/staff/designations', icon: BadgeCheck });
      }
      staffGovernanceItems.push({ name: 'Staff Documents', path: '/staff/documents', icon: FileText });
    }
    staffGovernanceItems.push({ name: 'Notice Board', path: '/staff/communication', icon: Bell });
    if (isOwnerOrAdmin || isManager) {
      staffGovernanceItems.push({ name: 'Performance KPIs', path: '/staff/performance', icon: Award });
    }
  }

  if (staffGovernanceItems.length > 0) {
    sections.push({
      id: 'staff_governance',
      title: 'Staff Management',
      items: staffGovernanceItems,
    });
  }

  // ==========================================
  // SECTION 3: EMPLOYEE SELF-SERVICE (Staff, Cashier, Supervisor)
  // ==========================================
  if (!isOwnerOrAdmin) {
    const selfServiceItems: NavItem[] = [
      { name: 'Work Dashboard', path: '/self-service/dashboard', icon: Home },
      { name: 'My Profile', path: '/self-service/profile', icon: User },
      { name: 'My Attendance', path: '/self-service/attendance', icon: CalendarCheck },
      { name: 'My Shifts', path: '/self-service/shifts', icon: Clock },
      { name: 'My Leave', path: '/self-service/leave', icon: Calendar },
      { name: 'My Payslips', path: '/self-service/payroll', icon: DollarSign },
      { name: 'My Documents', path: '/self-service/documents', icon: FileText },
    ];

    sections.push({
      id: 'self_service',
      title: 'My Workspace',
      items: selfServiceItems,
    });
  }

  // ==========================================
  // SECTION 4: SYSTEM ADMINISTRATION (Admin / Owner Only)
  // ==========================================
  if (isOwnerOrAdmin) {
    sections.push({
      id: 'system_admin',
      title: 'System Administration',
      items: [
        { name: 'Roles & Access', path: '/roles', icon: ShieldCheck },
        { name: 'Users & Accounts', path: '/users', icon: UserCheck },
        { name: 'Backup & Restore', path: '/backup', icon: Database },
        { name: 'System Health', path: '/health', icon: Activity },
        { name: 'Settings', path: '/settings', icon: Settings },
      ],
    });
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen select-none shrink-0 shadow-xs">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-amber-50/40 via-white to-indigo-50/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white border border-amber-200/80 shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-0.5">
            <img src="/logo.png" alt="ரத்னா விலாஸ்" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight truncate">ரத்னா விலாஸ்</h1>
            <p className="text-[9px] font-extrabold text-amber-800 uppercase tracking-tight truncate">பட்டு &amp; ஜவுளி மாளிகை</p>
          </div>
        </div>
        <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-indigo-50 text-[#2012ad] border border-indigo-100 uppercase shrink-0">
          {currentUser?.roleName || 'Staff'}
        </span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {sections.map((section, sIdx) => (
          <div key={section.id} className={sIdx > 0 ? 'pt-1' : ''}>
            {section.title && (
              <div className="px-3 pb-1.5 flex items-center justify-between">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
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
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-[#2012ad] shadow-xs border border-indigo-100 font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-100 text-[#2012ad]">
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

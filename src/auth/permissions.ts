/**
 * Standardized Permissions & Role Matrix
 * Connects frontend authorization with backend RBAC & Data Scopes.
 */

import { PERMISSION_CATALOG, DataScope, getDefaultDataScopeForRole } from './permissionCatalog';

export { PERMISSION_CATALOG, getDefaultDataScopeForRole };
export type { DataScope };

export const PERMISSIONS = PERMISSION_CATALOG.reduce((acc, curr) => {
  acc[curr.code] = curr.code;
  return acc;
}, {} as Record<string, string>);

/**
 * Normalizes legacy dotted permission strings (e.g. 'dashboard.view' -> 'DASHBOARD_EXECUTIVE_VIEW')
 */
export const PERMISSION_ALIASES: Record<string, string[]> = {
  'dashboard.view': ['DASHBOARD_EXECUTIVE_VIEW', 'DASHBOARD_MANAGEMENT_VIEW', 'DASHBOARD_OPERATIONS_VIEW', 'DASHBOARD_BILLING_VIEW', 'DASHBOARD_WORK_VIEW'],
  'billing.create': ['POS_CREATE_SALE', 'POS_VIEW'],
  'sales.view': ['SALES_VIEW_ALL', 'SALES_VIEW_SELF'],
  'products.view': ['PRODUCT_VIEW'],
  'products.manage': ['PRODUCT_CREATE', 'PRODUCT_EDIT', 'PRODUCT_DELETE'],
  'inventory.view': ['INVENTORY_VIEW_ALL', 'INVENTORY_VIEW_ASSIGNED'],
  'inventory.manage': ['INVENTORY_ADJUST', 'INVENTORY_REORDER_PLAN'],
  'customers.view': ['CUSTOMER_VIEW_BASIC', 'CUSTOMER_VIEW_FINANCIALS'],
  'suppliers.view': ['SUPPLIER_VIEW'],
  'purchases.view': ['PURCHASE_VIEW'],
  'returns.create': ['RETURN_CREATE'],
  'reports.view': ['REPORT_SALES_VIEW', 'REPORT_INVENTORY_VIEW', 'REPORT_FINANCIAL_VIEW'],
  'staff.view': ['STAFF_VIEW_ALL'],
  'staff.organization': ['STAFF_MANAGE'],
  'attendance.view': ['ATTENDANCE_VIEW_ALL', 'ATTENDANCE_VIEW_SELF'],
  'shift.view': ['SHIFT_VIEW'],
  'leave.view': ['LEAVE_APPROVE'],
  'payroll.view': ['PAYROLL_VIEW_ALL', 'PAYROLL_VIEW_SELF'],
  'role.view': ['ROLE_MANAGE'],
  'users.view': ['USER_MANAGE'],
  'backup.create': ['BACKUP_MANAGE'],
  'settings.view': ['SETTINGS_MANAGE'],
  'self.profile.view': ['DASHBOARD_WORK_VIEW', 'ATTENDANCE_VIEW_SELF'],
  'self.attendance.view': ['ATTENDANCE_VIEW_SELF'],
  'self.shift.view': ['SHIFT_VIEW'],
  'self.leave.view': ['DASHBOARD_WORK_VIEW'],
  'self.payroll.view': ['PAYROLL_VIEW_SELF'],
  'self.documents.view': ['DASHBOARD_WORK_VIEW'],
  'self.performance.view': ['DASHBOARD_WORK_VIEW'],
  'self.notifications.view': ['DASHBOARD_WORK_VIEW'],
  'self.settings.manage': ['DASHBOARD_WORK_VIEW'],
  'ai.assistant.use': ['AI_USE_ASSISTANT'],
};

/**
 * Determines whether a user's permissions grant access to a required permission.
 */
export function checkPermissionMatch(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;

  if (userPermissions.includes(requiredPermission)) return true;

  // Check direct alias mapping
  const aliases = PERMISSION_ALIASES[requiredPermission] || [];
  for (const alias of aliases) {
    if (userPermissions.includes(alias)) return true;
  }

  // Check reverse alias mapping
  for (const userPerm of userPermissions) {
    const userAliases = PERMISSION_ALIASES[userPerm] || [];
    if (userAliases.includes(requiredPermission)) return true;
  }

  return false;
}

/**
 * Resolves the primary authorized landing route for any given user role/permissions
 */
export function getDefaultRouteForUser(
  user?: { roleId?: number; roleName?: string; role?: string; permissions?: string[] } | null
): string {
  if (!user) return '/dashboard';

  const roleName = (user.roleName || user.role || '').toLowerCase().trim();
  const permissions = user.permissions || [];
  const hasWildcard = permissions.includes('*') || user.roleId === 1;

  // 1. Admin / Owner -> Executive Dashboard
  if (hasWildcard || roleName.includes('owner') || roleName.includes('admin') || roleName.includes('super')) {
    return '/dashboard';
  }

  // 2. Manager -> Management Dashboard
  if (roleName.includes('manager')) {
    return '/dashboard';
  }

  // 3. Supervisor -> Operations Dashboard
  if (roleName.includes('supervisor') || roleName.includes('lead') || roleName.includes('floor')) {
    return '/dashboard';
  }

  // 4. Cashier -> POS Billing Register
  if (roleName.includes('cashier') || roleName.includes('billing')) {
    return '/billing';
  }

  // 5. Staff Employee -> Personal Work & Self-Service Dashboard
  return '/self-service/dashboard';
}

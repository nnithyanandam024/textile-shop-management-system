export interface UserAuthContext {
  userId?: number;
  roleId?: number;
  roleName?: string;
  permissions?: string[];
}

export type AiToolName =
  | 'getSalesSummary'
  | 'getTopSellingProducts'
  | 'getLowStockProducts'
  | 'getInventorySummary'
  | 'getCustomerSummary'
  | 'getAttendanceSummary'
  | 'getLeaveSummary'
  | 'getDailyReport'
  | 'getStaffPayrollSummary';

interface ToolPermissionRule {
  requiredPermission: string;
  allowedRoles: string[];
  restrictedMessage: string;
}

const TOOL_PERMISSIONS: Record<AiToolName, ToolPermissionRule> = {
  getSalesSummary: {
    requiredPermission: 'sales.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager', 'Cashier'],
    restrictedMessage: "You don't have permission to access sales financial data. Please contact your store administrator.",
  },
  getTopSellingProducts: {
    requiredPermission: 'sales.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager', 'Cashier'],
    restrictedMessage: "You don't have permission to view top-selling product analytics.",
  },
  getLowStockProducts: {
    requiredPermission: 'inventory.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager', 'Cashier', 'Inventory Staff'],
    restrictedMessage: "You don't have permission to access inventory stock levels.",
  },
  getInventorySummary: {
    requiredPermission: 'inventory.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager', 'Cashier', 'Inventory Staff'],
    restrictedMessage: "You don't have permission to access master inventory metrics.",
  },
  getCustomerSummary: {
    requiredPermission: 'customers.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager', 'Cashier'],
    restrictedMessage: "You don't have permission to view customer profiles and loyalty metrics.",
  },
  getAttendanceSummary: {
    requiredPermission: 'attendance.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager', 'HR Staff'],
    restrictedMessage: "You don't have permission to view overall staff attendance records.",
  },
  getLeaveSummary: {
    requiredPermission: 'leave.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager', 'HR Staff'],
    restrictedMessage: "You don't have permission to access staff leave records.",
  },
  getDailyReport: {
    requiredPermission: 'reports.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager'],
    restrictedMessage: "You don't have permission to access executive business summary reports.",
  },
  getStaffPayrollSummary: {
    requiredPermission: 'payroll.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'HR Staff'],
    restrictedMessage: "You don't have permission to access staff salary or payroll information.",
  },
};

export class AiRbacGuard {
  /**
   * Evaluates whether the user context has authorization to execute the specified AI tool.
   */
  public static canExecuteTool(toolName: AiToolName, user?: UserAuthContext): { allowed: boolean; reason?: string } {
    if (!user) {
      return { allowed: false, reason: 'Authentication required to query business data.' };
    }

    const roleName = user.roleName || 'Cashier';
    const userPermissions = user.permissions || [];

    // Owner / Super Admin with wildcard permission has unrestricted access
    if (roleName === 'Owner' || roleName === 'SUPER_ADMIN' || user.roleId === 1 || userPermissions.includes('*')) {
      return { allowed: true };
    }

    const rule = TOOL_PERMISSIONS[toolName];
    if (!rule) {
      return { allowed: false, reason: `Unknown tool "${toolName}".` };
    }

    // Role-level match
    const roleMatches = rule.allowedRoles.some(
      (r) => r.toLowerCase() === roleName.toLowerCase()
    );

    // Permission-level match
    const permMatches = userPermissions.includes(rule.requiredPermission);

    if (roleMatches || permMatches) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: rule.restrictedMessage,
    };
  }

  /**
   * Filters a list of available quick prompts according to user permissions.
   */
  public static filterAllowedPrompts(prompts: any[], user?: UserAuthContext): any[] {
    if (!user) return [];
    return prompts.filter((p) => {
      if (!p.requiredTool) return true;
      return this.canExecuteTool(p.requiredTool as AiToolName, user).allowed;
    });
  }
}

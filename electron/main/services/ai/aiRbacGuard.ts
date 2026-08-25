import { AI_PERMISSIONS, AiPermissionKey, hasDefaultAiPermission } from './rbac/aiPermissions';
import { AI_FEATURES } from './rbac/aiFeatureRegistry';

export interface UserAuthContext {
  userId?: number;
  roleId?: number;
  roleName?: string;
  permissions?: string[];
}

export type AiToolName =
  | 'getSalesSummary'
  | 'getCashierShiftSummary'
  | 'getTopSellingProducts'
  | 'getLowStockProducts'
  | 'getInventorySummary'
  | 'getCustomerSummary'
  | 'getAttendanceSummary'
  | 'getLeaveSummary'
  | 'getDailyReport'
  | 'getStaffPayrollSummary'
  | 'getAuditLogs'
  | 'getRiskSummary'
  | 'getForecast'
  | 'getReorders';

interface ToolPermissionRule {
  requiredPermission: string;
  aiPermissionKey?: AiPermissionKey;
  allowedRoles: string[];
  restrictedMessage: string;
}

const TOOL_PERMISSIONS: Record<AiToolName, ToolPermissionRule> = {
  getSalesSummary: {
    requiredPermission: 'sales.view',
    aiPermissionKey: AI_PERMISSIONS.SALES_VIEW,
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager'],
    restrictedMessage: "🔒 Access Restricted: Storewide sales totals and financial revenue require Manager or Admin authorization.",
  },
  getCashierShiftSummary: {
    requiredPermission: 'pos.billing',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager', 'Cashier'],
    restrictedMessage: "You don't have permission to access POS register summary.",
  },
  getTopSellingProducts: {
    requiredPermission: 'sales.view',
    aiPermissionKey: AI_PERMISSIONS.SALES_VIEW,
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager'],
    restrictedMessage: "🔒 Access Restricted: Executive top-selling product revenue analytics require Manager or Admin authorization.",
  },
  getLowStockProducts: {
    requiredPermission: 'inventory.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager', 'Inventory Staff', 'Supervisor'],
    restrictedMessage: "You don't have permission to access inventory stock levels.",
  },
  getInventorySummary: {
    requiredPermission: 'inventory.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager', 'Inventory Staff', 'Supervisor'],
    restrictedMessage: "You don't have permission to access master inventory valuation metrics.",
  },
  getCustomerSummary: {
    requiredPermission: 'customers.view',
    aiPermissionKey: AI_PERMISSIONS.CUSTOMER_VIEW,
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager'],
    restrictedMessage: "You don't have permission to view aggregated customer lifetime analytics.",
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
    aiPermissionKey: AI_PERMISSIONS.REPORTS_VIEW,
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager'],
    restrictedMessage: "🔒 Access Restricted: Storewide executive reports and profit statements require Manager or Admin authorization.",
  },
  getStaffPayrollSummary: {
    requiredPermission: 'payroll.view',
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'HR Staff'],
    restrictedMessage: "🔒 Access Restricted: Staff salary and payroll information is strictly restricted to Owner and HR.",
  },
  getAuditLogs: {
    requiredPermission: 'audit.view',
    aiPermissionKey: AI_PERMISSIONS.ANOMALIES_VIEW,
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager'],
    restrictedMessage: "🔒 Access Restricted: Security and operational anomaly logs require Manager or Admin authorization.",
  },
  getRiskSummary: {
    requiredPermission: 'audit.view',
    aiPermissionKey: AI_PERMISSIONS.RISK_VIEW,
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager'],
    restrictedMessage: "🔒 Access Restricted: Store risk monitoring dashboards require Manager or Admin authorization.",
  },
  getForecast: {
    requiredPermission: 'inventory.view',
    aiPermissionKey: AI_PERMISSIONS.FORECAST_VIEW,
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager'],
    restrictedMessage: "🔒 Access Restricted: Demand forecasting is restricted to Store Managers and Inventory Planners.",
  },
  getReorders: {
    requiredPermission: 'inventory.view',
    aiPermissionKey: AI_PERMISSIONS.REORDERS_VIEW,
    allowedRoles: ['Owner', 'SUPER_ADMIN', 'Manager', 'Supervisor'],
    restrictedMessage: "🔒 Access Restricted: Smart Reorder Point (ROP) analytics require Manager or Supervisor authorization.",
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
    if (
      roleName.toLowerCase() === 'owner' ||
      roleName.toLowerCase() === 'super_admin' ||
      roleName.toLowerCase() === 'admin' ||
      user.roleId === 1 ||
      userPermissions.includes('*')
    ) {
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

    // Permission-level match (traditional or granular AI permission)
    const permMatches =
      userPermissions.includes(rule.requiredPermission) ||
      (rule.aiPermissionKey && userPermissions.includes(rule.aiPermissionKey)) ||
      (rule.aiPermissionKey && hasDefaultAiPermission(roleName, rule.aiPermissionKey));

    if (roleMatches || permMatches) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: rule.restrictedMessage,
    };
  }

  /**
   * Evaluates whether the user context can access a specific high-level AI feature.
   */
  public static canAccessFeature(featureId: string, user?: UserAuthContext): { allowed: boolean; reason?: string } {
    if (!user) {
      return { allowed: false, reason: 'Authentication required.' };
    }

    const roleName = (user.roleName || 'Cashier').toLowerCase().trim();
    if (roleName === 'owner' || roleName === 'admin' || roleName === 'super_admin' || user.roleId === 1) {
      return { allowed: true };
    }

    const feature = Object.values(AI_FEATURES).find((f) => f.featureId === featureId);
    if (!feature) {
      return { allowed: false, reason: `Unknown AI feature: ${featureId}` };
    }

    const hasExplicitPerm = user.permissions && user.permissions.includes(feature.requiredPermission);
    const hasDefaultPerm = hasDefaultAiPermission(roleName, feature.requiredPermission);

    if (hasExplicitPerm || hasDefaultPerm) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Access Restricted: ${feature.name} requires [${feature.requiredPermission}] permission.`,
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


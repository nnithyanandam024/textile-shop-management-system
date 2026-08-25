export const AI_PERMISSIONS = {
  SALES_VIEW: 'ai.sales.view',
  FORECAST_VIEW: 'ai.forecast.view',
  REORDERS_VIEW: 'ai.reorders.view',
  CUSTOMER_VIEW: 'ai.customer.view',
  ANOMALIES_VIEW: 'ai.anomalies.view',
  RISK_VIEW: 'ai.risk.view',
  REPORTS_VIEW: 'ai.reports.view',
  CHAT_USE: 'ai.chat.use',
  CROSS_SELL_USE: 'ai.cross_sell.use',
  ALERTS_RECEIVE: 'ai.alerts.receive',
} as const;

export type AiPermissionKey = typeof AI_PERMISSIONS[keyof typeof AI_PERMISSIONS];

export interface AiPermissionDefinition {
  key: AiPermissionKey;
  label: string;
  category: 'Analytics' | 'Forecasting' | 'Risk & Security' | 'Operations' | 'Assistant';
  description: string;
  defaultRoles: string[];
}

export const AI_PERMISSION_DEFINITIONS: AiPermissionDefinition[] = [
  {
    key: AI_PERMISSIONS.SALES_VIEW,
    label: 'View AI Sales Insights & Velocity',
    category: 'Analytics',
    description: 'Proactive sales growth trends, hourly heatmaps, and category velocity analytics.',
    defaultRoles: ['owner', 'admin', 'super_admin', 'manager', 'supervisor', 'cashier'],
  },
  {
    key: AI_PERMISSIONS.FORECAST_VIEW,
    label: 'View 30-Day Demand Forecasting',
    category: 'Forecasting',
    description: 'Projected product unit sales, festive demand surge predictions, and stock depletion dates.',
    defaultRoles: ['owner', 'admin', 'super_admin', 'manager'],
  },
  {
    key: AI_PERMISSIONS.REORDERS_VIEW,
    label: 'View Smart Reorder Point (ROP) Recommendations',
    category: 'Forecasting',
    description: 'Supplier replenishment calculations, recommended order quantities, and dead stock capital alerts.',
    defaultRoles: ['owner', 'admin', 'super_admin', 'manager', 'supervisor'],
  },
  {
    key: AI_PERMISSIONS.CUSTOMER_VIEW,
    label: 'View Customer Intelligence & Lifetime Value',
    category: 'Analytics',
    description: 'Top patron spending profiles, buying intervals, and repeat customer retention cohorts.',
    defaultRoles: ['owner', 'admin', 'super_admin', 'manager'],
  },
  {
    key: AI_PERMISSIONS.ANOMALIES_VIEW,
    label: 'View AI Anomaly Detection Logs',
    category: 'Risk & Security',
    description: 'Detection of unusual manual discounts, large stock write-offs, and abnormal return volumes.',
    defaultRoles: ['owner', 'admin', 'super_admin', 'manager'],
  },
  {
    key: AI_PERMISSIONS.RISK_VIEW,
    label: 'View Store Operational Risk Monitor',
    category: 'Risk & Security',
    description: 'Overall showroom risk score, threat matrix radar, and unresolved threat monitoring.',
    defaultRoles: ['owner', 'admin', 'super_admin', 'manager'],
  },
  {
    key: AI_PERMISSIONS.REPORTS_VIEW,
    label: 'View AI Executive Smart Reports',
    category: 'Analytics',
    description: 'Automated daily, weekly, and monthly business summaries with actionable recommendations.',
    defaultRoles: ['owner', 'admin', 'super_admin', 'manager'],
  },
  {
    key: AI_PERMISSIONS.CHAT_USE,
    label: 'Access Business AI Assistant & Chatbot',
    category: 'Assistant',
    description: 'Conversational ChatGPT-like business assistant in English and Tamil.',
    defaultRoles: ['owner', 'admin', 'super_admin', 'manager', 'supervisor', 'cashier', 'staff'],
  },
  {
    key: AI_PERMISSIONS.CROSS_SELL_USE,
    label: 'Real-Time POS Cross-Sell Suggestions',
    category: 'Operations',
    description: 'Matching accessories and complementary products suggested during billing.',
    defaultRoles: ['owner', 'admin', 'super_admin', 'manager', 'supervisor', 'cashier'],
  },
  {
    key: AI_PERMISSIONS.ALERTS_RECEIVE,
    label: 'Receive AI Operational & Security Push Alerts',
    category: 'Risk & Security',
    description: 'High-priority push notifications when risk anomalies or stockouts are detected.',
    defaultRoles: ['owner', 'admin', 'super_admin', 'manager'],
  },
];

/**
 * Resolves whether a given role has a specific AI permission by default
 */
export function hasDefaultAiPermission(roleName: string, permission: AiPermissionKey): boolean {
  const normRole = (roleName || '').toLowerCase().trim();
  if (normRole === 'owner' || normRole === 'admin' || normRole === 'super_admin') {
    return true;
  }
  const def = AI_PERMISSION_DEFINITIONS.find((d) => d.key === permission);
  if (!def) return false;
  return def.defaultRoles.map((r) => r.toLowerCase()).includes(normRole);
}

/**
 * Returns list of default AI permissions for a given role
 */
export function getDefaultAiPermissionsForRole(roleName: string): AiPermissionKey[] {
  const normRole = (roleName || '').toLowerCase().trim();
  if (normRole === 'owner' || normRole === 'admin' || normRole === 'super_admin') {
    return AI_PERMISSION_DEFINITIONS.map((d) => d.key);
  }
  return AI_PERMISSION_DEFINITIONS.filter((d) =>
    d.defaultRoles.map((r) => r.toLowerCase()).includes(normRole)
  ).map((d) => d.key);
}

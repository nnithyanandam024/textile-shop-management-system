import { AI_PERMISSIONS, AiPermissionKey } from './aiPermissions';

export type AiDataScope = 'BUSINESS_WIDE' | 'ASSIGNED_BRANCH' | 'OWN_TERMINAL' | 'ASSIGNED_OPERATIONS';

export interface AiFeatureDescriptor {
  featureId: string;
  name: string;
  requiredPermission: AiPermissionKey;
  allowedRoles: string[];
  dataScope: AiDataScope;
  dashboardWidgetId?: string;
  description: string;
}

export const AI_FEATURES: Record<string, AiFeatureDescriptor> = {
  SALES_INSIGHTS: {
    featureId: 'sales_insights',
    name: 'Sales Analytics & Velocity',
    requiredPermission: AI_PERMISSIONS.SALES_VIEW,
    allowedRoles: ['owner', 'admin', 'super_admin', 'manager', 'supervisor', 'cashier'],
    dataScope: 'BUSINESS_WIDE',
    dashboardWidgetId: 'widget_ai_sales_insights',
    description: 'Proactive sales trend analysis, category velocity, and peak hour distributions.',
  },
  DEMAND_FORECASTING: {
    featureId: 'demand_forecasting',
    name: 'Demand Forecasting',
    requiredPermission: AI_PERMISSIONS.FORECAST_VIEW,
    allowedRoles: ['owner', 'admin', 'super_admin', 'manager'],
    dataScope: 'BUSINESS_WIDE',
    dashboardWidgetId: 'widget_ai_forecast',
    description: '30-day forward demand projections and seasonal surge estimates.',
  },
  REORDER_RECOMMENDATIONS: {
    featureId: 'reorder_recommendations',
    name: 'Smart Reorder Point (ROP) & Replenishment',
    requiredPermission: AI_PERMISSIONS.REORDERS_VIEW,
    allowedRoles: ['owner', 'admin', 'super_admin', 'manager', 'supervisor'],
    dataScope: 'BUSINESS_WIDE',
    dashboardWidgetId: 'widget_ai_reorders',
    description: 'Automated calculation of ROP and recommended restock orders based on lead times.',
  },
  CUSTOMER_INTELLIGENCE: {
    featureId: 'customer_intelligence',
    name: 'Customer CRM Intelligence',
    requiredPermission: AI_PERMISSIONS.CUSTOMER_VIEW,
    allowedRoles: ['owner', 'admin', 'super_admin', 'manager'],
    dataScope: 'BUSINESS_WIDE',
    dashboardWidgetId: 'widget_ai_customers',
    description: 'Customer lifetime value, repeat rate analysis, and purchase frequency tiers.',
  },
  ANOMALY_DETECTION: {
    featureId: 'anomaly_detection',
    name: 'Operational Anomaly Detection',
    requiredPermission: AI_PERMISSIONS.ANOMALIES_VIEW,
    allowedRoles: ['owner', 'admin', 'super_admin', 'manager'],
    dataScope: 'BUSINESS_WIDE',
    dashboardWidgetId: 'widget_ai_anomalies',
    description: 'Audit flags for large discounts, sudden inventory shrinkage, and abnormal return surges.',
  },
  OPERATIONAL_RISK: {
    featureId: 'operational_risk',
    name: 'Showroom Operational Risk Monitor',
    requiredPermission: AI_PERMISSIONS.RISK_VIEW,
    allowedRoles: ['owner', 'admin', 'super_admin', 'manager'],
    dataScope: 'BUSINESS_WIDE',
    dashboardWidgetId: 'widget_ai_risk_monitor',
    description: 'Store threat matrix, aggregated risk score, and open compliance items.',
  },
  SMART_REPORTS: {
    featureId: 'smart_reports',
    name: 'AI Executive Smart Reports',
    requiredPermission: AI_PERMISSIONS.REPORTS_VIEW,
    allowedRoles: ['owner', 'admin', 'super_admin', 'manager'],
    dataScope: 'BUSINESS_WIDE',
    dashboardWidgetId: 'widget_ai_daily_summary',
    description: 'Daily executive briefs, weekly performance digests, and monthly management reports.',
  },
  BUSINESS_AI_CHAT: {
    featureId: 'business_ai_chat',
    name: 'Business AI Assistant',
    requiredPermission: AI_PERMISSIONS.CHAT_USE,
    allowedRoles: ['owner', 'admin', 'super_admin', 'manager', 'supervisor', 'cashier', 'staff'],
    dataScope: 'BUSINESS_WIDE',
    description: 'Natural language business intelligence assistant supporting English and Tamil.',
  },
  POS_CROSS_SELL: {
    featureId: 'pos_cross_sell',
    name: 'POS Real-Time Cross-Sell Assistant',
    requiredPermission: AI_PERMISSIONS.CROSS_SELL_USE,
    allowedRoles: ['owner', 'admin', 'super_admin', 'manager', 'supervisor', 'cashier'],
    dataScope: 'OWN_TERMINAL',
    dashboardWidgetId: 'widget_ai_pos_cross_sell',
    description: 'Real-time complementary item matching during customer checkout.',
  },
};

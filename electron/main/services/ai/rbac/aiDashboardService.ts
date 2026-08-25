import { UserAuthContext } from '../aiRbacGuard';
import { AI_PERMISSIONS, hasDefaultAiPermission } from './aiPermissions';

export interface AiDashboardConfig {
  role: string;
  isExecutive: boolean;
  canViewFinancials: boolean;
  canViewAnomalies: boolean;
  canViewRiskMonitor: boolean;
  canViewForecast: boolean;
  canViewReorders: boolean;
  canViewSmartReports: boolean;
  canViewSalesInsights: boolean;
  canUseCrossSell: boolean;
  canUseChat: boolean;
  widgets: string[];
  kpiCards: string[];
}

export class AiDashboardService {
  /**
   * Generates the personalized dashboard layout and authorized widget set
   */
  public static getDashboardConfig(userContext?: UserAuthContext): AiDashboardConfig {
    const role = (userContext?.roleName || 'Cashier').toLowerCase().trim();
    const isOwnerOrAdmin = role === 'owner' || role === 'admin' || role === 'super_admin';
    const isManager = role === 'manager';
    const isSupervisor = role === 'supervisor';
    const isCashier = role === 'cashier';

    // Helper to check userContext permissions with fallback to role defaults
    const checkPerm = (permKey: any): boolean => {
      if (isOwnerOrAdmin) return true;
      if (userContext?.permissions && userContext.permissions.includes(permKey)) {
        return true;
      }
      return hasDefaultAiPermission(role, permKey);
    };

    const canViewFinancials = isOwnerOrAdmin || (isManager && checkPerm(AI_PERMISSIONS.SALES_VIEW));
    const canViewAnomalies = checkPerm(AI_PERMISSIONS.ANOMALIES_VIEW);
    const canViewRiskMonitor = checkPerm(AI_PERMISSIONS.RISK_VIEW);
    const canViewForecast = checkPerm(AI_PERMISSIONS.FORECAST_VIEW);
    const canViewReorders = checkPerm(AI_PERMISSIONS.REORDERS_VIEW);
    const canViewSmartReports = checkPerm(AI_PERMISSIONS.REPORTS_VIEW);
    const canViewSalesInsights = checkPerm(AI_PERMISSIONS.SALES_VIEW);
    const canUseCrossSell = checkPerm(AI_PERMISSIONS.CROSS_SELL_USE);
    const canUseChat = checkPerm(AI_PERMISSIONS.CHAT_USE);

    const widgets: string[] = [];
    const kpiCards: string[] = [];

    // KPI Cards Resolution
    if (canViewFinancials) {
      kpiCards.push(
        'kpi_today_sales',
        'kpi_net_revenue',
        'kpi_gross_profit',
        'kpi_operating_expenses',
        'kpi_inventory_value',
        'kpi_total_products',
        'kpi_active_customers',
        'kpi_active_suppliers'
      );
    } else if (isSupervisor) {
      kpiCards.push(
        'kpi_today_sales',
        'kpi_inventory_units',
        'kpi_total_products',
        'kpi_low_stock_count'
      );
    } else if (isCashier) {
      kpiCards.push(
        'kpi_cashier_shift_sales',
        'kpi_cashier_bills_count',
        'kpi_cashier_avg_ticket',
        'kpi_cashier_shift_discounts'
      );
    } else {
      // General staff / tailor
      kpiCards.push(
        'kpi_assigned_tasks',
        'kpi_shift_hours',
        'kpi_store_inventory_status'
      );
    }

    // AI Dashboard Widgets Resolution
    if (canViewSmartReports) {
      widgets.push('widget_ai_daily_summary');
    }

    if (canViewSalesInsights) {
      widgets.push('widget_ai_sales_insights');
    }

    if (canViewRiskMonitor && canViewAnomalies) {
      widgets.push('widget_ai_risk_monitor');
    }

    if (canViewForecast) {
      widgets.push('widget_ai_forecast');
    }

    if (canViewReorders) {
      widgets.push('widget_ai_reorders');
    }

    if (canUseCrossSell && isCashier) {
      widgets.push('widget_ai_pos_cross_sell');
    }

    // Standard panels
    widgets.push('panel_sales_trend_chart', 'panel_low_stock_alerts');

    return {
      role,
      isExecutive: isOwnerOrAdmin || isManager,
      canViewFinancials,
      canViewAnomalies,
      canViewRiskMonitor,
      canViewForecast,
      canViewReorders,
      canViewSmartReports,
      canViewSalesInsights,
      canUseCrossSell,
      canUseChat,
      widgets,
      kpiCards,
    };
  }
}

import { ipcMain } from 'electron';
import { AiService } from '../services/ai/aiService';
import { AiLogger } from '../services/ai/aiLogger';
import { AiChatRequest } from '../services/ai/aiConfig';
import { UserAuthContext, AiRbacGuard } from '../services/ai/aiRbacGuard';
import { InsightGenerator } from '../services/ai/analytics/insightGenerator';
import { DailySummaryService } from '../services/ai/analytics/dailySummaryService';
import { AnalyticsTimeframe } from '../services/ai/analytics/analyticsTypes';
import { ReorderRecommendationEngine } from '../services/ai/forecasting/reorderRecommendationEngine';
import { DeadStockDetector } from '../services/ai/forecasting/deadStockDetector';

export function registerAiHandlers() {
  // 1. Process AI Chat query
  ipcMain.handle('ai:chat', async (_event, payload: { request: AiChatRequest; userContext?: UserAuthContext }) => {
    return await AiService.processChat(payload.request, payload.userContext);
  });

  // 2. Get Quick Prompts for user role
  ipcMain.handle('ai:getQuickPrompts', async (_event, userContext?: UserAuthContext) => {
    return AiService.getQuickPrompts(userContext);
  });

  // 3. Get AI Audit Logs
  ipcMain.handle('ai:getLogs', async (_event, limit?: number) => {
    return AiLogger.getRecentLogs(limit);
  });

  // 4. Get AI Usage Stats
  ipcMain.handle('ai:getStats', async () => {
    return AiLogger.getUsageStats();
  });

  // 5. Get Proactive AI Sales Analytics & Insights
  ipcMain.handle('ai:getSalesInsights', async (_event, payload: { timeframe?: AnalyticsTimeframe; userContext?: UserAuthContext }) => {
    const timeframe = payload?.timeframe || 'week';
    const rbac = AiRbacGuard.canExecuteTool('getSalesSummary', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const data = InsightGenerator.generatePayload(timeframe);
    return { success: true, data };
  });

  // 6. Get Daily Executive AI Summary
  ipcMain.handle('ai:getDailySummary', async (_event, payload: { dateStr?: string; userContext?: UserAuthContext }) => {
    const rbac = AiRbacGuard.canExecuteTool('getDailyReport', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const data = DailySummaryService.getDailyExecutiveSummary(payload?.dateStr);
    return { success: true, data };
  });

  // 7. Get AI Inventory Intelligence & Demand Forecasting Summary
  ipcMain.handle('ai:getInventoryIntelligence', async (_event, payload: { userContext?: UserAuthContext }) => {
    const rbac = AiRbacGuard.canExecuteTool('getInventorySummary', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const data = ReorderRecommendationEngine.generateInventoryIntelligence();
    return { success: true, data };
  });

  // 8. Get Single Product Forecast Details
  ipcMain.handle('ai:getProductForecast', async (_event, payload: { variantId: number; userContext?: UserAuthContext }) => {
    const rbac = AiRbacGuard.canExecuteTool('getInventorySummary', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const data = ReorderRecommendationEngine.getProductForecast(payload.variantId);
    return { success: true, data };
  });

  // 9. Get Dead Stock List
  ipcMain.handle('ai:getDeadStock', async (_event, payload: { userContext?: UserAuthContext }) => {
    const rbac = AiRbacGuard.canExecuteTool('getInventorySummary', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const data = DeadStockDetector.detectDeadStock();
    return { success: true, data };
  });
}

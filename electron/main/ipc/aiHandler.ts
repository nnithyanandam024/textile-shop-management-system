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
import { RecommendationEngine } from '../services/ai/recommendations/recommendationEngine';
import { CustomerIntelligenceService } from '../services/ai/recommendations/customerIntelligenceService';
import { RecommendationTracker } from '../services/ai/recommendations/recommendationTracker';
import { CartRecommendationRequest } from '../services/ai/recommendations/recommendationTypes';
import { AnomalyDetectionEngine } from '../services/ai/anomalies/anomalyDetectionEngine';
import { AnomalyReviewService } from '../services/ai/anomalies/anomalyReviewService';
import { ReportHistoryService } from '../services/ai/reports/reportHistoryService';
import { ReportPeriod } from '../services/ai/reports/reportTypes';
import { BiOrchestrator } from '../services/ai/bi/biOrchestrator';
import { BiConversationManager } from '../services/ai/bi/biConversationManager';
import { BiQueryRequest } from '../services/ai/bi/biTypes';
import { AiDashboardService } from '../services/ai/rbac/aiDashboardService';

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

  // 10. Get POS Cart Recommendations
  ipcMain.handle('ai:getCartRecommendations', async (_event, payload: { request: CartRecommendationRequest; userContext?: UserAuthContext }) => {
    const data = RecommendationEngine.getCartRecommendations(payload.request);
    return { success: true, data };
  });

  // 11. Get Customer Intelligence Profile
  ipcMain.handle('ai:getCustomerIntelligence', async (_event, payload: { customerId: number; userContext?: UserAuthContext }) => {
    const rbac = AiRbacGuard.canExecuteTool('getCustomerSummary', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const data = CustomerIntelligenceService.getCustomerProfile(payload.customerId);
    return { success: true, data };
  });

  // 12. Get Product Similar / Complementary Recommendations
  ipcMain.handle('ai:getProductRecommendations', async (_event, payload: { productId: number; userContext?: UserAuthContext }) => {
    const data = RecommendationEngine.getProductRecommendations(payload.productId);
    return { success: true, data };
  });

  // 13. Track Recommendation Feedback
  ipcMain.handle('ai:trackRecommendationFeedback', async (_event, payload: { event: any }) => {
    RecommendationTracker.trackEvent(payload.event);
    return { success: true };
  });

  // 14. Get Operational Anomalies List
  ipcMain.handle('ai:getAnomalies', async (_event, payload: { filter?: any; userContext?: UserAuthContext }) => {
    const rbac = AiRbacGuard.canExecuteTool('getAuditLogs', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const data = AnomalyReviewService.getAnomalies(payload?.filter);
    return { success: true, data };
  });

  // 15. Get Anomaly Details
  ipcMain.handle('ai:getAnomalyDetails', async (_event, payload: { anomalyId: string; userContext?: UserAuthContext }) => {
    const rbac = AiRbacGuard.canExecuteTool('getAuditLogs', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const data = AnomalyReviewService.getAnomalyById(payload.anomalyId);
    return { success: true, data };
  });

  // 16. Manager Review Anomaly
  ipcMain.handle('ai:reviewAnomaly', async (_event, payload: { request: any; userContext?: UserAuthContext }) => {
    const rbac = AiRbacGuard.canExecuteTool('getAuditLogs', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const res = AnomalyReviewService.reviewAnomaly(payload.request);
    return res;
  });

  // 17. Get Store Risk Summary
  ipcMain.handle('ai:getRiskSummary', async (_event, payload?: { userContext?: UserAuthContext }) => {
    const rbac = AiRbacGuard.canExecuteTool('getRiskSummary', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const data = AnomalyDetectionEngine.getRiskSummary();
    return { success: true, data };
  });

  // 18. Get Smart Executive Business Report
  ipcMain.handle('ai:getSmartReport', async (_event, payload: { period: ReportPeriod; dateStr?: string; userContext?: UserAuthContext }) => {
    const rbac = AiRbacGuard.canExecuteTool('getDailyReport', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const data = ReportHistoryService.getReport(payload.period, payload.dateStr, payload?.userContext);
    return { success: true, data };
  });

  // 19. Get Report History Archive
  ipcMain.handle('ai:getReportHistory', async (_event, payload?: { userContext?: UserAuthContext }) => {
    const rbac = AiRbacGuard.canExecuteTool('getDailyReport', payload?.userContext);
    if (!rbac.allowed) {
      return { success: false, error: rbac.reason };
    }
    const data = ReportHistoryService.getReportHistory();
    return { success: true, data };
  });

  // 20. Process Conversational BI Query (Natural Language Business Intelligence)
  ipcMain.handle('ai:biQuery', async (_event, payload: { request: BiQueryRequest; userContext?: UserAuthContext }) => {
    return await BiOrchestrator.processQuery(payload.request, payload.userContext);
  });

  // 21. Get BI Conversation Threads
  ipcMain.handle('ai:getBiConversations', async (_event, payload?: { userContext?: UserAuthContext }) => {
    const data = BiConversationManager.getConversations(payload?.userContext?.userId);
    return { success: true, data };
  });

  // 22. Get BI Conversation Message History
  ipcMain.handle('ai:getBiConversationMessages', async (_event, payload: { conversationId: string; userContext?: UserAuthContext }) => {
    const data = BiConversationManager.getMessages(payload.conversationId);
    return { success: true, data };
  });

  // 23. Clear BI Conversation Thread
  ipcMain.handle('ai:clearBiConversation', async (_event, payload: { conversationId: string; userContext?: UserAuthContext }) => {
    const success = BiConversationManager.clearConversation(payload.conversationId);
    return { success };
  });

  // 24. Get Personalized AI Dashboard Config
  ipcMain.handle('ai:getDashboardConfig', async (_event, payload?: { userContext?: UserAuthContext }) => {
    const data = AiDashboardService.getDashboardConfig(payload?.userContext);
    return { success: true, data };
  });
}

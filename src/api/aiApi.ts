import { apiClient, ApiResponse } from './client';
import { StorageManager } from '../utils/storage';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  data?: any;
  source?: string;
  sourcesUsed?: string[];
  generatedAt: string;
  isError?: boolean;
}

export interface AiQuickPromptItem {
  id: string;
  label: string;
  prompt: string;
  category: 'sales' | 'inventory' | 'customers' | 'reports' | 'staff';
}

export class AiApi {
  /**
   * Sends a prompt to the AI Assistant via Electron IPC or Common REST API fallback
   */
  public static async sendMessage(message: string, currentRoute?: string): Promise<ApiResponse<AiChatMessage>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    const requestPayload = {
      message,
      context: { currentRoute },
    };

    // 1. Electron IPC Bridge
    if (typeof window !== 'undefined' && (window as any).api?.ai?.chat) {
      try {
        const res = await (window as any).api.ai.chat(requestPayload, userContext);
        const chatMsg: AiChatMessage = {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: res.answer,
          data: res.data,
          source: res.source,
          sourcesUsed: res.sourcesUsed,
          generatedAt: res.generatedAt || new Date().toISOString(),
          isError: res.isError,
        };
        return { success: true, data: chatMsg };
      } catch (err: any) {
        return {
          success: false,
          error: { code: 'AI_ERROR', message: err.message || 'Failed to communicate with AI service' },
        };
      }
    }

    // 2. HTTP REST Endpoint Fallback (for remote server / mobile app backend)
    try {
      const res = await apiClient.post<any>('/ai/chat', { message, context: { currentRoute } });
      if (res.success && res.data) {
        const chatMsg: AiChatMessage = {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: res.data.answer,
          data: res.data.data,
          source: res.data.source,
          sourcesUsed: res.data.sourcesUsed,
          generatedAt: res.data.generatedAt || new Date().toISOString(),
          isError: res.data.isError,
        };
        return { success: true, data: chatMsg };
      }
      return { success: false, error: res.error };
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Network error' },
      };
    }
  }

  /**
   * Retrieves role-specific quick prompts
   */
  public static async getQuickPrompts(): Promise<AiQuickPromptItem[]> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getQuickPrompts) {
      try {
        return await (window as any).api.ai.getQuickPrompts(userContext);
      } catch {}
    }

    return [
      { id: 'sales_today', label: '📊 Sales Today', prompt: 'How much did we sell today?', category: 'sales' },
      { id: 'top_sellers', label: '🏆 Top Selling Items', prompt: 'What are today’s top-selling products?', category: 'sales' },
      { id: 'low_stock', label: '🚨 Low Stock Alerts', prompt: 'Which products are low or out of stock?', category: 'inventory' },
      { id: 'business_summary', label: '📈 Business Summary', prompt: 'Give me today’s executive business summary.', category: 'reports' },
    ];
  }

  /**
   * Retrieves Proactive AI Sales Analytics & Insights
   */
  public static async getSalesInsights(timeframe: 'today' | 'week' | 'month' = 'week'): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getSalesInsights) {
      try {
        const res = await (window as any).api.ai.getSalesInsights(timeframe, userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>(`/ai/insights/sales?timeframe=${timeframe}`);
  }

  /**
   * Retrieves Daily Executive AI Summary
   */
  public static async getDailySummary(dateStr?: string): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getDailySummary) {
      try {
        const res = await (window as any).api.ai.getDailySummary(dateStr, userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>(`/ai/summary/daily${dateStr ? `?date=${dateStr}` : ''}`);
  }

  /**
   * Retrieves AI Inventory Intelligence and Reorder Summary
   */
  public static async getInventoryIntelligence(): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getInventoryIntelligence) {
      try {
        const res = await (window as any).api.ai.getInventoryIntelligence(userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>('/ai/forecast/inventory');
  }

  /**
   * Retrieves single product detailed demand forecast
   */
  public static async getProductForecast(variantId: number): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getProductForecast) {
      try {
        const res = await (window as any).api.ai.getProductForecast(variantId, userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>(`/ai/forecast/products/${variantId}`);
  }

  /**
   * Retrieves Dead Stock analysis list
   */
  public static async getDeadStock(): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getDeadStock) {
      try {
        const res = await (window as any).api.ai.getDeadStock(userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>('/ai/inventory/dead-stock');
  }

  /**
   * Retrieves Real-Time POS Cart Recommendations
   */
  public static async getCartRecommendations(cartVariantIds: number[], customerId?: number): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    const request = { cartVariantIds, customerId, limit: 3 };

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getCartRecommendations) {
      try {
        const res = await (window as any).api.ai.getCartRecommendations(request, userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.post<any>('/ai/recommendations/cart', request);
  }

  /**
   * Retrieves Customer Purchasing & Persona Intelligence Profile
   */
  public static async getCustomerIntelligence(customerId: number): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getCustomerIntelligence) {
      try {
        const res = await (window as any).api.ai.getCustomerIntelligence(customerId, userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>(`/ai/recommendations/customer/${customerId}`);
  }

  /**
   * Retrieves Similar and Complementary Product Recommendations
   */
  public static async getProductRecommendations(productId: number): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getProductRecommendations) {
      try {
        const res = await (window as any).api.ai.getProductRecommendations(productId, userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>(`/ai/recommendations/product/${productId}`);
  }

  /**
   * Tracks recommendation click and conversion feedback
   */
  public static async trackRecommendationFeedback(event: any): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).api?.ai?.trackRecommendationFeedback) {
      try {
        await (window as any).api.ai.trackRecommendationFeedback(event);
      } catch {}
    }
  }

  /**
   * Retrieves detected operational anomalies
   */
  public static async getAnomalies(filter?: any): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getAnomalies) {
      try {
        const res = await (window as any).api.ai.getAnomalies(filter, userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>('/ai/anomalies', { params: filter });
  }

  /**
   * Retrieves single anomaly details
   */
  public static async getAnomalyDetails(anomalyId: string): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getAnomalyDetails) {
      try {
        const res = await (window as any).api.ai.getAnomalyDetails(anomalyId, userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>(`/ai/anomalies/${anomalyId}`);
  }

  /**
   * Performs manager review on an anomaly
   */
  public static async reviewAnomaly(request: any): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.reviewAnomaly) {
      try {
        const res = await (window as any).api.ai.reviewAnomaly(request, userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.post<any>(`/ai/anomalies/${request.anomalyId}/review`, request);
  }

  /**
   * Retrieves executive risk health summary
   */
  public static async getRiskSummary(): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getRiskSummary) {
      try {
        const res = await (window as any).api.ai.getRiskSummary(userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>('/ai/anomalies/risk-summary');
  }

  /**
   * Retrieves Smart Business Report for period
   */
  public static async getSmartReport(period: string, dateStr?: string): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getSmartReport) {
      try {
        const res = await (window as any).api.ai.getSmartReport(period, dateStr, userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>('/ai/reports/smart', { params: { period, dateStr } });
  }

  /**
   * Retrieves historical report archive list
   */
  public static async getReportHistory(): Promise<ApiResponse<any>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getReportHistory) {
      try {
        const res = await (window as any).api.ai.getReportHistory(userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    // Fallback to REST endpoint
    return await apiClient.get<any>('/ai/reports/history');
  }

  /**
   * Submits a natural language query to the Conversational Business Intelligence Assistant
   */
  public static async biQuery(request: { conversationId?: string; message: string; language?: string }): Promise<{ conversationId: string; message: any }> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.biQuery) {
      try {
        return await (window as any).api.ai.biQuery(request, userContext);
      } catch (err: any) {
        console.error('biQuery error:', err);
      }
    }

    const fallbackRes = await (apiClient as any).post('/ai/bi/query', { request, userContext });
    return fallbackRes.data || { conversationId: request.conversationId || 'default', message: { role: 'assistant', content: 'Unable to process query.' } };
  }

  /**
   * Retrieves conversation threads list
   */
  public static async getBiConversations(): Promise<ApiResponse<any[]>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getBiConversations) {
      try {
        const res = await (window as any).api.ai.getBiConversations(userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    return await apiClient.get<any[]>('/ai/bi/conversations');
  }

  /**
   * Retrieves messages for a specific conversation thread
   */
  public static async getBiConversationMessages(conversationId: string): Promise<ApiResponse<any[]>> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.getBiConversationMessages) {
      try {
        const res = await (window as any).api.ai.getBiConversationMessages(conversationId, userContext);
        return res;
      } catch (err: any) {
        return { success: false, error: { code: 'AI_ERROR', message: err.message } };
      }
    }

    return await apiClient.get<any[]>(`/ai/bi/conversations/${conversationId}/messages`);
  }

  /**
   * Clears messages in a conversation thread
   */
  public static async clearBiConversation(conversationId: string): Promise<{ success: boolean }> {
    const userSession = StorageManager.getCurrentUser();
    const userContext = userSession ? {
      userId: Number(userSession.id) || 1,
      username: userSession.username,
      roleName: userSession.role,
      roleId: userSession.roleId,
      permissions: userSession.permissions || [],
    } : undefined;

    if (typeof window !== 'undefined' && (window as any).api?.ai?.clearBiConversation) {
      try {
        return await (window as any).api.ai.clearBiConversation(conversationId, userContext);
      } catch (err: any) {
        console.error('clearBiConversation error:', err);
      }
    }

    return { success: true };
  }
}

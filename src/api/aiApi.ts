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
}

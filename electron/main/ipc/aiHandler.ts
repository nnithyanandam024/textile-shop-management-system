import { ipcMain } from 'electron';
import { AiService } from '../services/ai/aiService';
import { AiLogger } from '../services/ai/aiLogger';
import { AiChatRequest } from '../services/ai/aiConfig';
import { UserAuthContext } from '../services/ai/aiRbacGuard';

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
}

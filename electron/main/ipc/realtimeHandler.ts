/**
 * Phase 14 — Realtime IPC Handlers
 */
import { ipcMain } from 'electron';
import { eventBus } from '../realtime/eventBus';
import log from '../logger';

export function registerRealtimeHandlers() {
  ipcMain.handle('realtime:publish', async (_, event: any) => {
    try {
      if (!event || !event.type) {
        return { success: false, error: 'Invalid event payload.' };
      }
      eventBus.publish(event.type, event.data, event.meta);
      return { success: true };
    } catch (err: any) {
      log.error('IPC realtime:publish error:', err);
      return { success: false, error: err.message };
    }
  });
}

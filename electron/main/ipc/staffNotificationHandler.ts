import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffNotificationCenterService } from '../services/staffNotificationCenterService';
import log from '../logger';

export function registerStaffNotificationCenterHandlers(db: Database.Database) {
  const service = new StaffNotificationCenterService(db);

  ipcMain.handle('staff-notifications:get-all', async (_, staffId?: number, filters?: any) => {
    try {
      const data = service.getNotifications(staffId, filters);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-notifications:get-all error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('staff-notifications:mark-read', async (_, notificationId: number, staffId?: number) => {
    try {
      const data = service.markAsRead(notificationId, staffId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-notifications:mark-read error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('staff-notifications:mark-all-read', async (_, staffId?: number) => {
    try {
      const data = service.markAllAsRead(staffId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-notifications:mark-all-read error:', err);
      return { success: false, error: err.message };
    }
  });
}

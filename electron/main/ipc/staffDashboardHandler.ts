import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffDashboardService } from '../services/staffDashboardService';
import log from '../logger';

export function registerStaffDashboardHandlers(db: Database.Database) {
  const service = new StaffDashboardService(db);

  ipcMain.handle('staff-dashboard:get-summary', async () => {
    try {
      return { success: true, data: service.getDashboardSummary() };
    } catch (err: any) {
      log.error('IPC staff-dashboard:get-summary error:', err);
      return { success: false, error: err.message || 'Failed to load staff dashboard summary.' };
    }
  });
}

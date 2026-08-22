import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffReportsService } from '../services/staffReportsService';
import log from '../logger';

export function registerStaffReportsHandlers(db: Database.Database) {
  const service = new StaffReportsService(db);

  ipcMain.handle('staff-reports:sales', async (_, staffId?: number, filters?: any) => {
    try {
      const data = service.getStaffSalesReport(staffId, filters);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-reports:sales error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('staff-reports:attendance', async (_, staffId?: number, monthYear?: string) => {
    try {
      const data = service.getStaffAttendanceReport(staffId, monthYear);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-reports:attendance error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('staff-reports:commission', async (_, staffId?: number, period?: string) => {
    try {
      const data = service.getStaffCommissionReport(staffId, period);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-reports:commission error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('staff-reports:inventory-tasks', async (_, staffId?: number) => {
    try {
      const data = service.getStaffInventoryTasksReport(staffId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-reports:inventory-tasks error:', err);
      return { success: false, error: err.message };
    }
  });
}

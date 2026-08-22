import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffSettingsService } from '../services/staffSettingsService';
import log from '../logger';

export function registerStaffSettingsHandlers(db: Database.Database) {
  const service = new StaffSettingsService(db);

  ipcMain.handle('staff-settings:get-preferences', async (_, staffId?: number) => {
    try {
      const data = service.getStaffPreferences(staffId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-settings:get-preferences error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('staff-settings:update-preferences', async (_, staffId: number, preferences: any) => {
    try {
      const data = service.updateStaffPreferences(staffId, preferences);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-settings:update-preferences error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('staff-settings:get-printers', async () => {
    try {
      const data = service.getAvailablePrinters();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-settings:get-printers error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('staff-settings:test-print', async (_, printerName: string, printerType: string) => {
    try {
      const data = service.testPrint(printerName, printerType);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-settings:test-print error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('staff-settings:update-password', async (_, userId: number, oldPass: string, newPass: string) => {
    try {
      const data = await service.updateStaffPassword(userId, oldPass, newPass);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-settings:update-password error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('staff-settings:get-version', async () => {
    try {
      const data = service.getAppVersionInfo();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-settings:get-version error:', err);
      return { success: false, error: err.message };
    }
  });
}

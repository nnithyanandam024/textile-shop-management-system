import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffAuthService } from '../services/auth/staffAuthService';
import log from '../logger';

export function registerStaffAuthHandlers(db: Database.Database) {
  const staffAuthService = new StaffAuthService(db);

  ipcMain.handle('staff-auth:login', async (_, { employeeId, password, rememberMe }) => {
    try {
      return await staffAuthService.login(employeeId, password, rememberMe);
    } catch (err: any) {
      log.error('IPC staff-auth:login error:', err);
      return { success: false, error: 'Unable to connect to the system. Please try again.' };
    }
  });

  ipcMain.handle('staff-auth:logout', async () => {
    try {
      return staffAuthService.logout();
    } catch (err: any) {
      log.error('IPC staff-auth:logout error:', err);
      return { success: false };
    }
  });

  ipcMain.handle('staff-auth:get-current-user', async () => {
    try {
      return staffAuthService.getCurrentStaff();
    } catch (err: any) {
      log.error('IPC staff-auth:get-current-user error:', err);
      return null;
    }
  });
}

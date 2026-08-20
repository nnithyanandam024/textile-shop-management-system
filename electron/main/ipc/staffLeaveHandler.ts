import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffLeaveService } from '../services/staffLeaveService';
import log from '../logger';

export function registerStaffLeaveHandlers(db: Database.Database) {
  const service = new StaffLeaveService(db);

  // 1. Leave Balances
  ipcMain.handle('staff-leave:get-balances', async (_, year?: number) => {
    try {
      const data = service.getLeaveBalances(year);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-leave:get-balances error:', err);
      return { success: false, error: err.message };
    }
  });

  // 2. Leave Types
  ipcMain.handle('staff-leave:get-types', async () => {
    try {
      const data = service.getLeaveTypes();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-leave:get-types error:', err);
      return { success: false, error: err.message };
    }
  });

  // 3. Apply Leave
  ipcMain.handle('staff-leave:apply', async (_, input: any) => {
    try {
      const result = service.applyLeave(input);
      return result;
    } catch (err: any) {
      log.error('IPC staff-leave:apply error:', err);
      return { success: false, error: err.message };
    }
  });

  // 4. Get Leave Requests
  ipcMain.handle('staff-leave:get-requests', async (_, filters?: any) => {
    try {
      const data = service.getLeaveRequests(filters);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-leave:get-requests error:', err);
      return { success: false, error: err.message };
    }
  });

  // 5. Get Leave Details
  ipcMain.handle('staff-leave:get-details', async (_, requestId: number) => {
    try {
      const data = service.getLeaveDetails(requestId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-leave:get-details error:', err);
      return { success: false, error: err.message };
    }
  });

  // 6. Cancel Leave
  ipcMain.handle('staff-leave:cancel', async (_, requestId: number) => {
    try {
      const result = service.cancelLeave(requestId);
      return result;
    } catch (err: any) {
      log.error('IPC staff-leave:cancel error:', err);
      return { success: false, error: err.message };
    }
  });

  // 7. Get Leave Calendar
  ipcMain.handle('staff-leave:get-calendar', async (_, monthStr?: string) => {
    try {
      const data = service.getLeaveCalendar(monthStr);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-leave:get-calendar error:', err);
      return { success: false, error: err.message };
    }
  });

  // 8. Get Leave History
  ipcMain.handle('staff-leave:get-history', async (_, year?: number) => {
    try {
      const data = service.getLeaveHistory(year);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-leave:get-history error:', err);
      return { success: false, error: err.message };
    }
  });

  // 9. Request Permission
  ipcMain.handle('staff-leave:request-permission', async (_, input: any) => {
    try {
      const result = service.requestPermission(input);
      return result;
    } catch (err: any) {
      log.error('IPC staff-leave:request-permission error:', err);
      return { success: false, error: err.message };
    }
  });

  // 10. Get Permission Requests
  ipcMain.handle('staff-leave:get-permissions', async () => {
    try {
      const data = service.getPermissionRequests();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-leave:get-permissions error:', err);
      return { success: false, error: err.message };
    }
  });

  // 11. Cancel Permission
  ipcMain.handle('staff-leave:cancel-permission', async (_, id: number) => {
    try {
      const result = service.cancelPermission(id);
      return result;
    } catch (err: any) {
      log.error('IPC staff-leave:cancel-permission error:', err);
      return { success: false, error: err.message };
    }
  });
}

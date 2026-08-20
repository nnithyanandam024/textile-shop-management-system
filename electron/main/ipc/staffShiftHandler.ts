import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffShiftService } from '../services/staffShiftService';
import log from 'electron-log';

export function registerStaffShiftHandlers(db: Database.Database) {
  const shiftService = new StaffShiftService(db);

  // 1. Get Today's Shift
  ipcMain.handle('staff-shifts:get-today', async () => {
    try {
      const data = shiftService.getTodayShift();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-shifts:get-today failed:', err);
      return { success: false, error: err.message || 'Failed to fetch today shift' };
    }
  });

  // 2. Get Weekly Schedule
  ipcMain.handle('staff-shifts:get-weekly', async (_event, weekStartDate?: string) => {
    try {
      const data = shiftService.getWeeklySchedule(weekStartDate);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-shifts:get-weekly failed:', err);
      return { success: false, error: err.message || 'Failed to fetch weekly schedule' };
    }
  });

  // 3. Get Monthly Schedule
  ipcMain.handle('staff-shifts:get-monthly', async (_event, monthStr?: string) => {
    try {
      const data = shiftService.getMonthlySchedule(monthStr);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-shifts:get-monthly failed:', err);
      return { success: false, error: err.message || 'Failed to fetch monthly schedule' };
    }
  });

  // 4. Get Upcoming Shifts
  ipcMain.handle('staff-shifts:get-upcoming', async (_event, count?: number) => {
    try {
      const data = shiftService.getUpcomingShifts(count);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-shifts:get-upcoming failed:', err);
      return { success: false, error: err.message || 'Failed to fetch upcoming shifts' };
    }
  });

  // 5. Get Shift Details by Date
  ipcMain.handle('staff-shifts:get-details', async (_event, dateStr: string) => {
    try {
      const data = shiftService.getShiftDetails(dateStr);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-shifts:get-details failed:', err);
      return { success: false, error: err.message || 'Failed to fetch shift details' };
    }
  });

  // 6. Get Shift History
  ipcMain.handle('staff-shifts:get-history', async (_event, filter?: { month?: string }) => {
    try {
      const data = shiftService.getShiftHistory(filter);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-shifts:get-history failed:', err);
      return { success: false, error: err.message || 'Failed to fetch shift history' };
    }
  });

  // 7. Request Shift Change
  ipcMain.handle('staff-shifts:request-change', async (_event, input: any) => {
    try {
      const res = shiftService.requestShiftChange(input);
      return res;
    } catch (err: any) {
      log.error('IPC staff-shifts:request-change failed:', err);
      return { success: false, error: err.message || 'Failed to request shift change' };
    }
  });

  // 8. Request Shift Swap
  ipcMain.handle('staff-shifts:request-swap', async (_event, input: any) => {
    try {
      const res = shiftService.requestShiftSwap(input);
      return res;
    } catch (err: any) {
      log.error('IPC staff-shifts:request-swap failed:', err);
      return { success: false, error: err.message || 'Failed to request shift swap' };
    }
  });

  // 9. Get Shift Requests
  ipcMain.handle('staff-shifts:get-requests', async () => {
    try {
      const data = shiftService.getShiftRequests();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-shifts:get-requests failed:', err);
      return { success: false, error: err.message || 'Failed to fetch shift requests' };
    }
  });

  // 10. Cancel Request
  ipcMain.handle('staff-shifts:cancel-request', async (_event, id: number, type: 'CHANGE' | 'SWAP') => {
    try {
      const res = shiftService.cancelShiftRequest(id, type);
      return res;
    } catch (err: any) {
      log.error('IPC staff-shifts:cancel-request failed:', err);
      return { success: false, error: err.message || 'Failed to cancel shift request' };
    }
  });

  // 11. Get Swap Candidates
  ipcMain.handle('staff-shifts:get-swap-candidates', async (_event, dateStr: string) => {
    try {
      const data = shiftService.getSwapCandidates(dateStr);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-shifts:get-swap-candidates failed:', err);
      return { success: false, error: err.message || 'Failed to fetch swap candidates' };
    }
  });

  // 12. Get Shift Templates (for dropdowns)
  ipcMain.handle('staff-shifts:get-templates', async () => {
    try {
      const data = shiftService.getAllShiftTemplates();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-shifts:get-templates failed:', err);
      return { success: false, error: err.message || 'Failed to fetch shift templates' };
    }
  });
}

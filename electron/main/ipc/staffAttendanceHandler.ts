import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffAttendanceService } from '../services/staffAttendanceService';
import log from '../logger';

export function registerStaffAttendanceHandlers(db: Database.Database): void {
  const attendanceService = new StaffAttendanceService(db);

  // 1. Get Today's Attendance
  ipcMain.handle('staff-attendance:get-today', async () => {
    try {
      const data = attendanceService.getTodayAttendance();
      return { success: true, data };
    } catch (error: any) {
      log.error(`[IPC staff-attendance:get-today] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 2. Check In
  ipcMain.handle('staff-attendance:check-in', async (_, customTime?: string) => {
    try {
      const result = attendanceService.checkIn(customTime);
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-attendance:check-in] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 3. Check Out
  ipcMain.handle('staff-attendance:check-out', async (_, customTime?: string) => {
    try {
      const result = attendanceService.checkOut(customTime);
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-attendance:check-out] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 4. Start Break
  ipcMain.handle('staff-attendance:start-break', async (_, customTime?: string) => {
    try {
      const result = attendanceService.startBreak(customTime);
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-attendance:start-break] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 5. End Break
  ipcMain.handle('staff-attendance:end-break', async (_, customTime?: string) => {
    try {
      const result = attendanceService.endBreak(customTime);
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-attendance:end-break] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 6. Get Attendance History
  ipcMain.handle('staff-attendance:get-history', async (_, filter?: any) => {
    try {
      const data = attendanceService.getAttendanceHistory(filter);
      return { success: true, data };
    } catch (error: any) {
      log.error(`[IPC staff-attendance:get-history] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 7. Get Monthly Summary
  ipcMain.handle('staff-attendance:get-monthly-summary', async (_, monthStr?: string) => {
    try {
      const data = attendanceService.getMonthlySummary(monthStr);
      return { success: true, data };
    } catch (error: any) {
      log.error(`[IPC staff-attendance:get-monthly-summary] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 8. Get By Date
  ipcMain.handle('staff-attendance:get-by-date', async (_, dateStr: string) => {
    try {
      const data = attendanceService.getAttendanceByDate(dateStr);
      return { success: true, data };
    } catch (error: any) {
      log.error(`[IPC staff-attendance:get-by-date] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 9. Request Correction
  ipcMain.handle('staff-attendance:request-correction', async (_, input: any) => {
    try {
      const result = attendanceService.requestCorrection(input);
      return result;
    } catch (error: any) {
      log.error(`[IPC staff-attendance:request-correction] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // 10. Get Correction Requests
  ipcMain.handle('staff-attendance:get-correction-requests', async () => {
    try {
      const data = attendanceService.getCorrectionRequests();
      return { success: true, data };
    } catch (error: any) {
      log.error(`[IPC staff-attendance:get-correction-requests] Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  log.info('Staff Attendance IPC handlers registered successfully.');
}

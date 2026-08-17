import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { AttendanceService } from '../services/attendanceService';
import { AuthorizationService } from '../services/auth/authorizationService';
import { SessionService } from '../services/auth/sessionService';

export function registerAttendanceHandlers(db: Database.Database) {
  ipcMain.handle('attendance:get-settings', () => {
    AuthorizationService.requirePermission('attendance.view');
    const service = new AttendanceService(db);
    return service.getSettings();
  });

  ipcMain.handle('attendance:update-settings', (_, input: any) => {
    AuthorizationService.requirePermission('attendance.manage_settings');
    const session = SessionService.getSession();
    const service = new AttendanceService(db);
    return service.updateSettings(input, session?.userId);
  });

  ipcMain.handle('attendance:check-in', (_, { staffId, time }: { staffId: number; time?: string }) => {
    AuthorizationService.requirePermission('attendance.create');
    const session = SessionService.getSession();
    const service = new AttendanceService(db);
    return service.checkIn(staffId, time, session?.userId);
  });

  ipcMain.handle('attendance:check-out', (_, { staffId, time }: { staffId: number; time?: string }) => {
    AuthorizationService.requirePermission('attendance.create');
    const session = SessionService.getSession();
    const service = new AttendanceService(db);
    return service.checkOut(staffId, time, session?.userId);
  });

  ipcMain.handle('attendance:get-daily', (_, { date, filters }: { date: string; filters?: any }) => {
    AuthorizationService.requirePermission('attendance.view');
    const service = new AttendanceService(db);
    return service.getDailyAttendanceList(date, filters);
  });

  ipcMain.handle('attendance:get-staff-monthly', (_, { staffId, year, month }: { staffId: number; year: number; month: number }) => {
    AuthorizationService.requirePermission('attendance.view');
    const service = new AttendanceService(db);
    return service.getMonthlyStaffSummary(staffId, year, month);
  });

  ipcMain.handle('attendance:mark-manual', (_, input: any) => {
    AuthorizationService.requirePermission('attendance.update');
    const session = SessionService.getSession();
    const service = new AttendanceService(db);
    return service.manualMarkAttendance(input, session?.userId);
  });

  ipcMain.handle('attendance:request-correction', (_, { attendanceId, input }: { attendanceId: number; input: any }) => {
    AuthorizationService.requirePermission('attendance.correct');
    const session = SessionService.getSession();
    const service = new AttendanceService(db);
    return service.requestCorrection(attendanceId, input, session?.userId || 1);
  });

  ipcMain.handle('attendance:approve-correction', (_, { correctionId, approve }: { correctionId: number; approve: boolean }) => {
    AuthorizationService.requirePermission('attendance.approve');
    const session = SessionService.getSession();
    const service = new AttendanceService(db);
    return service.approveCorrection(correctionId, approve, session?.userId || 1);
  });

  ipcMain.handle('attendance:get-pending-corrections', () => {
    AuthorizationService.requirePermission('attendance.approve');
    const service = new AttendanceService(db);
    return service.getPendingCorrections();
  });
}

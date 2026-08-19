import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { SelfServiceService } from '../services/selfServiceService';
import { AuthorizationService } from '../services/auth/authorizationService';
import { SessionService } from '../services/auth/sessionService';

export function registerSelfServiceHandlers(db: Database.Database) {
  ipcMain.handle('self-service:get-dashboard', () => {
    AuthorizationService.requirePermission('self.profile.view');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.getDashboard(session?.userId || 1);
  });

  ipcMain.handle('self-service:get-profile', () => {
    AuthorizationService.requirePermission('self.profile.view');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.getMyProfile(session?.userId || 1);
  });

  ipcMain.handle('self-service:update-profile', (_, fields: any) => {
    AuthorizationService.requirePermission('self.profile.edit');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.updateMyProfile(session?.userId || 1, fields);
  });

  ipcMain.handle('self-service:request-profile-change', (_, input: any) => {
    AuthorizationService.requirePermission('self.profile.request_change');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.requestProfileChange(session?.userId || 1, input);
  });

  ipcMain.handle('self-service:get-profile-change-requests', () => {
    AuthorizationService.requirePermission('self.profile.view');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.getProfileChangeRequests(session?.userId || 1);
  });

  ipcMain.handle('self-service:get-attendance', (_, month?: string, year?: number) => {
    AuthorizationService.requirePermission('self.attendance.view');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.getMyAttendance(session?.userId || 1, month, year);
  });

  ipcMain.handle('self-service:request-attendance-correction', (_, input: any) => {
    AuthorizationService.requirePermission('self.attendance.request_correction');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.requestAttendanceCorrection(session?.userId || 1, input);
  });

  ipcMain.handle('self-service:get-leave', () => {
    AuthorizationService.requirePermission('self.leave.view');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.getMyLeave(session?.userId || 1);
  });

  ipcMain.handle('self-service:apply-leave', (_, input: any) => {
    AuthorizationService.requirePermission('self.leave.apply');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.applyLeave(session?.userId || 1, input);
  });

  ipcMain.handle('self-service:cancel-leave', (_, leaveRequestId: number) => {
    AuthorizationService.requirePermission('self.leave.cancel');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.cancelLeave(session?.userId || 1, leaveRequestId);
  });

  ipcMain.handle('self-service:get-payroll', () => {
    AuthorizationService.requirePermission('self.payroll.view');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.getMyPayroll(session?.userId || 1);
  });

  ipcMain.handle('self-service:get-documents', () => {
    AuthorizationService.requirePermission('self.documents.view');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.getMyDocuments(session?.userId || 1);
  });

  ipcMain.handle('self-service:get-performance', () => {
    AuthorizationService.requirePermission('self.performance.view');
    const session = SessionService.getSession();
    const service = new SelfServiceService(db);
    return service.getMyPerformance(session?.userId || 1);
  });
}

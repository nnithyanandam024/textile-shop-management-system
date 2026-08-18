import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { LeaveService } from '../services/leaveService';
import { HolidayService } from '../services/holidayService';
import { AuthorizationService } from '../services/auth/authorizationService';
import { SessionService } from '../services/auth/sessionService';

export function registerLeaveHandlers(db: Database.Database) {
  ipcMain.handle('leave:get-types', (_, includeInactive?: boolean) => {
    AuthorizationService.requirePermission('leave.view');
    const service = new LeaveService(db);
    return service.getLeaveTypes(includeInactive);
  });

  ipcMain.handle('leave:create-type', (_, input: any) => {
    AuthorizationService.requirePermission('leave.manage_types');
    const session = SessionService.getSession();
    const service = new LeaveService(db);
    return service.createLeaveType(input, session?.userId);
  });

  ipcMain.handle('leave:update-type', (_, { id, input }: { id: number; input: any }) => {
    AuthorizationService.requirePermission('leave.manage_types');
    const session = SessionService.getSession();
    const service = new LeaveService(db);
    return service.updateLeaveType(id, input, session?.userId);
  });

  ipcMain.handle('leave:get-balances', (_, { staffId, year }: { staffId: number; year?: number }) => {
    AuthorizationService.requirePermission('leave.view');
    const service = new LeaveService(db);
    return service.getStaffBalances(staffId, year);
  });

  ipcMain.handle('leave:adjust-balance', (_, input: any) => {
    AuthorizationService.requirePermission('leave.manage_balances');
    const session = SessionService.getSession();
    const service = new LeaveService(db);
    return service.adjustBalance(input, session?.userId);
  });

  ipcMain.handle('leave:get-requests', (_, filters?: any) => {
    AuthorizationService.requirePermission('leave.view');
    const service = new LeaveService(db);
    return service.getRequests(filters);
  });

  ipcMain.handle('leave:apply', (_, input: any) => {
    AuthorizationService.requirePermission('leave.create');
    const service = new LeaveService(db);
    return service.applyLeave(input);
  });

  ipcMain.handle('leave:approve', (_, requestId: number) => {
    AuthorizationService.requirePermission('leave.approve');
    const session = SessionService.getSession();
    const service = new LeaveService(db);
    return service.approveLeave(requestId, session?.userId || 1);
  });

  ipcMain.handle('leave:reject', (_, { requestId, rejectionReason }: { requestId: number; rejectionReason: string }) => {
    AuthorizationService.requirePermission('leave.reject');
    const session = SessionService.getSession();
    const service = new LeaveService(db);
    return service.rejectLeave(requestId, rejectionReason, session?.userId || 1);
  });

  ipcMain.handle('leave:cancel', (_, requestId: number) => {
    AuthorizationService.requirePermission('leave.cancel');
    const session = SessionService.getSession();
    const service = new LeaveService(db);
    return service.cancelLeave(requestId, session?.userId);
  });

  ipcMain.handle('leave:get-holidays', (_, includeInactive?: boolean) => {
    AuthorizationService.requirePermission('leave.view');
    const service = new HolidayService(db);
    return service.getHolidays(includeInactive);
  });

  ipcMain.handle('leave:create-holiday', (_, input: any) => {
    AuthorizationService.requirePermission('leave.manage_holidays');
    const session = SessionService.getSession();
    const service = new HolidayService(db);
    return service.createHoliday(input, session?.userId);
  });

  ipcMain.handle('leave:delete-holiday', (_, id: number) => {
    AuthorizationService.requirePermission('leave.manage_holidays');
    const session = SessionService.getSession();
    const service = new HolidayService(db);
    return service.deleteHoliday(id, session?.userId);
  });
}

import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { ShiftService } from '../services/shiftService';
import { AuthorizationService } from '../services/auth/authorizationService';
import { SessionService } from '../services/auth/sessionService';

export function registerShiftHandlers(db: Database.Database) {
  ipcMain.handle('shift:get-templates', (_, includeInactive?: boolean) => {
    AuthorizationService.requirePermission('shift.view');
    const service = new ShiftService(db);
    return service.getTemplates(includeInactive);
  });

  ipcMain.handle('shift:get-template-by-id', (_, id: number) => {
    AuthorizationService.requirePermission('shift.view');
    const service = new ShiftService(db);
    return service.getTemplateById(id);
  });

  ipcMain.handle('shift:create-template', (_, input: any) => {
    AuthorizationService.requirePermission('shift.create');
    const session = SessionService.getSession();
    const service = new ShiftService(db);
    return service.createTemplate(input, session?.userId);
  });

  ipcMain.handle('shift:update-template', (_, { id, input }: { id: number; input: any }) => {
    AuthorizationService.requirePermission('shift.update');
    const session = SessionService.getSession();
    const service = new ShiftService(db);
    return service.updateTemplate(id, input, session?.userId);
  });

  ipcMain.handle('shift:deactivate-template', (_, id: number) => {
    AuthorizationService.requirePermission('shift.deactivate');
    const session = SessionService.getSession();
    const service = new ShiftService(db);
    return service.deactivateTemplate(id, session?.userId);
  });

  ipcMain.handle('shift:assign-staff', (_, input: any) => {
    AuthorizationService.requirePermission('shift.assign');
    const session = SessionService.getSession();
    const service = new ShiftService(db);
    return service.assignShift(input, session?.userId);
  });

  ipcMain.handle('shift:get-staff-history', (_, staffId: number) => {
    AuthorizationService.requirePermission('shift.view');
    const service = new ShiftService(db);
    return service.getStaffShiftHistory(staffId);
  });

  ipcMain.handle('shift:get-schedule', (_, { staffId, dateStr }: { staffId: number; dateStr?: string }) => {
    AuthorizationService.requirePermission('shift.view');
    const service = new ShiftService(db);
    return service.getWeeklySchedule(staffId, dateStr);
  });

  ipcMain.handle('shift:set-schedule', (_, { staffId, scheduleDays }: { staffId: number; scheduleDays: any[] }) => {
    AuthorizationService.requirePermission('shift.assign');
    const session = SessionService.getSession();
    const service = new ShiftService(db);
    return service.setWeeklySchedule(staffId, scheduleDays, session?.userId);
  });

  ipcMain.handle('shift:create-override', (_, input: any) => {
    AuthorizationService.requirePermission('shift.override');
    const session = SessionService.getSession();
    const service = new ShiftService(db);
    return service.createOverride(input, session?.userId);
  });

  ipcMain.handle('shift:delete-override', (_, id: number) => {
    AuthorizationService.requirePermission('shift.override');
    const session = SessionService.getSession();
    const service = new ShiftService(db);
    return service.deleteOverride(id, session?.userId);
  });

  ipcMain.handle('shift:get-overrides', (_, { startDate, endDate }: { startDate: string; endDate: string }) => {
    AuthorizationService.requirePermission('shift.view');
    const service = new ShiftService(db);
    return service.getOverridesForPeriod(startDate, endDate);
  });

  ipcMain.handle('shift:resolve-date', (_, { staffId, dateStr }: { staffId: number; dateStr: string }) => {
    AuthorizationService.requirePermission('shift.view');
    const service = new ShiftService(db);
    return service.resolveStaffShiftForDate(staffId, dateStr);
  });
}

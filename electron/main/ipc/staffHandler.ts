import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffService } from '../services/staffService';
import { DepartmentService } from '../services/departmentService';
import { DesignationService } from '../services/designationService';
import { SessionService } from '../services/auth/sessionService';
import log from '../logger';

export function registerStaffHandlers(db: Database.Database) {
  const staffService = new StaffService(db);
  const deptService = new DepartmentService(db);
  const desService = new DesignationService(db);

  // Helper for permission checks
  const checkPermission = async (requiredPermission: string): Promise<boolean> => {
    const session = SessionService.getSession();
    if (!session) return true;
    return session.permissions.includes(requiredPermission) || session.permissions.includes('*') || session.roleName === 'Owner';
  };

  const getActorUserId = (): number | undefined => {
    const session = SessionService.getSession();
    return session?.userId;
  };

  // --- STAFF IPC CHANNELS ---
  ipcMain.handle('staff:getAll', async (_event, params) => {
    try {
      return staffService.getStaffList(params);
    } catch (error: any) {
      log.error('IPC staff:getAll error:', error);
      return { staff: [], total: 0 };
    }
  });

  ipcMain.handle('staff:getById', async (_event, id: number) => {
    try {
      return staffService.getStaffById(id);
    } catch (error: any) {
      log.error('IPC staff:getById error:', error);
      return undefined;
    }
  });

  ipcMain.handle('staff:create', async (_event, _token: string, input) => {
    const hasPerm = await checkPermission('staff.manage');
    if (!hasPerm) return { success: false, error: 'Unauthorized: Required permission staff.manage' };
    const actorId = getActorUserId();
    return staffService.createStaff(input, actorId);
  });

  ipcMain.handle('staff:update', async (_event, _token: string, id: number, input) => {
    const hasPerm = await checkPermission('staff.manage');
    if (!hasPerm) return { success: false, error: 'Unauthorized: Required permission staff.manage' };
    const actorId = getActorUserId();
    return staffService.updateStaff(id, input, actorId);
  });

  ipcMain.handle('staff:deactivate', async (_event, _token: string, id: number) => {
    const hasPerm = await checkPermission('staff.manage');
    if (!hasPerm) return { success: false, error: 'Unauthorized: Required permission staff.manage' };
    const actorId = getActorUserId();
    return staffService.deactivateStaff(id, actorId);
  });

  // --- DEPARTMENT IPC CHANNELS ---
  ipcMain.handle('department:getAll', async (_event, includeInactive?: boolean) => {
    try {
      return deptService.getDepartments(includeInactive);
    } catch (error: any) {
      log.error('IPC department:getAll error:', error);
      return [];
    }
  });

  ipcMain.handle('department:create', async (_event, _token: string, input) => {
    const hasPerm = await checkPermission('staff.organization');
    if (!hasPerm) return { success: false, error: 'Unauthorized: Required permission staff.organization' };
    const actorId = getActorUserId();
    return deptService.createDepartment(input, actorId);
  });

  ipcMain.handle('department:update', async (_event, _token: string, id: number, input) => {
    const hasPerm = await checkPermission('staff.organization');
    if (!hasPerm) return { success: false, error: 'Unauthorized: Required permission staff.organization' };
    const actorId = getActorUserId();
    return deptService.updateDepartment(id, input, actorId);
  });

  ipcMain.handle('department:deactivate', async (_event, _token: string, id: number) => {
    const hasPerm = await checkPermission('staff.organization');
    if (!hasPerm) return { success: false, error: 'Unauthorized: Required permission staff.organization' };
    const actorId = getActorUserId();
    return deptService.deactivateDepartment(id, actorId);
  });

  // --- DESIGNATION IPC CHANNELS ---
  ipcMain.handle('designation:getAll', async (_event, departmentId?: number, includeInactive?: boolean) => {
    try {
      return desService.getDesignations(departmentId, includeInactive);
    } catch (error: any) {
      log.error('IPC designation:getAll error:', error);
      return [];
    }
  });

  ipcMain.handle('designation:create', async (_event, _token: string, input) => {
    const hasPerm = await checkPermission('staff.organization');
    if (!hasPerm) return { success: false, error: 'Unauthorized: Required permission staff.organization' };
    const actorId = getActorUserId();
    return desService.createDesignation(input, actorId);
  });

  ipcMain.handle('designation:update', async (_event, _token: string, id: number, input) => {
    const hasPerm = await checkPermission('staff.organization');
    if (!hasPerm) return { success: false, error: 'Unauthorized: Required permission staff.organization' };
    const actorId = getActorUserId();
    return desService.updateDesignation(id, input, actorId);
  });

  ipcMain.handle('designation:deactivate', async (_event, _token: string, id: number) => {
    const hasPerm = await checkPermission('staff.organization');
    if (!hasPerm) return { success: false, error: 'Unauthorized: Required permission staff.organization' };
    const actorId = getActorUserId();
    return desService.deactivateDesignation(id, actorId);
  });
}

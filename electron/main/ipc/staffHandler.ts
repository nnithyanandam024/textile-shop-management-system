import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffService } from '../services/staffService';
import { DepartmentService } from '../services/departmentService';
import { DesignationService } from '../services/designationService';
import { EmergencyContactService } from '../services/emergencyContactService';
import { StaffBankService } from '../services/staffBankService';
import { StaffDocumentService } from '../services/staffDocumentService';
import { EmploymentHistoryService } from '../services/employmentHistoryService';
import { StaffNotesService } from '../services/staffNotesService';
import { SessionService } from '../services/auth/sessionService';
import log from '../logger';

export function registerStaffHandlers(db: Database.Database) {
  const staffService = new StaffService(db);
  const deptService = new DepartmentService(db);
  const desService = new DesignationService(db);
  const emergencyService = new EmergencyContactService(db);
  const bankService = new StaffBankService(db);
  const docService = new StaffDocumentService(db);
  const historyService = new EmploymentHistoryService(db);
  const notesService = new StaffNotesService(db);

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
      const res = staffService.getStaffList(params);
      const staffWithCompletion = res.staff.map((s) => ({
        ...s,
        profile_completion: staffService.calculateProfileCompletion(s.id),
      }));
      return { staff: staffWithCompletion, total: res.total };
    } catch (error: any) {
      log.error('IPC staff:getAll error:', error);
      return { staff: [], total: 0 };
    }
  });

  ipcMain.handle('staff:getById', async (_event, id: number) => {
    try {
      const s = staffService.getStaffById(id);
      if (!s) return undefined;
      return {
        ...s,
        profile_completion: staffService.calculateProfileCompletion(id),
      };
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

  // --- EMERGENCY CONTACTS ---
  ipcMain.handle('staff:emergency:getAll', async (_event, staffId: number) => {
    return emergencyService.getContacts(staffId);
  });

  ipcMain.handle('staff:emergency:save', async (_event, _token: string, input) => {
    const hasPerm = await checkPermission('staff.manage');
    if (!hasPerm) return { success: false, error: 'Unauthorized' };
    return emergencyService.saveContact(input, getActorUserId());
  });

  ipcMain.handle('staff:emergency:delete', async (_event, _token: string, id: number) => {
    const hasPerm = await checkPermission('staff.manage');
    if (!hasPerm) return { success: false, error: 'Unauthorized' };
    return emergencyService.deleteContact(id, getActorUserId());
  });

  // --- BANK DETAILS ---
  ipcMain.handle('staff:bank:get', async (_event, staffId: number, revealFull?: boolean) => {
    const hasPerm = await checkPermission('staff.bank.view');
    if (!hasPerm) return undefined;
    return bankService.getBankDetails(staffId, revealFull);
  });

  ipcMain.handle('staff:bank:save', async (_event, _token: string, input) => {
    const hasPerm = await checkPermission('staff.bank.manage');
    if (!hasPerm) return { success: false, error: 'Unauthorized' };
    return bankService.saveBankDetails(input, getActorUserId());
  });

  // --- DOCUMENTS ---
  ipcMain.handle('staff:document:getAll', async (_event, staffId: number) => {
    const hasPerm = await checkPermission('staff.documents.view');
    if (!hasPerm) return [];
    return docService.getDocuments(staffId);
  });

  ipcMain.handle('staff:document:upload', async (_event, _token: string, input) => {
    const hasPerm = await checkPermission('staff.documents.manage');
    if (!hasPerm) return { success: false, error: 'Unauthorized' };
    return docService.uploadDocument(input, getActorUserId());
  });

  ipcMain.handle('staff:document:verify', async (_event, _token: string, id: number, status: 'Pending' | 'Verified' | 'Rejected') => {
    const hasPerm = await checkPermission('staff.documents.manage');
    if (!hasPerm) return { success: false, error: 'Unauthorized' };
    return docService.verifyDocument(id, status, getActorUserId());
  });

  ipcMain.handle('staff:document:delete', async (_event, _token: string, id: number) => {
    const hasPerm = await checkPermission('staff.documents.manage');
    if (!hasPerm) return { success: false, error: 'Unauthorized' };
    return docService.deleteDocument(id, getActorUserId());
  });

  // --- NOTES ---
  ipcMain.handle('staff:notes:getAll', async (_event, staffId: number) => {
    const hasPerm = await checkPermission('staff.notes.view');
    if (!hasPerm) return [];
    return notesService.getNotes(staffId);
  });

  ipcMain.handle('staff:notes:add', async (_event, _token: string, input) => {
    const hasPerm = await checkPermission('staff.notes.manage');
    if (!hasPerm) return { success: false, error: 'Unauthorized' };
    return notesService.addNote(input, getActorUserId());
  });

  ipcMain.handle('staff:notes:delete', async (_event, _token: string, id: number) => {
    const hasPerm = await checkPermission('staff.notes.manage');
    if (!hasPerm) return { success: false, error: 'Unauthorized' };
    return notesService.deleteNote(id, getActorUserId());
  });

  // --- EMPLOYMENT HISTORY ---
  ipcMain.handle('staff:history:getAll', async (_event, staffId: number) => {
    const hasPerm = await checkPermission('staff.history.view');
    if (!hasPerm) return [];
    return historyService.getHistory(staffId);
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


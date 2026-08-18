import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { PayrollService } from '../services/payrollService';
import { AuthorizationService } from '../services/auth/authorizationService';
import { SessionService } from '../services/auth/sessionService';

export function registerPayrollHandlers(db: Database.Database) {
  ipcMain.handle('payroll:get-periods', () => {
    AuthorizationService.requirePermission('payroll.view');
    const service = new PayrollService(db);
    return service.getPeriods();
  });

  ipcMain.handle('payroll:get-period-by-id', (_, id: number) => {
    AuthorizationService.requirePermission('payroll.view');
    const service = new PayrollService(db);
    return service.getPeriodById(id);
  });

  ipcMain.handle('payroll:create-period', (_, input: any) => {
    AuthorizationService.requirePermission('payroll.create');
    const session = SessionService.getSession();
    const service = new PayrollService(db);
    return service.createPayrollPeriod(input, session?.userId);
  });

  ipcMain.handle('payroll:calculate-period', (_, periodId: number) => {
    AuthorizationService.requirePermission('payroll.calculate');
    const session = SessionService.getSession();
    const service = new PayrollService(db);
    return service.calculatePayrollPeriod(periodId, session?.userId);
  });

  ipcMain.handle('payroll:approve-period', (_, periodId: number) => {
    AuthorizationService.requirePermission('payroll.approve');
    const session = SessionService.getSession();
    const service = new PayrollService(db);
    return service.approvePayrollPeriod(periodId, session?.userId || 1);
  });

  ipcMain.handle('payroll:lock-period', (_, periodId: number) => {
    AuthorizationService.requirePermission('payroll.lock');
    const session = SessionService.getSession();
    const service = new PayrollService(db);
    return service.lockPayrollPeriod(periodId, session?.userId);
  });

  ipcMain.handle('payroll:get-records', (_, periodId: number) => {
    AuthorizationService.requirePermission('payroll.view');
    const service = new PayrollService(db);
    return service.getRecordsForPeriod(periodId);
  });

  ipcMain.handle('payroll:get-record-by-id', (_, recordId: number) => {
    AuthorizationService.requirePermission('payroll.view');
    const service = new PayrollService(db);
    return service.getRecordById(recordId);
  });

  ipcMain.handle('payroll:get-staff-history', (_, staffId: number) => {
    AuthorizationService.requirePermission('payroll.view');
    const service = new PayrollService(db);
    return service.getStaffPayrollHistory(staffId);
  });

  ipcMain.handle('salary:get-structure', (_, { staffId, dateStr }: { staffId: number; dateStr?: string }) => {
    AuthorizationService.requirePermission('payroll.view');
    const service = new PayrollService(db);
    return service.getCurrentSalaryStructure(staffId, dateStr);
  });

  ipcMain.handle('salary:assign-structure', (_, input: any) => {
    AuthorizationService.requirePermission('payroll.manage_salary');
    const session = SessionService.getSession();
    const service = new PayrollService(db);
    return service.assignSalaryStructure(input, session?.userId);
  });

  ipcMain.handle('salary:get-history', (_, staffId: number) => {
    AuthorizationService.requirePermission('payroll.view');
    const service = new PayrollService(db);
    return service.getSalaryHistory(staffId);
  });

  ipcMain.handle('advance:get-all', (_, filters?: any) => {
    AuthorizationService.requirePermission('payroll.view');
    const service = new PayrollService(db);
    return service.getAdvances(filters);
  });

  ipcMain.handle('advance:issue', (_, input: any) => {
    AuthorizationService.requirePermission('payroll.manage_advances');
    const session = SessionService.getSession();
    const service = new PayrollService(db);
    return service.issueAdvance(input, session?.userId);
  });
}

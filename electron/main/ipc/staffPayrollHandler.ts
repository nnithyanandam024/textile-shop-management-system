import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffPayrollService } from '../services/staffPayrollService';
import log from '../logger';

export function registerStaffPayrollHandlers(db: Database.Database) {
  const service = new StaffPayrollService(db);

  // 1. Current Payroll
  ipcMain.handle('staff-payroll:get-current', async (_, periodId?: number) => {
    try {
      const data = service.getCurrentPayroll(periodId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-payroll:get-current error:', err);
      return { success: false, error: err.message };
    }
  });

  // 2. Periods List
  ipcMain.handle('staff-payroll:get-periods', async () => {
    try {
      const data = service.getPayrollPeriods();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-payroll:get-periods error:', err);
      return { success: false, error: err.message };
    }
  });

  // 3. History
  ipcMain.handle('staff-payroll:get-history', async () => {
    try {
      const data = service.getPayrollHistory();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-payroll:get-history error:', err);
      return { success: false, error: err.message };
    }
  });

  // 4. Details / Payslip
  ipcMain.handle('staff-payroll:get-details', async (_, recordId: number) => {
    try {
      const data = service.getPayslipDetails(recordId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-payroll:get-details error:', err);
      return { success: false, error: err.message };
    }
  });

  // 5. Salary Overview
  ipcMain.handle('staff-payroll:get-salary-overview', async () => {
    try {
      const data = service.getSalaryOverview();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-payroll:get-salary-overview error:', err);
      return { success: false, error: err.message };
    }
  });

  // 6. Salary History
  ipcMain.handle('staff-payroll:get-salary-history', async () => {
    try {
      const data = service.getSalaryHistory();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-payroll:get-salary-history error:', err);
      return { success: false, error: err.message };
    }
  });

  // 7. Overtime Summary
  ipcMain.handle('staff-payroll:get-overtime', async (_, monthStr?: string) => {
    try {
      const data = service.getOvertimeSummary(monthStr);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-payroll:get-overtime error:', err);
      return { success: false, error: err.message };
    }
  });

  // 8. Incentives Summary
  ipcMain.handle('staff-payroll:get-incentives', async (_, periodName?: string) => {
    try {
      const data = service.getIncentiveSummary(periodName);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-payroll:get-incentives error:', err);
      return { success: false, error: err.message };
    }
  });
}

import Database from 'better-sqlite3';
import { SessionService } from './auth/sessionService';
import { PayrollRepository, PayrollRecordRow, PayrollPeriodRow, PayrollLineItemRow } from '../repositories/payrollRepository';
import { SalaryRepository, SalaryStructureRow } from '../repositories/salaryRepository';
import { AttendanceRepository } from '../repositories/attendanceRepository';
import { LeaveRepository } from '../repositories/leaveRepository';
import { AdvanceRepository } from '../repositories/advanceRepository';
import log from '../logger';

export interface StaffSalaryComponentItem {
  id: number;
  code: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  calculationMethod: string;
  value: number;
  amount: number;
}

export interface StaffSalaryOverview {
  staffId: number;
  basicSalary: number;
  grossSalary: number;
  payFrequency: string;
  effectiveFrom: string;
  components: StaffSalaryComponentItem[];
}

export interface StaffAttendanceImpactSummary {
  scheduledDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  lateArrivals: number;
  attendanceDeduction: number;
}

export interface StaffLeaveImpactSummary {
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  dailyRate: number;
  unpaidLeaveDeduction: number;
}

export interface StaffOvertimeSummary {
  approvedHours: number;
  hourlyRate: number;
  overtimeAmount: number;
  recordsCount: number;
}

export interface StaffIncentiveSummary {
  totalIncentives: number;
  items: Array<{
    id: number;
    incentiveType: string;
    amount: number;
    targetAchievement?: number;
    reason?: string;
    status: string;
  }>;
}

export interface StaffPayrollDetails {
  id: number;
  payrollPeriodId: number;
  periodName: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  staffId: number;
  staffCode: string;
  staffName: string;
  departmentName: string;
  designationName: string;
  basicSalary: number;
  grossEarnings: number;
  overtimeHours: number;
  overtimeAmount: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  finalizedAt?: string;
  earnings: Array<{ name: string; amount: number; code: string }>;
  deductions: Array<{ name: string; amount: number; code: string }>;
  attendanceImpact: StaffAttendanceImpactSummary;
  leaveImpact: StaffLeaveImpactSummary;
  overtimeSummary: StaffOvertimeSummary;
  incentiveSummary: StaffIncentiveSummary;
}

export interface StaffPayrollHistoryItem {
  id: number;
  payrollPeriodId: number;
  periodName: string;
  year: number;
  month: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  finalizedAt?: string;
}

export interface StaffSalaryRevisionItem {
  id: number;
  effectiveFrom: string;
  effectiveTo?: string;
  basicSalary: number;
  grossSalary: number;
  status: string;
  reason?: string;
}

export class StaffPayrollService {
  private payrollRepo: PayrollRepository;
  private salaryRepo: SalaryRepository;
  private attRepo: AttendanceRepository;
  private leaveRepo: LeaveRepository;
  private advanceRepo: AdvanceRepository;

  constructor(private db: Database.Database) {
    this.payrollRepo = new PayrollRepository(db);
    this.salaryRepo = new SalaryRepository(db);
    this.attRepo = new AttendanceRepository(db);
    this.leaveRepo = new LeaveRepository(db);
    this.advanceRepo = new AdvanceRepository(db);
  }

  private getAuthenticatedStaffId(): number {
    const session = SessionService.getSession();
    if (!session || !session.staffId) {
      throw new Error('Unauthorized: Staff session not found.');
    }
    return session.staffId;
  }

  /**
   * Get available finalized/approved payroll periods for selection
   */
  getPayrollPeriods(): Array<{ id: number; name: string; year: number; month: number; status: string }> {
    const periods = this.payrollRepo.getPeriods();
    return periods
      .filter((p) => p.status === 'APPROVED' || p.status === 'LOCKED')
      .map((p) => ({
        id: p.id,
        name: p.name,
        year: p.year,
        month: p.month,
        status: p.status,
      }));
  }

  /**
   * Get current or selected period's payroll summary
   */
  getCurrentPayroll(periodId?: number): StaffPayrollDetails {
    const staffId = this.getAuthenticatedStaffId();
    let record: PayrollRecordRow | undefined;
    let period: PayrollPeriodRow | undefined;

    if (periodId) {
      period = this.payrollRepo.getPeriodById(periodId);
      const records = this.payrollRepo.getRecordsForPeriod(periodId);
      record = records.find((r) => r.staff_id === staffId);
    } else {
      // Find latest approved/locked period record for staff
      const history = this.payrollRepo.getStaffPayrollHistory(staffId);
      if (history.length > 0) {
        const latestHist = history[0];
        record = this.payrollRepo.getRecordById(latestHist.id);
        if (record) {
          period = this.payrollRepo.getPeriodById(record.payroll_period_id);
        }
      }
    }

    // Load staff metadata
    const staff = this.db.prepare(`
      SELECT s.*, d.name as department_name, des.name as designation_name
      FROM staff s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN designations des ON s.designation_id = des.id
      WHERE s.id = ?
    `).get(staffId) as any;

    if (!staff) {
      throw new Error('Staff record not found.');
    }

    const currentStructure = this.salaryRepo.getCurrentStructure(staffId);
    const basicSalary = record ? record.basic_salary : currentStructure?.basic_salary || 0;
    const workingDays = record ? record.working_days : 26;
    const dailyRate = basicSalary > 0 && workingDays > 0 ? Math.round(basicSalary / workingDays) : 0;
    const hourlyRate = dailyRate > 0 ? Math.round((dailyRate / 8) * 100) / 100 : 0;

    // Line items
    const earnings: Array<{ name: string; amount: number; code: string }> = [];
    const deductions: Array<{ name: string; amount: number; code: string }> = [];

    let grossEarnings = 0;
    let totalDeductions = 0;
    let netSalary = 0;
    let otHours = 0;
    let otAmount = 0;

    let presentDays = 0;
    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let unpaidLeaveDeduction = 0;
    let advanceDeduction = 0;
    let attendanceDeduction = 0;
    let lateArrivals = 0;

    if (record) {
      grossEarnings = record.gross_earnings;
      totalDeductions = record.total_deductions;
      netSalary = record.net_salary;
      otHours = record.overtime_hours;
      otAmount = record.overtime_amount;
      presentDays = record.present_days;
      paidLeaveDays = record.paid_leave_days;
      unpaidLeaveDays = record.unpaid_leave_days;
      unpaidLeaveDeduction = record.unpaid_leave_deduction;
      advanceDeduction = record.advance_deduction;

      const lineItems = this.payrollRepo.getLineItems(record.id);
      for (const item of lineItems) {
        if (item.type === 'EARNING') {
          earnings.push({ name: item.component_name, amount: item.amount, code: item.component_code });
        } else {
          deductions.push({ name: item.component_name, amount: item.amount, code: item.component_code });
        }
      }
    } else if (currentStructure) {
      // Live estimated structure snapshot for current active period
      earnings.push({ name: 'Basic Salary', amount: currentStructure.basic_salary, code: 'BASIC' });
      grossEarnings = currentStructure.basic_salary;

      if (currentStructure.components) {
        for (const c of currentStructure.components) {
          let amt = c.value;
          if (c.calculation_method === 'PERCENTAGE_OF_BASIC') {
            amt = (currentStructure.basic_salary * c.value) / 100;
          }
          if (c.type === 'DEDUCTION') {
            deductions.push({ name: c.component_name || 'Deduction', amount: amt, code: c.component_code || 'DEDUCT' });
            totalDeductions += amt;
          } else {
            earnings.push({ name: c.component_name || 'Allowance', amount: amt, code: c.component_code || 'ALLOW' });
            grossEarnings += amt;
          }
        }
      }
      netSalary = Math.max(0, grossEarnings - totalDeductions);
    }

    // Overtime summary
    const otSummary: StaffOvertimeSummary = {
      approvedHours: otHours,
      hourlyRate,
      overtimeAmount: otAmount,
      recordsCount: otHours > 0 ? 1 : 0,
    };

    // Incentives summary
    const periodName = period?.name || `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`;
    const incentiveRows = this.db.prepare(`
      SELECT * FROM staff_incentives WHERE staff_id = ? AND period_name = ? AND status = 'APPROVED'
    `).all(staffId, periodName) as any[];

    const incentiveItems = incentiveRows.map((i) => ({
      id: i.id,
      incentiveType: i.incentive_type,
      amount: i.amount,
      targetAchievement: i.target_achievement,
      reason: i.reason,
      status: i.status,
    }));
    const totalIncentives = incentiveItems.reduce((acc, curr) => acc + curr.amount, 0);

    const incentiveSummary: StaffIncentiveSummary = {
      totalIncentives,
      items: incentiveItems,
    };

    const attendanceImpact: StaffAttendanceImpactSummary = {
      scheduledDays: workingDays,
      presentDays,
      paidLeaveDays,
      unpaidLeaveDays,
      absentDays: Math.max(0, workingDays - (presentDays + paidLeaveDays + unpaidLeaveDays)),
      lateArrivals,
      attendanceDeduction,
    };

    const leaveImpact: StaffLeaveImpactSummary = {
      paidLeaveDays,
      unpaidLeaveDays,
      dailyRate,
      unpaidLeaveDeduction,
    };

    return {
      id: record ? record.id : 0,
      payrollPeriodId: period ? period.id : 0,
      periodName,
      year: period?.year || new Date().getFullYear(),
      month: period?.month || new Date().getMonth() + 1,
      startDate: period?.start_date || '',
      endDate: period?.end_date || '',
      staffId,
      staffCode: staff.staff_code,
      staffName: `${staff.first_name} ${staff.last_name || ''}`.trim(),
      departmentName: staff.department_name || 'Store Operations',
      designationName: staff.designation_name || 'Staff Associate',
      basicSalary,
      grossEarnings,
      overtimeHours: otHours,
      overtimeAmount: otAmount,
      totalDeductions,
      netSalary,
      status: record?.status || 'ESTIMATED',
      finalizedAt: record?.updated_at,
      earnings,
      deductions,
      attendanceImpact,
      leaveImpact,
      overtimeSummary: otSummary,
      incentiveSummary,
    };
  }

  /**
   * Get employee payroll history (finalized periods only)
   */
  getPayrollHistory(): StaffPayrollHistoryItem[] {
    const staffId = this.getAuthenticatedStaffId();
    const records = this.payrollRepo.getStaffPayrollHistory(staffId);

    return records.map((r: any) => ({
      id: r.id,
      payrollPeriodId: r.payroll_period_id,
      periodName: r.period_name || `Period #${r.payroll_period_id}`,
      year: r.year,
      month: r.month,
      grossEarnings: r.gross_earnings,
      totalDeductions: r.total_deductions,
      netSalary: r.net_salary,
      status: r.status,
      finalizedAt: r.updated_at,
    }));
  }

  /**
   * Get full payslip details for printing / modal inspection
   */
  getPayslipDetails(recordId: number): StaffPayrollDetails {
    const staffId = this.getAuthenticatedStaffId();
    const record = this.payrollRepo.getRecordById(recordId);

    if (!record || record.staff_id !== staffId) {
      throw new Error('Unauthorized: Payslip record not found.');
    }

    return this.getCurrentPayroll(record.payroll_period_id);
  }

  /**
   * Get active salary structure & allowances overview
   */
  getSalaryOverview(): StaffSalaryOverview {
    const staffId = this.getAuthenticatedStaffId();
    const struct = this.salaryRepo.getCurrentStructure(staffId);

    if (!struct) {
      return {
        staffId,
        basicSalary: 0,
        grossSalary: 0,
        payFrequency: 'MONTHLY',
        effectiveFrom: new Date().toISOString().slice(0, 10),
        components: [],
      };
    }

    const components: StaffSalaryComponentItem[] = [];

    // Basic
    components.push({
      id: 1,
      code: 'BASIC',
      name: 'Basic Salary',
      type: 'EARNING',
      calculationMethod: 'FIXED',
      value: struct.basic_salary,
      amount: struct.basic_salary,
    });

    if (struct.components) {
      for (const sc of struct.components) {
        let amt = sc.value;
        if (sc.calculation_method === 'PERCENTAGE_OF_BASIC') {
          amt = (struct.basic_salary * sc.value) / 100;
        }
        components.push({
          id: sc.id,
          code: sc.component_code || 'ALLOW',
          name: sc.component_name || 'Allowance',
          type: sc.type || 'EARNING',
          calculationMethod: sc.calculation_method,
          value: sc.value,
          amount: amt,
        });
      }
    }

    return {
      staffId,
      basicSalary: struct.basic_salary,
      grossSalary: struct.gross_salary,
      payFrequency: struct.pay_frequency || 'MONTHLY',
      effectiveFrom: struct.effective_from,
      components,
    };
  }

  /**
   * Get historical salary structure revisions
   */
  getSalaryHistory(): StaffSalaryRevisionItem[] {
    const staffId = this.getAuthenticatedStaffId();
    const structures = this.salaryRepo.getSalaryHistory(staffId);

    return structures.map((s) => ({
      id: s.id,
      effectiveFrom: s.effective_from,
      effectiveTo: s.effective_to,
      basicSalary: s.basic_salary,
      grossSalary: s.gross_salary,
      status: s.status,
      reason: 'Salary Revision / Appraisal',
    }));
  }

  /**
   * Get approved overtime records
   */
  getOvertimeSummary(monthStr?: string): StaffOvertimeSummary {
    const staffId = this.getAuthenticatedStaffId();
    const targetMonth = monthStr || new Date().toISOString().slice(0, 7);

    const rows = this.db.prepare(`
      SELECT * FROM overtime_records
      WHERE staff_id = ? AND strftime('%Y-%m', date) = ? AND status = 'APPROVED'
      ORDER BY date DESC
    `).all(staffId, targetMonth) as any[];

    const approvedHours = rows.reduce((acc, curr) => acc + curr.hours, 0);
    const overtimeAmount = rows.reduce((acc, curr) => acc + curr.amount, 0);
    const hourlyRate = rows.length > 0 ? rows[0].rate : 0;

    return {
      approvedHours,
      hourlyRate,
      overtimeAmount,
      recordsCount: rows.length,
    };
  }

  /**
   * Get approved incentives summary
   */
  getIncentiveSummary(periodName?: string): StaffIncentiveSummary {
    const staffId = this.getAuthenticatedStaffId();
    const targetPeriod = periodName || `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`;

    const rows = this.db.prepare(`
      SELECT * FROM staff_incentives
      WHERE staff_id = ? AND period_name = ? AND status = 'APPROVED'
      ORDER BY id DESC
    `).all(staffId, targetPeriod) as any[];

    const items = rows.map((r) => ({
      id: r.id,
      incentiveType: r.incentive_type,
      amount: r.amount,
      targetAchievement: r.target_achievement,
      reason: r.reason,
      status: r.status,
    }));

    return {
      totalIncentives: items.reduce((acc, curr) => acc + curr.amount, 0),
      items,
    };
  }
}

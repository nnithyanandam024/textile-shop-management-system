import Database from 'better-sqlite3';
import { SalaryRepository, SalaryStructureRow } from '../repositories/salaryRepository';
import { AdvanceRepository, SalaryAdvanceRow } from '../repositories/advanceRepository';
import { PayrollRepository, PayrollPeriodRow, PayrollRecordRow } from '../repositories/payrollRepository';
import { StaffRepository } from '../repositories/staffRepository';
import { AttendanceRepository } from '../repositories/attendanceRepository';
import { LeaveRepository } from '../repositories/leaveRepository';
import { AuditRepository } from '../repositories/auditRepository';

export class PayrollService {
  private salaryRepo: SalaryRepository;
  private advanceRepo: AdvanceRepository;
  private payrollRepo: PayrollRepository;
  private staffRepo: StaffRepository;
  private attRepo: AttendanceRepository;
  private leaveRepo: LeaveRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.salaryRepo = new SalaryRepository(db);
    this.advanceRepo = new AdvanceRepository(db);
    this.payrollRepo = new PayrollRepository(db);
    this.staffRepo = new StaffRepository(db);
    this.attRepo = new AttendanceRepository(db);
    this.leaveRepo = new LeaveRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private sanitizeActorUserId(actorUserId?: number): number | undefined {
    if (!actorUserId) return undefined;
    const user = this.db.prepare('SELECT id FROM users WHERE id = ?').get(actorUserId);
    return user ? actorUserId : undefined;
  }

  // --- SALARY STRUCTURES ---
  getCurrentSalaryStructure(staffId: number, dateStr?: string): SalaryStructureRow | undefined {
    return this.salaryRepo.getCurrentStructure(staffId, dateStr);
  }

  getSalaryHistory(staffId: number): SalaryStructureRow[] {
    return this.salaryRepo.getSalaryHistory(staffId);
  }

  assignSalaryStructure(input: {
    staff_id: number;
    effective_from: string;
    pay_frequency?: string;
    basic_salary: number;
    allowances?: Array<{ component_id: number; calculation_method: string; value: number }>;
  }, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.basic_salary || input.basic_salary <= 0) {
      return { success: false, error: 'Basic salary must be greater than 0.' };
    }
    if (!input.effective_from) {
      return { success: false, error: 'Effective date is required.' };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);
    const components = this.salaryRepo.getAllComponents();
    const basicComp = components.find((c) => c.code === 'BASIC')!;

    let gross = input.basic_salary;
    const structComponents: Array<{ component_id: number; calculation_method: string; value: number }> = [
      { component_id: basicComp.id, calculation_method: 'FIXED', value: input.basic_salary },
    ];

    if (input.allowances && input.allowances.length > 0) {
      for (const allow of input.allowances) {
        let amt = allow.value;
        if (allow.calculation_method === 'PERCENTAGE_OF_BASIC') {
          amt = (input.basic_salary * allow.value) / 100;
        }
        gross += amt;
        structComponents.push({
          component_id: allow.component_id,
          calculation_method: allow.calculation_method || 'FIXED',
          value: allow.value,
        });
      }
    }

    const id = this.salaryRepo.createStructure({
      staff_id: input.staff_id,
      effective_from: input.effective_from,
      pay_frequency: input.pay_frequency || 'MONTHLY',
      basic_salary: input.basic_salary,
      gross_salary: gross,
      created_by: validActor,
      components: structComponents,
    });

    this.auditRepo.log({
      user_id: validActor,
      action: 'SALARY_STRUCTURE_ASSIGNED',
      entity_type: 'SALARY_STRUCTURE',
      entity_id: id,
      new_value: `Assigned salary structure for staff #${input.staff_id}: Basic=${input.basic_salary}, Gross=${gross}`,
    });

    return { success: true, id };
  }

  // --- SALARY ADVANCES ---
  getAdvances(filters?: { staffId?: number; status?: string }): SalaryAdvanceRow[] {
    return this.advanceRepo.getAdvances(filters);
  }

  issueAdvance(input: {
    staff_id: number;
    amount: number;
    advance_date: string;
    reason: string;
    monthly_installment: number;
  }, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.amount || input.amount <= 0) {
      return { success: false, error: 'Advance amount must be greater than 0.' };
    }
    if (!input.monthly_installment || input.monthly_installment <= 0) {
      return { success: false, error: 'Monthly installment must be greater than 0.' };
    }
    if (!input.reason || input.reason.trim() === '') {
      return { success: false, error: 'Reason for salary advance is required.' };
    }

    // Check existing active advance
    const active = this.advanceRepo.getActiveAdvance(input.staff_id);
    if (active) {
      return { success: false, error: `Staff member already has an active salary advance with ₹${active.remaining_amount} remaining balance.` };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);
    const id = this.advanceRepo.createAdvance({
      staff_id: input.staff_id,
      amount: input.amount,
      advance_date: input.advance_date,
      reason: input.reason,
      monthly_installment: input.monthly_installment,
      approved_by: validActor,
      created_by: validActor,
    });

    this.auditRepo.log({
      user_id: validActor,
      action: 'SALARY_ADVANCE_ISSUED',
      entity_type: 'SALARY_ADVANCE',
      entity_id: id,
      new_value: `Issued salary advance of ₹${input.amount} to staff #${input.staff_id}`,
    });

    return { success: true, id };
  }

  // --- PAYROLL PERIODS & CALCULATION ENGINE ---
  getPeriods(): PayrollPeriodRow[] {
    return this.payrollRepo.getPeriods();
  }

  getPeriodById(id: number): PayrollPeriodRow | undefined {
    return this.payrollRepo.getPeriodById(id);
  }

  createPayrollPeriod(input: {
    name: string;
    year: number;
    month: number;
    start_date: string;
    end_date: string;
    total_working_days?: number;
  }, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.name || input.name.trim() === '') {
      return { success: false, error: 'Payroll period name is required.' };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);
    const id = this.payrollRepo.createPeriod({
      name: input.name,
      year: input.year,
      month: input.month,
      start_date: input.start_date,
      end_date: input.end_date,
      total_working_days: input.total_working_days || 26,
      created_by: validActor,
    });

    this.auditRepo.log({
      user_id: validActor,
      action: 'PAYROLL_PERIOD_CREATED',
      entity_type: 'PAYROLL_PERIOD',
      entity_id: id,
      new_value: `Created payroll period '${input.name}'`,
    });

    return { success: true, id };
  }

  calculatePayrollPeriod(periodId: number, actorUserId?: number): { success: boolean; recordCount?: number; error?: string } {
    const period = this.payrollRepo.getPeriodById(periodId);
    if (!period || period.status === 'LOCKED') {
      return { success: false, error: 'Payroll period is locked or invalid.' };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);
    const staffList = this.staffRepo.getAll({ limit: 1000 }).staff.filter((s) => s.status === 'ACTIVE');
    const totalWorkingDays = period.total_working_days || 26;

    let recordCount = 0;

    for (const staff of staffList) {
      const struct = this.salaryRepo.getCurrentStructure(staff.id, period.end_date);
      if (!struct) continue; // Skip staff without configured salary structure

      const dailyRate = struct.basic_salary / totalWorkingDays;
      const hourlyRate = dailyRate / 8;

      // Load attendance metrics for target period
      const attRows = this.attRepo.findByMonth(period.year, period.month, staff.id);

      let presentDays = 0;
      let otMinutes = 0;

      for (const a of attRows) {
        if (a.status === 'PRESENT') presentDays += 1;
        else if (a.status === 'HALF_DAY') presentDays += 0.5;
        if (a.overtime_minutes) otMinutes += a.overtime_minutes;
      }

      const otHours = Math.round((otMinutes / 60) * 100) / 100;
      const otAmount = Math.round(otHours * (hourlyRate * 1.5));

      // Load leave requests for target period
      const leaveReqs = this.leaveRepo.getRequests({ staffId: staff.id, status: 'APPROVED' })
        .filter((l) => !(l.end_date < period.start_date || l.start_date > period.end_date));

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;

      for (const l of leaveReqs) {
        if (l.paid) paidLeaveDays += l.duration_days;
        else unpaidLeaveDays += l.duration_days;
      }

      const unpaidLeaveDeduction = Math.round(unpaidLeaveDays * dailyRate);

      // Check active salary advance repayment
      const activeAdvance = this.advanceRepo.getActiveAdvance(staff.id);
      let advanceDeduction = 0;
      if (activeAdvance) {
        advanceDeduction = Math.min(activeAdvance.monthly_installment, activeAdvance.remaining_amount);
      }

      // Calculate Gross & Net
      let grossEarnings = struct.gross_salary + otAmount;
      const totalDeductions = unpaidLeaveDeduction + advanceDeduction;
      const netSalary = Math.max(0, grossEarnings - totalDeductions);

      // Line items snapshot
      const lineItems: Array<{ component_code: string; component_name: string; type: 'EARNING' | 'DEDUCTION'; amount: number; calculation_source?: string }> = [];

      // Structure component earnings
      if (struct.components) {
        for (const sc of struct.components) {
          let amt = sc.value;
          if (sc.calculation_method === 'PERCENTAGE_OF_BASIC') {
            amt = (struct.basic_salary * sc.value) / 100;
          }
          lineItems.push({
            component_code: sc.component_code || 'ALLOWANCE',
            component_name: sc.component_name || 'Allowance',
            type: sc.type || 'EARNING',
            amount: amt,
            calculation_source: 'STRUCTURE',
          });
        }
      }

      // Overtime earning line item
      if (otAmount > 0) {
        lineItems.push({
          component_code: 'OVERTIME',
          component_name: 'Approved Overtime Pay',
          type: 'EARNING',
          amount: otAmount,
          calculation_source: 'OVERTIME',
        });
      }

      // Unpaid leave deduction line item
      if (unpaidLeaveDeduction > 0) {
        lineItems.push({
          component_code: 'UNPAID_LEAVE',
          component_name: 'Unpaid Leave Deduction',
          type: 'DEDUCTION',
          amount: unpaidLeaveDeduction,
          calculation_source: 'UNPAID_LEAVE',
        });
      }

      // Advance deduction line item
      if (advanceDeduction > 0) {
        lineItems.push({
          component_code: 'ADVANCE',
          component_name: 'Salary Advance Recovery',
          type: 'DEDUCTION',
          amount: advanceDeduction,
          calculation_source: 'ADVANCE',
        });
      }

      this.payrollRepo.saveRecordWithLineItems({
        payroll_period_id: periodId,
        staff_id: staff.id,
        basic_salary: struct.basic_salary,
        gross_earnings: grossEarnings,
        overtime_hours: otHours,
        overtime_amount: otAmount,
        working_days: totalWorkingDays,
        present_days: presentDays,
        paid_leave_days: paidLeaveDays,
        unpaid_leave_days: unpaidLeaveDays,
        unpaid_leave_deduction: unpaidLeaveDeduction,
        advance_deduction: advanceDeduction,
        other_deductions: 0,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        status: 'DRAFT',
      }, lineItems);

      recordCount += 1;
    }

    this.payrollRepo.updatePeriodStatus(periodId, 'CALCULATED');

    this.auditRepo.log({
      user_id: validActor,
      action: 'PAYROLL_CALCULATED',
      entity_type: 'PAYROLL_PERIOD',
      entity_id: periodId,
      new_value: `Ran payroll calculation for period #${periodId} (${recordCount} employees included)`,
    });

    return { success: true, recordCount };
  }

  approvePayrollPeriod(periodId: number, actorUserId: number): { success: boolean; error?: string } {
    const period = this.payrollRepo.getPeriodById(periodId);
    if (!period || period.status === 'LOCKED') {
      return { success: false, error: 'Payroll period is locked or invalid.' };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);
    this.payrollRepo.updatePeriodStatus(periodId, 'APPROVED', { approved_by: validActor });

    this.auditRepo.log({
      user_id: validActor,
      action: 'PAYROLL_APPROVED',
      entity_type: 'PAYROLL_PERIOD',
      entity_id: periodId,
      new_value: `Approved payroll period #${periodId}`,
    });

    return { success: true };
  }

  lockPayrollPeriod(periodId: number, actorUserId?: number): { success: boolean; error?: string } {
    const period = this.payrollRepo.getPeriodById(periodId);
    if (!period) {
      return { success: false, error: 'Payroll period not found.' };
    }

    const records = this.payrollRepo.getRecordsForPeriod(periodId);

    // Apply salary advance deductions to advance loan balances
    for (const r of records) {
      if (r.advance_deduction > 0) {
        const activeAdv = this.advanceRepo.getActiveAdvance(r.staff_id);
        if (activeAdv) {
          this.advanceRepo.recordRepayment(activeAdv.id, r.advance_deduction);
        }
      }
    }

    this.payrollRepo.updatePeriodStatus(periodId, 'LOCKED');

    this.auditRepo.log({
      user_id: this.sanitizeActorUserId(actorUserId),
      action: 'PAYROLL_LOCKED',
      entity_type: 'PAYROLL_PERIOD',
      entity_id: periodId,
      new_value: `Locked payroll period #${periodId}`,
    });

    return { success: true };
  }

  getRecordsForPeriod(periodId: number): PayrollRecordRow[] {
    return this.payrollRepo.getRecordsForPeriod(periodId);
  }

  getRecordById(recordId: number): PayrollRecordRow | undefined {
    return this.payrollRepo.getRecordById(recordId);
  }

  getStaffPayrollHistory(staffId: number): PayrollRecordRow[] {
    return this.payrollRepo.getStaffPayrollHistory(staffId);
  }
}

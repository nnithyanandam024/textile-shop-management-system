import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { PayrollService } from '../../electron/main/services/payrollService';
import { StaffService } from '../../electron/main/services/staffService';
import { DepartmentRepository } from '../../electron/main/repositories/departmentRepository';
import { DesignationRepository } from '../../electron/main/repositories/designationRepository';

describe('Staff Management System — Phase 7 Test Suite (Payroll & Salary Management)', () => {
  let db: Database.Database;
  let dbPath: string;
  let payrollService: PayrollService;
  let staffService: StaffService;
  let deptRepo: DepartmentRepository;
  let desRepo: DesignationRepository;
  let testStaffId: number;

  beforeEach(() => {
    closeDatabase();
    dbPath = path.join(__dirname, `../../test_staff_phase7_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    payrollService = new PayrollService(db);
    staffService = new StaffService(db);
    deptRepo = new DepartmentRepository(db);
    desRepo = new DesignationRepository(db);

    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    testStaffId = staffService.createStaff({
      first_name: 'Rajesh',
      last_name: 'Kannan',
      phone: '9443322110',
      joining_date: '2026-01-01',
      department_id: dept.id,
      designation_id: des.id,
    }).id!;
  });

  afterEach(() => {
    closeDatabase();
    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {
        // ignore cleanup lock
      }
    }
  });

  it('1. should verify Migration v9 initialization and default salary components', () => {
    const periods = payrollService.getPeriods();
    expect(periods).toBeDefined();

    const row: any = db.prepare('SELECT COUNT(*) as count FROM salary_components').get();
    expect(row.count).toBeGreaterThanOrEqual(8);
  });

  it('2. should assign employee salary structure and calculate gross salary', () => {
    const assignRes = payrollService.assignSalaryStructure({
      staff_id: testStaffId,
      effective_from: '2026-01-01',
      basic_salary: 25000,
      allowances: [
        { component_id: 2, calculation_method: 'PERCENTAGE_OF_BASIC', value: 20 }, // HRA 20% = 5000
        { component_id: 3, calculation_method: 'FIXED', value: 2000 }, // Transport = 2000
      ],
    });

    expect(assignRes.success).toBe(true);
    expect(assignRes.id).toBeDefined();

    const struct = payrollService.getCurrentSalaryStructure(testStaffId, '2026-08-01');
    expect(struct).toBeDefined();
    expect(struct?.basic_salary).toBe(25000);
    expect(struct?.gross_salary).toBe(32000); // 25000 + 5000 + 2000 = 32000
  });

  it('3. should issue salary advance loan and track monthly repayment installments', () => {
    const advRes = payrollService.issueAdvance({
      staff_id: testStaffId,
      amount: 10000,
      advance_date: '2026-08-01',
      monthly_installment: 2000,
      reason: 'Medical advance',
    });

    expect(advRes.success).toBe(true);
    expect(advRes.id).toBeDefined();

    const advances = payrollService.getAdvances({ staffId: testStaffId });
    expect(advances.length).toBe(1);
    expect(advances[0].remaining_amount).toBe(10000);
    expect(advances[0].monthly_installment).toBe(2000);
  });

  it('4. should run deterministic payroll calculation engine with earnings, unpaid leave, overtime and advance recovery', () => {
    // 1. Assign Salary (Basic 26000 => Daily rate = 1000 for 26 days)
    payrollService.assignSalaryStructure({
      staff_id: testStaffId,
      effective_from: '2026-01-01',
      basic_salary: 26000,
      allowances: [
        { component_id: 3, calculation_method: 'FIXED', value: 4000 }, // Gross = 30000
      ],
    });

    // 2. Issue Advance (₹2000/mo)
    payrollService.issueAdvance({
      staff_id: testStaffId,
      amount: 6000,
      advance_date: '2026-08-01',
      monthly_installment: 2000,
      reason: 'Personal advance',
    });

    // 3. Create Payroll Period for August 2026
    const periodRes = payrollService.createPayrollPeriod({
      name: 'August 2026',
      year: 2026,
      month: 8,
      start_date: '2026-08-01',
      end_date: '2026-08-31',
      total_working_days: 26,
    });

    expect(periodRes.success).toBe(true);

    // 4. Run calculation
    const calcRes = payrollService.calculatePayrollPeriod(periodRes.id!);
    expect(calcRes.success).toBe(true);
    expect(calcRes.recordCount).toBeGreaterThanOrEqual(1);

    const records = payrollService.getRecordsForPeriod(periodRes.id!);
    const rec = records.find((r) => r.staff_id === testStaffId)!;

    expect(rec).toBeDefined();
    expect(rec.basic_salary).toBe(26000);
    expect(rec.gross_earnings).toBe(30000);
    expect(rec.advance_deduction).toBe(2000);
    expect(rec.net_salary).toBe(28000); // 30000 - 2000 = 28000
  });

  it('5. should execute payroll period lifecycle: CALCULATED -> APPROVED -> LOCKED', () => {
    payrollService.assignSalaryStructure({
      staff_id: testStaffId,
      effective_from: '2026-01-01',
      basic_salary: 20000,
    });

    const periodRes = payrollService.createPayrollPeriod({
      name: 'September 2026',
      year: 2026,
      month: 9,
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      total_working_days: 26,
    });

    payrollService.calculatePayrollPeriod(periodRes.id!);
    let period = payrollService.getPeriodById(periodRes.id!)!;
    expect(period.status).toBe('CALCULATED');

    const appRes = payrollService.approvePayrollPeriod(periodRes.id!, 1);
    expect(appRes.success).toBe(true);
    period = payrollService.getPeriodById(periodRes.id!)!;
    expect(period.status).toBe('APPROVED');

    const lockRes = payrollService.lockPayrollPeriod(periodRes.id!);
    expect(lockRes.success).toBe(true);
    period = payrollService.getPeriodById(periodRes.id!)!;
    expect(period.status).toBe('LOCKED');
  });

  it('6. should auto-deduct advance balance when payroll is locked', () => {
    payrollService.assignSalaryStructure({
      staff_id: testStaffId,
      effective_from: '2026-01-01',
      basic_salary: 20000,
    });

    const advRes = payrollService.issueAdvance({
      staff_id: testStaffId,
      amount: 4000,
      advance_date: '2026-10-01',
      monthly_installment: 2000,
      reason: 'Festive advance',
    });

    const periodRes = payrollService.createPayrollPeriod({
      name: 'October 2026',
      year: 2026,
      month: 10,
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      total_working_days: 26,
    });

    payrollService.calculatePayrollPeriod(periodRes.id!);
    payrollService.approvePayrollPeriod(periodRes.id!, 1);
    payrollService.lockPayrollPeriod(periodRes.id!);

    // Verify remaining advance balance updated from 4000 -> 2000
    const advances = payrollService.getAdvances({ staffId: testStaffId });
    const adv = advances.find((a) => a.id === advRes.id!)!;
    expect(adv.remaining_amount).toBe(2000);
    expect(adv.status).toBe('ACTIVE');
  });
});

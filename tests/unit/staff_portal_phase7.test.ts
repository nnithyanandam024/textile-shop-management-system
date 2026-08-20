import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffPayrollService } from '../../electron/main/services/staffPayrollService';
import { SessionService, AuthUserSession } from '../../electron/main/services/auth/sessionService';
import { PasswordService } from '../../electron/main/services/auth/passwordService';

describe('Staff Portal — Phase 7 Test Suite (Staff Payroll & Salary Information)', () => {
  let db: Database.Database;
  let dbPath: string;
  let payrollService: StaffPayrollService;
  let staff1Id: number;
  let staff2Id: number;
  let period1Id: number;
  let record1Id: number;

  beforeEach(() => {
    dbPath = path.join(process.cwd(), `test_staff_phase7_${Date.now()}_${Math.random().toString(36).substring(7)}.db`);
    db = initDatabase(dbPath);
    payrollService = new StaffPayrollService(db);

    // Setup Roles
    db.prepare(`
      INSERT OR IGNORE INTO roles (id, name, description) VALUES (3, 'STAFF', 'Floor Staff & Cashier');
    `).run();

    // Setup Department & Designation
    let depRow = db.prepare(`SELECT id FROM departments WHERE department_code = 'DEP-001'`).get() as any;
    let depId = depRow?.id;
    if (!depId) {
      const depRes = db.prepare(`
        INSERT INTO departments (department_code, name, status) VALUES ('DEP-001', 'Storefront Sales', 'ACTIVE')
      `).run();
      depId = Number(depRes.lastInsertRowid);
    }

    let desRow = db.prepare(`SELECT id FROM designations WHERE designation_code = 'DES-001'`).get() as any;
    let desId = desRow?.id;
    if (!desId) {
      const desRes = db.prepare(`
        INSERT INTO designations (designation_code, name, department_id, status) VALUES ('DES-001', 'Senior Sales Associate', ?, 'ACTIVE')
      `).run(depId);
      desId = Number(desRes.lastInsertRowid);
    }

    // Setup Staff 1 (Arun Kumar)
    const pwHash = PasswordService.hashPasswordSync('password123');
    const u1Res = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('arun.kumar', ?, 'Arun Kumar', 3)
    `).run(pwHash);
    const u1Id = Number(u1Res.lastInsertRowid);

    const s1Res = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id
      ) VALUES (
        'STF-0001', 'Arun', 'Kumar', '9876543210', 'arun@texora.shop',
        ?, ?, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?
      )
    `).run(depId, desId, u1Id);
    staff1Id = Number(s1Res.lastInsertRowid);

    // Setup Staff 2 (Priya Sharma)
    const u2Res = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('priya.sharma', ?, 'Priya Sharma', 3)
    `).run(pwHash);
    const u2Id = Number(u2Res.lastInsertRowid);

    const s2Res = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id
      ) VALUES (
        'STF-0002', 'Priya', 'Sharma', '9876500002', 'priya@texora.shop',
        ?, ?, 'Branch 02', '2026-02-01', 'FULL_TIME', 'ACTIVE', ?
      )
    `).run(depId, desId, u2Id);
    staff2Id = Number(s2Res.lastInsertRowid);

    // Setup Salary Structure for Staff 1: Basic = ₹20,000, HRA = ₹5,000, Transport = ₹2,000 -> Gross = ₹27,000
    const structRes = db.prepare(`
      INSERT INTO salary_structures (staff_id, effective_from, pay_frequency, basic_salary, gross_salary, status)
      VALUES (?, '2026-01-01', 'MONTHLY', 20000, 27000, 'ACTIVE')
    `).run(staff1Id);
    const structId = Number(structRes.lastInsertRowid);

    db.prepare(`
      INSERT INTO salary_structure_components (salary_structure_id, component_id, calculation_method, value)
      VALUES
        (?, 1, 'FIXED', 20000),
        (?, 2, 'FIXED', 5000),
        (?, 3, 'FIXED', 2000)
    `).run(structId, structId, structId);

    // Setup Payroll Period: August 2026
    const periodRes = db.prepare(`
      INSERT INTO payroll_periods (name, year, month, start_date, end_date, total_working_days, status)
      VALUES ('August 2026', 2026, 8, '2026-08-01', '2026-08-31', 26, 'APPROVED')
    `).run();
    period1Id = Number(periodRes.lastInsertRowid);

    // Setup Payroll Record for Staff 1: Gross ₹35,000, Deductions ₹2,550, Net ₹32,450
    const recRes = db.prepare(`
      INSERT INTO payroll_records (
        payroll_period_id, staff_id, basic_salary, gross_earnings, overtime_hours, overtime_amount,
        working_days, present_days, paid_leave_days, unpaid_leave_days, unpaid_leave_deduction,
        advance_deduction, other_deductions, total_deductions, net_salary, status
      ) VALUES (
        ?, ?, 20000, 35000, 10, 1200,
        26, 23, 2, 1, 800,
        1000, 750, 2550, 32450, 'APPROVED'
      )
    `).run(period1Id, staff1Id);
    record1Id = Number(recRes.lastInsertRowid);

    // Setup Line Items
    db.prepare(`
      INSERT INTO payroll_line_items (payroll_record_id, component_code, component_name, type, amount, calculation_source)
      VALUES
        (?, 'BASIC', 'Basic Salary', 'EARNING', 20000, 'STRUCTURE'),
        (?, 'HRA', 'House Rent Allowance', 'EARNING', 5000, 'STRUCTURE'),
        (?, 'TRANSPORT', 'Transport Allowance', 'EARNING', 2000, 'STRUCTURE'),
        (?, 'OVERTIME', 'Approved Overtime Pay', 'EARNING', 1200, 'OVERTIME'),
        (?, 'INCENTIVE', 'Sales Incentive', 'EARNING', 6800, 'INCENTIVE'),
        (?, 'UNPAID_LEAVE', 'Unpaid Leave Deduction', 'DEDUCTION', 800, 'LEAVE'),
        (?, 'ADVANCE', 'Salary Advance Recovery', 'DEDUCTION', 1000, 'ADVANCE'),
        (?, 'ATTENDANCE', 'Attendance Late Deduction', 'DEDUCTION', 750, 'ATTENDANCE')
    `).run(record1Id, record1Id, record1Id, record1Id, record1Id, record1Id, record1Id, record1Id);
  });

  afterEach(() => {
    closeDatabase();
    SessionService.clearSession();
    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {
        // ignore
      }
    }
  });

  it('Test 1: Salary Overview & Current Structure Resolution', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.payroll.view'],
    };
    SessionService.setSession(session1);

    const overview = payrollService.getSalaryOverview();
    expect(overview.basicSalary).toBe(20000);
    expect(overview.grossSalary).toBe(27000);
    expect(overview.payFrequency).toBe('MONTHLY');
    expect(overview.components.length).toBeGreaterThanOrEqual(3);
  });

  it('Test 2: Configurable Allowance Components Breakdown', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.payroll.view'],
    };
    SessionService.setSession(session1);

    const overview = payrollService.getSalaryOverview();
    const basic = overview.components.find((c) => c.code === 'BASIC');
    const hra = overview.components.find((c) => c.code === 'HRA');
    const transport = overview.components.find((c) => c.code === 'TRANSPORT');

    expect(basic?.amount).toBe(20000);
    expect(hra?.amount).toBe(5000);
    expect(transport?.amount).toBe(2000);
  });

  it('Test 3: Overtime Integration & Calculation Verification', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.payroll.view'],
    };
    SessionService.setSession(session1);

    // Insert approved overtime record: 10 hours @ ₹120/hr = ₹1200
    db.prepare(`
      INSERT INTO overtime_records (staff_id, date, hours, rate, amount, status)
      VALUES (?, '2026-08-15', 10, 120, 1200, 'APPROVED')
    `).run(staff1Id);

    const ot = payrollService.getOvertimeSummary('2026-08');
    expect(ot.approvedHours).toBe(10);
    expect(ot.hourlyRate).toBe(120);
    expect(ot.overtimeAmount).toBe(1200);
  });

  it('Test 4: Incentives & Bonus Integration', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.payroll.view'],
    };
    SessionService.setSession(session1);

    // Insert approved incentive: ₹1,500 with 108% target achievement
    db.prepare(`
      INSERT INTO staff_incentives (staff_id, period_name, incentive_type, amount, target_achievement, reason, status)
      VALUES (?, 'August 2026', 'Sales Target Incentive', 1500, 108, 'Exceeded monthly festival target', 'APPROVED')
    `).run(staff1Id);

    const inc = payrollService.getIncentiveSummary('August 2026');
    expect(inc.totalIncentives).toBe(1500);
    expect(inc.items.length).toBe(1);
    expect(inc.items[0].targetAchievement).toBe(108);
  });

  it('Test 5: Deductions Calculation & Detailed Items', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.payroll.view'],
    };
    SessionService.setSession(session1);

    const payroll = payrollService.getCurrentPayroll(period1Id);
    expect(payroll.totalDeductions).toBe(2550);
    expect(payroll.deductions.length).toBeGreaterThanOrEqual(3);

    const unpaidLeave = payroll.deductions.find((d) => d.code === 'UNPAID_LEAVE');
    const advance = payroll.deductions.find((d) => d.code === 'ADVANCE');
    expect(unpaidLeave?.amount).toBe(800);
    expect(advance?.amount).toBe(1000);
  });

  it('Test 6: Net Salary Formula Calculation (Gross ₹35,000 - Deductions ₹2,550 = Net ₹32,450)', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.payroll.view'],
    };
    SessionService.setSession(session1);

    const payroll = payrollService.getCurrentPayroll(period1Id);
    expect(payroll.grossEarnings).toBe(35000);
    expect(payroll.totalDeductions).toBe(2550);
    expect(payroll.netSalary).toBe(32450);
    expect(payroll.status).toBe('APPROVED');
  });

  it('Test 7: Payslip Snapshot & Details Retrieval', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.payroll.view'],
    };
    SessionService.setSession(session1);

    const payslip = payrollService.getPayslipDetails(record1Id);
    expect(payslip.staffCode).toBe('STF-0001');
    expect(payslip.staffName).toContain('Arun Kumar');
    expect(payslip.periodName).toBe('August 2026');
    expect(payslip.netSalary).toBe(32450);
    expect(payslip.earnings.length).toBeGreaterThan(0);
    expect(payslip.deductions.length).toBeGreaterThan(0);
  });

  it('Test 8: Strict Session Data Isolation (Staff 1 cannot view Staff 2 records)', () => {
    // 1. Session as Staff 2
    SessionService.setSession({
      userId: 2,
      staffId: staff2Id,
      username: 'priya.sharma',
      displayName: 'Priya Sharma',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.payroll.view'],
    });

    const s2History = payrollService.getPayrollHistory();
    expect(s2History.length).toBe(0); // Staff 2 has 0 finalized records

    // Staff 2 cannot inspect Staff 1's payslip
    expect(() => {
      payrollService.getPayslipDetails(record1Id);
    }).toThrow(/Unauthorized: Payslip record not found/);
  });
});

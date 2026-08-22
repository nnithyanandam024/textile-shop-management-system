import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { LeaveService } from '../../electron/main/services/leaveService';
import { HolidayService } from '../../electron/main/services/holidayService';
import { StaffService } from '../../electron/main/services/staffService';
import { DepartmentRepository } from '../../electron/main/repositories/departmentRepository';
import { DesignationRepository } from '../../electron/main/repositories/designationRepository';

describe('Staff Management System — Phase 6 Test Suite (Leave Management System)', () => {
  let db: Database.Database;
  let dbPath: string;
  let leaveService: LeaveService;
  let holidayService: HolidayService;
  let staffService: StaffService;
  let deptRepo: DepartmentRepository;
  let desRepo: DesignationRepository;
  let testStaffId: number;

  beforeEach(() => {
    closeDatabase();
    dbPath = path.join(__dirname, `../.test_db/test_staff_phase6_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    leaveService = new LeaveService(db);
    holidayService = new HolidayService(db);
    staffService = new StaffService(db);
    deptRepo = new DepartmentRepository(db);
    desRepo = new DesignationRepository(db);

    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    testStaffId = staffService.createStaff({
      first_name: 'Priya',
      last_name: 'Sharma',
      phone: '9876543210',
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

  it('1. should verify Migration v8 schema initialization, default leave types and shop holidays', () => {
    const types = leaveService.getLeaveTypes(true);
    expect(types.length).toBeGreaterThanOrEqual(4);

    const cl = types.find((t) => t.leave_code === 'CL');
    const sl = types.find((t) => t.leave_code === 'SL');
    const el = types.find((t) => t.leave_code === 'EL');
    const ul = types.find((t) => t.leave_code === 'UL');

    expect(cl?.name).toBe('Casual Leave');
    expect(cl?.annual_allocation).toBe(12);
    expect(sl?.annual_allocation).toBe(10);
    expect(el?.carry_forward_allowed).toBe(1);
    expect(ul?.paid).toBe(0);

    const holidays = holidayService.getHolidays(true);
    expect(holidays.length).toBeGreaterThanOrEqual(5);
    expect(holidays.some((h) => h.name === 'Republic Day')).toBe(true);
  });

  it('2. should initialize staff balances accurately and support manual balance adjustments', () => {
    const year = 2026;
    const balances = leaveService.getStaffBalances(testStaffId, year);
    expect(balances.length).toBeGreaterThanOrEqual(4);

    const clBal = balances.find((b) => b.leave_code === 'CL')!;
    expect(clBal.allocated_days).toBe(12);
    expect(clBal.used_days).toBe(0);
    expect(clBal.available_days).toBe(12);

    // Adjust balance (+2 days special entitlement)
    const adjRes = leaveService.adjustBalance({
      staff_id: testStaffId,
      leave_type_id: clBal.leave_type_id,
      year,
      adjustment_days: 2,
      reason: 'Bonus casual leave granted by Owner',
    });

    expect(adjRes.success).toBe(true);

    const updatedBalances = leaveService.getStaffBalances(testStaffId, year);
    const updatedCl = updatedBalances.find((b) => b.leave_code === 'CL')!;
    expect(updatedCl.adjustment_days).toBe(2);
    expect(updatedCl.available_days).toBe(14); // 12 + 2 = 14
  });

  it('3. should process leave application, date validation, and overlap checks', () => {
    const types = leaveService.getLeaveTypes();
    const cl = types.find((t) => t.leave_code === 'CL')!;

    // Test invalid date range (start > end)
    const invalidRes = leaveService.applyLeave({
      staff_id: testStaffId,
      leave_type_id: cl.id,
      start_date: '2026-08-25',
      end_date: '2026-08-20',
      reason: 'Personal work',
    });
    expect(invalidRes.success).toBe(false);
    expect(invalidRes.error).toContain('Start date cannot be later than end date');

    // Test valid application
    const validRes = leaveService.applyLeave({
      staff_id: testStaffId,
      leave_type_id: cl.id,
      start_date: '2026-08-20',
      end_date: '2026-08-21',
      reason: 'Personal family work',
    });
    expect(validRes.success).toBe(true);
    expect(validRes.id).toBeDefined();

    // Test overlap rejection on same dates
    const overlapRes = leaveService.applyLeave({
      staff_id: testStaffId,
      leave_type_id: cl.id,
      start_date: '2026-08-21',
      end_date: '2026-08-22',
      reason: 'Another request',
    });
    expect(overlapRes.success).toBe(false);
    expect(overlapRes.error).toContain('already has a pending or approved leave');
  });

  it('4. should process manager approval: deduct balance and update/create attendance records', () => {
    const types = leaveService.getLeaveTypes();
    const cl = types.find((t) => t.leave_code === 'CL')!;

    const appRes = leaveService.applyLeave({
      staff_id: testStaffId,
      leave_type_id: cl.id,
      start_date: '2026-08-20',
      end_date: '2026-08-21',
      reason: 'Personal vacation',
    });
    expect(appRes.success).toBe(true);

    const approveRes = leaveService.approveLeave(appRes.id!, 1);
    expect(approveRes.success).toBe(true);

    // Check balance deduction (2 days used)
    const balances = leaveService.getStaffBalances(testStaffId, 2026);
    const clBal = balances.find((b) => b.leave_code === 'CL')!;
    expect(clBal.used_days).toBe(2);
    expect(clBal.available_days).toBe(10); // 12 - 2 = 10

    // Check attendance record integration
    const attRow: any = db.prepare('SELECT * FROM attendance WHERE staff_id = ? AND attendance_date = ?').get(testStaffId, '2026-08-20');
    expect(attRow).toBeDefined();
    expect(attRow.status).toBe('PRESENT');
    expect(attRow.leave_request_id).toBe(appRes.id!);
  });

  it('5. should enforce mandatory rejection reason when manager rejects request', () => {
    const types = leaveService.getLeaveTypes();
    const cl = types.find((t) => t.leave_code === 'CL')!;

    const appRes = leaveService.applyLeave({
      staff_id: testStaffId,
      leave_type_id: cl.id,
      start_date: '2026-08-25',
      end_date: '2026-08-26',
      reason: 'Vacation trip',
    });

    // Test rejection without reason
    const noReasonRes = leaveService.rejectLeave(appRes.id!, '', 1);
    expect(noReasonRes.success).toBe(false);
    expect(noReasonRes.error).toContain('Rejection reason is required');

    // Test rejection with valid reason
    const rejectRes = leaveService.rejectLeave(appRes.id!, 'High store sales volume expected', 1);
    expect(rejectRes.success).toBe(true);

    // Verify status is REJECTED and balance remains intact (used = 0)
    const requests = leaveService.getRequests({ staffId: testStaffId });
    const req = requests.find((r) => r.id === appRes.id!);
    expect(req?.status).toBe('REJECTED');
    expect(req?.rejection_reason).toBe('High store sales volume expected');

    const balances = leaveService.getStaffBalances(testStaffId, 2026);
    const clBal = balances.find((b) => b.leave_code === 'CL')!;
    expect(clBal.used_days).toBe(0);
  });

  it('6. should restore leave balance and unlink attendance when approved leave is cancelled', () => {
    const types = leaveService.getLeaveTypes();
    const cl = types.find((t) => t.leave_code === 'CL')!;

    const appRes = leaveService.applyLeave({
      staff_id: testStaffId,
      leave_type_id: cl.id,
      start_date: '2026-08-20',
      end_date: '2026-08-21',
      reason: 'Personal trip',
    });

    leaveService.approveLeave(appRes.id!, 1);

    // Cancel approved leave
    const cancelRes = leaveService.cancelLeave(appRes.id!, 1);
    expect(cancelRes.success).toBe(true);

    // Verify balance restored (used_days = 0)
    const balances = leaveService.getStaffBalances(testStaffId, 2026);
    const clBal = balances.find((b) => b.leave_code === 'CL')!;
    expect(clBal.used_days).toBe(0);
    expect(clBal.available_days).toBe(12);

    // Verify attendance unlinked
    const attRow: any = db.prepare('SELECT * FROM attendance WHERE staff_id = ? AND attendance_date = ?').get(testStaffId, '2026-08-20');
    expect(attRow.leave_request_id).toBeNull();
  });

  it('7. should support half-day leave applications with 0.5 days calculation', () => {
    const types = leaveService.getLeaveTypes();
    const cl = types.find((t) => t.leave_code === 'CL')!;

    const appRes = leaveService.applyLeave({
      staff_id: testStaffId,
      leave_type_id: cl.id,
      start_date: '2026-08-28',
      end_date: '2026-08-28',
      duration_type: 'HALF_DAY',
      session: 'MORNING',
      reason: 'Doctor appointment',
    });

    expect(appRes.success).toBe(true);

    const requests = leaveService.getRequests({ staffId: testStaffId });
    const req = requests.find((r) => r.id === appRes.id!);
    expect(req?.duration_days).toBe(0.5);
    expect(req?.duration_type).toBe('HALF_DAY');
    expect(req?.session).toBe('MORNING');
  });

  it('8. should manage shop holiday calendar CRUD operations', () => {
    const createRes = holidayService.createHoliday({
      name: 'Store Foundation Day',
      holiday_date: '2026-09-15',
      type: 'SHOP',
      description: 'Annual anniversary holiday',
    });

    expect(createRes.success).toBe(true);
    expect(createRes.id).toBeDefined();

    let holidays = holidayService.getHolidays();
    expect(holidays.some((h) => h.name === 'Store Foundation Day')).toBe(true);

    const delRes = holidayService.deleteHoliday(createRes.id!);
    expect(delRes.success).toBe(true);

    holidays = holidayService.getHolidays();
    expect(holidays.some((h) => h.name === 'Store Foundation Day')).toBe(false);
  });
});

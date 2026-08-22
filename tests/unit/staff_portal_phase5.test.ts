import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffShiftService } from '../../electron/main/services/staffShiftService';
import { SessionService, AuthUserSession } from '../../electron/main/services/auth/sessionService';
import { PasswordService } from '../../electron/main/services/auth/passwordService';
import { getTodayDateStr } from '../../electron/main/services/attendanceService';

describe('Staff Portal — Phase 5 Test Suite (Staff Shift & Work Schedule Management)', () => {
  let db: Database.Database;
  let dbPath: string;
  let shiftService: StaffShiftService;
  let staff1Id: number;
  let staff2Id: number;

  beforeEach(() => {
    dbPath = path.join(__dirname, `../.test_db/test_staff_phase5_${Date.now()}_${Math.random().toString(36).substring(7)}.db`);
    db = initDatabase(dbPath);
    shiftService = new StaffShiftService(db);

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
        INSERT INTO designations (designation_code, name, department_id, status) VALUES ('DES-001', 'Sales Associate', ?, 'ACTIVE')
      `).run(depId);
      desId = Number(desRes.lastInsertRowid);
    }

    // Configure Shift Templates: Template 1 = Morning Shift (09:00-18:00), Template 2 = Evening Shift (13:00-21:00)
    db.prepare(`
      UPDATE shift_templates 
      SET name = 'Morning Shift', start_time = '09:00', end_time = '18:00', grace_minutes = 15, break_minutes = 60
      WHERE id = 1;
    `).run();

    db.prepare(`
      UPDATE shift_templates 
      SET name = 'Evening Shift', start_time = '13:00', end_time = '21:00', grace_minutes = 10, break_minutes = 60
      WHERE id = 2;
    `).run();

    // Setup Leave Types
    db.prepare(`
      INSERT OR IGNORE INTO leave_types (id, leave_code, name, paid, requires_approval, status)
      VALUES (1, 'CL', 'Casual Leave', 1, 1, 'ACTIVE');
    `).run();

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

    // Assign Morning Shift to Staff 1
    db.prepare(`
      INSERT INTO staff_shift_assignments (staff_id, shift_template_id, effective_from)
      VALUES (?, 1, '2026-01-01')
    `).run(staff1Id);

    // Assign Evening Shift to Staff 2
    db.prepare(`
      INSERT INTO staff_shift_assignments (staff_id, shift_template_id, effective_from)
      VALUES (?, 2, '2026-01-01')
    `).run(staff2Id);
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

  it('Test 1: Today Shift Resolution (Regular Assignment vs Temporary Override)', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.shift.view'],
    };
    SessionService.setSession(session1);

    // 1. Regular Assigned Shift
    const todayShift = shiftService.getTodayShift();
    expect(todayShift.shiftName).toBe('Morning Shift');
    expect(todayShift.startTime).toBe('09:00');
    expect(todayShift.endTime).toBe('18:00');
    expect(todayShift.workLocation).toBe('Main Store');
    expect(todayShift.graceMinutes).toBe(15);
    expect(todayShift.isOverride).toBe(false);

    // 2. Add Single-Day Override for Today
    const todayStr = getTodayDateStr();
    db.prepare(`
      INSERT INTO staff_shift_overrides (staff_id, override_date, shift_template_id, is_week_off, reason)
      VALUES (?, ?, 2, 0, 'Special Evening Sale Duty')
    `).run(staff1Id, todayStr);

    const overriddenShift = shiftService.getTodayShift();
    expect(overriddenShift.shiftName).toBe('Evening Shift');
    expect(overriddenShift.startTime).toBe('13:00');
    expect(overriddenShift.endTime).toBe('21:00');
    expect(overriddenShift.status).toBe('CHANGED');
    expect(overriddenShift.isOverride).toBe(true);
    expect(overriddenShift.overrideReason).toBe('Special Evening Sale Duty');
  });

  it('Test 2: Special Days Resolution (Holiday, Leave, Week Off)', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.shift.view'],
    };
    SessionService.setSession(session1);

    // 1. Store Holiday
    db.prepare(`
      INSERT OR IGNORE INTO holidays (name, holiday_date) VALUES ('Independence Day', '2026-08-15')
    `).run();

    const holShift = shiftService.resolveShiftForStaffDate(staff1Id, '2026-08-15');
    expect(holShift.status).toBe('HOLIDAY');
    expect(holShift.isHoliday).toBe(true);
    expect(holShift.holidayName).toBe('Independence Day');
    expect(holShift.symbol).toBe('H');

    // 2. Approved Leave
    db.prepare(`
      INSERT INTO leave_requests (staff_id, leave_type_id, start_date, end_date, duration_days, reason, status)
      VALUES (?, 1, '2026-08-20', '2026-08-22', 3, 'Family Function', 'APPROVED')
    `).run(staff1Id);

    const leaveShift = shiftService.resolveShiftForStaffDate(staff1Id, '2026-08-21');
    expect(leaveShift.status).toBe('LEAVE');
    expect(leaveShift.isLeave).toBe(true);
    expect(leaveShift.leaveTypeName).toBe('Casual Leave');
    expect(leaveShift.symbol).toBe('L');

    // 3. Weekly Off (Sunday)
    const sundayShift = shiftService.resolveShiftForStaffDate(staff1Id, '2026-08-23'); // 2026-08-23 is Sunday
    expect(sundayShift.status).toBe('WEEK_OFF');
    expect(sundayShift.isWeekOff).toBe(true);
    expect(sundayShift.symbol).toBe('OFF');
  });

  it('Test 3: Weekly 7-Day Schedule Generation', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.shift.view'],
    };
    SessionService.setSession(session1);

    const weekly = shiftService.getWeeklySchedule('2026-08-17');
    expect(weekly.weekStart).toBe('2026-08-17');
    expect(weekly.weekEnd).toBe('2026-08-23');
    expect(weekly.days.length).toBe(7);
    expect(weekly.days[0].dayName).toBe('Monday');
    expect(weekly.days[6].dayName).toBe('Sunday');
    expect(weekly.days[6].isWeekOff).toBe(true);
  });

  it('Test 4: Monthly Schedule Resolution & Navigation', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.shift.view'],
    };
    SessionService.setSession(session1);

    const monthly = shiftService.getMonthlySchedule('2026-08');
    expect(monthly.monthStr).toBe('2026-08');
    expect(monthly.totalDays).toBe(31);
    expect(monthly.days.length).toBe(31);
    expect(monthly.days[0].date).toBe('2026-08-01');
    expect(monthly.days[30].date).toBe('2026-08-31');
  });

  it('Test 5: Upcoming Shifts (Next 7 Days Calculation)', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.shift.view'],
    };
    SessionService.setSession(session1);

    const upcoming = shiftService.getUpcomingShifts(7);
    expect(upcoming.length).toBe(7);
    expect(upcoming[0].date > getTodayDateStr()).toBe(true);
  });

  it('Test 6: Shift Change Request Submission & Cancellation', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.shift.view'],
    };
    SessionService.setSession(session1);

    const res = shiftService.requestShiftChange({
      target_date: '2026-08-28',
      requested_shift_template_id: 2,
      reason: 'Doctor appointment in morning',
    });

    expect(res.success).toBe(true);
    expect(res.id).toBeGreaterThan(0);

    // Prevent duplicate pending request on same date
    expect(() => {
      shiftService.requestShiftChange({
        target_date: '2026-08-28',
        requested_shift_template_id: 1,
        reason: 'Duplicate attempt',
      });
    }).toThrow(/already have a pending shift change request/);

    const reqs = shiftService.getShiftRequests();
    expect(reqs.length).toBe(1);
    expect(reqs[0].status).toBe('PENDING');
    expect(reqs[0].type).toBe('CHANGE');
    expect(reqs[0].reason).toBe('Doctor appointment in morning');

    // Cancel Request
    const cancelRes = shiftService.cancelShiftRequest(res.id, 'CHANGE');
    expect(cancelRes.success).toBe(true);

    const updatedReqs = shiftService.getShiftRequests();
    expect(updatedReqs[0].status).toBe('CANCELLED');
  });

  it('Test 7: Shift Swap Request Submission & Peer Selection', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.shift.view'],
    };
    SessionService.setSession(session1);

    // Check Swap Candidates
    const candidates = shiftService.getSwapCandidates('2026-08-29');
    expect(candidates.length).toBe(1);
    expect(candidates[0].id).toBe(staff2Id);
    expect(candidates[0].name).toBe('Priya Sharma');

    // Submit Swap Request
    const swapRes = shiftService.requestShiftSwap({
      target_staff_id: staff2Id,
      shift_date: '2026-08-29',
      reason: 'Mutual agreement for weekend festival',
    });

    expect(swapRes.success).toBe(true);
    expect(swapRes.id).toBeGreaterThan(0);

    const reqs = shiftService.getShiftRequests();
    expect(reqs.some((r) => r.type === 'SWAP' && r.targetStaffName === 'Priya Sharma')).toBe(true);

    // Prevent swapping with self
    expect(() => {
      shiftService.requestShiftSwap({
        target_staff_id: staff1Id,
        shift_date: '2026-08-30',
        reason: 'Invalid self swap',
      });
    }).toThrow(/Cannot swap shifts with yourself/);
  });

  it('Test 8: Strict Session Data Isolation (Staff 1 cannot view or modify Staff 2 schedule/requests)', () => {
    // 1. Staff 1 creates request
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.shift.view'],
    });

    shiftService.requestShiftChange({
      target_date: '2026-08-25',
      requested_shift_template_id: 2,
      reason: 'Staff 1 personal reason',
    });

    // 2. Staff 2 accesses requests
    SessionService.setSession({
      userId: 2,
      staffId: staff2Id,
      username: 'priya.sharma',
      displayName: 'Priya Sharma',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.shift.view'],
    });

    const s2Requests = shiftService.getShiftRequests();
    expect(s2Requests.length).toBe(0); // Staff 2 sees 0 requests

    const s2Today = shiftService.getTodayShift();
    expect(s2Today.shiftName).toBe('Evening Shift'); // Staff 2 has Evening Shift assigned
    expect(s2Today.workLocation).toBe('Branch 02');
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffLeaveService } from '../../electron/main/services/staffLeaveService';
import { SessionService, AuthUserSession } from '../../electron/main/services/auth/sessionService';
import { PasswordService } from '../../electron/main/services/auth/passwordService';

describe('Staff Portal — Phase 6 Test Suite (Staff Leave & Permission Management)', () => {
  let db: Database.Database;
  let dbPath: string;
  let leaveService: StaffLeaveService;
  let staff1Id: number;
  let staff2Id: number;

  beforeEach(() => {
    dbPath = path.join(process.cwd(), `test_staff_phase6_${Date.now()}_${Math.random().toString(36).substring(7)}.db`);
    db = initDatabase(dbPath);
    leaveService = new StaffLeaveService(db);

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

    // Setup Leave Types: CL (12 days), SL (10 days), EL (15 days)
    db.prepare(`
      INSERT OR IGNORE INTO leave_types (id, leave_code, name, description, paid, annual_allocation, status)
      VALUES
        (1, 'CL', 'Casual Leave', 'Casual personal leave', 1, 12, 'ACTIVE'),
        (2, 'SL', 'Sick Leave', 'Medical leave', 1, 10, 'ACTIVE'),
        (3, 'EL', 'Earned Leave', 'Annual earned leave', 1, 15, 'ACTIVE');
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

  it('Test 1: Leave Balance Calculation (Allocated, Used, Pending, Available, Remaining After Pending)', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.leave.view'],
    };
    SessionService.setSession(session1);

    // Initialize balance
    leaveService.getLeaveBalances(2026);

    // 1. Record 1 approved leave (2 days used)
    db.prepare(`
      UPDATE leave_balances
      SET used_days = 2
      WHERE staff_id = ? AND leave_type_id = 1 AND year = 2026
    `).run(staff1Id);

    // 2. Insert 1 pending leave request (3 days pending)
    db.prepare(`
      INSERT INTO leave_requests (staff_id, leave_type_id, start_date, end_date, duration_days, duration_type, reason, status)
      VALUES (?, 1, '2026-09-01', '2026-09-03', 3, 'FULL_DAY', 'Family trip', 'PENDING')
    `).run(staff1Id);

    const balances = leaveService.getLeaveBalances(2026);
    const cl = balances.find((b) => b.leaveCode === 'CL');

    expect(cl).toBeDefined();
    expect(cl?.allocatedDays).toBe(12);
    expect(cl?.usedDays).toBe(2);
    expect(cl?.availableDays).toBe(10); // 12 - 2 = 10
    expect(cl?.pendingDays).toBe(3);
    expect(cl?.remainingAfterPending).toBe(7); // 10 - 3 = 7
  });

  it('Test 2: Apply Full-Day Leave with Automatic Duration Calculation', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.leave.apply'],
    };
    SessionService.setSession(session1);

    const res = leaveService.applyLeave({
      leave_type_id: 1,
      start_date: '2026-08-24',
      end_date: '2026-08-26',
      duration_type: 'FULL_DAY',
      reason: 'Personal work and family function',
    });

    expect(res.success).toBe(true);
    expect(res.id).toBeGreaterThan(0);

    const requests = leaveService.getLeaveRequests();
    expect(requests.length).toBe(1);
    expect(requests[0].durationDays).toBe(3); // 24, 25, 26 = 3 days
    expect(requests[0].durationType).toBe('FULL_DAY');
    expect(requests[0].status).toBe('PENDING');
  });

  it('Test 3: Apply Half-Day Leave (Morning Session = 0.5 Days)', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.leave.apply'],
    };
    SessionService.setSession(session1);

    const res = leaveService.applyLeave({
      leave_type_id: 2,
      start_date: '2026-08-28',
      end_date: '2026-08-28',
      duration_type: 'HALF_DAY',
      session: 'MORNING',
      reason: 'Morning dental checkup',
    });

    expect(res.success).toBe(true);
    const requests = leaveService.getLeaveRequests();
    expect(requests.length).toBe(1);
    expect(requests[0].durationDays).toBe(0.5);
    expect(requests[0].durationType).toBe('HALF_DAY');
    expect(requests[0].session).toBe('MORNING');
  });

  it('Test 4: Validation Rules (Invalid date range, Insufficient balance, Overlap rejection)', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.leave.apply'],
    };
    SessionService.setSession(session1);

    // 1. End Date < Start Date
    expect(() => {
      leaveService.applyLeave({
        leave_type_id: 1,
        start_date: '2026-08-25',
        end_date: '2026-08-20',
        reason: 'Backwards dates',
      });
    }).toThrow(/End date cannot be earlier than start date/);

    // 2. Insufficient balance (CL has 12 days, requesting 20 days)
    expect(() => {
      leaveService.applyLeave({
        leave_type_id: 1,
        start_date: '2026-09-01',
        end_date: '2026-09-20',
        reason: 'Too long leave',
      });
    }).toThrow(/You do not have enough leave balance/);

    // 3. Overlap check
    leaveService.applyLeave({
      leave_type_id: 1,
      start_date: '2026-08-10',
      end_date: '2026-08-12',
      reason: 'Valid application',
    });

    expect(() => {
      leaveService.applyLeave({
        leave_type_id: 1,
        start_date: '2026-08-11',
        end_date: '2026-08-14',
        reason: 'Overlapping application',
      });
    }).toThrow(/A leave request already exists for part of this period/);
  });

  it('Test 5: Permission Request Submission & Duration Computation', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.leave.apply'],
    };
    SessionService.setSession(session1);

    const res = leaveService.requestPermission({
      request_date: '2026-08-29',
      start_time: '15:00',
      end_time: '16:30',
      reason: 'Bank work during afternoon window',
    });

    expect(res.success).toBe(true);
    expect(res.id).toBeGreaterThan(0);

    const perms = leaveService.getPermissionRequests();
    expect(perms.length).toBe(1);
    expect(perms[0].durationMinutes).toBe(90);
    expect(perms[0].durationFormatted).toBe('1h 30m');
    expect(perms[0].status).toBe('PENDING');
  });

  it('Test 6: Cancel Pending Leave & Cancel Pending Permission', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.leave.apply'],
    };
    SessionService.setSession(session1);

    // Leave cancellation
    const leaveRes = leaveService.applyLeave({
      leave_type_id: 1,
      start_date: '2026-10-05',
      end_date: '2026-10-06',
      reason: 'Cancel test',
    });

    const cancelLeaveRes = leaveService.cancelLeave(leaveRes.id);
    expect(cancelLeaveRes.success).toBe(true);
    const updatedLeave = leaveService.getLeaveDetails(leaveRes.id);
    expect(updatedLeave.status).toBe('CANCELLED');

    // Permission cancellation
    const permRes = leaveService.requestPermission({
      request_date: '2026-10-07',
      start_time: '14:00',
      end_time: '15:00',
      reason: 'Doctor consultation',
    });

    const cancelPermRes = leaveService.cancelPermission(permRes.id);
    expect(cancelPermRes.success).toBe(true);
    const perms = leaveService.getPermissionRequests();
    expect(perms[0].status).toBe('CANCELLED');
  });

  it('Test 7: Leave Calendar Roster Generation with Status Flags (L, P, H, O, W)', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.leave.view'],
    };
    SessionService.setSession(session1);

    // 1. Approved Leave on 2026-08-10
    db.prepare(`
      INSERT INTO leave_requests (staff_id, leave_type_id, start_date, end_date, duration_days, reason, status)
      VALUES (?, 1, '2026-08-10', '2026-08-10', 1, 'Approved trip', 'APPROVED')
    `).run(staff1Id);

    // 2. Pending Leave on 2026-08-20
    db.prepare(`
      INSERT INTO leave_requests (staff_id, leave_type_id, start_date, end_date, duration_days, reason, status)
      VALUES (?, 1, '2026-08-20', '2026-08-20', 1, 'Pending trip', 'PENDING')
    `).run(staff1Id);

    // 3. Store Holiday on 2026-08-15
    db.prepare(`
      INSERT OR IGNORE INTO holidays (name, holiday_date, type)
      VALUES ('Independence Day', '2026-08-15', 'PUBLIC')
    `).run();

    const cal = leaveService.getLeaveCalendar('2026-08');
    expect(cal.totalDays).toBe(31);

    // 2026-08-10 -> Approved Leave (L)
    const day10 = cal.days.find((d) => d.date === '2026-08-10');
    expect(day10?.symbol).toBe('L');
    expect(day10?.status).toBe('APPROVED_LEAVE');

    // 2026-08-20 -> Pending Leave (P)
    const day20 = cal.days.find((d) => d.date === '2026-08-20');
    expect(day20?.symbol).toBe('P');
    expect(day20?.status).toBe('PENDING_LEAVE');

    // 2026-08-15 -> Holiday (H)
    const day15 = cal.days.find((d) => d.date === '2026-08-15');
    expect(day15?.symbol).toBe('H');
    expect(day15?.status).toBe('HOLIDAY');

    // 2026-08-23 (Sunday) -> Week Off (O)
    const day23 = cal.days.find((d) => d.date === '2026-08-23');
    expect(day23?.symbol).toBe('O');
    expect(day23?.status).toBe('WEEK_OFF');

    // 2026-08-04 (Tuesday) -> Working Day (W)
    const day04 = cal.days.find((d) => d.date === '2026-08-04');
    expect(day04?.symbol).toBe('W');
    expect(day04?.status).toBe('WORKING');
  });

  it('Test 8: Strict Session Data Isolation (Staff 1 cannot view or modify Staff 2 records)', () => {
    // 1. Staff 1 submits leave & permission
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.leave.apply'],
    });

    const leave1 = leaveService.applyLeave({
      leave_type_id: 1,
      start_date: '2026-11-10',
      end_date: '2026-11-11',
      reason: 'Staff 1 confidential leave',
    });

    leaveService.requestPermission({
      request_date: '2026-11-12',
      start_time: '10:00',
      end_time: '11:00',
      reason: 'Staff 1 permission',
    });

    // 2. Staff 2 accesses requests
    SessionService.setSession({
      userId: 2,
      staffId: staff2Id,
      username: 'priya.sharma',
      displayName: 'Priya Sharma',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.leave.apply'],
    });

    const s2Requests = leaveService.getLeaveRequests();
    expect(s2Requests.length).toBe(0); // Staff 2 sees 0 requests

    const s2Perms = leaveService.getPermissionRequests();
    expect(s2Perms.length).toBe(0); // Staff 2 sees 0 permissions

    // Staff 2 cannot inspect or cancel Staff 1's leave
    expect(() => {
      leaveService.getLeaveDetails(leave1.id);
    }).toThrow(/Leave request not found or unauthorized/);

    expect(() => {
      leaveService.cancelLeave(leave1.id);
    }).toThrow(/Leave request not found or unauthorized/);
  });
});

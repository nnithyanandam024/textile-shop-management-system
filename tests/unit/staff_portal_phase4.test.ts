import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffAttendanceService } from '../../electron/main/services/staffAttendanceService';
import { SessionService, AuthUserSession } from '../../electron/main/services/auth/sessionService';
import { PasswordService } from '../../electron/main/services/auth/passwordService';
import { getTodayDateStr } from '../../electron/main/services/attendanceService';

describe('Staff Portal — Phase 4 Test Suite (Staff Attendance Management System)', () => {
  let db: Database.Database;
  let dbPath: string;
  let attendanceService: StaffAttendanceService;
  let staff1Id: number;
  let staff2Id: number;

  beforeEach(() => {
    dbPath = path.join(__dirname, `../.test_db/test_staff_phase4_${Date.now()}_${Math.random().toString(36).substring(7)}.db`);
    db = initDatabase(dbPath);
    attendanceService = new StaffAttendanceService(db);

    // Setup Roles
    db.prepare(`
      INSERT OR IGNORE INTO roles (id, name, description) VALUES (3, 'STAFF', 'Floor Staff & Cashier');
    `).run();

    // Get or create Department & Designation
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

    // Setup Shift Template (09:00 to 18:00, 15m grace)
    db.prepare(`
      INSERT OR IGNORE INTO shift_templates (
        id, shift_code, name, start_time, end_time, grace_minutes, break_minutes, minimum_work_minutes, is_overnight, status
      ) VALUES (
        1, 'MS-01', 'Morning Shift', '09:00', '18:00', 15, 60, 480, 0, 'ACTIVE'
      )
    `).run();

    // Setup User 1 & Staff 1 (Arun Kumar)
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

    // Setup User 2 & Staff 2 (Priya Sharma)
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
        ?, ?, 'Main Store', '2026-02-01', 'FULL_TIME', 'ACTIVE', ?
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

  it('Test 1: Check-In Flow (On-Time vs Late Arrival Detection)', () => {
    // 1. Staff 1 On-Time Check-In (08:58)
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.attendance.view'],
    };
    SessionService.setSession(session1);

    const res1 = attendanceService.checkIn('08:58');
    expect(res1.success).toBe(true);
    expect(res1.data.status).toBe('WORKING');
    expect(res1.data.checkIn).toBe('08:58');
    expect(res1.data.lateMinutes).toBe(0);
    expect(res1.data.isLate).toBe(false);

    // 2. Staff 2 Late Arrival Check-In (09:27, 27 mins late on 09:00 shift with 15m grace)
    const session2: AuthUserSession = {
      userId: 2,
      staffId: staff2Id,
      username: 'priya.sharma',
      displayName: 'Priya Sharma',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.attendance.view'],
    };
    SessionService.setSession(session2);

    const res2 = attendanceService.checkIn('09:27');
    expect(res2.success).toBe(true);
    expect(res2.data.checkIn).toBe('09:27');
    expect(res2.data.lateMinutes).toBe(27);
    expect(res2.data.isLate).toBe(true);
  });

  it('Test 2: Prevent Duplicate Check-In', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.attendance.view'],
    };
    SessionService.setSession(session1);

    attendanceService.checkIn('09:02');

    expect(() => {
      attendanceService.checkIn('09:05');
    }).toThrow(/Already checked in today/);
  });

  it('Test 3: Break Management (Start Break, End Break, Pause Working Timer)', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.attendance.view'],
    };
    SessionService.setSession(session1);

    attendanceService.checkIn('09:00');

    // 1. Start Break at 13:00
    const breakStartRes = attendanceService.startBreak('13:00');
    expect(breakStartRes.success).toBe(true);
    expect(breakStartRes.data.status).toBe('ON_BREAK');
    expect(breakStartRes.data.isOnBreak).toBe(true);
    expect(breakStartRes.data.breakStart).toBe('13:00');

    // Cannot start break again while on break
    expect(() => {
      attendanceService.startBreak('13:15');
    }).toThrow(/Already on break/);

    // 2. End Break at 14:00 (1 hour = 60 mins break)
    const breakEndRes = attendanceService.endBreak('14:00');
    expect(breakEndRes.success).toBe(true);
    expect(breakEndRes.data.status).toBe('WORKING');
    expect(breakEndRes.data.isOnBreak).toBe(false);
    expect(breakEndRes.data.totalBreakMinutes).toBe(60);
  });

  it('Test 4: Check-Out Flow & Total Working Hours (Excluding Break)', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.attendance.view'],
    };
    SessionService.setSession(session1);

    // Check in at 09:00
    attendanceService.checkIn('09:00');

    // Break 13:00 to 14:00 (60 mins)
    attendanceService.startBreak('13:00');
    attendanceService.endBreak('14:00');

    // Check out at 18:00 (Total elapsed 9 hours = 540 mins - 60 mins break = 480 mins = 8h 0m)
    const outRes = attendanceService.checkOut('18:00');
    expect(outRes.success).toBe(true);
    expect(outRes.data.status).toBe('COMPLETED');
    expect(outRes.data.checkOut).toBe('18:00');
    expect(outRes.data.workedMinutes).toBe(480);
    expect(outRes.data.canCheckIn).toBe(false);
    expect(outRes.data.canCheckOut).toBe(false);
  });

  it('Test 5: Prevent Duplicate Check-Out & Invalid Sequence', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.attendance.view'],
    };
    SessionService.setSession(session1);

    // Cannot check out without checking in
    expect(() => {
      attendanceService.checkOut('18:00');
    }).toThrow(/Cannot check out without checking in first/);

    // Cannot start break without checking in
    expect(() => {
      attendanceService.startBreak('13:00');
    }).toThrow(/Cannot start break before checking in/);

    attendanceService.checkIn('09:00');
    attendanceService.checkOut('18:00');

    // Cannot check out twice
    expect(() => {
      attendanceService.checkOut('18:05');
    }).toThrow(/Already checked out today/);
  });

  it('Test 6: Monthly Attendance Summary & Attendance Rate Calculation', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.attendance.view'],
    };
    SessionService.setSession(session1);

    // Seed historical days for August 2026
    const daysData = [
      { date: '2026-08-01', status: 'PRESENT', worked: 480, late: 0 },
      { date: '2026-08-02', status: 'WEEK_OFF', worked: 0, late: 0 },
      { date: '2026-08-03', status: 'PRESENT', worked: 480, late: 0 },
      { date: '2026-08-04', status: 'LATE', worked: 460, late: 20 },
      { date: '2026-08-05', status: 'LEAVE', worked: 0, late: 0 },
      { date: '2026-08-06', status: 'ABSENT', worked: 0, late: 0 },
    ];

    for (const d of daysData) {
      db.prepare(`
        INSERT INTO attendance (staff_id, attendance_date, status, worked_minutes, late_minutes)
        VALUES (?, ?, ?, ?, ?)
      `).run(staff1Id, d.date, d.status, d.worked, d.late);
    }

    const summary = attendanceService.getMonthlySummary('2026-08');

    expect(summary.monthStr).toBe('2026-08');
    expect(summary.presentCount).toBe(3); // 2 PRESENT + 1 LATE
    expect(summary.lateCount).toBe(1);
    expect(summary.absentCount).toBe(1);
    expect(summary.leaveCount).toBe(1);
    expect(summary.weekOffCount).toBe(1);
    expect(summary.totalWorkedMinutes).toBe(480 + 480 + 460); // 1420 mins
    expect(summary.totalHoursFormatted).toBe('23h 40m');
    expect(summary.attendanceRate).toBeGreaterThan(0);
  });

  it('Test 7: Attendance Correction Request Submission & Audit Trail', () => {
    const session1: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.attendance.view'],
    };
    SessionService.setSession(session1);

    const reqRes = attendanceService.requestCorrection({
      date: '2026-08-18',
      requestedCheckIn: '09:00',
      requestedCheckOut: '18:05',
      reason: 'Forgot to clock out after closing counter',
    });

    expect(reqRes.success).toBe(true);
    expect(reqRes.id).toBeGreaterThan(0);

    const requests = attendanceService.getCorrectionRequests();
    expect(requests.length).toBe(1);
    expect(requests[0].date).toBe('2026-08-18');
    expect(requests[0].requestedCheckIn).toBe('09:00');
    expect(requests[0].requestedCheckOut).toBe('18:05');
    expect(requests[0].status).toBe('PENDING');
    expect(requests[0].reason).toContain('Forgot to clock out');
  });

  it('Test 8: Strict Session Data Isolation (Staff 1 cannot view or modify Staff 2 attendance)', () => {
    // 1. Session as Staff 1
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.attendance.view'],
    });

    attendanceService.checkIn('09:02');
    const s1Today = attendanceService.getTodayAttendance();
    expect(s1Today.staffId).toBe(staff1Id);
    expect(s1Today.status).toBe('WORKING');

    // 2. Session as Staff 2
    SessionService.setSession({
      userId: 2,
      staffId: staff2Id,
      username: 'priya.sharma',
      displayName: 'Priya Sharma',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.attendance.view'],
    });

    const s2Today = attendanceService.getTodayAttendance();
    expect(s2Today.staffId).toBe(staff2Id);
    expect(s2Today.status).toBe('NOT_CHECKED_IN');
    expect(s2Today.canCheckIn).toBe(true);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffDashboardService } from '../../electron/main/services/staffDashboardService';
import { StaffRepository } from '../../electron/main/repositories/staffRepository';
import { SessionService, AuthUserSession } from '../../electron/main/services/auth/sessionService';

describe('Staff Portal — Phase 2 Test Suite (Staff Dashboard Today View & Personal Summary)', () => {
  let db: Database.Database;
  let dbPath: string;
  let dashboardService: StaffDashboardService;
  let staffRepo: StaffRepository;
  let staff1Id: number;
  let staff2Id: number;

  beforeEach(async () => {
    closeDatabase();
    SessionService.clearSession();
    dbPath = path.join(__dirname, `../../test_staff_portal_p2_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    dashboardService = new StaffDashboardService(db);
    staffRepo = new StaffRepository(db);

    // 1. Create Staff 1 (Arun Kumar)
    staff1Id = staffRepo.create({
      first_name: 'Arun',
      last_name: 'Kumar',
      phone: '9876543210',
      joining_date: '2026-01-15',
      department_id: 1,
      designation_id: 1,
      work_location: 'Main Textile Shop',
      employment_type: 'FULL_TIME',
    });

    // 2. Create Staff 2 (Bala Raman)
    staff2Id = staffRepo.create({
      first_name: 'Bala',
      last_name: 'Raman',
      phone: '9876543211',
      joining_date: '2026-02-01',
      department_id: 1,
      designation_id: 1,
      work_location: 'Branch 2',
      employment_type: 'FULL_TIME',
    });

    // Seed Shift Template & Assignment for Staff 1
    const shiftRes = db.prepare(`
      INSERT INTO shift_templates (shift_code, name, start_time, end_time, break_minutes, minimum_work_minutes)
      VALUES ('MS-01', 'Morning Shift', '09:00', '18:00', 60, 480)
    `).run();
    const shiftTemplateId = Number(shiftRes.lastInsertRowid);

    db.prepare(`
      INSERT INTO staff_shift_assignments (staff_id, shift_template_id, effective_from, effective_to)
      VALUES (?, ?, '2026-01-01', '2026-12-31')
    `).run(staff1Id, shiftTemplateId);

    // Seed Leave Types & Balances for Staff 1
    let clRow = db.prepare(`SELECT id FROM leave_types WHERE leave_code = 'CL'`).get() as any;
    let clId = clRow?.id;
    if (!clId) {
      const clRes = db.prepare(`
        INSERT INTO leave_types (leave_code, name, annual_allocation, paid)
        VALUES ('CL', 'Casual Leave', 6, 1)
      `).run();
      clId = Number(clRes.lastInsertRowid);
    }

    db.prepare(`
      INSERT INTO leave_balances (staff_id, leave_type_id, year, allocated_days, used_days)
      VALUES (?, ?, 2026, 6, 2)
    `).run(staff1Id, clId);

    // Seed Verified Documents for Staff 1
    let catRow = db.prepare(`SELECT id FROM document_categories LIMIT 1`).get() as any;
    let catId = catRow?.id;
    if (!catId) {
      const catRes = db.prepare(`
        INSERT INTO document_categories (code, name) VALUES ('ID_PROOF', 'ID Proof')
      `).run();
      catId = Number(catRes.lastInsertRowid);
    }

    db.prepare(`
      INSERT INTO staff_documents (staff_id, category_id, document_type, file_name, file_path, file_size, mime_type, verification_status, expiry_date)
      VALUES (?, ?, 'GOVT_ID', 'aadhar.pdf', '/docs/aadhar.pdf', 1024, 'application/pdf', 'Verified', '2028-12-31')
    `).run(staff1Id, catId);
  });

  afterEach(() => {
    closeDatabase();
    SessionService.clearSession();
    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {
        // ignore lock
      }
    }
  });

  it('Test 1: Dashboard Summary Compilation with Staff Profile & Metrics', () => {
    const session: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.profile.view'],
    };
    SessionService.setSession(session);

    const summary = dashboardService.getDashboardSummary();
    expect(summary).toBeDefined();
    expect(summary.staff.fullName).toBe('Arun Kumar');
    expect(summary.staff.workLocation).toBe('Main Textile Shop');
    expect(summary.todayShift.hasShift).toBe(true);
    expect(summary.todayShift.name).toBe('Morning Shift');
    expect(summary.leaveBalances.length).toBeGreaterThan(0);
    expect(summary.documents.totalRequired).toBe(5);
    expect(summary.upcomingShifts.length).toBe(4);
  });

  it('Test 2: Attendance Status Resolution (NOT_CHECKED_IN, PRESENT, COMPLETED)', () => {
    const session: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.profile.view'],
    };
    SessionService.setSession(session);

    const todayStr = new Date().toISOString().slice(0, 10);

    // Initial state: Not Checked In
    const summary1 = dashboardService.getDashboardSummary();
    expect(summary1.attendance.status).toBe('NOT_CHECKED_IN');

    // Checked In state: Present
    db.prepare(`
      INSERT INTO attendance (staff_id, attendance_date, check_in, status, worked_minutes)
      VALUES (?, ?, '09:02', 'PRESENT', 120)
    `).run(staff1Id, todayStr);

    const summary2 = dashboardService.getDashboardSummary();
    expect(summary2.attendance.status).toBe('PRESENT');
    expect(summary2.attendance.checkIn).toBe('09:02');

    // Checked Out state: Completed
    db.prepare(`
      UPDATE attendance SET check_out = '18:04', worked_minutes = 482 WHERE staff_id = ? AND attendance_date = ?
    `).run(staff1Id, todayStr);

    const summary3 = dashboardService.getDashboardSummary();
    expect(summary3.attendance.status).toBe('COMPLETED');
    expect(summary3.attendance.checkOut).toBe('18:04');
    expect(summary3.attendance.workedFormatted).toBe('8h 02m');
  });

  it('Test 3: Shift Assignment & Break Timing Resolution', () => {
    const session: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.profile.view'],
    };
    SessionService.setSession(session);

    const summary = dashboardService.getDashboardSummary();
    expect(summary.todayShift.name).toBe('Morning Shift');
    expect(summary.todayShift.breakTime).toBe('01:00 PM – 02:00 PM');
    expect(summary.todayShift.location).toBe('Main Textile Shop');
  });

  it('Test 4: Leave Balances and Remaining Capacity Calculation', () => {
    const session: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.profile.view'],
    };
    SessionService.setSession(session);

    const summary = dashboardService.getDashboardSummary();
    const cl = summary.leaveBalances.find((b) => b.code === 'CL');
    expect(cl).toBeDefined();
    expect(cl?.allocated).toBe(6);
    expect(cl?.used).toBe(2);
    expect(cl?.available).toBe(4);
    expect(cl?.percentage).toBe(67);
  });

  it('Test 5: Document Compliance & Expiring Alert Detection', () => {
    const session: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.profile.view'],
    };
    SessionService.setSession(session);

    // Add a document expiring in 7 days
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 7);
    const expDateStr = expDate.toISOString().slice(0, 10);

    const cat = db.prepare(`SELECT id FROM document_categories LIMIT 1`).get() as any;
    db.prepare(`
      INSERT INTO staff_documents (staff_id, category_id, document_type, file_name, file_path, file_size, mime_type, verification_status, expiry_date)
      VALUES (?, ?, 'CERTIFICATE', 'Safety Certificate.pdf', '/docs/cert.pdf', 1024, 'application/pdf', 'Verified', ?)
    `).run(staff1Id, cat?.id || 1, expDateStr);

    const summary = dashboardService.getDashboardSummary();
    expect(summary.documents.verifiedCount).toBe(2);
    expect(summary.documents.expiringAlert).toBeDefined();
    expect(summary.documents.expiringAlert?.documentName).toBe('Safety Certificate');
    expect(summary.documents.expiringAlert?.daysRemaining).toBe(7);
  });

  it('Test 6: Upcoming Shifts Chronology', () => {
    const session: AuthUserSession = {
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.profile.view'],
    };
    SessionService.setSession(session);

    const summary = dashboardService.getDashboardSummary();
    expect(summary.upcomingShifts.length).toBe(4);
    expect(summary.upcomingShifts[0].dayLabel).toBe('TODAY');
    expect(summary.upcomingShifts[1].dayLabel).toBe('TOMORROW');
  });

  it('Test 7: Strict Session Data Isolation (Staff 1 cannot view Staff 2 data)', () => {
    // Session set to Staff 1
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.profile.view'],
    });
    const summaryStaff1 = dashboardService.getDashboardSummary();
    expect(summaryStaff1.staff.id).toBe(staff1Id);
    expect(summaryStaff1.staff.fullName).toBe('Arun Kumar');

    // Session set to Staff 2
    SessionService.setSession({
      userId: 2,
      staffId: staff2Id,
      username: 'bala.raman',
      displayName: 'Bala Raman',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.profile.view'],
    });
    const summaryStaff2 = dashboardService.getDashboardSummary();
    expect(summaryStaff2.staff.id).toBe(staff2Id);
    expect(summaryStaff2.staff.fullName).toBe('Bala Raman');
    expect(summaryStaff2.staff.workLocation).toBe('Branch 2');
  });
});

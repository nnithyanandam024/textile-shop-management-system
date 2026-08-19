import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { SelfServiceService } from '../../electron/main/services/selfServiceService';
import { StaffRepository } from '../../electron/main/repositories/staffRepository';

describe('Staff Management System — Phase 11 Test Suite (Staff Self-Service Portal)', () => {
  let db: Database.Database;
  let dbPath: string;
  let selfService: SelfServiceService;
  let staffRepo: StaffRepository;
  let user1Id: number;
  let user2Id: number;
  let staff1Id: number;
  let staff2Id: number;

  beforeEach(() => {
    closeDatabase();
    dbPath = path.join(__dirname, `../../test_staff_phase11_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    selfService = new SelfServiceService(db);
    staffRepo = new StaffRepository(db);

    // Create 2 Users
    const u1 = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('arun', 'hash', 'Arun Kumar', 3)
    `).run();
    user1Id = Number(u1.lastInsertRowid);

    const u2 = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('priya', 'hash', 'Priya Dharshini', 3)
    `).run();
    user2Id = Number(u2.lastInsertRowid);

    // Create 2 Staff profiles bound to users
    staff1Id = staffRepo.create({
      first_name: 'Arun',
      last_name: 'Kumar',
      phone: '9876543210',
      joining_date: '2026-01-15',
      department_id: 1,
      designation_id: 1,
      work_location: 'Main Store',
      employment_type: 'FULL_TIME',
      user_id: user1Id,
    });

    staff2Id = staffRepo.create({
      first_name: 'Priya',
      last_name: 'Dharshini',
      phone: '9876543211',
      joining_date: '2026-02-01',
      department_id: 1,
      designation_id: 1,
      work_location: 'Main Store',
      employment_type: 'FULL_TIME',
      user_id: user2Id,
    });
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

  it('1. should verify Migration v13 database schema and seeded self-service permissions', () => {
    const perms = db.prepare("SELECT * FROM permissions WHERE module = 'SelfService'").all();
    expect(perms.length).toBeGreaterThanOrEqual(17);

    const cashierPerms = db.prepare(`
      SELECT p.code FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = 3 AND p.module = 'SelfService'
    `).all();
    expect(cashierPerms.length).toBeGreaterThanOrEqual(17);
  });

  it('2. should enforce strict self-service data isolation between staff members', () => {
    const arunProfile = selfService.getMyProfile(user1Id);
    expect(arunProfile.id).toBe(staff1Id);
    expect(arunProfile.first_name).toBe('Arun');

    const priyaProfile = selfService.getMyProfile(user2Id);
    expect(priyaProfile.id).toBe(staff2Id);
    expect(priyaProfile.first_name).toBe('Priya');
  });

  it('3. should process profile change request submission and store in pending state', () => {
    const res = selfService.requestProfileChange(user1Id, {
      field_name: 'phone',
      old_value: '9876543210',
      new_value: '9999988888',
      reason: 'Mobile number updated',
    });

    expect(res.success).toBe(true);
    expect(res.id).toBeDefined();

    const reqs = selfService.getProfileChangeRequests(user1Id);
    expect(reqs.length).toBe(1);
    expect(reqs[0].new_value).toBe('9999988888');
    expect(reqs[0].status).toBe('PENDING');

    // Priya should have 0 requests
    const priyaReqs = selfService.getProfileChangeRequests(user2Id);
    expect(priyaReqs.length).toBe(0);
  });

  it('4. should submit attendance correction request with justification reason', () => {
    const res = selfService.requestAttendanceCorrection(user1Id, {
      date: '2026-08-19',
      requested_check_in: '09:02',
      requested_check_out: '18:05',
      reason: 'Scanner failure during evening checkout',
    });

    expect(res.success).toBe(true);
    expect(res.id).toBeDefined();
  });

  it('5. should process leave application and allow cancelling pending request', () => {
    const appRes = selfService.applyLeave(user1Id, {
      leave_type_id: 1,
      start_date: '2026-08-25',
      end_date: '2026-08-26',
      reason: 'Personal errands',
    });

    expect(appRes.success).toBe(true);

    const leaveInfo = selfService.getMyLeave(user1Id);
    expect(leaveInfo.requests.length).toBe(1);
    expect(leaveInfo.requests[0].status).toBe('PENDING');

    const cancelRes = selfService.cancelLeave(user1Id, leaveInfo.requests[0].id);
    expect(cancelRes.success).toBe(true);

    const updatedLeave = selfService.getMyLeave(user1Id);
    expect(updatedLeave.requests[0].status).toBe('CANCELLED');
  });

  it('6. should compile self-service dashboard summary for logged-in employee', () => {
    const dashboard = selfService.getDashboard(user1Id);
    expect(dashboard.profile.first_name).toBe('Arun');
    expect(dashboard.leaveBalance.total).toBe(18);
    expect(dashboard.documentCompletion.complianceScore).toBeDefined();
  });
});

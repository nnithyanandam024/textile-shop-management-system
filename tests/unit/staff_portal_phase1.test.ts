import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffAuthService } from '../../electron/main/services/auth/staffAuthService';
import { StaffRepository } from '../../electron/main/repositories/staffRepository';
import { PasswordService } from '../../electron/main/services/auth/passwordService';
import { SessionService } from '../../electron/main/services/auth/sessionService';

describe('Staff Portal — Phase 1 Test Suite (Staff Login & Authentication Foundation)', () => {
  let db: Database.Database;
  let dbPath: string;
  let staffAuthService: StaffAuthService;
  let staffRepo: StaffRepository;
  let user1Id: number;
  let userInactiveId: number;
  let userNonStaffId: number;
  let staff1Id: number;
  let staffInactiveId: number;

  beforeEach(async () => {
    closeDatabase();
    SessionService.clearSession();
    dbPath = path.join(__dirname, `../../test_staff_portal_p1_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    staffAuthService = new StaffAuthService(db);
    staffRepo = new StaffRepository(db);

    const pwHash = await PasswordService.hashPassword('MyPassword123');

    // 1. Active Staff User
    const u1 = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id, is_active)
      VALUES ('arun.cashier', ?, 'Arun Kumar', 3, 1)
    `).run(pwHash);
    user1Id = Number(u1.lastInsertRowid);

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

    // 2. Inactive Staff User
    const uInactive = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id, is_active)
      VALUES ('inactive.staff', ?, 'Inactive Staff', 3, 0)
    `).run(pwHash);
    userInactiveId = Number(uInactive.lastInsertRowid);

    staffInactiveId = staffRepo.create({
      first_name: 'Inactive',
      last_name: 'User',
      phone: '9876543299',
      joining_date: '2026-01-15',
      department_id: 1,
      designation_id: 1,
      work_location: 'Main Store',
      employment_type: 'FULL_TIME',
      user_id: userInactiveId,
    });
    // Set staff status to INACTIVE
    db.prepare("UPDATE staff SET status = 'INACTIVE' WHERE id = ?").run(staffInactiveId);

    // 3. Standalone Non-Staff Admin User (e.g. Owner with no staff record)
    const uNonStaff = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id, is_active)
      VALUES ('store.owner', ?, 'Owner Boss', 1, 1)
    `).run(pwHash);
    userNonStaffId = Number(uNonStaff.lastInsertRowid);
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

  it('Test 1: Correct Login with Employee ID and Password', async () => {
    // Authenticate using formatted staff code (e.g. STF-0001)
    const res1 = await staffAuthService.login('STF-0001', 'MyPassword123');
    expect(res1.success).toBe(true);
    expect(res1.user).toBeDefined();
    expect(res1.user?.employeeCode).toBe('STF-0001');
    expect(res1.user?.displayName).toBe('Arun Kumar');
    expect(res1.user?.staffId).toBe(staff1Id);

    // Also support STF001 without hyphen
    const res2 = await staffAuthService.login('STF0001', 'MyPassword123');
    expect(res2.success).toBe(true);
    expect(res2.user?.staffId).toBe(staff1Id);

    // Also support username
    const res3 = await staffAuthService.login('arun.cashier', 'MyPassword123');
    expect(res3.success).toBe(true);
    expect(res3.user?.staffId).toBe(staff1Id);
  });

  it('Test 2: Wrong Password Rejection', async () => {
    const res = await staffAuthService.login('STF-0001', 'WrongPassword456');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Invalid Employee ID or Password.');
  });

  it('Test 3: Empty Employee ID Validation', async () => {
    const res = await staffAuthService.login('', 'MyPassword123');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Employee ID is required.');
  });

  it('Test 4: Empty Password Validation', async () => {
    const res = await staffAuthService.login('STF-0001', '');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Password is required.');
  });

  it('Test 5: Both Empty Fields Validation', async () => {
    const res = await staffAuthService.login('', '');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Please enter your Employee ID and Password.');
  });

  it('Test 6: Inactive / Suspended Staff Account Checks', async () => {
    // Inactive staff
    const res = await staffAuthService.login('inactive.staff', 'MyPassword123');
    expect(res.success).toBe(false);
    expect(res.error).toContain('inactive');

    // Suspended staff
    db.prepare("UPDATE staff SET status = 'SUSPENDED' WHERE id = ?").run(staff1Id);
    const resSuspended = await staffAuthService.login('STF-0001', 'MyPassword123');
    expect(resSuspended.success).toBe(false);
    expect(resSuspended.error).toContain('suspended');
  });

  it('Test 7: Non-Staff Account Login Attempt on Staff Portal', async () => {
    const res = await staffAuthService.login('store.owner', 'MyPassword123');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Staff access denied.');
  });

  it('Test 8: Session Retrieval and Logout', async () => {
    await staffAuthService.login('STF-0001', 'MyPassword123');
    const currentStaff = staffAuthService.getCurrentStaff();
    expect(currentStaff).toBeDefined();
    expect(currentStaff?.displayName).toBe('Arun Kumar');

    staffAuthService.logout();
    const afterLogout = staffAuthService.getCurrentStaff();
    expect(afterLogout).toBeNull();
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffProfileService } from '../../electron/main/services/staffProfileService';
import { SessionService, AuthUserSession } from '../../electron/main/services/auth/sessionService';
import { PasswordService } from '../../electron/main/services/auth/passwordService';

describe('Staff Portal — Phase 3 Test Suite (My Profile & Personal Information)', () => {
  let db: Database.Database;
  let dbPath: string;
  let profileService: StaffProfileService;
  let staff1Id: number;
  let staff2Id: number;

  beforeEach(() => {
    dbPath = path.join(__dirname, `../.test_db/test_staff_phase3_${Date.now()}_${Math.random().toString(36).substring(7)}.db`);
    db = initDatabase(dbPath);
    profileService = new StaffProfileService(db);

    // Setup Roles
    db.prepare(`
      INSERT OR IGNORE INTO roles (id, name, description) VALUES (3, 'STAFF', 'Floor Staff & Cashier');
    `).run();

    // Setup Departments & Designations
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

    // Setup User 1 & Staff 1 (Arun Kumar)
    const pwHash = PasswordService.hashPasswordSync('password123');
    const u1Res = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('arun.kumar', ?, 'Arun Kumar', 3)
    `).run(pwHash);
    const u1Id = Number(u1Res.lastInsertRowid);

    const s1Res = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email, date_of_birth, gender,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id,
        address_line_1, city, state, pincode
      ) VALUES (
        'STF-0001', 'Arun', 'Kumar', '9876543210', 'arun@texora.shop', '1998-05-15', 'Male',
        ?, ?, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?,
        '123 Gandhi Road', 'Coimbatore', 'Tamil Nadu', '641001'
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
        staff_code, first_name, last_name, phone, email, date_of_birth, gender,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id,
        address_line_1, city, state, pincode
      ) VALUES (
        'STF-0002', 'Priya', 'Sharma', '9876500002', 'priya@texora.shop', '2000-08-20', 'Female',
        ?, ?, 'Main Store', '2026-02-01', 'FULL_TIME', 'ACTIVE', ?,
        '456 Crosscut Road', 'Coimbatore', 'Tamil Nadu', '641012'
      )
    `).run(depId, desId, u2Id);
    staff2Id = Number(s2Res.lastInsertRowid);

    // Primary Emergency Contact for Staff 1
    db.prepare(`
      INSERT INTO staff_emergency_contacts (staff_id, name, relationship, phone, is_primary)
      VALUES (?, 'Ramesh Kumar', 'Father', '9876500111', 1)
    `).run(staff1Id);
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

  it('Test 1: Full Profile Retrieval with Identity & Emergency Details', () => {
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

    const profile = profileService.getMyProfile();

    expect(profile.id).toBe(staff1Id);
    expect(profile.staffCode).toBe('STF-0001');
    expect(profile.fullName).toBe('Arun Kumar');
    expect(profile.departmentName).toBeDefined();
    expect(profile.designationName).toBeDefined();
    expect(profile.phone).toBe('9876543210');
    expect(profile.email).toBe('arun@texora.shop');
    expect(profile.dateOfBirth).toBe('1998-05-15');
    expect(profile.gender).toBe('Male');
    expect(profile.emergencyContact).toBeDefined();
    expect(profile.emergencyContact?.name).toBe('Ramesh Kumar');
    expect(profile.emergencyContact?.relationship).toBe('Father');
  });

  it('Test 2: Authorized Profile Update (Phone, Email, Address, DOB, Gender)', () => {
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

    const res = profileService.updateMyProfile({
      phone: '+91 91234 56789',
      email: 'arun.updated@texora.shop',
      addressLine1: '789 New Housing Unit',
      city: 'Tiruppur',
      pincode: '641601',
      dateOfBirth: '1998-05-20',
      gender: 'Male',
    });

    expect(res.success).toBe(true);

    const updated = profileService.getMyProfile();
    expect(updated.phone).toBe('+91 91234 56789');
    expect(updated.email).toBe('arun.updated@texora.shop');
    expect(updated.addressLine1).toBe('789 New Housing Unit');
    expect(updated.city).toBe('Tiruppur');
    expect(updated.pincode).toBe('641601');
    expect(updated.dateOfBirth).toBe('1998-05-20');

    // Verify audit log recorded
    const auditLogs = profileService.getProfileActivity();
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    expect(auditLogs[0].action).toBe('SELF_PROFILE_UPDATED');
  });

  it('Test 3: Validation & Protection of Read-Only Fields', () => {
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

    // Invalid phone
    expect(() => {
      profileService.updateMyProfile({ phone: '123' });
    }).toThrow(/valid phone number/);

    // Invalid email
    expect(() => {
      profileService.updateMyProfile({ email: 'not-valid-email' });
    }).toThrow(/valid email/);

    // Empty address
    expect(() => {
      profileService.updateMyProfile({ addressLine1: '' });
    }).toThrow(/Address cannot be empty/);
  });

  it('Test 4: Emergency Contacts Management (Add, Edit, Delete)', () => {
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

    // 1. Add secondary contact
    const addRes = profileService.saveEmergencyContact({
      name: 'Priya Kumar',
      relationship: 'Sister',
      phone: '9876543299',
      isPrimary: false,
    });
    expect(addRes.success).toBe(true);

    const contacts = profileService.getEmergencyContacts();
    expect(contacts.length).toBe(2);

    // 2. Edit contact
    const editRes = profileService.saveEmergencyContact({
      id: addRes.id,
      name: 'Priya Ramesh',
      relationship: 'Sister',
      phone: '9876543299',
    });
    expect(editRes.success).toBe(true);

    // 3. Delete contact
    const delRes = profileService.deleteEmergencyContact(addRes.id);
    expect(delRes.success).toBe(true);

    const remaining = profileService.getEmergencyContacts();
    expect(remaining.length).toBe(1);
    expect(remaining[0].name).toBe('Ramesh Kumar');
  });

  it('Test 5: Password Change Validation & Secure Hashing', async () => {
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

    // Wrong current password
    await expect(
      profileService.changePassword('wrongpass', 'newSecret123')
    ).rejects.toThrow(/Current password does not match/);

    // New password same as current
    await expect(
      profileService.changePassword('password123', 'password123')
    ).rejects.toThrow(/different from current password/);

    // Short password (< 6 chars)
    await expect(
      profileService.changePassword('password123', '123')
    ).rejects.toThrow(/at least 6 characters/);

    // Valid change
    const res = await profileService.changePassword('password123', 'newStrongPassword456');
    expect(res.success).toBe(true);

    // Verify user can authenticate with new password
    const userRow = db.prepare('SELECT password_hash FROM users WHERE id = 1').get() as any;
    const isNewValid = await PasswordService.verifyPassword('newStrongPassword456', userRow.password_hash);
    expect(isNewValid).toBe(true);
  });

  it('Test 6: Profile Photo Upload and Removal with Audit Trail', () => {
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

    const photoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    // Upload
    const uploadRes = profileService.uploadProfilePhoto(photoData);
    expect(uploadRes.success).toBe(true);

    let profile = profileService.getMyProfile();
    expect(profile.photoPath).toBe(photoData);

    // Remove
    const removeRes = profileService.removeProfilePhoto();
    expect(removeRes.success).toBe(true);

    profile = profileService.getMyProfile();
    expect(profile.photoPath).toBeNull();
  });

  it('Test 7: Strict Session Data Isolation (Staff 1 cannot view or modify Staff 2)', () => {
    // 1. Session as Staff 1
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.profile.view'],
    });

    const p1 = profileService.getMyProfile();
    expect(p1.id).toBe(staff1Id);
    expect(p1.fullName).toBe('Arun Kumar');

    // 2. Session as Staff 2
    SessionService.setSession({
      userId: 2,
      staffId: staff2Id,
      username: 'priya.sharma',
      displayName: 'Priya Sharma',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.profile.view'],
    });

    const p2 = profileService.getMyProfile();
    expect(p2.id).toBe(staff2Id);
    expect(p2.fullName).toBe('Priya Sharma');

    // Staff 2 updates phone
    profileService.updateMyProfile({ phone: '9999988888' });

    // Verify Staff 2 changed, Staff 1 untouched
    const p2Updated = profileService.getMyProfile();
    expect(p2Updated.phone).toBe('9999988888');

    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.profile.view'],
    });

    const p1Check = profileService.getMyProfile();
    expect(p1Check.phone).toBe('9876543210');
  });
});

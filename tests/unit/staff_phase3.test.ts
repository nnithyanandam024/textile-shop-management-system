import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffService } from '../../electron/main/services/staffService';
import { DepartmentRepository } from '../../electron/main/repositories/departmentRepository';
import { DesignationRepository } from '../../electron/main/repositories/designationRepository';
import { RoleService } from '../../electron/main/services/auth/roleService';
import { UserService } from '../../electron/main/services/auth/userService';
import { SessionService } from '../../electron/main/services/auth/sessionService';
import { AuthorizationService } from '../../electron/main/services/auth/authorizationService';

describe('Staff Management System — Phase 3 Test Suite (Roles, Permissions & Access Control)', () => {
  let db: Database.Database;
  let dbPath: string;
  let staffService: StaffService;
  let deptRepo: DepartmentRepository;
  let desRepo: DesignationRepository;
  let roleService: RoleService;
  let userService: UserService;

  beforeEach(() => {
    closeDatabase();
    dbPath = path.join(__dirname, `../../test_staff_phase3_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    staffService = new StaffService(db);
    deptRepo = new DepartmentRepository(db);
    desRepo = new DesignationRepository(db);
    roleService = new RoleService(db);
    userService = new UserService(db);
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

  it('1. should verify Migration v5 seeding of 6 standard system roles and granular permissions', () => {
    const roles = roleService.getRoles();
    expect(roles.length).toBeGreaterThanOrEqual(6);

    const roleNames = roles.map((r) => r.name);
    expect(roleNames).toContain('Owner');
    expect(roleNames).toContain('Manager');
    expect(roleNames).toContain('Cashier');
    expect(roleNames).toContain('Inventory Staff');
    expect(roleNames).toContain('Accountant');
    expect(roleNames).toContain('HR Staff');

    const permissions = roleService.getAllPermissions();
    expect(permissions.length).toBeGreaterThanOrEqual(30);

    const permCodes = permissions.map((p) => p.code);
    expect(permCodes).toContain('staff.view');
    expect(permCodes).toContain('role.view');
    expect(permCodes).toContain('user.create');
  });

  it('2. should support creating, updating permission matrix, and deleting custom roles', () => {
    const createRes = roleService.createRole({
      name: 'Senior Cashier',
      description: 'Supervised counter sales and return approvals',
      permissions: ['pos.view', 'pos.create', 'returns.create', 'sales.view'],
    });

    expect(createRes.success).toBe(true);
    const roleId = createRes.id!;

    let perms = roleService.getRolePermissions(roleId);
    expect(perms).toContain('pos.view');
    expect(perms).toContain('returns.create');

    // Update permissions matrix
    roleService.updateRole(roleId, {
      permissions: ['pos.view', 'pos.create', 'returns.create', 'sales.view', 'expenses.view'],
    });

    perms = roleService.getRolePermissions(roleId);
    expect(perms).toContain('expenses.view');

    // Delete custom role
    const delRes = roleService.deleteRole(roleId);
    expect(delRes.success).toBe(true);
  });

  it('3. should enforce system role protection and block deleting system roles', () => {
    const ownerRole = roleService.getRoles().find((r) => r.name === 'Owner')!;
    expect(ownerRole.is_system_role).toBe(1);

    const delRes = roleService.deleteRole(ownerRole.id);
    expect(delRes.success).toBe(false);
    expect(delRes.error).toContain('System roles (Owner, Manager, Cashier, etc.) are protected');
  });

  it('4. should create login user account linked to a staff member (Staff ↔ User Link)', async () => {
    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    const staffId = staffService.createStaff({
      first_name: 'Vimal',
      phone: '9876543210',
      joining_date: '2026-01-01',
      department_id: dept.id,
      designation_id: des.id,
    }).id!;

    const cashierRole = roleService.getRoles().find((r) => r.name === 'Cashier')!;

    const loginRes = await userService.createStaffLogin(staffId, {
      username: 'vimal.cashier',
      password: 'password123',
      display_name: 'Vimal Cashier',
      role_id: cashierRole.id,
    });

    expect(loginRes.success).toBe(true);

    const updatedStaff = staffService.getStaffById(staffId);
    expect(updatedStaff?.user_id).toBe(loginRes.id);
    expect(updatedStaff?.username).toBe('vimal.cashier');

    // Second login attempt for same staff must fail
    const secondLogin = await userService.createStaffLogin(staffId, {
      username: 'vimal.second',
      password: 'password123',
      display_name: 'Vimal Second',
      role_id: cashierRole.id,
    });
    expect(secondLogin.success).toBe(false);
    expect(secondLogin.error).toBe('Staff member already has an associated user account.');
  });

  it('5. should enforce Last Active Owner protection rule', async () => {
    const ownerRole = roleService.getRoles().find((r) => r.name === 'Owner')!;

    const ownerRes = await userService.createUser({
      username: 'sole_owner',
      password: 'password123',
      display_name: 'Sole Owner',
      role_id: ownerRole.id,
    });
    const ownerUserId = ownerRes.id!;

    // Try disabling the last active Owner account
    const disableRes = userService.updateUser(ownerUserId, { is_active: 0 });
    expect(disableRes.success).toBe(false);
    expect(disableRes.error).toContain('At least one active Owner/Admin account is required');
  });

  it('6. should automatically disable associated login user account upon staff deactivation', async () => {
    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    const cashierRole = roleService.getRoles().find((r) => r.name === 'Cashier')!;

    const staffId = staffService.createStaff({
      first_name: 'Gokul',
      phone: '9876543210',
      joining_date: '2026-01-01',
      department_id: dept.id,
      designation_id: des.id,
    }).id!;

    const loginRes = await userService.createStaffLogin(staffId, {
      username: 'gokul.staff',
      password: 'password123',
      display_name: 'Gokul Staff',
      role_id: cashierRole.id,
    });

    const userId = loginRes.id!;

    // Deactivate Staff
    const deactRes = staffService.deactivateStaff(staffId);
    expect(deactRes.success).toBe(true);

    // Verify linked user is disabled
    const users = userService.getUsers();
    const gokulUser = users.find((u) => u.id === userId);
    expect(gokulUser?.is_active).toBe(0);
  });
});

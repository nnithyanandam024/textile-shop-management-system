import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { initDatabase } from '../../electron/main/database';
import { PasswordService } from '../../electron/main/services/auth/passwordService';
import { AuthService } from '../../electron/main/services/auth/authService';
import { UserService } from '../../electron/main/services/auth/userService';
import { SessionService } from '../../electron/main/services/auth/sessionService';
import { AuthorizationService } from '../../electron/main/services/auth/authorizationService';

describe('Phase 3 Authentication & User Management Test Suite', () => {
  let tempDbPath: string;
  let db: any;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-test-'));
    tempDbPath = path.join(tempDir, 'test-auth.db');
    db = initDatabase(tempDbPath);
    SessionService.clearSession();
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    try {
      if (fs.existsSync(tempDbPath)) {
        const tempDir = path.dirname(tempDbPath);
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore Windows async file handle release delays
    }
    SessionService.clearSession();
  });

  it('1. should hash passwords securely with bcryptjs and verify matches', async () => {
    const hash = await PasswordService.hashPassword('SecretPassword123');
    expect(hash).not.toBe('SecretPassword123');

    const match = await PasswordService.verifyPassword('SecretPassword123', hash);
    expect(match).toBe(true);

    const wrongMatch = await PasswordService.verifyPassword('WrongPassword', hash);
    expect(wrongMatch).toBe(false);
  });

  it('2. should execute First-Time Setup and create initial Owner account', async () => {
    const authService = new AuthService(db);

    // Fresh DB requires setup
    const check1 = authService.checkInitialSetup();
    expect(check1.setupRequired).toBe(true);

    const setupResult = await authService.firstTimeSetup({
      shopName: 'Texora Retail Hub',
      ownerName: 'Nithyanandam',
      adminUsername: 'admin',
      adminPassword: 'adminPassword123',
    });

    expect(setupResult.success).toBe(true);

    // Post-setup check
    const check2 = authService.checkInitialSetup();
    expect(check2.setupRequired).toBe(false);
  });

  it('3. should authenticate valid credentials and establish user session', async () => {
    const authService = new AuthService(db);
    await authService.firstTimeSetup({
      shopName: 'Texora Retail Hub',
      ownerName: 'Nithyanandam',
      adminUsername: 'admin',
      adminPassword: 'adminPassword123',
    });

    const loginRes = await authService.login('admin', 'adminPassword123');
    expect(loginRes.success).toBe(true);
    expect(loginRes.user).toBeDefined();
    expect(loginRes.user?.roleName).toBe('Owner');
    expect(SessionService.isAuthenticated()).toBe(true);
  });

  it('4. should track failed login attempts and lock account after 5 failures', async () => {
    const authService = new AuthService(db);
    await authService.firstTimeSetup({
      shopName: 'Texora Retail Hub',
      ownerName: 'Nithyanandam',
      adminUsername: 'admin',
      adminPassword: 'adminPassword123',
    });

    // 5 Invalid attempts
    for (let i = 1; i <= 5; i++) {
      const res = await authService.login('admin', 'wrong_pass');
      expect(res.success).toBe(false);
    }

    // 6th attempt even with correct password must be locked out
    const lockedRes = await authService.login('admin', 'adminPassword123');
    expect(lockedRes.success).toBe(false);
    expect(lockedRes.error).toContain('Account is temporarily locked');
  });

  it('5. should enforce Owner Protection Rule (prevent deactivating final active Owner)', async () => {
    const authService = new AuthService(db);
    const userService = new UserService(db);

    await authService.firstTimeSetup({
      shopName: 'Texora Retail Hub',
      ownerName: 'Nithyanandam',
      adminUsername: 'admin',
      adminPassword: 'adminPassword123',
    });

    const users = userService.getUsers();
    const owner = users.find((u) => u.username === 'admin')!;

    // Attempting to deactivate the only active Owner account must be BLOCKED
    const result = userService.updateUser(owner.id, { is_active: 0 });
    expect(result.success).toBe(false);
    expect(result.error).toContain('At least one active Owner/Admin account is required');
  });

  it('6. should enforce Server-Side Permission checks for Cashier role', async () => {
    const authService = new AuthService(db);
    const userService = new UserService(db);

    await authService.firstTimeSetup({
      shopName: 'Texora Retail Hub',
      ownerName: 'Nithyanandam',
      adminUsername: 'admin',
      adminPassword: 'adminPassword123',
    });

    // Create a Cashier account (Role 3)
    const cashierCreate = await userService.createUser({
      username: 'cashier1',
      password: 'cashierPassword123',
      display_name: 'Store Cashier',
      role_id: 3,
    });
    expect(cashierCreate.success).toBe(true);

    // Login as Cashier
    await authService.login('cashier1', 'cashierPassword123');
    expect(SessionService.getSession()?.roleName).toBe('Cashier');

    // Cashier has permission for billing.create
    expect(AuthorizationService.hasPermission('billing.create')).toBe(true);

    // Cashier DENIED permission for users.manage and settings.update
    expect(AuthorizationService.hasPermission('users.manage')).toBe(false);
    expect(AuthorizationService.hasPermission('settings.update')).toBe(false);

    expect(() => {
      AuthorizationService.requirePermission('users.manage');
    }).toThrow(/Access Denied/);
  });

  it('7. should process administrative password reset and user password change', async () => {
    const authService = new AuthService(db);
    const userService = new UserService(db);

    await authService.firstTimeSetup({
      shopName: 'Texora Retail Hub',
      ownerName: 'Nithyanandam',
      adminUsername: 'admin',
      adminPassword: 'adminPassword123',
    });

    await authService.login('admin', 'adminPassword123');

    // Create a Manager user
    const createRes = await userService.createUser({
      username: 'manager1',
      password: 'OldPassword123',
      display_name: 'Branch Manager',
      role_id: 2,
    });

    // Admin resets Manager password
    const resetRes = await userService.resetPassword(1, createRes.id!, 'NewPassword123');
    expect(resetRes.success).toBe(true);

    // Login as Manager with new password
    const mgrLogin = await authService.login('manager1', 'NewPassword123');
    expect(mgrLogin.success).toBe(true);
  });
});

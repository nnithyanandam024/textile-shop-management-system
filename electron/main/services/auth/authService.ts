import Database from 'better-sqlite3';
import { UserRepository } from '../../repositories/userRepository';
import { SettingsRepository } from '../../repositories/settingsRepository';
import { AuditRepository } from '../../repositories/auditRepository';
import { PasswordService } from './passwordService';
import { SessionService, AuthUserSession } from './sessionService';
import log from '../../logger';

export class AuthService {
  private userRepo: UserRepository;
  private settingsRepo: SettingsRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.userRepo = new UserRepository(db);
    this.settingsRepo = new SettingsRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  checkInitialSetup(): { setupRequired: boolean } {
    const users = this.userRepo.getAll();
    return { setupRequired: users.length === 0 };
  }

  async firstTimeSetup(input: {
    shopName: string;
    shopAddress?: string;
    shopPhone?: string;
    gstNumber?: string;
    ownerName: string;
    adminUsername: string;
    adminPassword: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!input.shopName || !input.ownerName || !input.adminUsername || !input.adminPassword) {
      return { success: false, error: 'Shop Name, Owner Name, Username, and Password are required.' };
    }

    if (input.adminPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const existing = this.userRepo.getAll();
      if (existing.length > 0) {
        return { success: false, error: 'Initial setup has already been completed.' };
      }

      const passwordHash = await PasswordService.hashPassword(input.adminPassword);

      const transaction = this.db.transaction(() => {
        // 1. Save Shop Settings
        this.settingsRepo.set('shop_name', input.shopName);
        if (input.shopAddress) this.settingsRepo.set('shop_address', input.shopAddress);
        if (input.shopPhone) this.settingsRepo.set('shop_phone', input.shopPhone);
        if (input.gstNumber) this.settingsRepo.set('gst_number', input.gstNumber);

        // 2. Create Owner User (Role 1 = Owner)
        const userId = this.userRepo.create({
          username: input.adminUsername,
          password_hash: passwordHash,
          display_name: input.ownerName,
          role_id: 1,
        });

        // 3. Log Audit Entry
        this.auditRepo.log({
          user_id: userId,
          action: 'FIRST_TIME_SETUP',
          entity_type: 'SYSTEM',
          new_value: `Configured Shop: ${input.shopName}, Owner: ${input.ownerName}`,
        });

        return userId;
      });

      transaction();
      return { success: true };
    } catch (error: any) {
      log.error('First-time setup error:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; user?: AuthUserSession; error?: string }> {
    if (!username || !password) {
      return { success: false, error: 'Invalid username or password.' };
    }

    const user = this.userRepo.getByUsername(username);
    if (!user) {
      return { success: false, error: 'Invalid username or password.' };
    }

    // 1. Check Active Status
    if (!user.is_active) {
      return { success: false, error: 'This account is currently inactive. Please contact your store administrator.' };
    }

    // 2. Check Lockout Status
    if (user.locked_until) {
      const lockTime = new Date(user.locked_until).getTime();
      if (Date.now() < lockTime) {
        const remainingMins = Math.ceil((lockTime - Date.now()) / 60000);
        return {
          success: false,
          error: `Account is temporarily locked due to multiple failed login attempts. Try again in ${remainingMins} minute(s).`,
        };
      }
    }

    // 3. Verify Password Hash
    const matches = await PasswordService.verifyPassword(password, user.password_hash);
    if (!matches) {
      const failed = user.failed_login_attempts + 1;
      let lockUntil: string | undefined = undefined;

      if (failed >= 5) {
        // Lock for 5 minutes
        lockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        log.warn(`User '${username}' locked out for 5 minutes after 5 failed attempts.`);
      }

      this.userRepo.updateFailedAttempts(user.id, failed, lockUntil);

      this.auditRepo.log({
        user_id: user.id,
        action: 'LOGIN_FAILURE',
        entity_type: 'USER',
        entity_id: user.id,
        new_value: `Failed attempt #${failed}`,
      });

      return { success: false, error: 'Invalid username or password.' };
    }

    // 4. Login Success
    this.userRepo.recordSuccessfulLogin(user.id);

    const permissions = this.userRepo.getUserPermissions(user.role_id);
    const session: AuthUserSession = {
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      roleId: user.role_id,
      roleName: user.role_name || 'Staff',
      permissions,
    };

    SessionService.setSession(session);

    this.auditRepo.log({
      user_id: user.id,
      action: 'LOGIN_SUCCESS',
      entity_type: 'USER',
      entity_id: user.id,
      new_value: `User ${user.username} logged in`,
    });

    return { success: true, user: session };
  }

  logout(): { success: boolean } {
    const session = SessionService.getSession();
    if (session) {
      this.auditRepo.log({
        user_id: session.userId,
        action: 'LOGOUT',
        entity_type: 'USER',
        entity_id: session.userId,
      });
    }
    SessionService.clearSession();
    return { success: true };
  }

  getCurrentUser(): AuthUserSession | null {
    return SessionService.getSession();
  }

  async changePassword(userId: number, currentPass: string, newPass: string): Promise<{ success: boolean; error?: string }> {
    if (!currentPass || !newPass || newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const user = this.userRepo.getById(userId);
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    const valid = await PasswordService.verifyPassword(currentPass, user.password_hash);
    if (!valid) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    const newHash = await PasswordService.hashPassword(newPass);
    this.userRepo.updatePasswordHash(userId, newHash);

    this.auditRepo.log({
      user_id: userId,
      action: 'PASSWORD_CHANGED',
      entity_type: 'USER',
      entity_id: userId,
    });

    return { success: true };
  }
}

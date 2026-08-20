import Database from 'better-sqlite3';
import { UserRepository } from '../../repositories/userRepository';
import { StaffRepository } from '../../repositories/staffRepository';
import { AuditRepository } from '../../repositories/auditRepository';
import { PasswordService } from './passwordService';
import { SessionService, AuthUserSession } from './sessionService';
import log from '../../logger';

export interface StaffAuthSession extends AuthUserSession {
  staffId: number;
  employeeCode: string;
  departmentName?: string;
  designationName?: string;
  status: string;
}

export class StaffAuthService {
  private userRepo: UserRepository;
  private staffRepo: StaffRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.userRepo = new UserRepository(db);
    this.staffRepo = new StaffRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  async login(
    employeeIdOrUsername: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{ success: boolean; user?: StaffAuthSession; error?: string }> {
    const trimmedIdentifier = (employeeIdOrUsername || '').trim();
    const trimmedPassword = (password || '').trim();

    // 1. Input Validation
    if (!trimmedIdentifier && !trimmedPassword) {
      return { success: false, error: 'Please enter your Employee ID and Password.' };
    }
    if (!trimmedIdentifier) {
      return { success: false, error: 'Employee ID is required.' };
    }
    if (!trimmedPassword) {
      return { success: false, error: 'Password is required.' };
    }

    // 2. Lookup Staff / User Account
    // Try lookup by staff_code directly (e.g. STF-0001, STF001) or by username
    let staffRecord = this.db.prepare(`
      SELECT s.*, 
             dep.name as department_name, 
             des.name as designation_name,
             u.id as user_id,
             u.username,
             u.password_hash,
             u.role_id,
             u.is_active as user_is_active,
             u.failed_login_attempts,
             u.locked_until,
             r.name as role_name
      FROM staff s
      LEFT JOIN departments dep ON s.department_id = dep.id
      LEFT JOIN designations des ON s.designation_id = des.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE UPPER(s.staff_code) = UPPER(?) 
         OR UPPER(REPLACE(s.staff_code, '-', '')) = UPPER(REPLACE(?, '-', ''))
         OR UPPER(u.username) = UPPER(?)
      LIMIT 1
    `).get(trimmedIdentifier, trimmedIdentifier, trimmedIdentifier) as any;

    if (!staffRecord || !staffRecord.user_id || !staffRecord.password_hash) {
      // Check if user exists but has no staff record attached
      const standaloneUser = this.userRepo.getByUsername(trimmedIdentifier);
      if (standaloneUser) {
        return { success: false, error: 'Staff access denied.' };
      }
      return { success: false, error: 'Invalid Employee ID or Password.' };
    }

    // 3. Check Account & Employment Status
    const employmentStatus = (staffRecord.status || '').toUpperCase();
    if (employmentStatus === 'INACTIVE' || !staffRecord.user_is_active) {
      return { success: false, error: 'Your account is currently inactive. Please contact your administrator.' };
    }
    if (employmentStatus === 'SUSPENDED') {
      return { success: false, error: 'Your account has been suspended. Please contact your administrator.' };
    }
    if (employmentStatus === 'TERMINATED' || employmentStatus === 'EXIT') {
      return { success: false, error: 'Your employment account has ended. Please contact HR.' };
    }

    // Check Account Lockout
    if (staffRecord.locked_until) {
      const lockTime = new Date(staffRecord.locked_until).getTime();
      if (Date.now() < lockTime) {
        return { success: false, error: 'Your account is currently locked. Please contact your administrator.' };
      }
    }

    // 4. Verify Password
    const matches = await PasswordService.verifyPassword(trimmedPassword, staffRecord.password_hash);
    if (!matches) {
      const failed = (staffRecord.failed_login_attempts || 0) + 1;
      let lockUntil: string | undefined = undefined;

      if (failed >= 5) {
        lockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        log.warn(`Staff user '${staffRecord.username}' locked out for 5 minutes after 5 failed attempts.`);
      }

      this.userRepo.updateFailedAttempts(staffRecord.user_id, failed, lockUntil);

      this.auditRepo.log({
        user_id: staffRecord.user_id,
        action: 'STAFF_LOGIN_FAILURE',
        entity_type: 'STAFF',
        entity_id: staffRecord.id,
        new_value: `Failed attempt #${failed} for staff ${staffRecord.staff_code}`,
      });

      return { success: false, error: 'Invalid Employee ID or Password.' };
    }

    // 5. Successful Login
    this.userRepo.recordSuccessfulLogin(staffRecord.user_id);

    const permissions = this.userRepo.getUserPermissions(staffRecord.role_id);
    const session: StaffAuthSession = {
      userId: staffRecord.user_id,
      staffId: staffRecord.id,
      employeeCode: staffRecord.staff_code,
      username: staffRecord.username,
      displayName: `${staffRecord.first_name} ${staffRecord.last_name || ''}`.trim(),
      roleId: staffRecord.role_id,
      roleName: staffRecord.role_name || 'STAFF',
      departmentName: staffRecord.department_name,
      designationName: staffRecord.designation_name,
      status: staffRecord.status,
      permissions,
    };

    SessionService.setSession(session);

    this.auditRepo.log({
      user_id: staffRecord.user_id,
      action: 'STAFF_LOGIN_SUCCESS',
      entity_type: 'STAFF',
      entity_id: staffRecord.id,
      new_value: `Staff ${staffRecord.staff_code} (${session.displayName}) logged into Staff Portal (rememberMe: ${rememberMe})`,
    });

    return { success: true, user: session };
  }

  logout(): { success: boolean } {
    const session = SessionService.getSession();
    if (session) {
      this.auditRepo.log({
        user_id: session.userId,
        action: 'STAFF_LOGOUT',
        entity_type: 'STAFF',
        entity_id: session.staffId,
        new_value: `Staff ${session.username} logged out from Staff Portal`,
      });
      SessionService.clearSession();
    }
    return { success: true };
  }

  getCurrentStaff(): StaffAuthSession | null {
    const session = SessionService.getSession();
    if (!session || !session.staffId) return null;

    // Verify staff record is still active
    const staff = this.db.prepare(`
      SELECT s.*, 
             dep.name as department_name, 
             des.name as designation_name,
             u.username,
             u.role_id,
             r.name as role_name
      FROM staff s
      LEFT JOIN departments dep ON s.department_id = dep.id
      LEFT JOIN designations des ON s.designation_id = des.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE s.id = ? AND s.status = 'ACTIVE'
    `).get(session.staffId) as any;

    if (!staff) return null;

    return {
      userId: session.userId,
      staffId: staff.id,
      employeeCode: staff.staff_code,
      username: staff.username,
      displayName: `${staff.first_name} ${staff.last_name || ''}`.trim(),
      roleId: staff.role_id,
      roleName: staff.role_name || 'STAFF',
      departmentName: staff.department_name,
      designationName: staff.designation_name,
      status: staff.status,
      permissions: session.permissions || [],
    };
  }
}

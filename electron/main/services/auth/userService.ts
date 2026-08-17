import Database from 'better-sqlite3';
import { UserRepository, UserRow } from '../../repositories/userRepository';
import { StaffRepository } from '../../repositories/staffRepository';
import { AuditRepository } from '../../repositories/auditRepository';
import { PasswordService } from './passwordService';
import log from '../../logger';

export interface CreateUserInput {
  username: string;
  password: string;
  display_name: string;
  role_id: number;
}

export interface UpdateUserInput {
  display_name?: string;
  role_id?: number;
  is_active?: number;
}

export class UserService {
  private userRepo: UserRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.userRepo = new UserRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  getUsers(): UserRow[] {
    return this.userRepo.getAll().map((u) => {
      const copy = { ...u };
      delete (copy as any).password_hash;
      return copy;
    });
  }

  async createUser(input: CreateUserInput, actorUserId?: number): Promise<{ success: boolean; id?: number; error?: string }> {
    if (!input.username || !input.password || !input.display_name || !input.role_id) {
      return { success: false, error: 'Username, password, display name, and role are required.' };
    }

    if (input.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const existing = this.userRepo.getByUsername(input.username);
    if (existing) {
      return { success: false, error: `Username '${input.username}' is already taken.` };
    }

    try {
      const passwordHash = await PasswordService.hashPassword(input.password);
      const id = this.userRepo.create({
        username: input.username,
        password_hash: passwordHash,
        display_name: input.display_name,
        role_id: input.role_id,
      });

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'USER_CREATED',
        entity_type: 'USER',
        entity_id: id,
        new_value: `Created user ${input.username} with role_id ${input.role_id}`,
      });

      return { success: true, id };
    } catch (error: any) {
      log.error('Failed to create user:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  async createStaffLogin(
    staffId: number,
    input: CreateUserInput,
    actorUserId?: number
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    const staffRepo = new StaffRepository(this.db);
    const staff = staffRepo.getById(staffId);
    if (!staff) {
      return { success: false, error: 'Staff member record not found.' };
    }

    if (staff.user_id) {
      return { success: false, error: 'Staff member already has an associated user account.' };
    }

    const userRes = await this.createUser(input, actorUserId);
    if (!userRes.success || !userRes.id) {
      return userRes;
    }

    staffRepo.update(staffId, { user_id: userRes.id });

    this.auditRepo.log({
      user_id: actorUserId,
      action: 'ROLE_ASSIGNED',
      entity_type: 'STAFF',
      entity_id: staffId,
      new_value: `Created login '${input.username}' for staff ${staff.staff_code}`,
    });

    return { success: true, id: userRes.id };
  }

  updateUser(id: number, input: UpdateUserInput, actorUserId?: number): { success: boolean; error?: string } {
    const targetUser = this.userRepo.getById(id);
    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }

    // Owner Protection Rule: Cannot change role or deactivate if this is the last active Owner
    if ((input.is_active === 0 || (input.role_id !== undefined && input.role_id !== 1)) && targetUser.role_name === 'Owner' && targetUser.is_active === 1) {
      const ownerCount = this.userRepo.getActiveOwnerCount();
      if (ownerCount <= 1) {
        return {
          success: false,
          error: 'Action blocked: At least one active Owner/Admin account is required for system administration.',
        };
      }
    }

    const updated = this.userRepo.update(id, input);
    if (updated) {
      this.auditRepo.log({
        user_id: actorUserId,
        action: input.role_id !== undefined ? 'ROLE_CHANGED' : 'USER_UPDATED',
        entity_type: 'USER',
        entity_id: id,
        new_value: JSON.stringify(input),
      });
      return { success: true };
    }
    return { success: false, error: 'No changes made.' };
  }

  async resetPassword(adminUserId: number, targetUserId: number, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const targetUser = this.userRepo.getById(targetUserId);
    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }

    try {
      const newHash = await PasswordService.hashPassword(newPassword);
      this.userRepo.updatePasswordHash(targetUserId, newHash);

      this.auditRepo.log({
        user_id: adminUserId,
        action: 'PASSWORD_RESET',
        entity_type: 'USER',
        entity_id: targetUserId,
        new_value: `Password reset by admin`,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  }
}

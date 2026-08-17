import Database from 'better-sqlite3';
import { RoleRepository, RoleRow, PermissionRow } from '../../repositories/roleRepository';
import { AuditRepository } from '../../repositories/auditRepository';

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

export class RoleService {
  private roleRepo: RoleRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.roleRepo = new RoleRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  getRoles(): RoleRow[] {
    return this.roleRepo.getAll();
  }

  getRoleById(id: number): RoleRow | undefined {
    return this.roleRepo.getById(id);
  }

  getAllPermissions(): PermissionRow[] {
    return this.roleRepo.getAllPermissions();
  }

  getRolePermissions(roleId: number): string[] {
    return this.roleRepo.getRolePermissions(roleId);
  }

  createRole(input: CreateRoleInput, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.name || input.name.trim() === '') {
      return { success: false, error: 'Role name is required.' };
    }

    const existing = this.roleRepo.getByName(input.name);
    if (existing) {
      return { success: false, error: `Role name '${input.name}' already exists.` };
    }

    const roleId = this.roleRepo.create({
      name: input.name,
      description: input.description,
      is_system_role: 0,
    });

    if (input.permissions && input.permissions.length > 0) {
      this.roleRepo.syncRolePermissions(roleId, input.permissions);
    }

    this.auditRepo.log({
      user_id: actorUserId,
      action: 'ROLE_CREATED',
      entity_type: 'ROLE',
      entity_id: roleId,
      new_value: `Created custom role '${input.name.trim()}' with ${input.permissions?.length || 0} permissions`,
    });

    return { success: true, id: roleId };
  }

  updateRole(id: number, input: UpdateRoleInput, actorUserId?: number): { success: boolean; error?: string } {
    const existing = this.roleRepo.getById(id);
    if (!existing) {
      return { success: false, error: 'Role not found.' };
    }

    if (input.name && input.name.trim() !== '' && input.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      if (existing.is_system_role === 1) {
        return { success: false, error: 'System role names cannot be renamed.' };
      }
      const duplicate = this.roleRepo.getByName(input.name);
      if (duplicate) {
        return { success: false, error: `Role name '${input.name}' is already in use.` };
      }
    }

    this.roleRepo.update(id, {
      name: input.name,
      description: input.description,
    });

    if (input.permissions !== undefined) {
      this.roleRepo.syncRolePermissions(id, input.permissions);
    }

    this.auditRepo.log({
      user_id: actorUserId,
      action: 'ROLE_UPDATED',
      entity_type: 'ROLE',
      entity_id: id,
      new_value: `Updated role '${existing.name}' permissions matrix`,
    });

    return { success: true };
  }

  deleteRole(id: number, actorUserId?: number): { success: boolean; error?: string } {
    const existing = this.roleRepo.getById(id);
    if (!existing) {
      return { success: false, error: 'Role not found.' };
    }

    if (existing.is_system_role === 1) {
      return { success: false, error: 'System roles (Owner, Manager, Cashier, etc.) are protected and cannot be deleted.' };
    }

    if (existing.user_count && existing.user_count > 0) {
      return {
        success: false,
        error: `Cannot delete role '${existing.name}': It is currently assigned to ${existing.user_count} user account(s). Reassign those users before deleting.`,
      };
    }

    this.roleRepo.delete(id);

    this.auditRepo.log({
      user_id: actorUserId,
      action: 'ROLE_DELETED',
      entity_type: 'ROLE',
      entity_id: id,
      new_value: `Deleted custom role '${existing.name}'`,
    });

    return { success: true };
  }
}

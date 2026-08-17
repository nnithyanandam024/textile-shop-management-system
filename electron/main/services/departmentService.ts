import Database from 'better-sqlite3';
import { DepartmentRepository, DepartmentRow } from '../repositories/departmentRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export class DepartmentService {
  private deptRepo: DepartmentRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.deptRepo = new DepartmentRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  getDepartments(includeInactive: boolean = false): DepartmentRow[] {
    return this.deptRepo.getAll(includeInactive);
  }

  getDepartmentById(id: number): DepartmentRow | undefined {
    return this.deptRepo.getById(id);
  }

  createDepartment(
    input: { name: string; description?: string },
    actorUserId?: number
  ): { success: boolean; id?: number; error?: string } {
    if (!input.name || input.name.trim() === '') {
      return { success: false, error: 'Department name is required.' };
    }

    const existing = this.deptRepo.getByName(input.name);
    if (existing) {
      return { success: false, error: `Department "${input.name}" already exists.` };
    }

    try {
      const id = this.deptRepo.create({ name: input.name, description: input.description });

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'DEPARTMENT_CREATED',
        entity_type: 'DEPARTMENT',
        entity_id: id,
        new_value: `Created department: ${input.name}`,
      });

      return { success: true, id };
    } catch (error: any) {
      log.error('Failed to create department:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  updateDepartment(
    id: number,
    input: { name?: string; description?: string },
    actorUserId?: number
  ): { success: boolean; error?: string } {
    const existing = this.deptRepo.getById(id);
    if (!existing) {
      return { success: false, error: 'Department not found.' };
    }

    if (input.name && input.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = this.deptRepo.getByName(input.name);
      if (duplicate && duplicate.id !== id) {
        return { success: false, error: `Department "${input.name}" already exists.` };
      }
    }

    try {
      this.deptRepo.update(id, input);

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'DEPARTMENT_UPDATED',
        entity_type: 'DEPARTMENT',
        entity_id: id,
        old_value: existing.name,
        new_value: input.name || existing.name,
      });

      return { success: true };
    } catch (error: any) {
      log.error('Failed to update department:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  deactivateDepartment(
    id: number,
    actorUserId?: number
  ): { success: boolean; activeStaffCount?: number; error?: string } {
    const existing = this.deptRepo.getById(id);
    if (!existing) {
      return { success: false, error: 'Department not found.' };
    }

    const activeStaffCount = this.deptRepo.countStaffInDepartment(id);
    if (activeStaffCount > 0) {
      return {
        success: false,
        activeStaffCount,
        error: `Cannot deactivate department. ${activeStaffCount} active staff member(s) are assigned to this department. Please reassign them first.`
      };
    }

    try {
      this.deptRepo.updateStatus(id, 'INACTIVE');

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'DEPARTMENT_DEACTIVATED',
        entity_type: 'DEPARTMENT',
        entity_id: id,
        old_value: 'ACTIVE',
        new_value: 'INACTIVE',
      });

      return { success: true };
    } catch (error: any) {
      log.error('Failed to deactivate department:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
}

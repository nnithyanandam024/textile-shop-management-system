import Database from 'better-sqlite3';
import { DesignationRepository, DesignationRow } from '../repositories/designationRepository';
import { DepartmentRepository } from '../repositories/departmentRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export class DesignationService {
  private desRepo: DesignationRepository;
  private deptRepo: DepartmentRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.desRepo = new DesignationRepository(db);
    this.deptRepo = new DepartmentRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  getDesignations(departmentId?: number, includeInactive: boolean = false): DesignationRow[] {
    return this.desRepo.getAll(departmentId, includeInactive);
  }

  getDesignationById(id: number): DesignationRow | undefined {
    return this.desRepo.getById(id);
  }

  createDesignation(
    input: { name: string; department_id: number; description?: string },
    actorUserId?: number
  ): { success: boolean; id?: number; error?: string } {
    if (!input.name || input.name.trim() === '') {
      return { success: false, error: 'Designation name is required.' };
    }
    if (!input.department_id) {
      return { success: false, error: 'Department is required for designation.' };
    }

    const dept = this.deptRepo.getById(input.department_id);
    if (!dept) {
      return { success: false, error: 'Selected department does not exist.' };
    }

    try {
      const id = this.desRepo.create(input);

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'DESIGNATION_CREATED',
        entity_type: 'DESIGNATION',
        entity_id: id,
        new_value: `Created designation: ${input.name} in Department: ${dept.name}`,
      });

      return { success: true, id };
    } catch (error: any) {
      log.error('Failed to create designation:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  updateDesignation(
    id: number,
    input: { name?: string; department_id?: number; description?: string },
    actorUserId?: number
  ): { success: boolean; error?: string } {
    const existing = this.desRepo.getById(id);
    if (!existing) {
      return { success: false, error: 'Designation not found.' };
    }

    if (input.department_id && input.department_id !== existing.department_id) {
      const dept = this.deptRepo.getById(input.department_id);
      if (!dept) {
        return { success: false, error: 'Selected department does not exist.' };
      }
    }

    try {
      this.desRepo.update(id, input);

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'DESIGNATION_UPDATED',
        entity_type: 'DESIGNATION',
        entity_id: id,
        old_value: existing.name,
        new_value: input.name || existing.name,
      });

      return { success: true };
    } catch (error: any) {
      log.error('Failed to update designation:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  deactivateDesignation(
    id: number,
    actorUserId?: number
  ): { success: boolean; activeStaffCount?: number; error?: string } {
    const existing = this.desRepo.getById(id);
    if (!existing) {
      return { success: false, error: 'Designation not found.' };
    }

    const activeStaffCount = this.desRepo.countStaffInDesignation(id);
    if (activeStaffCount > 0) {
      return {
        success: false,
        activeStaffCount,
        error: `Cannot deactivate designation. ${activeStaffCount} active staff member(s) are assigned to this designation. Please reassign them first.`
      };
    }

    try {
      this.desRepo.updateStatus(id, 'INACTIVE');

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'DESIGNATION_DEACTIVATED',
        entity_type: 'DESIGNATION',
        entity_id: id,
        old_value: 'ACTIVE',
        new_value: 'INACTIVE',
      });

      return { success: true };
    } catch (error: any) {
      log.error('Failed to deactivate designation:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
}

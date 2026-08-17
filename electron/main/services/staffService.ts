import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { StaffRepository, StaffRow, StaffQueryParams } from '../repositories/staffRepository';
import { DepartmentRepository } from '../repositories/departmentRepository';
import { DesignationRepository } from '../repositories/designationRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export interface CreateStaffInput {
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
  address?: string;
  joining_date: string;
  department_id: number;
  designation_id: number;
  employment_type?: 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'CONTRACT' | 'INTERN';
  photo_base64?: string;
  user_id?: number;
}

export interface UpdateStaffInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  joining_date?: string;
  department_id?: number;
  designation_id?: number;
  employment_type?: 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'CONTRACT' | 'INTERN';
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED';
  photo_base64?: string;
  user_id?: number;
}

export class StaffService {
  private staffRepo: StaffRepository;
  private deptRepo: DepartmentRepository;
  private desRepo: DesignationRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.staffRepo = new StaffRepository(db);
    this.deptRepo = new DepartmentRepository(db);
    this.desRepo = new DesignationRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private getStaffPhotoDirectory(): string {
    const userDataPath = app?.getPath ? app.getPath('userData') : process.cwd();
    const photoDir = path.join(userDataPath, 'staff_photos');
    if (!fs.existsSync(photoDir)) {
      fs.mkdirSync(photoDir, { recursive: true });
    }
    return photoDir;
  }

  getStaffList(params: StaffQueryParams = {}): { staff: StaffRow[]; total: number } {
    return this.staffRepo.getAll(params);
  }

  getStaffById(id: number): StaffRow | undefined {
    return this.staffRepo.getById(id);
  }

  createStaff(
    input: CreateStaffInput,
    actorUserId?: number
  ): { success: boolean; id?: number; staff_code?: string; error?: string } {
    // 1. Mandatory Validations
    if (!input.first_name || input.first_name.trim() === '') {
      return { success: false, error: 'First name is required.' };
    }
    if (!input.phone || input.phone.trim() === '') {
      return { success: false, error: 'Phone number is required.' };
    }
    if (!input.joining_date || input.joining_date.trim() === '') {
      return { success: false, error: 'Joining date is required.' };
    }
    if (!input.department_id) {
      return { success: false, error: 'Department selection is required.' };
    }
    if (!input.designation_id) {
      return { success: false, error: 'Designation selection is required.' };
    }

    // Phone format check (must contain at least 7 digits)
    const phoneClean = input.phone.replace(/[\s\-+()]/g, '');
    if (!/^\d{7,15}$/.test(phoneClean)) {
      return { success: false, error: 'Invalid phone number format. Must contain 7 to 15 digits.' };
    }

    // Email regex check if provided
    if (input.email && input.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email.trim())) {
        return { success: false, error: 'Invalid email address format.' };
      }
    }

    // 2. Validate Department exists
    const dept = this.deptRepo.getById(input.department_id);
    if (!dept) {
      return { success: false, error: 'Selected department does not exist.' };
    }

    // 3. Validate Designation belongs to Department
    const des = this.desRepo.getById(input.designation_id);
    if (!des) {
      return { success: false, error: 'Selected designation does not exist.' };
    }
    if (des.department_id !== input.department_id) {
      return {
        success: false,
        error: `Designation "${des.name}" does not belong to Department "${dept.name}".`
      };
    }

    // 4. Check for duplicate phone
    const existingPhone = this.staffRepo.getByPhone(input.phone.trim());
    if (existingPhone) {
      return { success: false, error: `Staff member with phone number ${input.phone} already exists (${existingPhone.staff_code} ${existingPhone.first_name}).` };
    }

    // 5. Handle Photo Upload if base64 provided
    let photoPath: string | undefined = undefined;
    if (input.photo_base64) {
      try {
        const photoDir = this.getStaffPhotoDirectory();
        const tempCode = this.staffRepo.generateStaffCode();
        const fileName = `${tempCode}_${Date.now()}.png`;
        photoPath = path.join(photoDir, fileName);

        const base64Data = input.photo_base64.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(photoPath, Buffer.from(base64Data, 'base64'));
      } catch (err) {
        log.error('Failed to save staff photo:', err);
      }
    }

    try {
      const staffCode = this.staffRepo.generateStaffCode();
      const id = this.staffRepo.create({
        staff_code: staffCode,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        joining_date: input.joining_date,
        department_id: input.department_id,
        designation_id: input.designation_id,
        employment_type: input.employment_type || 'FULL_TIME',
        status: 'ACTIVE',
        photo_path: photoPath,
        user_id: input.user_id,
      });

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'STAFF_CREATED',
        entity_type: 'STAFF',
        entity_id: id,
        new_value: `Created Staff ${staffCode}: ${input.first_name} (${dept.name} - ${des.name})`,
      });

      return { success: true, id, staff_code: staffCode };
    } catch (error: any) {
      log.error('Failed to create staff record:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  updateStaff(
    id: number,
    input: UpdateStaffInput,
    actorUserId?: number
  ): { success: boolean; error?: string } {
    const existing = this.staffRepo.getById(id);
    if (!existing) {
      return { success: false, error: 'Staff member not found.' };
    }

    const deptId = input.department_id !== undefined ? input.department_id : existing.department_id;
    const desId = input.designation_id !== undefined ? input.designation_id : existing.designation_id;

    // Validate Department & Designation relationship if changed
    if (input.department_id !== undefined || input.designation_id !== undefined) {
      const dept = this.deptRepo.getById(deptId);
      const des = this.desRepo.getById(desId);

      if (!dept) return { success: false, error: 'Selected department does not exist.' };
      if (!des) return { success: false, error: 'Selected designation does not exist.' };

      if (des.department_id !== deptId) {
        return {
          success: false,
          error: `Designation "${des.name}" does not belong to Department "${dept.name}".`
        };
      }
    }

    if (input.email && input.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email.trim())) {
        return { success: false, error: 'Invalid email address format.' };
      }
    }

    // Photo Update
    let photoPath = existing.photo_path;
    if (input.photo_base64) {
      try {
        const photoDir = this.getStaffPhotoDirectory();
        const fileName = `${existing.staff_code}_${Date.now()}.png`;
        photoPath = path.join(photoDir, fileName);

        const base64Data = input.photo_base64.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(photoPath, Buffer.from(base64Data, 'base64'));
      } catch (err) {
        log.error('Failed to update staff photo:', err);
      }
    }

    try {
      this.staffRepo.update(id, {
        ...input,
        photo_path: photoPath,
      });

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'STAFF_UPDATED',
        entity_type: 'STAFF',
        entity_id: id,
        old_value: `${existing.staff_code} ${existing.first_name} ${existing.last_name || ''}`.trim(),
        new_value: `Updated details for ${existing.staff_code}`,
      });

      return { success: true };
    } catch (error: any) {
      log.error('Failed to update staff record:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  deactivateStaff(
    id: number,
    actorUserId?: number
  ): { success: boolean; error?: string } {
    const existing = this.staffRepo.getById(id);
    if (!existing) {
      return { success: false, error: 'Staff member not found.' };
    }

    try {
      this.staffRepo.updateStatus(id, 'INACTIVE');

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'STAFF_DEACTIVATED',
        entity_type: 'STAFF',
        entity_id: id,
        old_value: existing.status,
        new_value: 'INACTIVE',
      });

      return { success: true };
    } catch (error: any) {
      log.error('Failed to deactivate staff member:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
}

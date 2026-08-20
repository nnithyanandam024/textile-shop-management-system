import Database from 'better-sqlite3';
import { SessionService } from './auth/sessionService';
import { PasswordService } from './auth/passwordService';
import { AuditRepository } from '../repositories/auditRepository';
import { StaffEmergencyRepository } from '../repositories/staffEmergencyRepository';
import log from '../logger';

export interface StaffProfileData {
  id: number;
  staffCode: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  designationId: number;
  designationName: string;
  designationCode: string;
  managerId: number | null;
  managerName: string | null;
  workLocation: string;
  joiningDate: string;
  employmentType: string;
  status: string;
  photoPath: string | null;
  userId: number | null;
  username: string | null;
  emergencyContact?: {
    id: number;
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
  } | null;
}

export interface UpdateAllowedProfileFields {
  phone?: string;
  email?: string;
  alternatePhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  dateOfBirth?: string;
  gender?: string;
}

export class StaffProfileService {
  private auditRepo: AuditRepository;
  private emergencyRepo: StaffEmergencyRepository;

  constructor(private db: Database.Database) {
    this.auditRepo = new AuditRepository(db);
    this.emergencyRepo = new StaffEmergencyRepository(db);
  }

  private getStaffIdOrThrow(): number {
    const session = SessionService.getSession();
    if (!session) {
      throw new Error('ACCESS DENIED: Authentication required.');
    }

    let staffId = session.staffId;
    if (!staffId && session.userId) {
      const row = this.db.prepare('SELECT id FROM staff WHERE user_id = ?').get(session.userId) as any;
      if (row) staffId = row.id;
    }

    if (!staffId) {
      throw new Error('ACCESS DENIED: No active employee profile bound to this account.');
    }

    return staffId;
  }

  getMyProfile(): StaffProfileData {
    const staffId = this.getStaffIdOrThrow();

    const staffRow = this.db.prepare(`
      SELECT s.*,
             dep.name as department_name, dep.department_code,
             des.name as designation_name, des.designation_code,
             (mgr.first_name || ' ' || COALESCE(mgr.last_name, '')) as manager_name,
             u.username
      FROM staff s
      LEFT JOIN departments dep ON s.department_id = dep.id
      LEFT JOIN designations des ON s.designation_id = des.id
      LEFT JOIN staff mgr ON s.manager_id = mgr.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(staffId) as any;

    if (!staffRow) {
      throw new Error(`Staff profile #${staffId} not found.`);
    }

    const contacts = this.emergencyRepo.getByStaffId(staffId);
    const primaryEmergency = contacts[0] || null;

    return {
      id: staffRow.id,
      staffCode: staffRow.staff_code,
      firstName: staffRow.first_name,
      lastName: staffRow.last_name,
      fullName: `${staffRow.first_name}${staffRow.last_name ? ' ' + staffRow.last_name : ''}`,
      dateOfBirth: staffRow.date_of_birth || null,
      gender: staffRow.gender || null,
      phone: staffRow.phone,
      alternatePhone: staffRow.alternate_phone || null,
      email: staffRow.email || null,
      addressLine1: staffRow.address_line_1 || null,
      addressLine2: staffRow.address_line_2 || null,
      city: staffRow.city || null,
      district: staffRow.district || null,
      state: staffRow.state || null,
      pincode: staffRow.pincode || null,
      departmentId: staffRow.department_id,
      departmentName: staffRow.department_name || 'Unassigned',
      departmentCode: staffRow.department_code || 'N/A',
      designationId: staffRow.designation_id,
      designationName: staffRow.designation_name || 'Staff Member',
      designationCode: staffRow.designation_code || 'N/A',
      managerId: staffRow.manager_id,
      managerName: staffRow.manager_name?.trim() || null,
      workLocation: staffRow.work_location || 'Main Store',
      joiningDate: staffRow.joining_date,
      employmentType: staffRow.employment_type || 'FULL_TIME',
      status: staffRow.status,
      photoPath: staffRow.photo_path || null,
      userId: staffRow.user_id,
      username: staffRow.username || null,
      emergencyContact: primaryEmergency ? {
        id: primaryEmergency.id,
        name: primaryEmergency.name,
        relationship: primaryEmergency.relationship,
        phone: primaryEmergency.phone,
        alternatePhone: primaryEmergency.alternate_phone || undefined,
        address: primaryEmergency.address || undefined,
      } : null,
    };
  }

  updateMyProfile(fields: UpdateAllowedProfileFields): { success: boolean; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();

    // Validation
    if (fields.phone !== undefined) {
      if (!fields.phone.trim()) {
        throw new Error('Phone number is required.');
      }
      const cleanPhone = fields.phone.replace(/[\s\-+()]/g, '');
      if (!/^\d{7,15}$/.test(cleanPhone)) {
        throw new Error('Please enter a valid phone number (7-15 digits).');
      }
    }

    if (fields.email !== undefined && fields.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fields.email.trim())) {
        throw new Error('Please enter a valid email address.');
      }
    }

    if (fields.addressLine1 !== undefined && fields.addressLine1.trim() === '') {
      throw new Error('Address cannot be empty.');
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    if (fields.phone !== undefined) { setClauses.push('phone = ?'); params.push(fields.phone.trim()); }
    if (fields.alternatePhone !== undefined) { setClauses.push('alternate_phone = ?'); params.push(fields.alternatePhone.trim() || null); }
    if (fields.email !== undefined) { setClauses.push('email = ?'); params.push(fields.email.trim() || null); }
    if (fields.addressLine1 !== undefined) { setClauses.push('address_line_1 = ?'); params.push(fields.addressLine1.trim()); }
    if (fields.addressLine2 !== undefined) { setClauses.push('address_line_2 = ?'); params.push(fields.addressLine2.trim() || null); }
    if (fields.city !== undefined) { setClauses.push('city = ?'); params.push(fields.city.trim() || null); }
    if (fields.district !== undefined) { setClauses.push('district = ?'); params.push(fields.district.trim() || null); }
    if (fields.state !== undefined) { setClauses.push('state = ?'); params.push(fields.state.trim() || null); }
    if (fields.pincode !== undefined) { setClauses.push('pincode = ?'); params.push(fields.pincode.trim() || null); }
    if (fields.dateOfBirth !== undefined) { setClauses.push('date_of_birth = ?'); params.push(fields.dateOfBirth || null); }
    if (fields.gender !== undefined) { setClauses.push('gender = ?'); params.push(fields.gender || null); }

    if (setClauses.length === 0) {
      return { success: true, message: 'No changes detected.' };
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(staffId);

    this.db.prepare(`UPDATE staff SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'SELF_PROFILE_UPDATED',
      entity_type: 'STAFF',
      entity_id: staffId,
      new_value: `Updated profile details: ${Object.keys(fields).join(', ')}`,
    });

    log.info(`Staff #${staffId} successfully updated profile.`);
    return { success: true, message: 'Profile updated successfully.' };
  }

  getEmergencyContacts(): any[] {
    const staffId = this.getStaffIdOrThrow();
    return this.emergencyRepo.getByStaffId(staffId);
  }

  saveEmergencyContact(input: {
    id?: number;
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
    isPrimary?: boolean;
  }): { success: boolean; id: number; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();

    if (!input.name || input.name.trim() === '') {
      throw new Error('Contact name is required.');
    }
    if (!input.relationship || input.relationship.trim() === '') {
      throw new Error('Relationship is required.');
    }
    if (!input.phone || input.phone.trim() === '') {
      throw new Error('Phone number is required.');
    }
    const cleanPhone = input.phone.replace(/[\s\-+()]/g, '');
    if (!/^\d{7,15}$/.test(cleanPhone)) {
      throw new Error('Please enter a valid phone number.');
    }

    let contactId: number;
    if (input.id) {
      this.emergencyRepo.update(input.id, {
        name: input.name.trim(),
        relationship: input.relationship.trim(),
        phone: input.phone.trim(),
        alternate_phone: input.alternatePhone?.trim() || undefined,
        address: input.address?.trim() || undefined,
        is_primary: input.isPrimary ? 1 : 0,
      });
      contactId = input.id;
    } else {
      contactId = this.emergencyRepo.create({
        staff_id: staffId,
        name: input.name.trim(),
        relationship: input.relationship.trim(),
        phone: input.phone.trim(),
        alternate_phone: input.alternatePhone?.trim() || undefined,
        address: input.address?.trim() || undefined,
        is_primary: input.isPrimary ? 1 : 0,
      });
    }

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'STAFF_EMERGENCY_CONTACT_UPDATED',
      entity_type: 'STAFF',
      entity_id: staffId,
      new_value: `Saved emergency contact ${input.name} (${input.relationship})`,
    });

    return { success: true, id: contactId, message: 'Emergency contact saved successfully.' };
  }

  deleteEmergencyContact(id: number): { success: boolean; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();

    const existing = this.emergencyRepo.getById(id);
    if (!existing || existing.staff_id !== staffId) {
      throw new Error('Emergency contact not found or access denied.');
    }

    this.emergencyRepo.delete(id);

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'STAFF_EMERGENCY_CONTACT_UPDATED',
      entity_type: 'STAFF',
      entity_id: staffId,
      new_value: `Deleted emergency contact ${existing.name}`,
    });

    return { success: true, message: 'Emergency contact removed.' };
  }

  uploadProfilePhoto(dataUrlOrPath: string): { success: boolean; photoPath: string; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();

    if (!dataUrlOrPath || dataUrlOrPath.trim() === '') {
      throw new Error('Image data is required.');
    }

    // Update staff photo_path
    this.db.prepare(`UPDATE staff SET photo_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(dataUrlOrPath, staffId);

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'STAFF_PHOTO_UPDATED',
      entity_type: 'STAFF',
      entity_id: staffId,
      new_value: 'Updated profile photo',
    });

    return { success: true, photoPath: dataUrlOrPath, message: 'Profile photo updated successfully.' };
  }

  removeProfilePhoto(): { success: boolean; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();

    this.db.prepare(`UPDATE staff SET photo_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(staffId);

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'STAFF_PHOTO_REMOVED',
      entity_type: 'STAFF',
      entity_id: staffId,
      new_value: 'Removed profile photo',
    });

    return { success: true, message: 'Profile photo removed successfully.' };
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const session = SessionService.getSession();
    if (!session || !session.userId) {
      throw new Error('ACCESS DENIED: Authentication required.');
    }

    const staffId = this.getStaffIdOrThrow();

    if (!currentPassword) {
      throw new Error('Please enter your current password.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password.');
    }

    const userRow = this.db.prepare('SELECT password_hash FROM users WHERE id = ?').get(session.userId) as any;
    if (!userRow) {
      throw new Error('User account not found.');
    }

    const isMatch = await PasswordService.verifyPassword(currentPassword, userRow.password_hash);
    if (!isMatch) {
      throw new Error('Current password does not match.');
    }

    const newHash = await PasswordService.hashPassword(newPassword);

    this.db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(newHash, session.userId);

    this.auditRepo.log({
      user_id: session.userId,
      action: 'PASSWORD_CHANGED',
      entity_type: 'USER',
      entity_id: session.userId,
      new_value: 'User changed personal password via Staff Portal',
    });

    log.info(`User #${session.userId} (Staff #${staffId}) successfully changed password.`);
    return { success: true, message: 'Password changed successfully.' };
  }

  getProfileActivity(): Array<{
    id: number;
    action: string;
    description: string;
    timestamp: string;
  }> {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();

    const logs = this.db.prepare(`
      SELECT * FROM audit_logs
      WHERE (entity_type = 'STAFF' AND entity_id = ?)
         OR (entity_type = 'USER' AND entity_id = ?)
      ORDER BY id DESC
      LIMIT 10
    `).all(staffId, session?.userId || -1) as any[];

    return logs.map((logRow) => {
      let desc = logRow.new_value || logRow.action;
      if (logRow.action === 'SELF_PROFILE_UPDATED') desc = 'Updated personal contact details';
      if (logRow.action === 'STAFF_PHOTO_UPDATED') desc = 'Updated profile photo';
      if (logRow.action === 'STAFF_PHOTO_REMOVED') desc = 'Removed profile photo';
      if (logRow.action === 'PASSWORD_CHANGED') desc = 'Changed account password';
      if (logRow.action === 'STAFF_EMERGENCY_CONTACT_UPDATED') desc = logRow.new_value || 'Emergency contact modified';

      return {
        id: logRow.id,
        action: logRow.action,
        description: desc,
        timestamp: logRow.created_at,
      };
    });
  }

  requestProfileChange(input: {
    fieldName: string;
    oldValue?: string;
    newValue: string;
    reason: string;
  }): { success: boolean; id: number; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();

    if (!input.fieldName || !input.newValue || !input.reason) {
      throw new Error('Field name, new value, and reason are required.');
    }

    const info = this.db.prepare(`
      INSERT INTO staff_profile_change_requests (staff_id, field_name, old_value, new_value, reason, status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `).run(staffId, input.fieldName, input.oldValue || null, input.newValue.trim(), input.reason.trim());

    const id = Number(info.lastInsertRowid);

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'PROFILE_CHANGE_REQUESTED',
      entity_type: 'STAFF',
      entity_id: staffId,
      new_value: `Requested change for ${input.fieldName}: ${input.newValue}`,
    });

    return { success: true, id, message: 'Profile change request submitted for review.' };
  }

  getProfileChangeRequests(): any[] {
    const staffId = this.getStaffIdOrThrow();
    return this.db.prepare(`
      SELECT * FROM staff_profile_change_requests WHERE staff_id = ? ORDER BY id DESC
    `).all(staffId) as any[];
  }
}

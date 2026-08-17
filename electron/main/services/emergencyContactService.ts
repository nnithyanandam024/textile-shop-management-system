import Database from 'better-sqlite3';
import { StaffEmergencyRepository, StaffEmergencyContactRow } from '../repositories/staffEmergencyRepository';
import { AuditRepository } from '../repositories/auditRepository';

export interface SaveEmergencyContactInput {
  id?: number;
  staff_id: number;
  name: string;
  relationship: string;
  phone: string;
  alternate_phone?: string;
  address?: string;
  is_primary?: boolean;
}

export class EmergencyContactService {
  private repo: StaffEmergencyRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.repo = new StaffEmergencyRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  getContacts(staffId: number): StaffEmergencyContactRow[] {
    return this.repo.getByStaffId(staffId);
  }

  saveContact(input: SaveEmergencyContactInput, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.name || input.name.trim() === '') {
      return { success: false, error: 'Contact name is required.' };
    }
    if (!input.relationship || input.relationship.trim() === '') {
      return { success: false, error: 'Relationship is required.' };
    }
    if (!input.phone || input.phone.trim() === '') {
      return { success: false, error: 'Phone number is required.' };
    }

    const phoneClean = input.phone.replace(/[\s\-+()]/g, '');
    if (!/^\d{7,15}$/.test(phoneClean)) {
      return { success: false, error: 'Invalid phone number format.' };
    }

    let contactId: number;
    if (input.id) {
      this.repo.update(input.id, {
        name: input.name,
        relationship: input.relationship,
        phone: input.phone,
        alternate_phone: input.alternate_phone,
        address: input.address,
        is_primary: input.is_primary ? 1 : 0,
      });
      contactId = input.id;
    } else {
      contactId = this.repo.create({
        staff_id: input.staff_id,
        name: input.name,
        relationship: input.relationship,
        phone: input.phone,
        alternate_phone: input.alternate_phone,
        address: input.address,
        is_primary: input.is_primary ? 1 : 0,
      });
    }

    this.auditRepo.log({
      user_id: actorUserId,
      action: 'STAFF_EMERGENCY_CONTACT_UPDATED',
      entity_type: 'STAFF',
      entity_id: input.staff_id,
      new_value: `Saved emergency contact ${input.name} (${input.relationship})`,
    });

    return { success: true, id: contactId };
  }

  deleteContact(id: number, actorUserId?: number): { success: boolean; error?: string } {
    const existing = this.repo.getById(id);
    if (!existing) return { success: false, error: 'Emergency contact not found.' };

    this.repo.delete(id);
    this.auditRepo.log({
      user_id: actorUserId,
      action: 'STAFF_EMERGENCY_CONTACT_UPDATED',
      entity_type: 'STAFF',
      entity_id: existing.staff_id,
      new_value: `Deleted emergency contact ${existing.name}`,
    });

    return { success: true };
  }
}

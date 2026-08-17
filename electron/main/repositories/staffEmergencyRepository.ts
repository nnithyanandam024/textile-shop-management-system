import Database from 'better-sqlite3';

export interface StaffEmergencyContactRow {
  id: number;
  staff_id: number;
  name: string;
  relationship: string;
  phone: string;
  alternate_phone?: string;
  address?: string;
  is_primary: number;
  created_at: string;
  updated_at: string;
}

export class StaffEmergencyRepository {
  constructor(private db: Database.Database) {}

  getByStaffId(staffId: number): StaffEmergencyContactRow[] {
    return this.db.prepare(`
      SELECT * FROM staff_emergency_contacts 
      WHERE staff_id = ? 
      ORDER BY is_primary DESC, id ASC
    `).all(staffId) as StaffEmergencyContactRow[];
  }

  getById(id: number): StaffEmergencyContactRow | undefined {
    return this.db.prepare('SELECT * FROM staff_emergency_contacts WHERE id = ?').get(id) as StaffEmergencyContactRow | undefined;
  }

  create(contact: {
    staff_id: number;
    name: string;
    relationship: string;
    phone: string;
    alternate_phone?: string;
    address?: string;
    is_primary?: number;
  }): number {
    if (contact.is_primary) {
      this.db.prepare('UPDATE staff_emergency_contacts SET is_primary = 0 WHERE staff_id = ?').run(contact.staff_id);
    }
    const info = this.db.prepare(`
      INSERT INTO staff_emergency_contacts (staff_id, name, relationship, phone, alternate_phone, address, is_primary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      contact.staff_id,
      contact.name.trim(),
      contact.relationship.trim(),
      contact.phone.trim(),
      contact.alternate_phone?.trim() || null,
      contact.address?.trim() || null,
      contact.is_primary ? 1 : 0
    );
    return Number(info.lastInsertRowid);
  }

  update(id: number, contact: {
    name?: string;
    relationship?: string;
    phone?: string;
    alternate_phone?: string;
    address?: string;
    is_primary?: number;
  }): void {
    const existing = this.getById(id);
    if (!existing) return;

    if (contact.is_primary) {
      this.db.prepare('UPDATE staff_emergency_contacts SET is_primary = 0 WHERE staff_id = ?').run(existing.staff_id);
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (contact.name !== undefined) { fields.push('name = ?'); values.push(contact.name.trim()); }
    if (contact.relationship !== undefined) { fields.push('relationship = ?'); values.push(contact.relationship.trim()); }
    if (contact.phone !== undefined) { fields.push('phone = ?'); values.push(contact.phone.trim()); }
    if (contact.alternate_phone !== undefined) { fields.push('alternate_phone = ?'); values.push(contact.alternate_phone.trim() || null); }
    if (contact.address !== undefined) { fields.push('address = ?'); values.push(contact.address.trim() || null); }
    if (contact.is_primary !== undefined) { fields.push('is_primary = ?'); values.push(contact.is_primary ? 1 : 0); }

    if (fields.length === 0) return;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db.prepare(`UPDATE staff_emergency_contacts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM staff_emergency_contacts WHERE id = ?').run(id);
  }
}

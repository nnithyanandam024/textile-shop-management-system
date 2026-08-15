import Database from 'better-sqlite3';

export interface SupplierRow {
  id: number;
  supplier_code: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class SupplierRepository {
  constructor(private db: Database.Database) {}

  getAll(): SupplierRow[] {
    return this.db.prepare('SELECT * FROM suppliers WHERE is_active = 1 ORDER BY company_name ASC').all() as SupplierRow[];
  }

  getById(id: number): SupplierRow | undefined {
    return this.db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as SupplierRow | undefined;
  }

  create(s: { supplier_code: string; company_name: string; contact_person?: string; phone?: string; email?: string; address?: string; city?: string; state?: string; pincode?: string; gst_number?: string }): number {
    const info = this.db.prepare(`
      INSERT INTO suppliers (supplier_code, company_name, contact_person, phone, email, address, city, state, pincode, gst_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(s.supplier_code, s.company_name, s.contact_person || null, s.phone || null, s.email || null, s.address || null, s.city || null, s.state || null, s.pincode || null, s.gst_number || null);
    return Number(info.lastInsertRowid);
  }

  update(id: number, s: Partial<SupplierRow>): void {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(s)) {
      if (val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length === 0) return;
    values.push(id);
    this.db.prepare(`UPDATE suppliers SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
  }
}

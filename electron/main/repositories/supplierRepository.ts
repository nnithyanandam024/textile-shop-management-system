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

  create(s: { supplier_code: string; company_name: string; contact_person?: string; phone?: string; gst_number?: string }): number {
    const info = this.db.prepare(`
      INSERT INTO suppliers (supplier_code, company_name, contact_person, phone, gst_number)
      VALUES (?, ?, ?, ?, ?)
    `).run(s.supplier_code, s.company_name, s.contact_person || null, s.phone || null, s.gst_number || null);
    return Number(info.lastInsertRowid);
  }
}

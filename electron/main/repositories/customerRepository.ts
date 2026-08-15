import Database from 'better-sqlite3';

export interface CustomerRow {
  id: number;
  customer_code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  credit_limit: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class CustomerRepository {
  constructor(private db: Database.Database) {}

  getAll(): CustomerRow[] {
    return this.db.prepare('SELECT * FROM customers WHERE is_active = 1 ORDER BY name ASC').all() as CustomerRow[];
  }

  getById(id: number): CustomerRow | undefined {
    return this.db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as CustomerRow | undefined;
  }

  getByCode(code: string): CustomerRow | undefined {
    return this.db.prepare('SELECT * FROM customers WHERE customer_code = ?').get(code) as CustomerRow | undefined;
  }

  create(c: { customer_code: string; name: string; phone?: string; email?: string; address?: string; city?: string; state?: string; pincode?: string; gst_number?: string; credit_limit?: number }): number {
    const info = this.db.prepare(`
      INSERT INTO customers (customer_code, name, phone, email, address, city, state, pincode, gst_number, credit_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.customer_code, c.name, c.phone || null, c.email || null, c.address || null, c.city || null, c.state || null, c.pincode || null, c.gst_number || null, c.credit_limit ?? 0.0);
    return Number(info.lastInsertRowid);
  }

  update(id: number, c: Partial<CustomerRow>): void {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(c)) {
      if (val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length === 0) return;
    values.push(id);
    this.db.prepare(`UPDATE customers SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
  }
}

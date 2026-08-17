import Database from 'better-sqlite3';

export interface DesignationRow {
  id: number;
  designation_code: string;
  name: string;
  department_id: number;
  department_name?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  staff_count?: number;
  created_at: string;
  updated_at: string;
}

export class DesignationRepository {
  constructor(private db: Database.Database) {}

  getAll(departmentId?: number, includeInactive: boolean = false): DesignationRow[] {
    const conditions: string[] = [];
    const params: any[] = [];

    if (!includeInactive) {
      conditions.push("des.status = 'ACTIVE'");
    }
    if (departmentId) {
      conditions.push("des.department_id = ?");
      params.push(departmentId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return this.db.prepare(`
      SELECT des.*, dep.name as department_name, COUNT(s.id) as staff_count
      FROM designations des
      JOIN departments dep ON des.department_id = dep.id
      LEFT JOIN staff s ON des.id = s.designation_id AND s.status = 'ACTIVE'
      ${whereClause}
      GROUP BY des.id
      ORDER BY dep.name ASC, des.name ASC
    `).all(...params) as DesignationRow[];
  }

  getById(id: number): DesignationRow | undefined {
    return this.db.prepare(`
      SELECT des.*, dep.name as department_name, COUNT(s.id) as staff_count
      FROM designations des
      JOIN departments dep ON des.department_id = dep.id
      LEFT JOIN staff s ON des.id = s.designation_id AND s.status = 'ACTIVE'
      WHERE des.id = ?
      GROUP BY des.id
    `).get(id) as DesignationRow | undefined;
  }

  getByCode(code: string): DesignationRow | undefined {
    return this.db.prepare('SELECT * FROM designations WHERE designation_code = ?').get(code) as DesignationRow | undefined;
  }

  generateDesignationCode(): string {
    const row: any = this.db.prepare("SELECT COUNT(*) as count FROM designations").get();
    const count = (row?.count || 0) + 1;
    return `DES-${String(count).padStart(3, '0')}`;
  }

  create(d: { designation_code?: string; name: string; department_id: number; description?: string }): number {
    const code = d.designation_code || this.generateDesignationCode();
    const info = this.db.prepare(`
      INSERT INTO designations (designation_code, name, department_id, description, status)
      VALUES (?, ?, ?, ?, 'ACTIVE')
    `).run(code, d.name.trim(), d.department_id, d.description?.trim() || null);
    return Number(info.lastInsertRowid);
  }

  update(id: number, d: { name?: string; department_id?: number; description?: string }): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (d.name !== undefined) {
      fields.push('name = ?');
      values.push(d.name.trim());
    }
    if (d.department_id !== undefined) {
      fields.push('department_id = ?');
      values.push(d.department_id);
    }
    if (d.description !== undefined) {
      fields.push('description = ?');
      values.push(d.description ? d.description.trim() : null);
    }

    if (fields.length === 0) return;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db.prepare(`UPDATE designations SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  updateStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): void {
    this.db.prepare('UPDATE designations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  }

  countStaffInDesignation(designationId: number): number {
    const row: any = this.db.prepare("SELECT COUNT(*) as count FROM staff WHERE designation_id = ? AND status = 'ACTIVE'").get(designationId);
    return row?.count || 0;
  }
}

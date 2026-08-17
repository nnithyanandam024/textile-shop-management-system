import Database from 'better-sqlite3';

export interface DepartmentRow {
  id: number;
  department_code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  staff_count?: number;
  created_at: string;
  updated_at: string;
}

export class DepartmentRepository {
  constructor(private db: Database.Database) {}

  getAll(includeInactive: boolean = false): DepartmentRow[] {
    const statusClause = includeInactive ? '' : "WHERE d.status = 'ACTIVE'";
    return this.db.prepare(`
      SELECT d.*, COUNT(s.id) as staff_count
      FROM departments d
      LEFT JOIN staff s ON d.id = s.department_id AND s.status = 'ACTIVE'
      ${statusClause}
      GROUP BY d.id
      ORDER BY d.name ASC
    `).all() as DepartmentRow[];
  }

  getById(id: number): DepartmentRow | undefined {
    return this.db.prepare(`
      SELECT d.*, COUNT(s.id) as staff_count
      FROM departments d
      LEFT JOIN staff s ON d.id = s.department_id AND s.status = 'ACTIVE'
      WHERE d.id = ?
      GROUP BY d.id
    `).get(id) as DepartmentRow | undefined;
  }

  getByCode(code: string): DepartmentRow | undefined {
    return this.db.prepare('SELECT * FROM departments WHERE department_code = ?').get(code) as DepartmentRow | undefined;
  }

  getByName(name: string): DepartmentRow | undefined {
    return this.db.prepare('SELECT * FROM departments WHERE LOWER(name) = LOWER(?)').get(name) as DepartmentRow | undefined;
  }

  generateDepartmentCode(): string {
    const row: any = this.db.prepare("SELECT COUNT(*) as count FROM departments").get();
    const count = (row?.count || 0) + 1;
    return `DEP-${String(count).padStart(3, '0')}`;
  }

  create(d: { department_code?: string; name: string; description?: string }): number {
    const code = d.department_code || this.generateDepartmentCode();
    const info = this.db.prepare(`
      INSERT INTO departments (department_code, name, description, status)
      VALUES (?, ?, ?, 'ACTIVE')
    `).run(code, d.name.trim(), d.description?.trim() || null);
    return Number(info.lastInsertRowid);
  }

  update(id: number, d: { name?: string; description?: string }): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (d.name !== undefined) {
      fields.push('name = ?');
      values.push(d.name.trim());
    }
    if (d.description !== undefined) {
      fields.push('description = ?');
      values.push(d.description ? d.description.trim() : null);
    }

    if (fields.length === 0) return;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db.prepare(`UPDATE departments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  updateStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): void {
    this.db.prepare('UPDATE departments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  }

  countStaffInDepartment(departmentId: number): number {
    const row: any = this.db.prepare("SELECT COUNT(*) as count FROM staff WHERE department_id = ? AND status = 'ACTIVE'").get(departmentId);
    return row?.count || 0;
  }
}

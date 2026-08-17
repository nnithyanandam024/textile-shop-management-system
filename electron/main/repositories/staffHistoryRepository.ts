import Database from 'better-sqlite3';

export interface StaffEmploymentHistoryRow {
  id: number;
  staff_id: number;
  department_id: number;
  department_name?: string;
  designation_id: number;
  designation_name?: string;
  manager_id?: number;
  manager_name?: string;
  employment_type: string;
  effective_from: string;
  effective_to?: string;
  reason?: string;
  created_by?: number;
  author_name?: string;
  created_at: string;
}

export class StaffHistoryRepository {
  constructor(private db: Database.Database) {}

  getByStaffId(staffId: number): StaffEmploymentHistoryRow[] {
    return this.db.prepare(`
      SELECT h.*, 
             dept.name as department_name,
             des.name as designation_name,
             (mgr.first_name || ' ' || COALESCE(mgr.last_name, '')) as manager_name,
             u.display_name as author_name
      FROM staff_employment_history h
      JOIN departments dept ON h.department_id = dept.id
      JOIN designations des ON h.designation_id = des.id
      LEFT JOIN staff mgr ON h.manager_id = mgr.id
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.staff_id = ?
      ORDER BY h.effective_from DESC, h.id DESC
    `).all(staffId) as StaffEmploymentHistoryRow[];
  }

  create(history: {
    staff_id: number;
    department_id: number;
    designation_id: number;
    manager_id?: number;
    employment_type: string;
    effective_from: string;
    effective_to?: string;
    reason?: string;
    created_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO staff_employment_history (
        staff_id, department_id, designation_id, manager_id, employment_type, effective_from, effective_to, reason, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      history.staff_id,
      history.department_id,
      history.designation_id,
      history.manager_id || null,
      history.employment_type,
      history.effective_from,
      history.effective_to || null,
      history.reason?.trim() || null,
      history.created_by || null
    );
    return Number(info.lastInsertRowid);
  }

  closePreviousHistory(staffId: number, effectiveToDate: string): void {
    this.db.prepare(`
      UPDATE staff_employment_history 
      SET effective_to = ?
      WHERE staff_id = ? AND (effective_to IS NULL OR effective_to = '')
    `).run(effectiveToDate, staffId);
  }
}

import Database from 'better-sqlite3';

export interface AttendanceSettingsRow {
  id: number;
  work_start_time: string;
  work_end_time: string;
  grace_minutes: number;
  full_day_minutes: number;
  half_day_minutes: number;
  allow_manual_entry: number;
  require_approval_for_correction: number;
  updated_by?: number;
  updated_at: string;
}

export interface AttendanceRow {
  id: number;
  staff_id: number;
  attendance_date: string;
  status: string;
  check_in?: string;
  check_out?: string;
  worked_minutes: number;
  late_minutes: number;
  early_exit_minutes: number;
  permission_minutes: number;
  remarks?: string;
  source: string;
  approval_status: string;
  is_locked: number;
  created_by?: number;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  department_name?: string;
  designation_name?: string;
}

export class AttendanceRepository {
  constructor(private db: Database.Database) {}

  getSettings(): AttendanceSettingsRow {
    let settings = this.db.prepare('SELECT * FROM attendance_settings WHERE id = 1').get() as AttendanceSettingsRow | undefined;
    if (!settings) {
      this.db.prepare(`
        INSERT INTO attendance_settings (id, work_start_time, work_end_time, grace_minutes, full_day_minutes, half_day_minutes)
        VALUES (1, '09:00', '18:00', 10, 480, 240)
      `).run();
      settings = this.db.prepare('SELECT * FROM attendance_settings WHERE id = 1').get() as AttendanceSettingsRow;
    }
    return settings;
  }

  updateSettings(input: Partial<AttendanceSettingsRow>, actorUserId?: number): void {
    const fields: string[] = [];
    const params: any[] = [];

    if (input.work_start_time !== undefined) { fields.push('work_start_time = ?'); params.push(input.work_start_time); }
    if (input.work_end_time !== undefined) { fields.push('work_end_time = ?'); params.push(input.work_end_time); }
    if (input.grace_minutes !== undefined) { fields.push('grace_minutes = ?'); params.push(input.grace_minutes); }
    if (input.full_day_minutes !== undefined) { fields.push('full_day_minutes = ?'); params.push(input.full_day_minutes); }
    if (input.half_day_minutes !== undefined) { fields.push('half_day_minutes = ?'); params.push(input.half_day_minutes); }
    if (input.allow_manual_entry !== undefined) { fields.push('allow_manual_entry = ?'); params.push(input.allow_manual_entry); }
    if (input.require_approval_for_correction !== undefined) { fields.push('require_approval_for_correction = ?'); params.push(input.require_approval_for_correction); }

    if (fields.length === 0) return;
    fields.push('updated_by = ?'); params.push(actorUserId || null);
    fields.push('updated_at = CURRENT_TIMESTAMP');

    this.db.prepare(`UPDATE attendance_settings SET ${fields.join(', ')} WHERE id = 1`).run(...params);
  }

  findByStaffAndDate(staffId: number, date: string): AttendanceRow | undefined {
    return this.db.prepare(`
      SELECT a.*, s.staff_code, s.first_name, s.last_name, d.name as department_name, des.name as designation_name
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN designations des ON s.designation_id = des.id
      WHERE a.staff_id = ? AND a.attendance_date = ?
    `).get(staffId, date) as AttendanceRow | undefined;
  }

  findByDate(date: string, filters?: { departmentId?: number; status?: string; search?: string }): AttendanceRow[] {
    let sql = `
      SELECT a.*, s.staff_code, s.first_name, s.last_name, d.name as department_name, des.name as designation_name
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN designations des ON s.designation_id = des.id
      WHERE a.attendance_date = ?
    `;
    const params: any[] = [date];

    if (filters?.departmentId) {
      sql += ' AND s.department_id = ?';
      params.push(filters.departmentId);
    }
    if (filters?.status) {
      sql += ' AND a.status = ?';
      params.push(filters.status);
    }
    if (filters?.search && filters.search.trim() !== '') {
      sql += ` AND (s.staff_code LIKE ? OR LOWER(s.first_name) LIKE ? OR LOWER(s.last_name) LIKE ?)`;
      const q = `%${filters.search.trim().toLowerCase()}%`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY s.staff_code ASC';
    return this.db.prepare(sql).all(...params) as AttendanceRow[];
  }

  findByMonth(year: number, month: number, staffId?: number): AttendanceRow[] {
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    const prefix = `${year}-${monthStr}`;

    let sql = `
      SELECT a.*, s.staff_code, s.first_name, s.last_name, d.name as department_name, des.name as designation_name
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN designations des ON s.designation_id = des.id
      WHERE a.attendance_date LIKE ?
    `;
    const params: any[] = [`${prefix}%`];

    if (staffId) {
      sql += ' AND a.staff_id = ?';
      params.push(staffId);
    }

    sql += ' ORDER BY a.attendance_date ASC, s.staff_code ASC';
    return this.db.prepare(sql).all(...params) as AttendanceRow[];
  }

  findByStaff(staffId: number, limit: number = 30): AttendanceRow[] {
    return this.db.prepare(`
      SELECT a.*, s.staff_code, s.first_name, s.last_name
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      WHERE a.staff_id = ?
      ORDER BY a.attendance_date DESC
      LIMIT ?
    `).all(staffId, limit) as AttendanceRow[];
  }

  create(att: Partial<AttendanceRow>): number {
    const info = this.db.prepare(`
      INSERT INTO attendance (
        staff_id, attendance_date, status, check_in, check_out,
        worked_minutes, late_minutes, early_exit_minutes, permission_minutes,
        remarks, source, approval_status, is_locked, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      att.staff_id,
      att.attendance_date,
      att.status || 'PRESENT',
      att.check_in || null,
      att.check_out || null,
      att.worked_minutes || 0,
      att.late_minutes || 0,
      att.early_exit_minutes || 0,
      att.permission_minutes || 0,
      att.remarks || null,
      att.source || 'SELF_CHECK_IN',
      att.approval_status || 'NOT_REQUIRED',
      att.is_locked ? 1 : 0,
      att.created_by || null
    );
    return Number(info.lastInsertRowid);
  }

  update(id: number, att: Partial<AttendanceRow>): void {
    const fields: string[] = [];
    const params: any[] = [];

    if (att.status !== undefined) { fields.push('status = ?'); params.push(att.status); }
    if (att.check_in !== undefined) { fields.push('check_in = ?'); params.push(att.check_in); }
    if (att.check_out !== undefined) { fields.push('check_out = ?'); params.push(att.check_out); }
    if (att.worked_minutes !== undefined) { fields.push('worked_minutes = ?'); params.push(att.worked_minutes); }
    if (att.late_minutes !== undefined) { fields.push('late_minutes = ?'); params.push(att.late_minutes); }
    if (att.early_exit_minutes !== undefined) { fields.push('early_exit_minutes = ?'); params.push(att.early_exit_minutes); }
    if (att.permission_minutes !== undefined) { fields.push('permission_minutes = ?'); params.push(att.permission_minutes); }
    if (att.remarks !== undefined) { fields.push('remarks = ?'); params.push(att.remarks); }
    if (att.approval_status !== undefined) { fields.push('approval_status = ?'); params.push(att.approval_status); }
    if (att.approved_by !== undefined) { fields.push('approved_by = ?'); params.push(att.approved_by); }
    if (att.approved_at !== undefined) { fields.push('approved_at = ?'); params.push(att.approved_at); }

    if (fields.length === 0) return;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    this.db.prepare(`UPDATE attendance SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }
}

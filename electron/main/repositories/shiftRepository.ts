import Database from 'better-sqlite3';

export interface ShiftTemplateRow {
  id: number;
  shift_code: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
  break_minutes: number;
  minimum_work_minutes: number;
  is_overnight: number;
  status: 'ACTIVE' | 'INACTIVE';
  assigned_staff_count?: number;
  created_at: string;
  updated_at: string;
}

export interface StaffShiftAssignmentRow {
  id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  shift_template_id: number;
  shift_name?: string;
  shift_code?: string;
  start_time?: string;
  end_time?: string;
  effective_from: string;
  effective_to?: string;
  reason?: string;
  assigned_by?: number;
  assigned_by_name?: string;
  created_at: string;
}

export interface StaffScheduleDayRow {
  id: number;
  staff_id: number;
  day_of_week: number; // 0=Sunday, 1=Monday ... 6=Saturday
  shift_template_id?: number;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
  is_week_off: number;
  effective_from: string;
  effective_to?: string;
  created_by?: number;
  created_at: string;
}

export interface StaffShiftOverrideRow {
  id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  override_date: string;
  shift_template_id?: number;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
  is_week_off: number;
  reason: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
}

export class ShiftRepository {
  constructor(private db: Database.Database) {}

  // --- SHIFT TEMPLATES ---
  getAllTemplates(includeInactive: boolean = false): ShiftTemplateRow[] {
    const where = includeInactive ? '' : "WHERE st.status = 'ACTIVE'";
    return this.db.prepare(`
      SELECT st.*, COUNT(DISTINCT ssa.staff_id) as assigned_staff_count
      FROM shift_templates st
      LEFT JOIN staff_shift_assignments ssa ON st.id = ssa.shift_template_id AND ssa.effective_to IS NULL
      ${where}
      GROUP BY st.id
      ORDER BY st.id ASC
    `).all() as ShiftTemplateRow[];
  }

  getTemplateById(id: number): ShiftTemplateRow | undefined {
    return this.db.prepare(`
      SELECT st.*, COUNT(DISTINCT ssa.staff_id) as assigned_staff_count
      FROM shift_templates st
      LEFT JOIN staff_shift_assignments ssa ON st.id = ssa.shift_template_id AND ssa.effective_to IS NULL
      WHERE st.id = ?
      GROUP BY st.id
    `).get(id) as ShiftTemplateRow | undefined;
  }

  getTemplateByCode(code: string): ShiftTemplateRow | undefined {
    return this.db.prepare('SELECT * FROM shift_templates WHERE shift_code = ?').get(code.trim()) as ShiftTemplateRow | undefined;
  }

  createTemplate(t: {
    shift_code: string;
    name: string;
    start_time: string;
    end_time: string;
    grace_minutes?: number;
    break_minutes?: number;
    minimum_work_minutes?: number;
    is_overnight?: boolean;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO shift_templates (
        shift_code, name, start_time, end_time, grace_minutes, break_minutes, minimum_work_minutes, is_overnight, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(
      t.shift_code.trim().toUpperCase(),
      t.name.trim(),
      t.start_time,
      t.end_time,
      t.grace_minutes ?? 10,
      t.break_minutes ?? 60,
      t.minimum_work_minutes ?? 480,
      t.is_overnight ? 1 : 0
    );
    return Number(info.lastInsertRowid);
  }

  updateTemplate(id: number, t: {
    name?: string;
    start_time?: string;
    end_time?: string;
    grace_minutes?: number;
    break_minutes?: number;
    minimum_work_minutes?: number;
    is_overnight?: boolean;
  }): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (t.name !== undefined) { fields.push('name = ?'); values.push(t.name.trim()); }
    if (t.start_time !== undefined) { fields.push('start_time = ?'); values.push(t.start_time); }
    if (t.end_time !== undefined) { fields.push('end_time = ?'); values.push(t.end_time); }
    if (t.grace_minutes !== undefined) { fields.push('grace_minutes = ?'); values.push(t.grace_minutes); }
    if (t.break_minutes !== undefined) { fields.push('break_minutes = ?'); values.push(t.break_minutes); }
    if (t.minimum_work_minutes !== undefined) { fields.push('minimum_work_minutes = ?'); values.push(t.minimum_work_minutes); }
    if (t.is_overnight !== undefined) { fields.push('is_overnight = ?'); values.push(t.is_overnight ? 1 : 0); }

    if (fields.length === 0) return;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db.prepare(`UPDATE shift_templates SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  updateTemplateStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): void {
    this.db.prepare("UPDATE shift_templates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);
  }

  // --- STAFF SHIFT ASSIGNMENTS ---
  getCurrentAssignment(staffId: number, dateStr: string): StaffShiftAssignmentRow | undefined {
    return this.db.prepare(`
      SELECT ssa.*, st.name as shift_name, st.shift_code, st.start_time, st.end_time,
             u.display_name as assigned_by_name
      FROM staff_shift_assignments ssa
      JOIN shift_templates st ON ssa.shift_template_id = st.id
      LEFT JOIN users u ON ssa.assigned_by = u.id
      WHERE ssa.staff_id = ?
        AND ssa.effective_from <= ?
        AND (ssa.effective_to IS NULL OR ssa.effective_to >= ?)
      ORDER BY ssa.effective_from DESC, ssa.id DESC
      LIMIT 1
    `).get(staffId, dateStr, dateStr) as StaffShiftAssignmentRow | undefined;
  }

  getAssignmentHistory(staffId: number): StaffShiftAssignmentRow[] {
    return this.db.prepare(`
      SELECT ssa.*, st.name as shift_name, st.shift_code, st.start_time, st.end_time,
             u.display_name as assigned_by_name
      FROM staff_shift_assignments ssa
      JOIN shift_templates st ON ssa.shift_template_id = st.id
      LEFT JOIN users u ON ssa.assigned_by = u.id
      WHERE ssa.staff_id = ?
      ORDER BY ssa.effective_from DESC, ssa.id DESC
    `).all(staffId) as StaffShiftAssignmentRow[];
  }

  closePreviousAssignments(staffId: number, newEffectiveFrom: string): void {
    // Set effective_to of open assignments to 1 day before newEffectiveFrom
    const prevDay = new Date(new Date(newEffectiveFrom).getTime() - 86400000).toISOString().split('T')[0];
    this.db.prepare(`
      UPDATE staff_shift_assignments
      SET effective_to = ?
      WHERE staff_id = ? AND (effective_to IS NULL OR effective_to >= ?)
    `).run(prevDay, staffId, newEffectiveFrom);
  }

  createAssignment(a: {
    staff_id: number;
    shift_template_id: number;
    effective_from: string;
    effective_to?: string;
    reason?: string;
    assigned_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO staff_shift_assignments (
        staff_id, shift_template_id, effective_from, effective_to, reason, assigned_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(a.staff_id, a.shift_template_id, a.effective_from, a.effective_to || null, a.reason || null, a.assigned_by || null);
    return Number(info.lastInsertRowid);
  }

  // --- WEEKLY SCHEDULE DAYS ---
  getWeeklySchedule(staffId: number, dateStr: string): StaffScheduleDayRow[] {
    return this.db.prepare(`
      SELECT ssd.*, st.name as shift_name, st.start_time, st.end_time
      FROM staff_schedule_days ssd
      LEFT JOIN shift_templates st ON ssd.shift_template_id = st.id
      WHERE ssd.staff_id = ?
        AND ssd.effective_from <= ?
        AND (ssd.effective_to IS NULL OR ssd.effective_to >= ?)
      ORDER BY ssd.day_of_week ASC
    `).all(staffId, dateStr, dateStr) as StaffScheduleDayRow[];
  }

  setWeeklySchedule(staffId: number, scheduleDays: {
    day_of_week: number;
    shift_template_id?: number;
    is_week_off: boolean;
    effective_from: string;
  }[], actorUserId?: number): void {
    const stmt = this.db.prepare(`
      INSERT INTO staff_schedule_days (
        staff_id, day_of_week, shift_template_id, is_week_off, effective_from, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Clean old schedules for this staff & date range
    this.db.prepare("DELETE FROM staff_schedule_days WHERE staff_id = ? AND effective_from = ?").run(staffId, scheduleDays[0].effective_from);

    for (const d of scheduleDays) {
      stmt.run(staffId, d.day_of_week, d.shift_template_id || null, d.is_week_off ? 1 : 0, d.effective_from, actorUserId || null);
    }
  }

  // --- TEMPORARY SHIFT OVERRIDES ---
  getOverrideForDate(staffId: number, dateStr: string): StaffShiftOverrideRow | undefined {
    return this.db.prepare(`
      SELECT sso.*, st.name as shift_name, st.start_time, st.end_time,
             u.display_name as created_by_name
      FROM staff_shift_overrides sso
      LEFT JOIN shift_templates st ON sso.shift_template_id = st.id
      LEFT JOIN users u ON sso.created_by = u.id
      WHERE sso.staff_id = ? AND sso.override_date = ?
    `).get(staffId, dateStr) as StaffShiftOverrideRow | undefined;
  }

  getOverridesForPeriod(startDate: string, endDate: string): StaffShiftOverrideRow[] {
    return this.db.prepare(`
      SELECT sso.*, s.staff_code, s.first_name, s.last_name,
             st.name as shift_name, st.start_time, st.end_time,
             u.display_name as created_by_name
      FROM staff_shift_overrides sso
      JOIN staff s ON sso.staff_id = s.id
      LEFT JOIN shift_templates st ON sso.shift_template_id = st.id
      LEFT JOIN users u ON sso.created_by = u.id
      WHERE sso.override_date BETWEEN ? AND ?
      ORDER BY sso.override_date ASC, s.staff_code ASC
    `).all(startDate, endDate) as StaffShiftOverrideRow[];
  }

  createOverride(o: {
    staff_id: number;
    override_date: string;
    shift_template_id?: number;
    is_week_off?: boolean;
    reason: string;
    created_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO staff_shift_overrides (
        staff_id, override_date, shift_template_id, is_week_off, reason, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(staff_id, override_date) DO UPDATE SET
        shift_template_id = excluded.shift_template_id,
        is_week_off = excluded.is_week_off,
        reason = excluded.reason,
        created_by = excluded.created_by,
        created_at = CURRENT_TIMESTAMP
    `).run(o.staff_id, o.override_date, o.shift_template_id || null, o.is_week_off ? 1 : 0, o.reason.trim(), o.created_by || null);
    return Number(info.lastInsertRowid);
  }

  deleteOverride(id: number): void {
    this.db.prepare("DELETE FROM staff_shift_overrides WHERE id = ?").run(id);
  }
}

import Database from 'better-sqlite3';

export interface LeaveTypeRow {
  id: number;
  leave_code: string;
  name: string;
  description?: string;
  paid: number;
  requires_approval: number;
  requires_document: number;
  annual_allocation: number;
  carry_forward_allowed: number;
  max_carry_forward: number;
  max_consecutive_days: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface LeaveBalanceRow {
  id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  department_name?: string;
  leave_type_id: number;
  leave_code?: string;
  leave_name?: string;
  year: number;
  allocated_days: number;
  carry_forward_days: number;
  used_days: number;
  adjustment_days: number;
  available_days?: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestRow {
  id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  department_name?: string;
  leave_type_id: number;
  leave_code?: string;
  leave_name?: string;
  paid?: number;
  start_date: string;
  end_date: string;
  duration_days: number;
  duration_type: 'FULL_DAY' | 'HALF_DAY';
  session?: 'MORNING' | 'AFTERNOON';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN';
  attachment_path?: string;
  requested_at: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  cancelled_by?: number;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface HolidayRow {
  id: number;
  name: string;
  holiday_date: string;
  type: 'PUBLIC' | 'SHOP' | 'OPTIONAL' | 'SPECIAL';
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export class LeaveRepository {
  constructor(private db: Database.Database) {}

  // --- LEAVE TYPES ---
  getAllLeaveTypes(includeInactive: boolean = false): LeaveTypeRow[] {
    const where = includeInactive ? '' : "WHERE status = 'ACTIVE'";
    return this.db.prepare(`SELECT * FROM leave_types ${where} ORDER BY id ASC`).all() as LeaveTypeRow[];
  }

  getLeaveTypeById(id: number): LeaveTypeRow | undefined {
    return this.db.prepare('SELECT * FROM leave_types WHERE id = ?').get(id) as LeaveTypeRow | undefined;
  }

  getLeaveTypeByCode(code: string): LeaveTypeRow | undefined {
    return this.db.prepare('SELECT * FROM leave_types WHERE leave_code = ?').get(code.trim().toUpperCase()) as LeaveTypeRow | undefined;
  }

  createLeaveType(t: {
    leave_code: string;
    name: string;
    description?: string;
    paid?: boolean;
    requires_approval?: boolean;
    requires_document?: boolean;
    annual_allocation?: number;
    carry_forward_allowed?: boolean;
    max_carry_forward?: number;
    max_consecutive_days?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO leave_types (
        leave_code, name, description, paid, requires_approval, requires_document,
        annual_allocation, carry_forward_allowed, max_carry_forward, max_consecutive_days, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(
      t.leave_code.trim().toUpperCase(),
      t.name.trim(),
      t.description?.trim() || null,
      t.paid ?? true ? 1 : 0,
      t.requires_approval ?? true ? 1 : 0,
      t.requires_document ? 1 : 0,
      t.annual_allocation ?? 12,
      t.carry_forward_allowed ? 1 : 0,
      t.max_carry_forward ?? 0,
      t.max_consecutive_days ?? 5
    );
    return Number(info.lastInsertRowid);
  }

  updateLeaveType(id: number, t: Partial<LeaveTypeRow>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (t.name !== undefined) { fields.push('name = ?'); values.push(t.name.trim()); }
    if (t.description !== undefined) { fields.push('description = ?'); values.push(t.description?.trim() || null); }
    if (t.paid !== undefined) { fields.push('paid = ?'); values.push(t.paid); }
    if (t.requires_approval !== undefined) { fields.push('requires_approval = ?'); values.push(t.requires_approval); }
    if (t.requires_document !== undefined) { fields.push('requires_document = ?'); values.push(t.requires_document); }
    if (t.annual_allocation !== undefined) { fields.push('annual_allocation = ?'); values.push(t.annual_allocation); }
    if (t.carry_forward_allowed !== undefined) { fields.push('carry_forward_allowed = ?'); values.push(t.carry_forward_allowed); }
    if (t.max_carry_forward !== undefined) { fields.push('max_carry_forward = ?'); values.push(t.max_carry_forward); }
    if (t.max_consecutive_days !== undefined) { fields.push('max_consecutive_days = ?'); values.push(t.max_consecutive_days); }

    if (fields.length === 0) return;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db.prepare(`UPDATE leave_types SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  // --- LEAVE BALANCES ---
  getStaffBalances(staffId: number, year: number): LeaveBalanceRow[] {
    return this.db.prepare(`
      SELECT lb.*, lt.leave_code, lt.name as leave_name,
             (lb.allocated_days + lb.carry_forward_days + lb.adjustment_days - lb.used_days) as available_days
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.staff_id = ? AND lb.year = ?
      ORDER BY lt.id ASC
    `).all(staffId, year) as LeaveBalanceRow[];
  }

  getBalance(staffId: number, leaveTypeId: number, year: number): LeaveBalanceRow | undefined {
    return this.db.prepare(`
      SELECT lb.*, lt.leave_code, lt.name as leave_name,
             (lb.allocated_days + lb.carry_forward_days + lb.adjustment_days - lb.used_days) as available_days
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.staff_id = ? AND lb.leave_type_id = ? AND lb.year = ?
    `).get(staffId, leaveTypeId, year) as LeaveBalanceRow | undefined;
  }

  createOrUpdateBalance(b: {
    staff_id: number;
    leave_type_id: number;
    year: number;
    allocated_days: number;
    carry_forward_days?: number;
    used_days?: number;
    adjustment_days?: number;
  }): void {
    this.db.prepare(`
      INSERT INTO leave_balances (
        staff_id, leave_type_id, year, allocated_days, carry_forward_days, used_days, adjustment_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(staff_id, leave_type_id, year) DO UPDATE SET
        allocated_days = excluded.allocated_days,
        carry_forward_days = excluded.carry_forward_days,
        used_days = excluded.used_days,
        adjustment_days = excluded.adjustment_days,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      b.staff_id,
      b.leave_type_id,
      b.year,
      b.allocated_days,
      b.carry_forward_days ?? 0,
      b.used_days ?? 0,
      b.adjustment_days ?? 0
    );
  }

  updateUsedDays(staffId: number, leaveTypeId: number, year: number, deltaDays: number): void {
    this.db.prepare(`
      UPDATE leave_balances
      SET used_days = used_days + ?, updated_at = CURRENT_TIMESTAMP
      WHERE staff_id = ? AND leave_type_id = ? AND year = ?
    `).run(deltaDays, staffId, leaveTypeId, year);
  }

  updateAdjustmentDays(staffId: number, leaveTypeId: number, year: number, deltaDays: number): void {
    this.db.prepare(`
      UPDATE leave_balances
      SET adjustment_days = adjustment_days + ?, updated_at = CURRENT_TIMESTAMP
      WHERE staff_id = ? AND leave_type_id = ? AND year = ?
    `).run(deltaDays, staffId, leaveTypeId, year);
  }

  // --- LEAVE REQUESTS ---
  getRequests(filters?: { staffId?: number; status?: string; leaveTypeId?: number; search?: string }): LeaveRequestRow[] {
    let sql = `
      SELECT lr.*, s.staff_code, s.first_name, s.last_name, d.name as department_name,
             lt.leave_code, lt.name as leave_name, lt.paid,
             u.display_name as approved_by_name
      FROM leave_requests lr
      JOIN staff s ON lr.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.staffId) {
      sql += ' AND lr.staff_id = ?';
      params.push(filters.staffId);
    }
    if (filters?.status) {
      sql += ' AND lr.status = ?';
      params.push(filters.status);
    }
    if (filters?.leaveTypeId) {
      sql += ' AND lr.leave_type_id = ?';
      params.push(filters.leaveTypeId);
    }
    if (filters?.search && filters.search.trim() !== '') {
      sql += ' AND (s.staff_code LIKE ? OR LOWER(s.first_name) LIKE ? OR LOWER(s.last_name) LIKE ?)';
      const q = `%${filters.search.trim().toLowerCase()}%`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY lr.id DESC';
    return this.db.prepare(sql).all(...params) as LeaveRequestRow[];
  }

  getRequestById(id: number): LeaveRequestRow | undefined {
    return this.db.prepare(`
      SELECT lr.*, s.staff_code, s.first_name, s.last_name, d.name as department_name,
             lt.leave_code, lt.name as leave_name, lt.paid,
             u.display_name as approved_by_name
      FROM leave_requests lr
      JOIN staff s ON lr.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE lr.id = ?
    `).get(id) as LeaveRequestRow | undefined;
  }

  checkOverlappingRequest(staffId: number, startDate: string, endDate: string, excludeId?: number): boolean {
    let sql = `
      SELECT COUNT(*) as count
      FROM leave_requests
      WHERE staff_id = ?
        AND status IN ('PENDING', 'APPROVED')
        AND NOT (end_date < ? OR start_date > ?)
    `;
    const params: any[] = [staffId, startDate, endDate];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    const row: any = this.db.prepare(sql).get(...params);
    return (row?.count || 0) > 0;
  }

  createRequest(r: {
    staff_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    duration_days: number;
    duration_type?: 'FULL_DAY' | 'HALF_DAY';
    session?: 'MORNING' | 'AFTERNOON';
    reason: string;
    attachment_path?: string;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO leave_requests (
        staff_id, leave_type_id, start_date, end_date, duration_days,
        duration_type, session, reason, status, attachment_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(
      r.staff_id,
      r.leave_type_id,
      r.start_date,
      r.end_date,
      r.duration_days,
      r.duration_type || 'FULL_DAY',
      r.session || null,
      r.reason.trim(),
      r.attachment_path || null
    );
    return Number(info.lastInsertRowid);
  }

  updateRequestStatus(id: number, status: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN', meta?: {
    approved_by?: number;
    rejection_reason?: string;
    cancelled_by?: number;
  }): void {
    const fields: string[] = ['status = ?'];
    const params: any[] = [status];

    if (status === 'APPROVED') {
      fields.push('approved_by = ?'); params.push(meta?.approved_by || null);
      fields.push('approved_at = CURRENT_TIMESTAMP');
    } else if (status === 'REJECTED') {
      fields.push('rejection_reason = ?'); params.push(meta?.rejection_reason || null);
    } else if (status === 'CANCELLED' || status === 'WITHDRAWN') {
      fields.push('cancelled_by = ?'); params.push(meta?.cancelled_by || null);
      fields.push('cancelled_at = CURRENT_TIMESTAMP');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    this.db.prepare(`UPDATE leave_requests SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }

  // --- HOLIDAYS ---
  getAllHolidays(includeInactive: boolean = false): HolidayRow[] {
    const where = includeInactive ? '' : "WHERE status = 'ACTIVE'";
    return this.db.prepare(`SELECT * FROM holidays ${where} ORDER BY holiday_date ASC`).all() as HolidayRow[];
  }

  getHolidayByDate(dateStr: string): HolidayRow | undefined {
    return this.db.prepare("SELECT * FROM holidays WHERE holiday_date = ? AND status = 'ACTIVE'").get(dateStr) as HolidayRow | undefined;
  }

  createHoliday(h: {
    name: string;
    holiday_date: string;
    type?: 'PUBLIC' | 'SHOP' | 'OPTIONAL' | 'SPECIAL';
    description?: string;
    created_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO holidays (name, holiday_date, type, description, status, created_by)
      VALUES (?, ?, ?, ?, 'ACTIVE', ?)
    `).run(h.name.trim(), h.holiday_date, h.type || 'PUBLIC', h.description?.trim() || null, h.created_by || null);
    return Number(info.lastInsertRowid);
  }

  deleteHoliday(id: number): void {
    this.db.prepare('DELETE FROM holidays WHERE id = ?').run(id);
  }

  // --- ADJUSTMENTS ---
  createAdjustment(a: {
    staff_id: number;
    leave_type_id: number;
    year: number;
    adjustment_days: number;
    reason: string;
    created_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO leave_balance_adjustments (
        staff_id, leave_type_id, year, adjustment_days, reason, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(a.staff_id, a.leave_type_id, a.year, a.adjustment_days, a.reason.trim(), a.created_by || null);
    return Number(info.lastInsertRowid);
  }
}

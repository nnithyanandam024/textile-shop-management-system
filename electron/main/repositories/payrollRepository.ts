import Database from 'better-sqlite3';

export interface PayrollPeriodRow {
  id: number;
  name: string;
  year: number;
  month: number;
  start_date: string;
  end_date: string;
  total_working_days: number;
  status: 'DRAFT' | 'CALCULATED' | 'PENDING_APPROVAL' | 'APPROVED' | 'LOCKED' | 'CANCELLED';
  processed_at?: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  locked_at?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  total_staff_count?: number;
  total_gross?: number;
  total_deductions?: number;
  total_net?: number;
}

export interface PayrollRecordRow {
  id: number;
  payroll_period_id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  department_name?: string;
  designation_name?: string;
  joining_date?: string;
  basic_salary: number;
  gross_earnings: number;
  overtime_hours: number;
  overtime_amount: number;
  working_days: number;
  present_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  unpaid_leave_deduction: number;
  advance_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  created_at: string;
  updated_at: string;
  line_items?: PayrollLineItemRow[];
}

export interface PayrollLineItemRow {
  id: number;
  payroll_record_id: number;
  component_code: string;
  component_name: string;
  type: 'EARNING' | 'DEDUCTION';
  amount: number;
  calculation_source?: string;
  created_at: string;
}

export class PayrollRepository {
  constructor(private db: Database.Database) {}

  // --- PAYROLL PERIODS ---
  getPeriods(): PayrollPeriodRow[] {
    const rows = this.db.prepare(`
      SELECT pp.*, u.display_name as approved_by_name,
             (SELECT COUNT(*) FROM payroll_records pr WHERE pr.payroll_period_id = pp.id) as total_staff_count,
             (SELECT COALESCE(SUM(gross_earnings), 0) FROM payroll_records pr WHERE pr.payroll_period_id = pp.id) as total_gross,
             (SELECT COALESCE(SUM(total_deductions), 0) FROM payroll_records pr WHERE pr.payroll_period_id = pp.id) as total_deductions,
             (SELECT COALESCE(SUM(net_salary), 0) FROM payroll_records pr WHERE pr.payroll_period_id = pp.id) as total_net
      FROM payroll_periods pp
      LEFT JOIN users u ON pp.approved_by = u.id
      ORDER BY pp.year DESC, pp.month DESC, pp.id DESC
    `).all() as PayrollPeriodRow[];

    return rows;
  }

  getPeriodById(id: number): PayrollPeriodRow | undefined {
    return this.db.prepare(`
      SELECT pp.*, u.display_name as approved_by_name,
             (SELECT COUNT(*) FROM payroll_records pr WHERE pr.payroll_period_id = pp.id) as total_staff_count,
             (SELECT COALESCE(SUM(gross_earnings), 0) FROM payroll_records pr WHERE pr.payroll_period_id = pp.id) as total_gross,
             (SELECT COALESCE(SUM(total_deductions), 0) FROM payroll_records pr WHERE pr.payroll_period_id = pp.id) as total_deductions,
             (SELECT COALESCE(SUM(net_salary), 0) FROM payroll_records pr WHERE pr.payroll_period_id = pp.id) as total_net
      FROM payroll_periods pp
      LEFT JOIN users u ON pp.approved_by = u.id
      WHERE pp.id = ?
    `).get(id) as PayrollPeriodRow | undefined;
  }

  createPeriod(p: {
    name: string;
    year: number;
    month: number;
    start_date: string;
    end_date: string;
    total_working_days?: number;
    created_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO payroll_periods (
        name, year, month, start_date, end_date, total_working_days, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?)
    `).run(
      p.name.trim(),
      p.year,
      p.month,
      p.start_date,
      p.end_date,
      p.total_working_days || 26,
      p.created_by || null
    );
    return Number(info.lastInsertRowid);
  }

  updatePeriodStatus(id: number, status: 'CALCULATED' | 'APPROVED' | 'LOCKED' | 'CANCELLED', meta?: {
    approved_by?: number;
  }): void {
    const fields: string[] = ['status = ?'];
    const params: any[] = [status];

    if (status === 'CALCULATED') {
      fields.push('processed_at = CURRENT_TIMESTAMP');
    } else if (status === 'APPROVED') {
      fields.push('approved_by = ?'); params.push(meta?.approved_by || null);
      fields.push('approved_at = CURRENT_TIMESTAMP');
    } else if (status === 'LOCKED') {
      fields.push('locked_at = CURRENT_TIMESTAMP');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    this.db.prepare(`UPDATE payroll_periods SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }

  // --- PAYROLL RECORDS & SNAPSHOTS ---
  getRecordsForPeriod(periodId: number): PayrollRecordRow[] {
    const rows = this.db.prepare(`
      SELECT pr.*, s.staff_code, s.first_name, s.last_name, s.joining_date,
             d.name as department_name, des.name as designation_name
      FROM payroll_records pr
      JOIN staff s ON pr.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN designations des ON s.designation_id = des.id
      WHERE pr.payroll_period_id = ?
      ORDER BY s.staff_code ASC
    `).all(periodId) as PayrollRecordRow[];

    for (const r of rows) {
      r.line_items = this.getLineItems(r.id);
    }
    return rows;
  }

  getRecordById(recordId: number): PayrollRecordRow | undefined {
    const row = this.db.prepare(`
      SELECT pr.*, s.staff_code, s.first_name, s.last_name, s.joining_date,
             d.name as department_name, des.name as designation_name
      FROM payroll_records pr
      JOIN staff s ON pr.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN designations des ON s.designation_id = des.id
      WHERE pr.id = ?
    `).get(recordId) as PayrollRecordRow | undefined;

    if (row) {
      row.line_items = this.getLineItems(row.id);
    }
    return row;
  }

  getStaffPayrollHistory(staffId: number): PayrollRecordRow[] {
    return this.db.prepare(`
      SELECT pr.*, pp.name as period_name, pp.year, pp.month, pp.status as period_status
      FROM payroll_records pr
      JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
      WHERE pr.staff_id = ? AND pp.status IN ('APPROVED', 'LOCKED')
      ORDER BY pp.year DESC, pp.month DESC
    `).all(staffId) as PayrollRecordRow[];
  }

  getLineItems(recordId: number): PayrollLineItemRow[] {
    return this.db.prepare('SELECT * FROM payroll_line_items WHERE payroll_record_id = ? ORDER BY type ASC, id ASC').all(recordId) as PayrollLineItemRow[];
  }

  saveRecordWithLineItems(record: {
    payroll_period_id: number;
    staff_id: number;
    basic_salary: number;
    gross_earnings: number;
    overtime_hours: number;
    overtime_amount: number;
    working_days: number;
    present_days: number;
    paid_leave_days: number;
    unpaid_leave_days: number;
    unpaid_leave_deduction: number;
    advance_deduction: number;
    other_deductions: number;
    total_deductions: number;
    net_salary: number;
    status?: string;
  }, lineItems: Array<{
    component_code: string;
    component_name: string;
    type: 'EARNING' | 'DEDUCTION';
    amount: number;
    calculation_source?: string;
  }>): number {
    const saveTx = this.db.transaction(() => {
      // Check existing record
      const existing = this.db.prepare('SELECT id FROM payroll_records WHERE payroll_period_id = ? AND staff_id = ?').get(record.payroll_period_id, record.staff_id) as { id: number } | undefined;

      let recordId: number;
      if (existing) {
        recordId = existing.id;
        this.db.prepare(`
          UPDATE payroll_records SET
            basic_salary = ?, gross_earnings = ?, overtime_hours = ?, overtime_amount = ?,
            working_days = ?, present_days = ?, paid_leave_days = ?, unpaid_leave_days = ?,
            unpaid_leave_deduction = ?, advance_deduction = ?, other_deductions = ?,
            total_deductions = ?, net_salary = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          record.basic_salary, record.gross_earnings, record.overtime_hours, record.overtime_amount,
          record.working_days, record.present_days, record.paid_leave_days, record.unpaid_leave_days,
          record.unpaid_leave_deduction, record.advance_deduction, record.other_deductions,
          record.total_deductions, record.net_salary, record.status || 'DRAFT', recordId
        );
        this.db.prepare('DELETE FROM payroll_line_items WHERE payroll_record_id = ?').run(recordId);
      } else {
        const info = this.db.prepare(`
          INSERT INTO payroll_records (
            payroll_period_id, staff_id, basic_salary, gross_earnings, overtime_hours, overtime_amount,
            working_days, present_days, paid_leave_days, unpaid_leave_days, unpaid_leave_deduction,
            advance_deduction, other_deductions, total_deductions, net_salary, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          record.payroll_period_id, record.staff_id, record.basic_salary, record.gross_earnings,
          record.overtime_hours, record.overtime_amount, record.working_days, record.present_days,
          record.paid_leave_days, record.unpaid_leave_days, record.unpaid_leave_deduction,
          record.advance_deduction, record.other_deductions, record.total_deductions, record.net_salary, record.status || 'DRAFT'
        );
        recordId = Number(info.lastInsertRowid);
      }

      const itemStmt = this.db.prepare(`
        INSERT INTO payroll_line_items (payroll_record_id, component_code, component_name, type, amount, calculation_source)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of lineItems) {
        if (item.amount > 0) {
          itemStmt.run(recordId, item.component_code, item.component_name, item.type, item.amount, item.calculation_source || 'STRUCTURE');
        }
      }

      return recordId;
    });

    return saveTx();
  }
}

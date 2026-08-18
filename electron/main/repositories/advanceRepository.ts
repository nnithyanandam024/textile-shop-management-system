import Database from 'better-sqlite3';

export interface SalaryAdvanceRow {
  id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  department_name?: string;
  amount: number;
  advance_date: string;
  reason: string;
  monthly_installment: number;
  remaining_amount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  approved_by?: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export class AdvanceRepository {
  constructor(private db: Database.Database) {}

  getAdvances(filters?: { staffId?: number; status?: string }): SalaryAdvanceRow[] {
    let sql = `
      SELECT sa.*, s.staff_code, s.first_name, s.last_name, d.name as department_name
      FROM salary_advances sa
      JOIN staff s ON sa.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.staffId) {
      sql += ' AND sa.staff_id = ?';
      params.push(filters.staffId);
    }
    if (filters?.status) {
      sql += ' AND sa.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY sa.id DESC';
    return this.db.prepare(sql).all(...params) as SalaryAdvanceRow[];
  }

  getActiveAdvance(staffId: number): SalaryAdvanceRow | undefined {
    return this.db.prepare(`
      SELECT * FROM salary_advances
      WHERE staff_id = ? AND status = 'ACTIVE' AND remaining_amount > 0
      ORDER BY id ASC
      LIMIT 1
    `).get(staffId) as SalaryAdvanceRow | undefined;
  }

  createAdvance(input: {
    staff_id: number;
    amount: number;
    advance_date: string;
    reason: string;
    monthly_installment: number;
    approved_by?: number;
    created_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO salary_advances (
        staff_id, amount, advance_date, reason, monthly_installment, remaining_amount, status, approved_by, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(
      input.staff_id,
      input.amount,
      input.advance_date,
      input.reason.trim(),
      input.monthly_installment,
      input.amount, // remaining_amount initially equals full amount
      input.approved_by || null,
      input.created_by || null
    );
    return Number(info.lastInsertRowid);
  }

  recordRepayment(advanceId: number, installmentPaid: number): void {
    const adv = this.db.prepare('SELECT * FROM salary_advances WHERE id = ?').get(advanceId) as SalaryAdvanceRow | undefined;
    if (!adv) return;

    const newRemaining = Math.max(0, adv.remaining_amount - installmentPaid);
    const newStatus = newRemaining <= 0 ? 'COMPLETED' : 'ACTIVE';

    this.db.prepare(`
      UPDATE salary_advances
      SET remaining_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newRemaining, newStatus, advanceId);
  }
}
